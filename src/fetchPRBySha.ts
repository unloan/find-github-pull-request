import { debug, getInput, getBooleanInput, setFailed } from '@actions/core';
import { getOctokit, context } from '@actions/github';

/**
 * Fetch the pull request using a commit sha.
 */
export const fetchPRBySha = async () => {
  const githubToken = getInput('token', { required: true });
  const allowClosed = getBooleanInput('allowClosed', { required: false });
  const failIfNotFound = getBooleanInput('failIfNotFound', { required: false });
  const currentSha = getInput('commitSha', { required: false });

  // To be honest, it shouldn't be able to fail here, due to `{ required: true }` (etc) above.
  if (!githubToken) setFailed('token is required and not provided');
  if (!currentSha) setFailed('commitSha is required and not provided');

  const octokit = getOctokit(githubToken);

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
    if (failIfNotFound) {
      setFailed(
        `No pull requests found for ${context.repo.owner}/${context.repo.repo}@${currentSha}, Github Action failed.`
      );
    }

    return;
  }

  return pullRequests[0];
};
