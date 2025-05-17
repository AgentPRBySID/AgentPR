import express from 'express';
import { handlePullRequest } from '../agents/triageAgent';
import { runLintAgent } from '../agents/postLintComments';
import { runCoverageAgent } from '../agents/coverageAgent';

const router = express.Router();

router.post('/', async (req, res) => {
  const event = req.header('X-GitHub-Event');
  const action = req.body.action;
  const payload = req.body;

  // Run only on PR open, reopen, or sync
  if (event === 'pull_request' && ['opened', 'reopened', 'synchronize'].includes(action)) {
    try {
      console.log(`🔁 GitHub PR event received: ${action}`);

      await handlePullRequest(payload);  // Labeling
      await runLintAgent();              // Linting + inline comments
      await runCoverageAgent();          // ✅ Coverage report

      res.status(200).send('✅ Agents executed successfully.');
    } catch (error) {
      console.error('❌ Agent execution failed:', error);
      res.status(500).send('Agent execution failed.');
    }
  } else {
    res.status(200).send('Ignored event.');
  }
});

export default router;
