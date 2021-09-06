import { setFailed } from '@actions/core';
import { getPullRequest } from './getPullRequest';

getPullRequest().catch((err) => {
  setFailed(err.message);
});
