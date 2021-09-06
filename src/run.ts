import { setFailed } from '@actions/core';
import { fetchPullRequest } from './fetchPullRequest';

fetchPullRequest().catch((err) => {
  setFailed(err.message);
});
