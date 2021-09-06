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
