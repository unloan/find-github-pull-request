import { findPullRequestFromSha } from './findPullRequestFromSha';
import { setOutputs } from './setOutputs';

export const getPullRequest = async (): Promise<void> => {
  /**
   * Fetch the pull request from the current context's sha.
   * This is wrapped in another helper function to make testing and debugging easier.
   */
  const pullRequest = await findPullRequestFromSha();

  setOutputs(pullRequest);
};
