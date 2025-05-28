// src/agents/lintAgent.ts
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function runLintAgent(prPayload: any) {
  const token = process.env.GITHUB_TOKEN!;
  if (!token) throw new Error('Missing GITHUB_TOKEN in environment variables.');

  const prNumber = prPayload.number;
  const repo = prPayload.base.repo.name;
  const owner = prPayload.base.repo.owner.login;
  const head_sha = prPayload.head.sha;

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'AgentPR-Bot',
  };

  const results = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../eslint-output.json'), 'utf-8')
  );

  const repoRoot = path.resolve(__dirname, '../../');

  const getChangedFiles = async () => {
    const { data } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      { headers }
    );
    return data
      .filter((f: any) => f.patch)
      .map((f: { filename: string; patch: string }) => ({
        filename: f.filename,
        patch: f.patch,
      }));
  };

  const extractChangedLines = (patch: string): Set<number> => {
    const changedLines = new Set<number>();
    const lines = patch.split('\n');
    let newLine = 0;
    for (const line of lines) {
      if (line.startsWith('@@')) {
        const match = /@@ -\d+,\d+ \+(\d+),?(\d+)? @@/.exec(line);
        if (match) newLine = parseInt(match[1], 10);
        continue;
      }
      if (line.startsWith('+') && !line.startsWith('+++')) {
        changedLines.add(newLine);
        newLine++;
      } else if (!line.startsWith('-')) {
        newLine++;
      }
    }
    return changedLines;
  };

  try {
    const changedFiles = await getChangedFiles();
    const fileToChangedLines = new Map<string, Set<number>>();
    changedFiles.forEach((file: { filename: string; patch: string }) => {
        fileToChangedLines.set(file.filename, extractChangedLines(file.patch));
      });
      

    let commentsPosted = 0;

    for (const result of results) {
      let relativePath = path.relative(repoRoot, result.filePath).replace(/\\/g, '/');
      const filePath = relativePath.replace(/^.*?(src\/.+\.ts)$/, '$1');

      if (!fileToChangedLines.has(filePath)) continue;
      const changedLines = fileToChangedLines.get(filePath)!;

      for (const message of result.messages) {
        if (!changedLines.has(message.line)) continue;

        const commentBody = `Error: ${message.message}\nRule: \`${message.ruleId || 'n/a'}\``;
        const postUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`;

        try {
          await axios.post(
            postUrl,
            {
              body: commentBody,
              commit_id: head_sha,
              path: filePath,
              line: message.line,
              side: 'RIGHT',
            },
            { headers }
          );
          commentsPosted++;
        } catch (err: any) {
          console.warn(`❌ Failed to comment on ${filePath}:${message.line}`, err.message);
        }
      }
    }

    if (commentsPosted === 0) {
      await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
        { body: '✅ Lint completed, but no inline comments were necessary.' },
        { headers }
      );
    }

    console.log('✅ Lint Agent finished.');
  } catch (error: any) {
    console.error('❌ Lint Agent error:', error.message);
  }
}
