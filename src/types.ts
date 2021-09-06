import type { context as ContextType } from '@actions/github';

export type PullRequest = typeof ContextType['payload']['pull_request'];
