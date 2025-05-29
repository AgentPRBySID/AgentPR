import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function runCodeReviewAgent(prPayload: any) {
  try {
    const token = process.env.GITHUB_TOKEN!;
    const openaiKey = process.env.OPENAI_API_KEY!;
    if (!token || !openaiKey) throw new Error('Missing GITHUB_TOKEN or OPENAI_API_KEY.');
    console.log(' GPT Review Agent triggered');
    console.log(' OPENAI_API_KEY loaded:', openaiKey?.length);
    
    const prNumber = prPayload.number;
    const owner = prPayload.base.repo.owner.login;
    const repo = prPayload.base.repo.name;

    console.log(` Running Code Review Agent on ${owner}/${repo} PR #${prNumber}`);

    // GitHub's safer /files API to get limited diffs
    const filesUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`;
    const filesRes = await axios.get(filesUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'AgentPR-Bot',
      },
    });

    const patches = filesRes.data
      .filter((f: any) => f.patch)
      .map((f: any) => `### ${f.filename}\n${f.patch}`)
      .join('\n\n');

    const truncated = patches.length > 12000
      ? patches.slice(0, 12000) + '\n\n... [truncated]'
      : patches;

    console.log(' Using combined patches for GPT-4 prompt.');

    //  GPT-4 prompt
    const prompt = `
You are a senior software engineer reviewing a GitHub pull request.

Below are the diff patches for the modified files. Give feedback as bullet points:
- Spot logic bugs, risks, or code smells
- Recommend improvements in structure, clarity, or performance
- Be concise and constructive

${truncated}
`;

console.log(' Sending request to OpenAI...');

    // Step 3: Call OpenAI GPT-4
    const gptResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${openaiKey}`,
        },
      }
    );
    console.log(' GPT-4 Response:', JSON.stringify(gptResponse.data, null, 2));


    const feedback = gptResponse.data.choices[0].message.content;
    console.log(' GPT-4 Feedback:\n', feedback);

    // Step 4: Post feedback as PR comment
    const commentUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
    await axios.post(
      commentUrl,
      {
        body: ` **Automated Code Review Suggestions**\n\n${feedback}`,
      },
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    console.log(' Code review comment posted to GitHub.');
  } catch (err: any) {
    console.error(' Code Review Agent failed.');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Message:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
  }
}
