import simpleGit from 'simple-git';

const git = simpleGit();

export async function getGitDiff(base, head) {
  const diff = await git.diff([`${base}..${head}`]);
  return diff;
}