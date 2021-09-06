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
  { number, eventName }: { number: number; eventName: string },
  callbackInIsolation?: (arg: any) => void
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

    if (callbackInIsolation) callbackInIsolation(pullRequest);

    const { getPullRequest } = require('../src/getPullRequest');
    await getPullRequest();
  });

  return pullRequest;
};

describe('getPullRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('context.eventName=pull_request', () => {
    test.each([9000, 2, 44])(
      'returns the first PR in the array (%p)',
      async (number) => {
        expect(setOutputs).not.toHaveBeenCalled();

        // run the test
        const pullRequest = await runTest({
          number,
          eventName: 'pull_request',
        });

        expect(setOutputs).toHaveBeenCalledTimes(1);
        expect(setOutputs).toHaveBeenCalledWith(pullRequest);

        expect(findPullRequestFromSha).not.toHaveBeenCalled();
        expect(setFailed).not.toHaveBeenCalled();
      }
    );
  });

  describe('context.eventName=push', () => {
    test.each([1, 2, 99])('calls findPullRequestFromSha', async (number) => {
      expect(findPullRequestFromSha).not.toHaveBeenCalled();
      expect(setOutputs).not.toHaveBeenCalled();

      // run the test
      const pullRequest = await runTest(
        { number, eventName: 'push' },
        (pullRequest) =>
          (findPullRequestFromSha as jest.MockedFunction<any>).mockReturnValue(
            pullRequest
          )
      );

      expect(findPullRequestFromSha).toHaveBeenCalledTimes(1);

      expect(setOutputs).toHaveBeenCalledTimes(1);
      expect(setOutputs).toHaveBeenCalledWith(pullRequest);

      expect(setFailed).not.toHaveBeenCalled();
    });
  });

  test.each(['unknown', 'release'])(
    'context.eventName=%p (etc) calls setFailed',
    async (eventName) => {
      expect(setFailed).not.toHaveBeenCalled();
      expect(setOutputs).not.toHaveBeenCalled();

      // run the test
      await runTest({ number: 12, eventName });

      expect(setFailed).toHaveBeenCalledTimes(1);
      expect(setFailed).toHaveBeenCalledWith(
        `Received an unknown event: ${eventName}.`
      );

      // Still called though…
      expect(setOutputs).toHaveBeenCalledTimes(1);
      expect(setOutputs).toHaveBeenCalledWith(undefined);

      expect(findPullRequestFromSha).not.toHaveBeenCalled();
    }
  );
});
