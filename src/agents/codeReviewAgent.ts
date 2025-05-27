import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function runCodeReviewAgent(prPayload: any) {
  try {
    const token = process.env.GITHUB_TOKEN!;
    const openaiKey = process.env.OPENAI_API_KEY!;
    if (!token || !openaiKey) throw new Error('Missing GITHUB_TOKEN or OPENAI_API_KEY.');

    const prNumber = prPayload.number;
    const owner = prPayload.base.repo.owner.login;
    const repo = prPayload.base.repo.name;

    console.log(`📦 Running Code Review Agent on ${owner}/${repo} PR #${prNumber}`);

    // Step 1: Fetch PR diff
    const diffUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
    const { data: diffText } = await axios.get(diffUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3.diff',
        'User-Agent': 'AgentPR-Bot',
      },
    });

    console.log('🧾 Diff fetched. Sending to GPT-4...');

    // Step 2: Build GPT-4 prompt
    const prompt = `
You are a senior software engineer reviewing a GitHub pull request.

Below is the diff. Give feedback as bullet points:
- Flag logic bugs, complexity, or code smells.
- Suggest best practices or simplifications.
- Focus on clarity, structure, and maintainability.

Respond with just the feedback. Here's the diff:
${diffText}
    `;

    // Step 3: Call OpenAI
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

    const feedback = gptResponse.data.choices[0].message.content;
    console.log('💬 GPT-4 Feedback:\n', feedback);

    // Step 4: Post feedback to GitHub
    const commentUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
    await axios.post(
      commentUrl,
      {
        body: `🤖 **Automated Code Review Suggestions**\n\n${feedback}`,
      },
      { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' } }
    );

    console.log('✅ Code review comment posted to GitHub.');

  } catch (err: any) {
    console.error('❌ Code Review Agent failed.');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Message:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
  }
}
