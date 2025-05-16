import { classifyRiskLevel } from '../utils/classifier';
import { postPRLabel } from '../services/githubService';

export const handlePullRequest = async (payload: any) => {
  const prTitle = payload.pull_request.title;
  const prBody = payload.pull_request.body || '';
  const prNumber = payload.pull_request.number;
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;
  //const testLint = true; // temp line to trigger ESLint and PR diff
  const debugInlineLint = 123;



  const risk = classifyRiskLevel(prTitle + ' ' + prBody);

  await postPRLabel(owner, repo, prNumber, risk);
  
};
// eslint-disable-next-line no-unused-vars
const debugTriggerLint = 456;
// eslint-disable-next-line no-unused-vars
const debugTriggerLint = 456;
