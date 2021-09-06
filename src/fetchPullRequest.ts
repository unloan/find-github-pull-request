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
  const currentSha = getInput('commitSha', { required: true }); // not required in action.yml, but the default should provide
  const allowClosed = getBooleanInput('allowClosed', { required: false });
  const shouldFail = getBooleanInput('failIfNotFound', { required: false });

  // To be honest, it shouldn't be able to fail here, due to `{ required: true }` (etc) above.
  if (!githubToken) setFailed('token is required and not provided');
  if (!currentSha) setFailed('commitSha is required and not provided');

  const octokit = getOctokit(githubToken as string);

  const { data } =
    await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
      owner: context.repo.owner,
      repo: context.repo.repo,
      commit_sha: currentSha,
    });

  let pullRequests = data;
  debug(`Found ${pullRequests.length} pull requests.`);

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

  // Sanitize the title and body to avoid Shell interpolation of backticks and more.
  const title = sanitize(pullRequest.title);
  const body = sanitize(pullRequest.body);

  setOutput('number', pullRequest.number || '');
  setOutput('title', title || '');
  setOutput('body', body || '');
  setOutput('url', pullRequest.html_url || '');
}
