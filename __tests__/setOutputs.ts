import { setFailed, setOutput } from '@actions/core';

import { setOutputs } from '../src/setOutputs';
import { pullRequestFactory } from '../jestHelpers';

jest.mock('@actions/core', () => ({
  setFailed: jest.fn(),
  setOutput: jest.fn(),
}));

jest.mock('@actions/github', () => ({
  context: { eventName: 'mocked_event_name' }, // just mocked as we test it below
}));

describe('setOutputs', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test.each(['body', 'title'])('%p gets sanitized', async (key) => {
    const rawString = "This' is a `safe` string!";
    const expected = 'This is a safe string!';

    setOutputs(pullRequestFactory(1, { [key]: rawString }));

    expect(setOutput).toHaveBeenCalledWith(key, expected);
  });

  test.each([1, 2, 42])(
    'expected outputs are called for number=%p',
    (number) => {
      expect(setOutput).not.toHaveBeenCalled();

      setOutputs(pullRequestFactory(number));

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

  test.each([undefined, { number: 0 }, {}])(
    'with a bad pull_request=%p, calls setFailed',
    (pullRequest) => {
      expect(setFailed).not.toHaveBeenCalled();

      setOutputs(pullRequest as any);

      expect(setFailed).toHaveBeenCalledWith(
        'We did not find a pull request for an event=mocked_event_name.'
      );
    }
  );

  test('falls back to empty values', () => {
    expect(setOutput).not.toHaveBeenCalled();

    setOutputs({ number: 42 } as any);

    expect(setOutput).toHaveBeenCalledTimes(4);

    expect(setOutput).toHaveBeenCalledWith('number', 42); // technically it's called as a string
    expect(setOutput).toHaveBeenCalledWith('title', '');
    expect(setOutput).toHaveBeenCalledWith('body', '');
    expect(setOutput).toHaveBeenCalledWith('url', '');

    expect(setFailed).not.toHaveBeenCalled();
  });
});
