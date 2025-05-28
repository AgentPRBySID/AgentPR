import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function runSecurityScanAgent(prPayload: any) {
  try {
    const token = process.env.GITHUB_TOKEN!;
    const prNumber = prPayload.number;
    const owner = prPayload.base.repo.owner.login;
    const repo = prPayload.base.repo.name;

    console.log('🔐 Running Semgrep scan...');

    const outputPath = path.resolve(__dirname, '../../semgrep-output.json');
    try {
        execSync(`semgrep --config p/owasp-top-ten --json > ${outputPath}`, { stdio: 'inherit' });
      }  catch (e) {
        if (e instanceof Error) {
          console.error('❌ Semgrep execution failed:', e.message);
        } else {
          console.error('❌ Semgrep execution failed with unknown error:', e);
        }
        return;
      }
    
      

    const raw = fs.readFileSync(outputPath, 'utf-8');
    const report = JSON.parse(raw);

    if (report.results.length === 0) {
        console.log('✅ No security issues found. (Posting dummy comment for test)');
        const commentUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
        await axios.post(commentUrl, {
          body: `🔐 **Semgrep Security Scan**\n\n✅ No issues found.`,
        }, {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github+json',
          },
        });
        return;
      }
      

    const issues = report.results
      .map((r: any) => `- [${r.check_id}] ${r.path}:${r.start.line} → ${r.message}`)
      .join('\n');

    const body = `🔐 **Semgrep Security Scan Results**\n\n${issues}`;

    const commentUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
    await axios.post(commentUrl, { body }, {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' },
    });

    console.log('✅ Semgrep scan results posted to PR.');
  } catch (err: any) {
    console.error('❌ Security Scan Agent failed.', err.message);
  }
}
