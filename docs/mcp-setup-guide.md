# MCP Setup Guide — Zero-Cost AI Servers for Spill

## How to Configure

MCP servers must be configured through Kiro's UI (the `.kiro/settings/mcp.json` path is protected).

**Steps:**
1. Open Command Palette → search "MCP"
2. Select "Add MCP Server"
3. Paste each server configuration below

Alternatively, configure via the Kiro panel → MCP Servers → "+"

---

## Recommended Zero-Cost Servers

### 1. Context7 — Dependency Compatibility (FREE, no API key)

Verifies library compatibility before adding dependencies. Useful for checking React, FastAPI, SQLAlchemy version conflicts.

```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp@latest"],
    "env": { "FASTMCP_LOG_LEVEL": "ERROR" },
    "disabled": false,
    "autoApprove": ["resolve-library-id", "get-library-docs"]
  }
}
```

### 2. Playwright MCP — Browser Automation (FREE, open source)

Automate E2E testing, take screenshots, verify UI encryption flow.

```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-playwright@latest"],
    "env": { "FASTMCP_LOG_LEVEL": "ERROR" },
    "disabled": false,
    "autoApprove": ["browser_navigate", "browser_screenshot"]
  }
}
```

### 3. Memory MCP — Persistent Knowledge Graph (FREE, local)

Stores project context, architecture decisions, and cross-session knowledge.

```json
{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory@latest"],
    "env": { "FASTMCP_LOG_LEVEL": "ERROR" },
    "disabled": false,
    "autoApprove": ["read_graph", "search_nodes"]
  }
}
```

### 4. Fetch MCP — Web Content Fetching (FREE, no API key)

Fetches documentation, API references, and web pages for up-to-date information.

```json
{
  "fetch": {
    "command": "uvx",
    "args": ["mcp-server-fetch@latest"],
    "env": { "FASTMCP_LOG_LEVEL": "ERROR" },
    "disabled": false,
    "autoApprove": ["fetch"]
  }
}
```

### 5. Sequential Thinking — Structured Reasoning (FREE, local)

Provides chain-of-thought reasoning for complex architecture decisions.

```json
{
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking@latest"],
    "env": { "FASTMCP_LOG_LEVEL": "ERROR" },
    "disabled": false,
    "autoApprove": ["sequentialthinking"]
  }
}
```

### 6. GitHub MCP — Code Search & PR Review (FREE with GitHub token)

Requires `GITHUB_PERSONAL_ACCESS_TOKEN` in environment. Provides PR review, issue management, code search.

```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github@latest"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}",
      "FASTMCP_LOG_LEVEL": "ERROR"
    },
    "disabled": false,
    "autoApprove": ["search_code", "list_issues"]
  }
}
```

---

## Remote MCP Servers (WebMCP / Streamable HTTP)

Kiro now supports remote MCP servers via Streamable HTTP. This enables connecting to cloud-hosted tools without running local processes.

### Example: Remote server with OAuth
```json
{
  "notion": {
    "type": "streamableHttp",
    "url": "https://mcp.notion.so/v1/mcp",
    "disabled": false
  }
}
```

Kiro handles OAuth dynamic client registration automatically — it will prompt you to authenticate in your browser.

---

## AI Features Available at Zero Cost

| Feature | How | Cost |
|---------|-----|------|
| Sequential reasoning | Sequential Thinking MCP server | Free |
| Knowledge persistence | Memory MCP (local knowledge graph) | Free |
| Dependency checking | Context7 MCP server | Free |
| Browser automation | Playwright MCP | Free |
| Web research | Fetch MCP server | Free |
| Code review assist | GitHub MCP + Kiro's built-in semantic_reviewer | Free |
| Architecture analysis | Kiro's context-gatherer sub-agent | Free (Kiro credits) |
| Spec-driven development | Kiro Specs (requirements→design→tasks) | Free (Kiro credits) |

## Prerequisites

Ensure these are installed:
- **Node.js 18+** (for npx-based servers)
- **uv** (for uvx-based Python servers): `pip install uv` or see https://docs.astral.sh/uv/getting-started/installation/
