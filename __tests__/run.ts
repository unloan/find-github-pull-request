import { setFailed } from '@actions/core';

import { getPullRequest } from '../src/getPullRequest';

jest.mock('../src/getPullRequest');
jest.mock('@actions/core', () => ({
  setFailed: jest.fn(),
}));

describe('run', () => {
  test('running with `getPullRequest` not throwing an error does not call `setFailed`', async () => {
    (getPullRequest as any).mockImplementation(
      () => new Promise((resolve) => resolve('works!'))
    );

    jest.isolateModules(() => {
      require('../src/run');
    });

    // Just wait for a tick or so for `run` to …run.
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(setFailed).not.toHaveBeenCalled();
  });

  test('running when `getPullRequest` throws an error calls `setFailed`', async () => {
    const message = 'Everything failed!';
    (getPullRequest as any).mockImplementation(
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
