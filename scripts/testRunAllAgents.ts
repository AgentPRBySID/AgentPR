import { loadAgentConfig } from '../src/utils/loadAgentConfig';
import { runTriageAgent } from '../src/agents/triageAgent';
import { runCoverageAgent } from '../src/agents/coverageAgent';
import { runCodeReviewAgent } from '../src/agents/codeReviewAgent';
import { runSecurityScanAgent } from '../src/agents/securityScanAgent';
import { runLintAgent } from '../src/agents/lintAgent';

 // hypothetical combined function

 const prPayload = {
    number: 23,
    base: {
      repo: {
        name: 'AgentPR',
        owner: { login: 'sreebhargav' }
      }
    },
    head: {
      sha: 'your-latest-pr-commit-sha'
    },
    pull_request: {
      number: 23,
      title: 'feat: triage agent',
      body: 'This PR adds risk classification and label support.'
    },
    repository: {
      name: 'AgentPR',
      owner: { login: 'sreebhargav' }
    }
  };
  
  

async function main() {
  const { owner, name } = prPayload.base.repo;
  const config = await loadAgentConfig(owner.login, name);

  if (config.triage) await runTriageAgent(prPayload);
  if (config.lint) await runLintAgent(prPayload); // combines parser + comment
  if (config.coverage) await runCoverageAgent(prPayload);
  if (config.gptReview) await runCodeReviewAgent(prPayload);
  if (config.securityScan.enabled) await runSecurityScanAgent(prPayload);
}

main();
