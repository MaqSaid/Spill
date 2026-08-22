# Kiro Features Analysis — What We're Using & What We're Missing

## Features We ARE Using

| Feature | How We Use It |
|---------|---------------|
| Steering Files | 11 files: architecture, security, deployment, Python, TypeScript, React, Docker, Git, Testing, Development Standards, MCP |
| Agent Hooks | 10 hooks: lint, security scan, secret validation, post-write review, auto-test, env validation, commit helper, Docker validation, dependency scan |
| Specs | Full requirements.md → design.md → tasks.md workflow |
| Autopilot Mode | End-to-end autonomous implementation |
| Sub-agents | context-gatherer for codebase analysis, semantic_reviewer for PR review |
| Pre-commit | GitLeaks, Ruff, Mypy, detect-private-key |

## Features We're MISSING (Opportunities)

### 1. Kiro Powers (Installed Powers Available NOW)

We have powers already installed that we haven't activated:

| Power | Use Case for Spill |
|-------|-------------------|
| **cloud-architect** | Design our AWS CDK infrastructure for production deployment |
| **aws-cost-optimization** | Analyze hosting costs for App Runner / RDS |
| **snyk-secure-at-inception** | Deep SAST/SCA security scanning beyond Bandit |
| **checkmarx** | Enterprise-grade vulnerability detection |
| **terraform** | Alternative IaC if moving away from CDK |
| **strands** | Build AI agents for automated ticket triage |

**Action:** Run `kiro_powers activate <power-name>` in a session to use these.

### 2. Remote MCP / WebMCP (Streamable HTTP)

Kiro now supports **remote MCP servers** via Streamable HTTP. This means:

- Connect to cloud-hosted AI tools without local installs
- OAuth-based authentication (Notion, Linear, Jira, etc.)
- Use `"type": "streamableHttp"` + `"url"` in MCP config

**Zero-cost remote MCP options:**
- **Notion MCP** (free tier) — store runbooks and docs
- **Linear MCP** (free tier) — issue tracking integration
- **Civic MCP** — identity verification (if Spill adds org verification later)

### 3. Kiro Web + Mobile

Kiro now runs on web and mobile (iOS early access). You can:
- Run background tasks via **Automations** while away from desk
- Review Spill PRs on mobile
- Use MCP servers from any device

### 4. One-Click MCP Install

Kiro has an "Add to Kiro" button for curated MCP servers. Browse the server catalog from Kiro's documentation to install servers instantly.

### 5. Conditional Steering (fileMatch patterns)

We've now added `fileMatch` patterns so steering loads contextually:
- Python best practices load ONLY when `.py` files are open
- React/TypeScript best practices load ONLY when `.tsx` files are open
- Docker best practices load ONLY when Dockerfiles are open
- This saves context budget and improves relevance

### 6. Manual Steering (#context keys)

We could add a `inclusion: manual` steering file for advanced topics:
- Privacy audit checklist (invoked with `#privacy-audit` in chat)
- Deployment runbook steps (invoked with `#deploy` in chat)

---

## Zero-Cost AI Features We Can Add

### Already Free (No API Key Needed)

| MCP Server | What It Does | Setup |
|-----------|-------------|-------|
| Context7 | Check dependency compatibility | npx, no key |
| Playwright | Browser automation / E2E testing | npx, no key |
| Memory | Persistent knowledge graph | npx, no key |
| Fetch | Web content fetching | uvx, no key |
| Sequential Thinking | Chain-of-thought reasoning | npx, no key |
| Filesystem | Enhanced file operations | npx, no key |

### Free With Token (Still $0)

| MCP Server | What It Does | Token Source |
|-----------|-------------|-------------|
| GitHub | PR review, issue triage, code search | Free GitHub PAT |
| GitLab | MR management | Free GitLab PAT |

### Kiro Built-in (Included in Plan)

| Feature | What It Does |
|---------|-------------|
| semantic_reviewer | Design-level code review |
| context-gatherer | Deep codebase exploration |
| general-task-execution | Parallel autonomous subtasks |
| Web search + Fetch | Real-time documentation lookup |
| Powers ecosystem | Pre-packaged tool+knowledge bundles |

---

## Recommendations for Spill

### Immediate (Do Now)
1. Add Context7, Memory, and Sequential Thinking MCP servers via Kiro UI
2. Add Playwright MCP for automated E2E testing of encryption flow
3. Use `inclusion: manual` steering for a `#privacy-audit` checklist

### Short-Term
4. Activate **snyk-secure-at-inception** power for deeper security scanning
5. Add GitHub MCP for automated PR workflows
6. Use Memory MCP to persist architecture decisions across sessions

### Medium-Term
7. Activate **cloud-architect** power when ready for AWS production deployment
8. Set up Kiro Web Automations for background CI tasks
9. Add remote MCP (Notion or Linear) for issue tracking integration
10. Explore **strands** power for building an AI-powered ticket triage agent

---

## What is WebMCP?

"WebMCP" refers to Kiro's support for **remote MCP servers over Streamable HTTP** (and legacy HTTP+SSE). Instead of running MCP servers locally via stdio, you can connect to cloud-hosted servers over HTTPS.

**Benefits for Spill:**
- No local process overhead
- Access cloud-only tools (Notion, Jira, databases)
- OAuth-based auth handled by Kiro automatically
- Works on Kiro Web and Mobile too

**Configuration format:**
```json
{
  "my-remote-server": {
    "type": "streamableHttp",
    "url": "https://my-server.example.com/mcp",
    "headers": {
      "Authorization": "Bearer ${MY_API_TOKEN}"
    }
  }
}
```

This is available now in the latest Kiro IDE version.
