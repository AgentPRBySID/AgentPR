import express from 'express';
import { handlePullRequest } from '../agents/triageAgent';

const router = express.Router();

router.post('/', async (req, res) => {
  const event = req.headers['x-github-event'];

  console.log('📩 GitHub Event:', event);
  console.log('🧠 Payload:', req.body);

  if (event === 'pull_request') {
    try {
      await handlePullRequest(req.body);
      res.status(200).send('✅ PR event processed');
    } catch (error) {
      console.error('❌ Error in handlePullRequest:', error);
      res.status(500).send('Error processing PR');
    }
  } else {
    res.status(200).send('Ignored non-PR event');
  }
});

export default router;


