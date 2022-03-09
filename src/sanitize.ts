/**
 * Sanitize a string to be usable in a shell or bash command.
 *
 * Particularly, a backtick might break if wanting to use in a Github Action bash,
 * Eg. this can break: `echo "PR_TITLE=${{ steps.find-pr.outputs.title }}" >> $GITHUB_ENV`
 */
export const sanitize = (str?: string) => str?.replace(/['"`\(\)\[\]]+/g, '');
