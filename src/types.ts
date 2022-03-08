import type { components } from '@octokit/openapi-types';

/** This comes from `listPullRequestsAssociatedWithCommit`, but it's deeply nested…just as easy to pull it out. */
export type PullRequest = components["schemas"]["pull-request-simple"];
