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

    console.log('🔧 GITHUB_TOKEN:', token ? 'Present' : 'Missing');
    console.log('🔧 GITHUB_REPO:', repoFull);
    console.log('🔧 PR_NUMBER:', prNumber);

    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'AgentPR-Bot',
    };

    const coveragePath = path.resolve(__dirname, '../../coverage/coverage-summary.json');
    console.log('📄 Reading coverage from:', coveragePath);

    const coverageRaw = fs.readFileSync(coveragePath, 'utf-8');
    const coverage = JSON.parse(coverageRaw);
    const total = coverage.total;

    console.log('📊 Parsed Coverage:', total);

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

    console.log('🧠 Comment Message Prepared:\n', message);

    // Sanity check PR existence
    const prCheck = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      { headers }
    );
    console.log('✅ PR exists, PR title:', prCheck.data.title);

    const commentUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
    console.log('📤 Posting comment to:', commentUrl);

    const response = await axios.post(
      commentUrl,
      { body: message },
      { headers }
    );

    console.log('✅ Coverage comment posted successfully. Comment ID:', response.data.id);
  } catch (error: any) {
    console.error('❌ Failed to post test coverage comment.');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('URL:', error.config?.url);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}
