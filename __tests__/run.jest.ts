import { setFailed } from '@actions/core';

import { fetchPullRequest } from '../src/fetchPullRequest';

jest.mock('../src/fetchPullRequest');
jest.mock('@actions/core', () => ({
  setFailed: jest.fn(),
}));

describe('run', () => {
  test('running with `fetchPullRequest` not throwing an error does not call `setFailed`', async () => {
    (fetchPullRequest as any).mockImplementation(
      () => new Promise((resolve) => resolve('works!'))
    );

    jest.isolateModules(() => {
      require('../src/run');
    });

    // Just wait for a tick or so for `run` to …run.
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(setFailed).not.toHaveBeenCalled();
  });

  test('running when `fetchPullRequest` throws an error calls `setFailed`', async () => {
    const message = 'Everything failed!';
    (fetchPullRequest as any).mockImplementation(
      () => new Promise((_resolve, reject) => reject(new Error(message)))
    );

    jest.isolateModules(() => {
      require('../src/run');
    });

    // Just wait for a tick or so for `run` to …run.
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(setFailed).toHaveBeenCalledWith(message);
  });
});
