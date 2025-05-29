# AgentPR: AI-Powered Pull Request Automation
![Docker Pulls](https://img.shields.io/docker/pulls/sreebhargav9999/agentpr?style=flat-square)

AgentPR is an intelligent DevTool that automates code review, linting, test coverage analysis, and security scanning across GitHub pull requests. It's built for engineering teams that want to scale quality assurance and reduce manual code review overhead.

---

## 🚀 Features

* **PR Triage**: Classifies PRs as feature, bugfix, or docs using AI.
* **Lint Agent**: Runs ESLint and comments inline on violations.
* **Coverage Agent**: Analyzes test coverage using Jest and posts a badge to the PR.
* **Security Scan Agent**: Uses Semgrep to detect OWASP Top 10 risks.
* **Code Review Agent**: GPT-powered summary and feedback of PRs.

---

## 🧩 Architecture Overview

1. **GitHub Webhook** triggers on PR events
2. **Express.js server** receives events and dispatches agents
3. **PostgreSQL** stores test coverage history
4. **Each agent** runs independently and posts results to GitHub

---

## 🐳 Docker Deployment

### 🧪 Local Development (Self-Hosted)

**Requirements**:

* Docker
* GitHub Webhook configured to point to your machine (use [ngrok](https://ngrok.com/) for local testing)

```bash
git clone https://github.com/your-org/AgentPR.git
cd AgentPR
cp .env.example .env  # Fill with your GitHub token, DB creds, OpenAI key
```

**Run with Docker Compose**:

```bash
docker-compose up --build
```
Or run manually:

```bash
docker run --rm --env-file .env -v $(pwd):/app sreebhargav9999/agentpr:v4
```

### ☁️ SaaS/Cloud Hosting

Deploy to services like Render, Railway, or AWS ECS:

* Set environment variables (`GITHUB_TOKEN`, `OPENAI_API_KEY`, `DATABASE_URL`)
* Use a managed PostgreSQL instance
* Add your public AgentPR URL to your GitHub webhook settings

Optional: Push image to Docker Hub

```bash
docker build -t yourname/agentpr .
docker push yourname/agentpr
```

---

## 🔧 Configuration

### `.env`

```dotenv
GITHUB_TOKEN=ghp_...
OPENAI_API_KEY=sk-...
PGHOST=...
PGUSER=...
PGPASSWORD=...
PGDATABASE=agentpr
PGPORT=5432
```

---

## 📂 Repository Structure

```
├── src
│   ├── agents
│   ├── utils
│   ├── server.ts
├── coverage/
├── __tests__/
├── scripts/
├── docker-compose.yml
├── Dockerfile
```

---

## 📈 Coming Soon

* Web dashboard to track agent activity
* GitHub App integration
* Slack notifications

---

## 🛠 Contributors

Made with ❤️ by the AgentPR Team
