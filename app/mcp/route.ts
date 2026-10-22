// A small, stateless MCP server (Streamable HTTP transport, JSON responses).
// Point any MCP client at https://<site>/mcp and ask about Vishal's work.

import { capabilities, experience, mission, profile, projects, research, statusLabel } from "@/content/profile";
import { getShipLog } from "@/lib/github";

const SERVER_INFO = { name: "vishal-vana", title: "Vishal Vana", version: "1.0.0" };
const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version",
};

type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  run: (args: Record<string, unknown>) => Promise<string> | string;
};

const projectLine = (p: (typeof projects)[number]) =>
  `- ${p.name} (${p.slug}) · ${statusLabel[p.status]} · ${p.year}\n  ${p.summary}\n  Stack: ${p.stack.join(", ")}`;

const TOOLS: Tool[] = [
  {
    name: "get_profile",
    title: "Who Vishal is",
    description: "Vishal Vana's background, current role, focus and how to reach him.",
    inputSchema: { type: "object", properties: {} },
    run: () =>
      [
        `${profile.name}: ${profile.role}. ${profile.location}.`,
        profile.headline,
        profile.intro,
        "",
        ...profile.about,
        "",
        "What he builds:",
        ...capabilities.map((c) => `- ${c.title}: ${c.line}`),
        "",
        "Experience and education:",
        ...experience.map((e) => `- ${e.when}: ${e.what}, ${e.where}${e.note ? `. ${e.note}` : ""}`),
        "",
        "Research:",
        ...research.map((r) => `- ${r.title} (${r.venue}${r.when ? `, ${r.when}` : ""})`),
        "",
        `Email: ${profile.contact.email}`,
        `GitHub: ${profile.contact.github} · LinkedIn: ${profile.contact.linkedin} · X: ${profile.contact.x}`,
      ].join("\n"),
  },
  {
    name: "list_projects",
    title: "List projects",
    description:
      "Projects Vishal has built. Optionally filter by a tag or keyword such as backend, mobile, scraping, automation, agents or system-design.",
    inputSchema: {
      type: "object",
      properties: { filter: { type: "string", description: "Tag or keyword to filter by (optional)" } },
    },
    run: ({ filter }) => {
      const q = typeof filter === "string" ? filter.trim().toLowerCase() : "";
      const list = q
        ? projects.filter((p) =>
            [p.name, p.kind, p.summary, ...p.tags, ...p.stack].some((s) => s.toLowerCase().includes(q)),
          )
        : projects;
      if (!list.length) return `No projects match "${filter}". Try list_projects with no filter.`;
      return list.map(projectLine).join("\n");
    },
  },
  {
    name: "get_project",
    title: "Project details",
    description: "Full details of one project, by the slug returned from list_projects.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", description: "Project slug, e.g. baas" } },
      required: ["slug"],
    },
    run: ({ slug }) => {
      const p = projects.find((x) => x.slug === slug);
      if (!p) return `No project with slug "${slug}". Known slugs: ${projects.map((x) => x.slug).join(", ")}`;
      return [
        `${p.name}: ${p.kind} (${statusLabel[p.status]}, ${p.year})`,
        p.summary,
        ...p.details.map((d) => `- ${d}`),
        `Stack: ${p.stack.join(", ")}`,
        ...p.links.map((l) => `${l.label}: ${l.url}`),
      ].join("\n");
    },
  },
  {
    name: "get_current_mission",
    title: "What he's building now",
    description: "The project Vishal is shipping right now, with progress.",
    inputSchema: { type: "object", properties: {} },
    run: () =>
      [
        `${mission.name}: ${mission.goal}`,
        `Target date: ${mission.due}`,
        ...mission.steps.map((s) => `[${s.done ? "x" : " "}] ${s.label}`),
        `Repo: ${mission.repo}`,
      ].join("\n"),
  },
  {
    name: "get_recent_activity",
    title: "Recent commits",
    description: "Vishal's latest commits across his public GitHub repos.",
    inputSchema: { type: "object", properties: {} },
    run: async () => {
      const log = await getShipLog(10);
      if (!log.length) return `Couldn't reach GitHub just now. See ${profile.contact.github}`;
      return log.map((e) => `- ${e.date.slice(0, 10)} ${e.repo}: ${e.message}`).join("\n");
    },
  },
];

type RpcMessage = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

const ok = (id: RpcMessage["id"], result: unknown) => ({ jsonrpc: "2.0", id, result });
const fail = (id: RpcMessage["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

async function handle(msg: RpcMessage) {
  const isNotification = msg.id === undefined;
  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return isNotification ? null : fail(msg.id, -32600, "Invalid request");
  }
  if (isNotification) return null; // notifications/initialized and friends need no reply

  switch (msg.method) {
    case "initialize": {
      const asked = msg.params?.protocolVersion;
      const protocolVersion = typeof asked === "string" && PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0];
      return ok(msg.id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "Answers questions about Vishal Vana, a developer who builds AI agents, automations, backends and mobile apps. Start with get_profile or list_projects.",
      });
    }
    case "ping":
      return ok(msg.id, {});
    case "tools/list":
      return ok(msg.id, {
        tools: TOOLS.map((t) => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema })),
      });
    case "tools/call": {
      const name = msg.params?.name;
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) return fail(msg.id, -32602, `Unknown tool: ${String(name)}`);
      const args = (msg.params?.arguments as Record<string, unknown>) ?? {};
      try {
        return ok(msg.id, { content: [{ type: "text", text: await tool.run(args) }], isError: false });
      } catch {
        return ok(msg.id, { content: [{ type: "text", text: "That tool failed. Try again in a moment." }], isError: true });
      }
    }
    default:
      return fail(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(fail(null, -32700, "Parse error"), { status: 400, headers: CORS });
  }

  const messages = (Array.isArray(body) ? body : [body]) as RpcMessage[];
  const replies = (await Promise.all(messages.map(handle))).filter(Boolean);

  if (!replies.length) return new Response(null, { status: 202, headers: CORS });
  return Response.json(Array.isArray(body) ? replies : replies[0], { headers: CORS });
}

export async function GET(request: Request) {
  // MCP clients open GET for a server-sent event stream; this server doesn't offer one.
  if (!request.headers.get("accept")?.includes("text/html")) {
    return new Response(null, { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } });
  }
  const tools = TOOLS.map((t) => `<li><code>${t.name}</code> ${t.description}</li>`).join("");
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MCP · Vishal Vana</title>
<body style="font:15px/1.6 ui-monospace,Consolas,monospace;max-width:640px;margin:48px auto;padding:0 16px">
<h1 style="font-size:20px">This is an MCP server.</h1>
<p>Add this URL to Claude (or any MCP client) as a remote server, then ask it about Vishal's work.</p>
<ul>${tools}</ul><p><a href="/">Back to the site</a></p></body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
