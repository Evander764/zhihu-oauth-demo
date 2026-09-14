import { execFileSync } from 'node:child_process';

const user = JSON.parse(execFileSync('gh', ['api', 'user'], { encoding: 'utf8' }));
const email = execFileSync('git', ['var', 'GIT_AUTHOR_IDENT'], { encoding: 'utf8' }).match(/<([^>]+)>/)?.[1];
const allowed = [`${user.id}+${user.login}@users.noreply.github.com`, `${user.login}@users.noreply.github.com`, user.email].filter(Boolean);
const matchesAccount = allowed.some(value => value.toLowerCase() === email?.toLowerCase());
console.log(JSON.stringify({ account: user.login, configuredAuthorMatchesAccount: matchesAccount }));
if (!matchesAccount) {
  console.error('Commit author is not associated with the authenticated GitHub account. Correct this repository identity before committing for deployment.');
  process.exit(1);
}
