import {
  debug,
  getInput,
  getBooleanInput,
  setOutput,
  setFailed,
} from '@actions/core';
import { getOctokit, context } from '@actions/github';

import { sanitize } from './sanitize';

export async function fetchPullRequest() {
  const githubToken = getInput('token', { required: true }); // not required in action.yml, but the default should provide
  let currentSha = getInput('commitSha', { required: false });
  const allowClosed = getBooleanInput('allowClosed', { required: false });
  const shouldFail = getBooleanInput('failIfNotFound', { required: false });

  let targetNumber: number | undefined;

  debug(`context.issue.number: ${context.issue?.number}`);
  // @ts-ignore
  debug(`context.pull_request.number: ${context.pull_request?.number}`);

  // To be honest, it shouldn't be able to fail here, due to `{ required: true }` (etc) above.
  if (!githubToken) setFailed('token is required and not provided');
  if (!currentSha) setFailed('commitSha is required and not provided');

  if (context.eventName === 'pull_request') {
    debug('@@context.payload:');
    debug(JSON.stringify(context.payload));

    currentSha = context.payload.head?.sha;
    targetNumber = context.payload.pull_request.number;
  }

  const octokit = getOctokit(githubToken as string);

  const { data } =
    await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
      owner: context.repo.owner,
      repo: context.repo.repo,
      commit_sha: currentSha,
    });

  let pullRequests = data;
  debug(
    `Found ${pullRequests.length} pull requests with the sha ${currentSha}.`
  );

  if (!allowClosed) {
    pullRequests = pullRequests.filter((pr) => pr.state === 'open');
    debug(`Filtered to find ${pullRequests.length} open pull requests.`);
  }

  if (!pullRequests?.length) {
    if (shouldFail) {
      setFailed(
        `No pull requests found for ${context.repo.owner}/${context.repo.repo}@${currentSha}, Github Action failed.`
      );
    }

    return;
  }

  const pullRequest = pullRequests[0];

  if (targetNumber && pullRequest.number !== targetNumber) {
    setFailed(
      `We were looking for PR#${targetNumber}, received PR#${pullRequest.number}.`
    );

    return;
  }

  // Sanitize the title and body to avoid Shell interpolation of backticks and more.
  const title = sanitize(pullRequest.title);
  const body = sanitize(pullRequest.body);

  setOutput('number', pullRequest.number || '');
  setOutput('title', title || '');
  setOutput('body', body || '');
  setOutput('url', pullRequest.html_url || '');
}
