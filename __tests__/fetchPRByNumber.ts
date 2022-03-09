import { setFailed, setOutput } from '@actions/core';
import { getOctokit } from '@actions/github';

import { fetchPRByNumber } from '../src/fetchPRByNumber';
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
    eventName: 'pull_request',
    repo: {
      owner: 'kylorhall',
      repo: 'repo',
    },
    payload: {
      pull_request: { number: 12345 },
    },
  },
  getOctokit: jest.fn(),
}));

export const runTest = async (
  inputs: object | undefined,
  apiData: PullRequest
) => {
  // We first put all of our inputs into `process.env.INPUT_…` (etc).
  const inputObj = { ...baseInputs, ...inputs };
  const { deleteMockedInputs } = setMockedInputs(inputObj);

  const apiMock = jest.fn(
    async () => new Promise((resolve) => resolve({ data: apiData }))
  );

  (getOctokit as any).mockImplementation(() => ({
    rest: {
      pulls: {
        get: apiMock,
      },
    },
  }));

  const result = await fetchPRByNumber();

  expect(getOctokit).toHaveBeenCalledTimes(1);
  expect(getOctokit).toHaveBeenCalledWith(inputObj.token || '');

  expect(apiMock).toHaveBeenCalledTimes(1);
  // These are mocked in our `@actions/github.context`:
  expect(apiMock).toHaveBeenCalledWith({ owner: 'kylorhall', repo: 'repo', pull_number: 12345 });

  // Delete all `process.env.INPUT_PACKAGE` we just set.
  deleteMockedInputs();

  return { apiMock, result };
};

describe('fetchPRByNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([9000, 2, 44])(
    'returns a PR fetched from the array for number=%p',
    async (number) => {
      const { result } = await runTest({}, pullRequestFactory(number));

      expect(result.number).toEqual(number);
      expect(result.html_url).toEqual(
        `https://github.com/octocat/Hello-World/pull/${number}`
      );
    }
  );

  /** `failIfNotFound` doesn't matter, we should always fail…we explicitly had a pull_request.number, we should be able to find it! */
  describe.each([true, false])('failIfNotFound=%p', (failIfNotFound) => {
    test('sets an error with no pull requests', async () => {
      await runTest({ failIfNotFound }, undefined);

      expect(setOutput).not.toHaveBeenCalled();
      expect(setFailed).toHaveBeenCalledWith(
        'Pull request not found for kylorhall/repo#12345, Github Action failed.'
      );
    });
  });
});
