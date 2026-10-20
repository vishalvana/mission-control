# Mission Control

My portfolio, built as the thing I do: a console you can search, a live log of what I'm shipping, and an MCP server so Claude can answer questions about my work.

- `/` the console, current mission, ship log (latest commits from GitHub), projects and record
- `/facts` the same information as one plain page
- `/mcp` an MCP server (Streamable HTTP, stateless). Tools: `get_profile`, `list_projects`, `get_project`, `get_current_mission`, `get_recent_activity`

Everything the site says comes from one file: [`content/profile.ts`](content/profile.ts).

## Connect it to Claude

```bash
claude mcp add --transport http vishal-vana https://<site>/mcp
```

On claude.ai: Settings → Connectors → Add custom connector, and paste the `/mcp` URL.

## Run it

```bash
npm install
npm run dev
```

Optional: set `GITHUB_TOKEN` to raise the GitHub API rate limit for the ship log.

Built with Next.js 16.
