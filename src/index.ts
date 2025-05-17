import express from 'express';
import dotenv from 'dotenv';
import githubRoutes from './routes/github';

dotenv.config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON (required for GitHub payloads)
app.use(express.json(({ limit: '5mb' })));

// Route for handling GitHub webhooks
app.use('/webhook', githubRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(` AgentPR server running on port ${PORT}`);
});


