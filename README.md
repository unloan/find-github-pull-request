# find-github-pull-request

This Github Actions helps find a Pull Request in the context of a `push` or `pull_request` Github Action.

## Example Workflow

For a real-world action, this repo runs itself via [add-pr-comment.yml](https://github.com/kylorhall/find-github-pull-request/blob/main/.github/workflows/add-pr-comment.yml) to comment on every PR.

```yaml
name: Add PR Comment

# NOTE: We support both `push` and `pull_request`, but see the input documentation as they are different.
on: [push, pull_request]

jobs:
  add-pr-comment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Find Pull Request
        id: find-pr
        uses: kylorhall/find-github-pull-request@1.1.0
        with:
          # These are all default values.
          token: ${{ secrets.GITHUB_TOKEN }}
          commitSha: ${{ github.sha }}
          allowClosed: false
          failIfNotFound: false

      - name: Debug
        run: |
          echo number: ${{ steps.find-pr.outputs.number }}
          echo title: ${{ steps.find-pr.outputs.title }}
          echo body: ${{ steps.find-pr.outputs.body }}
          echo url: ${{ steps.find-pr.outputs.url }}
          echo url: ${{ steps.find-pr.outputs.base-ref }}
          echo url: ${{ steps.find-pr.outputs.base-sha }}
```

# Inputs

**All inputs are optional and only used for an `on: pull` event!**

If doing `on: pull_request`, we get this data directly from the payload and inputs are generally ignored…

| Name           | Description                                               | Example / Default Value |
| -------------- | --------------------------------------------------------- | ----------------------- |
| token          | Github Token used to fetch pull requests.                 | `ghp_Abc123`            |
| commitSha      | For `on: pull`, the sha to look for, defaults to current. | `abcdef123`             |
| allowClosed    | For `on: pull`, allows returning a closed PR.             | `false`                 |
| failIfNotFound | For `on: pull`, fail if not found at that sha.            | `false`                 |

---

# Outputs

**NOTE: `title` and `body` are sanitized to remove quotes and backticks to avoid shell interpolation.**

| Name     | Description         | Type or Example Value                                          |
| -------- | ------------------- | -------------------------------------------------------------- |
| number   | The found PR number | `'12345'`                                                      |
| title    | The found PR title  | `string`                                                       |
| body     | The found PR body   | `string`                                                       |
| url      | The found PR url    | `https://github.com/kylorhall/find-github-pull-request/pull/1` |
| base-ref | The base ref        | `'main'`                                                       |
| base-sha | The base sha        | `'dc45d5195b1f2510b7e83d7cb6a836ba09b2358d'`                                                       |

---

# Development of this Action

## Start Development

```bash
yarn install
code .
yarn jest:tdd
```

## Build & Release

#### Prepare Build

1. Deicde on a semver, eg. `1.2.3`.
2. Bump this version in `package.json` file—just for the sake of it.
4. Bump this version in `README.md` file.
5. Ensure that `yarn build` already has been ran and a `dist/index.js` committed; commit if not.
6. Version bumps should go via a PR and be merged into _master_ before releasing.

#### Create the Release

Manually build a New Release: [here](https://github.com/kylorhall/find-github-pull-request/releases/new)

1. Enter your tag based on the semver.
   - Your tag should be prepended with a `v`, eg. `v1.2.3`.
   - Do not use `@latest` tag.
2. :warning: Point the release to the correct commit (not _main_)! This should be the PR Merge commit.
3. Enter a title naming the release (eg. `v1.2.3: Brief description of changes`)
4. Enter a fuller description—link to commits, PRs, etc.
5. Release!
