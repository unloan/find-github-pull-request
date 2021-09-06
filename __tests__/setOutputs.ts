import { debug, setFailed, setOutput } from '@actions/core';

import { setOutputs } from '../src/setOutputs';
import {
  pullRequestFactory,
  setMockedInputs,
  deleteAllMockedInputs,
} from '../jestHelpers';

jest.mock('@actions/core', () => ({
  debug: jest.fn(),
  getBooleanInput: jest.requireActual('@actions/core').getBooleanInput, // use real as we mock it via setMockedInputs
  setFailed: jest.fn(),
  setOutput: jest.fn(),
}));

jest.mock('@actions/github', () => ({
  context: { eventName: 'mocked_event_name' }, // just mocked as we test it below
}));

describe('setOutputs', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    deleteAllMockedInputs();
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
      expect(debug).not.toHaveBeenCalled();
    }
  );

  describe.each([undefined, { number: 0 }, {}])(
    'with a bad pull_request=%p',
    (pullRequest) => {
      test('with inputs.failIfNotFound=false, calls `debug`', () => {
        expect(debug).not.toHaveBeenCalled();
        expect(setFailed).not.toHaveBeenCalled();

        setMockedInputs({ failIfNotFound: false });
        setOutputs(pullRequest as any);

        expect(debug).toHaveBeenCalledTimes(1);
        expect(debug).toHaveBeenCalledWith(
          'We did not find a pull request for an event=mocked_event_name.'
        );
        expect(setFailed).not.toHaveBeenCalled();
      });

      test('with inputs.failIfNotFound=true, calls `setFailed`', () => {
        expect(debug).not.toHaveBeenCalled();
        expect(setFailed).not.toHaveBeenCalled();

        setMockedInputs({ failIfNotFound: true });
        setOutputs(pullRequest as any);

        expect(setFailed).toHaveBeenCalledTimes(1);
        expect(setFailed).toHaveBeenCalledWith(
          'We did not find a pull request for an event=mocked_event_name.'
        );
        expect(debug).not.toHaveBeenCalled();
      });
    }
  );

  test('falls back to empty strings', () => {
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
