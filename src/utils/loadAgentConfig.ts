import axios from 'axios';
import yaml from 'js-yaml';
import dotenv from 'dotenv';

dotenv.config();

export interface AgentConfig {
  triage: boolean;
  lint: boolean;
  coverage: boolean;
  gptReview: boolean;
  securityScan: {
    enabled: boolean;
    failOnFinding: boolean;
  };
}

// Default fallback config
const defaultConfig: AgentConfig = {
  triage: true,
  lint: true,
  coverage: true,
  gptReview: true,
  securityScan: {
    enabled: true,
    failOnFinding: false,
  },
};

export async function loadAgentConfig(owner: string, repo: string, branch = 'main'): Promise<AgentConfig> {
  try {
    const token = process.env.GITHUB_TOKEN!;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/agentpr.yml?ref=${branch}`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3.raw',
      },
    });

    const configYaml = res.data;
    const parsed = yaml.load(configYaml) as AgentConfig;
    console.log('✅ Loaded agentpr.yml config:', parsed);
    return { ...defaultConfig, ...parsed };
  } catch (err) {
    console.warn('⚠️ Failed to load agentpr.yml, using default config.');
    return defaultConfig;
  }
}
