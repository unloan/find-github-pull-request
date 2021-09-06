export const pullRequestFactory = (number: number, overrides?: object) => ({
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

/** We put inputs into `process.env.INPUT_`.
 * Provides a function to cleanup itself.
 */
export const setMockedInputs = (inputs: object) => {
  const envKeyPairs = (Object.entries(inputs) as [string, string][]).map(
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

  return {
    deleteMockedInputs: () => {
      envKeyPairs.forEach(([key]) => {
        delete process.env[key];
      });
    },
  };
};

/** We assume that anything at `process.env.INPUT_` is a mocked input. */
export const deleteAllMockedInputs = () => {
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('INPUT_')) delete process.env[key];
  });
};
