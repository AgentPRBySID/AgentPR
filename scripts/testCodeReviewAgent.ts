import { runCodeReviewAgent } from '../src/agents/codeReviewAgent';



const fakePayload = {
  number: 22, // Replace with your actual PR number
  base: {
    repo: {
      name: 'AgentPR',
      owner: { login: 'sreebhargav' }, //  Your GitHub username
    },
  },
  head: {
    ref: 'feature/code-review-agent-test', //  The name of the branch from your PR
  },
};

runCodeReviewAgent(fakePayload);
