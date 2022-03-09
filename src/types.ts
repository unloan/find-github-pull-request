import type { components } from '@octokit/openapi-types';

/**
 * - `pull-request-simple` comes from `listPullRequestsAssociatedWithCommit(…)` (fetch by sha)
 * - `pull-request` comes from `pulls.get(…)` (fetch by number)
 */
export type PullRequest = components["schemas"]["pull-request-simple"] | components["schemas"]["pull-request"];
