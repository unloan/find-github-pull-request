import { setFailed } from '@actions/core';

import { fetchPRBySha } from '../src/fetchPRBySha';
import { setOutputs } from '../src/setOutputs';

import { pullRequestFactory } from '../jestHelpers';
import { fetchPRByNumber } from '../src/fetchPRByNumber';

jest.mock('../src/fetchPRBySha');
jest.mock('../src/fetchPRByNumber');
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

    // Mock the PRs returned by the Github API
    (fetchPRBySha as jest.MockedFunction<any>).mockReturnValue(pullRequest);
    (fetchPRByNumber as jest.MockedFunction<any>).mockReturnValue(pullRequest);

    const { getPullRequest } = require('../src/getPullRequest');
    await getPullRequest();
  });

  return pullRequest;
};

describe('getPullRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('context.eventName=push', () => {
    test.each([1, 2, 99])('calls fetchPRBySha', async (number) => {
      expect(fetchPRBySha).not.toHaveBeenCalled();
      expect(setOutputs).not.toHaveBeenCalled();

      // run the test
      const pullRequest = await runTest(
        { number, eventName: 'push' },
      );

      expect(fetchPRBySha).toHaveBeenCalledTimes(1);
      expect(fetchPRBySha).toHaveBeenCalledWith();

      expect(setOutputs).toHaveBeenCalledTimes(1);
      expect(setOutputs).toHaveBeenCalledWith(pullRequest);

      expect(setFailed).not.toHaveBeenCalled();
      expect(fetchPRByNumber).not.toHaveBeenCalled(); // never called
    });
  });

  describe('context.eventName=pull_request', () => {
    test.each([1, 2, 99])('calls fetchPRByNumber', async (number) => {
      expect(fetchPRByNumber).not.toHaveBeenCalled();
      expect(setOutputs).not.toHaveBeenCalled();

      // run the test
      const pullRequest = await runTest(
        { number, eventName: 'pull_request' },
      );

      expect(fetchPRByNumber).toHaveBeenCalledTimes(1);
      expect(fetchPRByNumber).toHaveBeenCalledWith();

      expect(setOutputs).toHaveBeenCalledTimes(1);
      expect(setOutputs).toHaveBeenCalledWith(pullRequest);

      expect(setFailed).not.toHaveBeenCalled();
      expect(fetchPRBySha).not.toHaveBeenCalled(); // never called
    });
  });
});
