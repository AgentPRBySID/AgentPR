import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import pool from '../utils/db';


dotenv.config();

export async function runCoverageAgent(prPayload: any) {
  try {
    const token = process.env.GITHUB_TOKEN!;
    if (!token) throw new Error('Missing GITHUB_TOKEN in environment variables.');

    const prNumber = prPayload.number;
    const owner = prPayload.base.repo.owner.login;
    const repo = prPayload.base.repo.name;

    console.log('🔧 PR Info:', `${owner}/${repo} #${prNumber}`);

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

    // 🗄️ Store coverage in Postgres
    await pool.query(
      `INSERT INTO coverage_history (pr_number, branch, lines, statements, functions, branches)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (pr_number) DO UPDATE SET
         lines = EXCLUDED.lines,
         statements = EXCLUDED.statements,
         functions = EXCLUDED.functions,
         branches = EXCLUDED.branches,
         created_at = CURRENT_TIMESTAMP`,
      [
        prNumber,
        prPayload.head.ref, // branch name
        total.lines.pct,
        total.statements.pct,
        total.functions.pct,
        total.branches.pct
      ]
    );
    
    console.log('✅ Coverage stored in PostgreSQL');
    
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
    

    console.log('🧠 Comment message prepared:\n', message);

    const commentUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
    console.log('📤 Posting coverage comment to:', commentUrl);

    const response = await axios.post(
      commentUrl,
      { body: message },
      { headers }
    );

    console.log('✅ Coverage comment posted. ID:', response.data.id);
  } catch (error: any) {
    console.error('❌ Coverage Agent failed.');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('URL:', error.config?.url);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}
