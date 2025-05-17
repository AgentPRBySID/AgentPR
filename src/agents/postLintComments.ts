import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Test lint error to trigger inline comment
const temp: any = 'still testing inline comment';
const x: any = 123;

export async function runLintAgent(prPayload: any) {
  const token = process.env.GITHUB_TOKEN!;
  if (!token) throw new Error('Missing GITHUB_TOKEN in environment variables.');

  const prNumber = prPayload.number;
  const repo = prPayload.base.repo.name;
  const owner = prPayload.base.repo.owner.login;
  const head_sha = prPayload.head.sha;

  console.log('🔧 Debug: repo =', repo);
  console.log('🔧 Debug: owner =', owner);
  console.log('🔧 Debug: prNumber =', prNumber);
  console.log('🔧 Debug: commit SHA =', head_sha);

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'AgentPR-Bot',
  };

  const results = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../eslint-output.json'), 'utf-8')
  );

  const repoRoot = path.resolve(__dirname, '../../');
  console.log('📁 Resolved repo root:', repoRoot);

  const getChangedFiles = async () => {
    const { data } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      { headers }
    );
    console.log('🗂 PR changed files:');
    data.forEach((f: any) => console.log('  •', f.filename));
    return data
  .filter((f: any) => f.patch) // 🛡️ filter out files without patch
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
      const match = relativePath.match(/AgentPR\/(src\/.+\.ts)$/);
      const filePath = match ? match[1] : relativePath;

      console.log('🧪 Normalized file path for GitHub:', filePath);

      if (!fileToChangedLines.has(filePath)) {
        console.log('🚫 Skipping file not in PR diff:', filePath);
        continue;
      }

      const changedLines = fileToChangedLines.get(filePath)!;

      for (const message of result.messages) {
        if (!changedLines.has(message.line)) {
          console.log(`🔕 Skipping unchanged line ${message.line}`);
          continue;
        }

        const commentBody = `Error: ${message.message}\nRule: \`${message.ruleId || 'n/a'}\``;

        try {
          const postUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`;
          console.log(`📤 Inline comment to ${filePath}:${message.line}`);

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
        } catch (error: any) {
          console.warn(
            `❌ Failed to comment on ${filePath}:${message.line}`,
            error.response?.data?.message || error.message
          );
        }
      }
    }

    if (commentsPosted === 0) {
      const fallbackUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
      console.log(`📤 Fallback comment to ${fallbackUrl}`);
      await axios.post(
        fallbackUrl,
        {
          body: '✅ Lint completed, but no inline comments were necessary.',
        },
        { headers }
      );
    }

    console.log('✅ Lint Agent finished.');
  } catch (error: any) {
    console.error('❌ Lint Agent error:', error.response?.data?.message || error.message);
  }
}
