import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.GITHUB_TOKEN!;
const repoFull = process.env.GITHUB_REPO!;
const [owner, repo] = repoFull.split('/');
const prNumber = 3;

const octokit = new Octokit({ auth: token });

const lintPath = path.resolve(__dirname, '../../eslint-output.json');
const results = JSON.parse(fs.readFileSync(lintPath, 'utf-8'));

(async () => {
  const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
  const head_sha = pr.head.sha;

  const allMessages = results.flatMap((f: any) => f.messages);
  const issueCount = allMessages.length;

  // ✅ Create GitHub Check
  await octokit.checks.create({
    owner,
    repo,
    name: 'Lint Agent',
    head_sha,
    status: 'completed',
    conclusion: issueCount === 0 ? 'success' : 'failure',
    output: {
      title: 'Lint Results',
      summary: issueCount === 0
        ? 'No lint issues found ✅'
        : `${issueCount} lint issue(s) found ❌`,
    },
  });

  console.log('✅ GitHub Check Run created');

  // 🗨️ Post Inline Review Comments
  for (const result of results) {
    const filePath = result.filePath.replace(`${process.cwd()}/`, '');

    for (const message of result.messages) {
      const commentBody = `**${message.severity === 2 ? '❌ Error' : '⚠️ Warning'}**: ${message.message}\nRule: \`${message.ruleId || 'n/a'}\``;

      try {
        await octokit.pulls.createReviewComment({
          owner,
          repo,
          pull_number: prNumber,
          body: commentBody,
          commit_id: head_sha,
          path: filePath,
          line: message.line,
          side: 'RIGHT'
        });

        console.log(`💬 Commented on ${filePath}:${message.line}`);
      } catch (error: any) {
        console.warn(`⚠️ Could not post inline comment on ${filePath}:${message.line}. Posting fallback comment.`);
        await octokit.pulls.createReview({
          owner,
          repo,
          pull_number: prNumber,
          event: 'COMMENT',
          body: `Lint warning in \`${filePath}:${message.line}\`:\n\n${commentBody}`
        });
      }
    }
  }
})();
