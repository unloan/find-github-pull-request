import { debug, setFailed, setOutput } from '@actions/core';
import { getOctokit } from '@actions/github';

import { fetchPullRequest } from '../src/fetchPullRequest';

export const baseInputs = {
  failIfNotFound: 'false',
  allowClosed: 'false',
  commitSha: 'dc45d51',
  token: 'GH_not-a-real-token',
} as const;

const pullRequestFactory = (number: number, overrides?: object) => ({
  html_url: `https://github.com/kylorhall/find-github-pull-request/pull/${number}`,
  number,
  state: 'open',
  title: `PR Title for number=${number}`,
  user: {
    login: 'kylorhall',
  },
  body: `PR Body for number=${number}`,
  created_at: '2021-09-06T07:08:29Z',
  updated_at: '2021-09-06T07:11:48Z',
  closed_at: '2021-09-06T07:08:38Z',
  merged_at: '2021-09-06T07:08:38Z',
  ...overrides,
});

jest.mock('@actions/core', () => ({
  getInput: jest.requireActual('@actions/core').getInput,
  getBooleanInput: jest.requireActual('@actions/core').getBooleanInput,
  setFailed: jest.fn(),
  setOutput: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'kylorhall',
      repo: 'repo',
    },
  },
  getOctokit: jest.fn(),
}));

export const runTest = async (
  inputs: object | undefined,
  apiData: object[]
) => {
  // We first put all of our inputs into `process.env.INPUT_…` (etc).
  const inputObj = { ...baseInputs, ...inputs };
  const envKeyPairs = (Object.entries(inputObj) as [string, string][]).map(
    ([key, value]) => {
      return [`INPUT_${key.replace(/ /g, '_').toUpperCase()}`, value];
    }
  );

  envKeyPairs.forEach(([key, value]) => {
    // don't set undefined values…
    if (value !== undefined && value !== null) {
      process.env[key] = String(value);
    }
  });

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

  await fetchPullRequest();

  expect(getOctokit).toHaveBeenCalledTimes(1);
  expect(getOctokit).toHaveBeenCalledWith(baseInputs.token);

  expect(apiMock).toHaveBeenCalledTimes(1);

  // Delete all `process.env.INPUT_PACKAGE` we just set.
  envKeyPairs.forEach(([key]) => {
    delete process.env[key];
  });

  return { apiMock };
};

describe('run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([9000, 2, 44])(
    'returns the first PR in the array (%#)',
    async (number) => {
      await runTest({}, [
        pullRequestFactory(number),
        pullRequestFactory(101),
        pullRequestFactory(1),
      ]);

      expect(debug).toHaveBeenCalledTimes(2);
      expect(debug).toHaveBeenCalledWith('Found 3 pull requests.');
      expect(debug).toHaveBeenCalledWith(
        'Filtered to find 3 open pull requests.'
      );

      expect(setOutput).toHaveBeenCalledTimes(4);
      // NOTE: This is just testing that it returns the first one, nothing to do with the id.
      expect(setOutput).toHaveBeenCalledWith('number', number);
      expect(setOutput).toHaveBeenCalledWith(
        'title',
        `PR Title for number=${number}`
      );
      expect(setOutput).toHaveBeenCalledWith(
        'body',
        `PR Body for number=${number}`
      );
      expect(setOutput).toHaveBeenCalledWith(
        'url',
        `https://github.com/kylorhall/find-github-pull-request/pull/${number}`
      );

      expect(setFailed).not.toHaveBeenCalled();
    }
  );

  test.each(['body', 'title'])('%p gets sanitized', async (key) => {
    const rawString = "This' is a `safe` string!";
    const expected = 'This is a safe string!';
    await runTest({}, [pullRequestFactory(1, { [key]: rawString })]);

    expect(setOutput).toHaveBeenCalledWith(key, expected);
  });

  describe('allowClosed', () => {
    test('set to true, does not filter the list of pull requests', async () => {
      await runTest({ allowClosed: 'true' }, [
        pullRequestFactory(1, { state: 'closed' }),
        pullRequestFactory(2, { state: 'closed' }),
        pullRequestFactory(3, { state: 'open' }),
        pullRequestFactory(4, { state: 'closed' }),
        pullRequestFactory(5, { state: 'open' }),
      ]);

      expect(debug).toHaveBeenCalledTimes(1);
      expect(debug).toHaveBeenCalledWith('Found 5 pull requests.');

      expect(setOutput).toHaveBeenCalledWith('number', 1);
    });

    test('set to false (default), filters out closed pull requests', async () => {
      await runTest({ allowClosed: 'false' }, [
        pullRequestFactory(1, { state: 'closed' }),
        pullRequestFactory(2, { state: 'closed' }),
        pullRequestFactory(3, { state: 'open' }),
        pullRequestFactory(4, { state: 'closed' }),
        pullRequestFactory(5, { state: 'open' }),
      ]);

      expect(debug).toHaveBeenCalledTimes(2);
      expect(debug).toHaveBeenCalledWith('Found 5 pull requests.');
      expect(debug).toHaveBeenCalledWith(
        'Filtered to find 2 open pull requests.'
      );

      expect(setOutput).toHaveBeenCalledWith('number', 3);
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
