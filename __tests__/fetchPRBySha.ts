import { debug, setFailed, setOutput } from '@actions/core';
import { getOctokit } from '@actions/github';

import { fetchPRBySha } from '../src/fetchPRBySha';
import { pullRequestFactory, setMockedInputs } from '../jestHelpers';
import { PullRequest } from '../src/types';

export const baseInputs = {
  failIfNotFound: 'false',
  allowClosed: 'false',
  commitSha: 'dc45d51',
  token: 'GH_not-a-real-token',
} as const;

jest.mock('@actions/core', () => ({
  getInput: jest.requireActual('@actions/core').getInput,
  getBooleanInput: jest.requireActual('@actions/core').getBooleanInput,
  setFailed: jest.fn(),
  setOutput: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('@actions/github', () => ({
  context: {
    eventName: 'push',
    repo: {
      owner: 'kylorhall',
      repo: 'repo',
    },
  },
  getOctokit: jest.fn(),
}));

export const runTest = async (
  inputs: object | undefined,
  apiData: PullRequest[]
) => {
  // We first put all of our inputs into `process.env.INPUT_…` (etc).
  const inputObj = { ...baseInputs, ...inputs };
  const { deleteMockedInputs } = setMockedInputs(inputObj);

  const apiMock = jest.fn(
    async () => new Promise((resolve) => resolve({ data: apiData }))
  );

  (getOctokit as any).mockImplementation(() => ({
    rest: {
      repos: {
        listPullRequestsAssociatedWithCommit: apiMock,
      },
    },
  }));

  const result = await fetchPRBySha();

  expect(getOctokit).toHaveBeenCalledTimes(1);
  expect(getOctokit).toHaveBeenCalledWith(inputObj.token || '');

  expect(apiMock).toHaveBeenCalledTimes(1);

  // Delete all `process.env.INPUT_PACKAGE` we just set.
  deleteMockedInputs();

  return { apiMock, result };
};

describe('fetchPRBySha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([9000, 2, 44])(
    'returns the first PR in the array (%p)',
    async (number) => {
      const { result } = await runTest({}, [
        pullRequestFactory(number),
        pullRequestFactory(101),
        pullRequestFactory(1),
      ]);

      expect(debug).toHaveBeenCalledTimes(2);
      expect(debug).toHaveBeenCalledWith(
        `Found 3 pull requests with the sha ${baseInputs.commitSha}.`
      );
      expect(debug).toHaveBeenCalledWith(
        'Filtered to find 3 open pull requests.'
      );

      expect(result.number).toEqual(number);
      expect(result.html_url).toEqual(
        `https://github.com/octocat/Hello-World/pull/${number}`
      );
    }
  );

  test.each(['commitSha'])(
    'fails when called without inputs.%p',
    async (key) => {
      await runTest({ [key]: undefined }, []);

      expect(setOutput).not.toHaveBeenCalled();

      expect(setFailed).toHaveBeenCalledTimes(1);
      expect(setFailed).toHaveBeenCalledWith(
        `${key} is required and not provided`
      );
    }
  );

  describe('allowClosed', () => {
    test('set to true, does not filter the list of pull requests', async () => {
      const { result } = await runTest({ allowClosed: 'true' }, [
        pullRequestFactory(1, { state: 'closed' }),
        pullRequestFactory(2, { state: 'closed' }),
        pullRequestFactory(3, { state: 'open' }),
        pullRequestFactory(4, { state: 'closed' }),
        pullRequestFactory(5, { state: 'open' }),
      ]);

      expect(debug).toHaveBeenCalledTimes(1);
      expect(debug).toHaveBeenCalledWith(
        `Found 5 pull requests with the sha ${baseInputs.commitSha}.`
      );

      expect(result.number).toEqual(1);
    });

    test('set to false (default), filters out closed pull requests', async () => {
      const { result } = await runTest({ allowClosed: 'false' }, [
        pullRequestFactory(1, { state: 'closed' }),
        pullRequestFactory(2, { state: 'closed' }),
        pullRequestFactory(3, { state: 'open' }),
        pullRequestFactory(4, { state: 'closed' }),
        pullRequestFactory(5, { state: 'open' }),
      ]);

      expect(debug).toHaveBeenCalledTimes(2);
      expect(debug).toHaveBeenCalledWith(
        `Found 5 pull requests with the sha ${baseInputs.commitSha}.`
      );
      expect(debug).toHaveBeenCalledWith(
        'Filtered to find 2 open pull requests.'
      );

      expect(result.number).toEqual(3);
    });
  });

  describe('failIfNotFound', () => {
    test('false throws no error with no pull requests', async () => {
      await runTest({ failIfNotFound: false }, []);

      expect(setOutput).not.toHaveBeenCalled();
      expect(setFailed).not.toHaveBeenCalled();
    });

    test('true sets an error with no pull requests', async () => {
      await runTest({ failIfNotFound: true }, []);

      expect(setOutput).not.toHaveBeenCalled();
      expect(setFailed).toHaveBeenCalledWith(
        'No pull requests found for kylorhall/repo@dc45d51, Github Action failed.'
      );
    });
  });
});
