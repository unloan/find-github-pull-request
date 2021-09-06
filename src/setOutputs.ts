import { setOutput, setFailed } from '@actions/core';
import { context } from '@actions/github';

import { sanitize } from './sanitize';

import type { PullRequest } from './types';

export const setOutputs = (pullRequest: PullRequest) => {
  if (!pullRequest?.number) {
    setFailed(
      `We did not find a pull request for an event=${context.eventName}.`
    );

    return;
  }

  // Sanitize the title and body to avoid Shell interpolation of backticks and more.
  const title = sanitize(pullRequest.title);
  const body = sanitize(pullRequest.body);

  setOutput('number', pullRequest.number);
  setOutput('title', title || '');
  setOutput('body', body || '');
  setOutput('url', pullRequest.html_url || '');
};
