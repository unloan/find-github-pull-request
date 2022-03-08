import { setFailed } from '@actions/core';

import { findPullRequestFromSha } from '../src/findPullRequestFromSha';
import { setOutputs } from '../src/setOutputs';

import { pullRequestFactory } from '../jestHelpers';

jest.mock('../src/findPullRequestFromSha');
jest.mock('../src/setOutputs');
jest.mock('@actions/core', () => ({
  setFailed: jest.fn(),
}));

const runTest = async (
  { number, eventName }: { number: number; eventName: string }
) => {
  const pullRequest = pullRequestFactory(number);

  let payload: object;
  if (eventName === 'pull_request') {
    payload = {
      pull_request: pullRequest,
    };
  }

  await jest.isolateModules(async () => {
    jest.doMock('@actions/github', () => ({
      context: {
        eventName,
        payload,
      },
    }));

    // Mock the return value from findPullRequestFromSha
    (findPullRequestFromSha as jest.MockedFunction<any>).mockReturnValue(pullRequest);

    const { getPullRequest } = require('../src/getPullRequest');
    await getPullRequest();
  });

  return pullRequest;
};

describe('getPullRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe.each(['push', 'pull_request'])('context.eventName=%p', (eventName) => {
    test.each([1, 2, 99])('calls findPullRequestFromSha', async (number) => {
      expect(findPullRequestFromSha).not.toHaveBeenCalled();
      expect(setOutputs).not.toHaveBeenCalled();

      // run the test
      const pullRequest = await runTest(
        { number, eventName },
      );

      expect(findPullRequestFromSha).toHaveBeenCalledTimes(1);

      expect(setOutputs).toHaveBeenCalledTimes(1);
      expect(setOutputs).toHaveBeenCalledWith(pullRequest);

      expect(setFailed).not.toHaveBeenCalled();
    });
  });
});
