import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.GITHUB_TOKEN!;
const repoFull = process.env.GITHUB_REPO!;
const [owner, repo] = repoFull.split('/');
const prNumber = parseInt(process.env.PR_NUMBER!, 10);

const headers = {
  Authorization: `token ${token}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'AgentPR-Bot',
};

const results = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../eslint-output.json'), 'utf-8'));
const repoRoot = '/app';

const getChangedFiles = async () => {
  const { data } = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
    { headers }
  );
  return data.map((f: any) => ({ filename: f.filename, patch: f.patch }));
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

(async () => {
  try {
    const prRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      { headers }
    );
    const head_sha = prRes.data.head.sha;
    const changedFiles = await getChangedFiles();

    const fileToChangedLines = new Map<string, Set<number>>();
    changedFiles.forEach((file) => {
      fileToChangedLines.set(file.filename, extractChangedLines(file.patch));
    });

    let commentsPosted = 0;

    for (const result of results) {
      const filePath = path.relative(repoRoot, result.filePath);
      const changedLines = fileToChangedLines.get(filePath);
      if (!changedLines) continue;

      for (const message of result.messages) {
        if (!changedLines.has(message.line)) continue;

        const commentBody = `Error: ${message.message}\nRule: \`${message.ruleId || 'n/a'}\``;

        try {
          await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
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
        } catch {}
      }
    }

    if (commentsPosted === 0) {
      await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
        {
          event: 'COMMENT',
          body: `Lint completed but no inline comments could be posted. Check \`eslint-output.json\`.`,
        },
        { headers }
      );
    }
  } catch {}
})();
