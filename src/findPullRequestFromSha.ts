import { debug, getInput, getBooleanInput, setFailed } from '@actions/core';
import { getOctokit, context } from '@actions/github';

export const findPullRequestFromSha = async () => {
  const githubToken = getInput('token', { required: false }); // not required unless for a search
  const allowClosed = getBooleanInput('allowClosed', { required: false });
  const shouldFail = getBooleanInput('failIfNotFound', { required: false });
  const currentSha = getInput('commitSha', { required: false });

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
  debug(
    `Found ${pullRequests.length} pull requests with the sha ${currentSha}.`
  );

  if (!allowClosed) {
    pullRequests = pullRequests.filter((pr) => pr.state === 'open');
    debug(`Filtered to find ${pullRequests.length} open pull requests.`);
  }

  if (!pullRequests.length) {
    if (shouldFail) {
      setFailed(
        `No pull requests found for ${context.repo.owner}/${context.repo.repo}@${currentSha}, Github Action failed.`
      );
    }

    return;
  }

  return pullRequests[0];
};
