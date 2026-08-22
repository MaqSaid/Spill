---
title: MCP (Model Context Protocol) Best Practices
inclusion: always
---

# MCP Best Practices

## Server Configuration
- Use workspace-level config (`.kiro/settings/mcp.json`) for project-specific servers
- Use user-level config (`~/.kiro/settings/mcp.json`) for global/cross-workspace servers
- Workspace config takes precedence over user config for name conflicts
- Always specify exact versions or use `@latest` for stability
- Use environment variables (`${ENV_VAR}` syntax) for credentials — never hardcode

## Remote MCP (Streamable HTTP)
- Kiro supports remote MCP servers via Streamable HTTP and HTTP+SSE
- Use `"type": "streamableHttp"` with `"url"` for remote servers
- Use dynamic client registration for OAuth-based services
- Remote servers extend capabilities beyond the local environment

## Security and Auto-Approval
- Use `autoApprove` sparingly and only for trusted, low-risk read-only tools
- Review tool capabilities before adding to auto-approve list
- Regularly audit auto-approved tools
- Store API keys in environment variables, approved via Kiro's security prompt

## Performance
- Disable unused servers to improve startup time
- Set `FASTMCP_LOG_LEVEL: "ERROR"` to reduce noise
- Use specific tool names in auto-approve rather than wildcards
- Test servers immediately after configuration

## Troubleshooting
- Check server logs in Kiro's MCP Server view
- Verify `uv` and `uvx` installation if Python-based servers fail
- Use command palette "MCP" commands for server management
- Servers reconnect automatically on config changes
- Use `"disabled": true` to temporarily disable problematic servers

## Zero-Cost MCP Servers for This Project
- **Context7**: Dependency compatibility checking (free, no API key)
- **Playwright MCP**: Browser automation for E2E testing (free, open source)
- **GitHub MCP**: PR review, issue triage, code search (free with GitHub token)
- **Fetch MCP**: Web content fetching for documentation (free, no API key)
- **Memory MCP**: Persistent knowledge graph for project context (free, local)
