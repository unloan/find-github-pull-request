import { getInput, setFailed } from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { PullRequest } from './types';

/**
 * Fetch the pull request using a commit number.
 */
export const fetchPRByNumber = async (): Promise<PullRequest | undefined> => {
  const githubToken = getInput('token', { required: true });

  // To be honest, it shouldn't be able to fail here, due to `{ required: true }` (etc) above.
  if (!githubToken) setFailed('token is required and not provided');

  const octokit = getOctokit(githubToken);

  const number = context.payload.pull_request.number;
  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner: "octokit",
    repo: "rest.js",
    pull_number: number,
  });

  if (!pullRequest) {
    setFailed(
      `Pull request not found for ${context.repo.owner}/${context.repo.repo}#${number}, Github Action failed.`
    );

    return;
  }

  return pullRequest;
};
