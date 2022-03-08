import { debug, getBooleanInput, setOutput, setFailed } from '@actions/core';
import { context } from '@actions/github';

import { sanitize } from './sanitize';

import type { PullRequest } from './types';

export const setOutputs = (pullRequest: PullRequest) => {
  if (!pullRequest?.number) {
    const failIfNotFound = getBooleanInput('failIfNotFound', {
      required: false,
    });

    const message = `We did not find a pull request for an event=${context.eventName}.`;
    if (failIfNotFound) setFailed(message);
    else debug(message);

    return;
  }

  // Sanitize the title to avoid Shell interpolation of backticks and more.
  const title = sanitize(pullRequest.title);
  if (title !== pullRequest.title) debug(`Sanitized title: ${title}`)

  // Sanitize the body to avoid Shell interpolation of backticks and more.
  const body = sanitize(pullRequest.body);
  if (body !== pullRequest.body) debug(`Sanitized body: ${body}`)

  debug('Setting outputs for a Pull Request')
  debug('------------------')
  debug(JSON.stringify(pullRequest));
  
  // NOTE: `pullRequest` has a ton of additional information in it to be used.
  setOutput('number', pullRequest.number);
  setOutput('title', title || '');
  setOutput('body', body || '');
  setOutput('url', pullRequest.html_url || '');
  setOutput('base-ref', pullRequest.base?.ref || '');
  setOutput('base-sha', pullRequest.base?.sha || '');
};
