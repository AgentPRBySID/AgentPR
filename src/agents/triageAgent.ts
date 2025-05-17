import { classifyRiskLevel } from '../utils/classifier';
import { postPRLabel } from '../services/githubService';

/**
 * Triage Agent: classifies PRs based on title/body and applies risk label
 */
export async function handlePullRequest(payload: any) {
  const prTitle = payload.pull_request.title;
  const prBody = payload.pull_request.body || '';
  const prNumber = payload.pull_request.number;
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;

  const risk = classifyRiskLevel(`${prTitle} ${prBody}`);
  await postPRLabel(owner, repo, prNumber, risk);

  console.log(`✅ Applied label: ${risk}`);
  const test: any=         64;

}



