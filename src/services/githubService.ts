import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config(); // Ensure this is called so env vars are loaded

export const postPRLabel = async (
  owner: string,
  repo: string,
  prNumber: number,
  label: string
) => {
  const token = process.env.GITHUB_TOKEN;
  console.log('GitHub token:', token); 

  if (!token) {
    throw new Error('GitHub token is missing. Check your .env file');
  }

  try {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/labels`,
      { labels: [label] },
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'AgentPR-Bot'
        }
      }
    );

    console.log(` Label "${label}" added to PR #${prNumber}`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to add label');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
};
