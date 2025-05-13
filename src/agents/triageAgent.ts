import { classifyRiskLevel } from '../utils/classifier';
import { postPRLabel } from '../services/githubService';

export const handlePullRequest = async (payload: any) => {
  const prTitle = payload.pull_request.title;
  const prBody = payload.pull_request.body || '';
  const prNumber = payload.pull_request.number;
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;

  const risk = classifyRiskLevel(prTitle + ' ' + prBody);

  await postPRLabel(owner, repo, prNumber, risk);
};
