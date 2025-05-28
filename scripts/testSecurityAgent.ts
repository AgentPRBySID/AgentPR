import { runSecurityScanAgent } from '../src/agents/securityScanAgent';

const fakePayload = {
  number: 22, // replace with your PR number
  base: {
    repo: {
      name: 'AgentPR',
      owner: { login: 'sreebhargav' },
    },
  },
};

runSecurityScanAgent(fakePayload);
