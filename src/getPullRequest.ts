import { setFailed } from '@actions/core';
import { context } from '@actions/github';

import { findPullRequestFromSha } from './findPullRequestFromSha';
import { setOutputs } from './setOutputs';

import type { PullRequest } from './types';

export const getPullRequest = async (): Promise<void> => {
  let pullRequest: PullRequest | undefined;

  if (context.eventName === 'pull_request') {
    pullRequest = context.payload.pull_request;
  } else if (context.eventName === 'push') {
    pullRequest = await findPullRequestFromSha();
  } else {
    setFailed(`Received an unknown event: ${context.eventName}.`);
  }

  setOutputs(pullRequest);
};
