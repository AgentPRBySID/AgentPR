import fs from 'fs';

import { loadAgentConfig } from '../src/utils/loadAgentConfig';
import { runTriageAgent } from '../src/agents/triageAgent';
import { runCoverageAgent } from '../src/agents/coverageAgent';
import { runCodeReviewAgent } from '../src/agents/codeReviewAgent';
import { runSecurityScanAgent } from '../src/agents/securityScanAgent';
import { runLintAgent } from '../src/agents/lintAgent';

async function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    throw new Error('GITHUB_EVENT_PATH not defined');
  }

  const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));

  const prPayload = {
    number: eventData.number,
    base: eventData.pull_request?.base,
    head: eventData.pull_request?.head,
    pull_request: {
      number: eventData.pull_request?.number,
      title: eventData.pull_request?.title,
      body: eventData.pull_request?.body
    },
    repository: {
      name: eventData.repository?.name,
      owner: { login: eventData.repository?.owner?.login }
    }
  };

  const owner = prPayload.base.repo.owner.login;
  const name = prPayload.base.repo.name;
  const config = await loadAgentConfig(owner, name);

  if (config.triage) await runTriageAgent(prPayload);
  if (config.lint) await runLintAgent(prPayload);
  if (config.coverage) await runCoverageAgent(prPayload);
  console.log('🧪 Loaded config:', config);

  if (config.gptReview) {
    console.log('✅ GPT Review Enabled:', config.gptReview);
    await runCodeReviewAgent(prPayload);
  }

  if (config.securityScan.enabled){
    console.log("🔐 Starting Semgrep scan...");
     await runSecurityScanAgent(prPayload);
}

main();}
