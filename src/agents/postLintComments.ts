import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Intentional lint error to test
const temp: any = 'still testing inline comment';


export async function runLintAgent() {
  const token = process.env.GITHUB_TOKEN!;
  const repoFull = process.env.GITHUB_REPO!;
  const [owner, repo] = repoFull.split('/');
  const prNumber = parseInt(process.env.PR_NUMBER!, 10);

  console.log('🔧 Debug: repo =', repo);
  console.log('🔧 Debug: owner =', owner);
  console.log('🔧 Debug: prNumber =', prNumber);

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
    return data.map((f: { filename: string; patch: string }) => ({
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
    const prRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      { headers }
    );
    const head_sha = prRes.data.head.sha;
    console.log('🔧 Debug: commit SHA =', head_sha);

    const changedFiles = await getChangedFiles();

    const fileToChangedLines = new Map<string, Set<number>>();
    changedFiles.forEach((file: { filename: string; patch: string }) =>
      {
      fileToChangedLines.set(file.filename, extractChangedLines(file.patch));
    });

    let commentsPosted = 0;

    for (const result of results) {
      let relativePath = path.relative(repoRoot, result.filePath).replace(/\\/g, '/');

      // Normalize path to match GitHub PR diff format exactly
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
    console.error(
      '❌ Lint Agent error:',
      error.response?.data?.message || error.message
    );
  }
}
