import { setFailed } from '@actions/core';
import { context } from '@actions/github';

import { fetchPRByNumber } from './fetchPRByNumber';
import { fetchPRBySha } from './fetchPRBySha';
import { setOutputs } from './setOutputs';
import { PullRequest } from './types';

export const getPullRequest = async (): Promise<void> => {
  let pullRequest: PullRequest | undefined;

  if (context.eventName === 'pull_request') {
    pullRequest = await fetchPRByNumber();
  } else if (context.eventName === 'push') {
    pullRequest = await fetchPRBySha();
  } else {
    setFailed(`Received an unknown event: ${context.eventName}.`);
  }

  // NOTE: handling of undefined values 
  setOutputs(pullRequest);
};
