import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function runCoverageAgent() {
  try {
    const token = process.env.GITHUB_TOKEN!;
    const repoFull = process.env.GITHUB_REPO!;
    const [owner, repo] = repoFull.split('/');
    const prNumber = parseInt(process.env.PR_NUMBER!, 10);

    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'AgentPR-Bot',
    };

    const coveragePath = path.resolve(__dirname, '../../coverage/coverage-summary.json');
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
    const total = coverage.total;

    const formatPercent = (value: unknown) => {
      const num = typeof value === 'number' ? value : 0;
      return `${num.toFixed(2)}%`;
    };

    const message = `
📊 **Test Coverage Report**
- **Lines:** ${formatPercent(total.lines.pct)}
- **Statements:** ${formatPercent(total.statements.pct)}
- **Functions:** ${formatPercent(total.functions.pct)}
- **Branches:** ${formatPercent(total.branches.pct)}
`;

    // Post a top-level comment on the PR (via issues API)
    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      { body: message },
      { headers }
    );

    console.log('✅ Posted test coverage comment to PR');
  } catch (error: any) {
    console.error('❌ Failed to post test coverage comment:', error.response?.data || error.message);
  }
}
