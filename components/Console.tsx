"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { mission, profile, projects, statusLabel, type Project } from "@/content/profile";
import { asciiPortrait, isDark, themeColors } from "@/lib/portrait";

type Line = { kind: "you" | "out" | "dim"; body: ReactNode };

const SUGGESTIONS = ["android", "scraping", "cache", "mcp", "now", "contact"];
const HIRE_WORDS = ["hire", "work with", "freelance", "available", "contract", "rate", "project for"];

function search(q: string): Project[] {
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  const scored = projects
    .map((p) => {
      const hay = [p.name, p.kind, p.summary, ...p.details, ...p.tags, ...p.stack].join(" ").toLowerCase();
      return { p, score: words.filter((w) => hay.includes(w)).length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((x) => x.p);
}

const projectLine = (p: Project) => (
  <>
    <a href={`#${p.slug}`}>{p.name}</a> · {p.kind} · {statusLabel[p.status].toLowerCase()}
  </>
);

function respond(input: string): Line[] | "clear" {
  const q = input.trim();
  const cmd = q.toLowerCase();
  if (!q) return [];
  if (cmd === "clear") return "clear";
  if (cmd === "help")
    return [
      { kind: "out", body: "Type any keyword to search my work, or one of these:" },
      { kind: "dim", body: "projects · now · mcp · contact · facts · whoami · clear" },
    ];
  if (cmd === "projects") return projects.map((p) => ({ kind: "out", body: projectLine(p) }));
  if (cmd === "now")
    return [
      { kind: "out", body: `${mission.name}: ${mission.goal}` },
      ...mission.steps.map((s) => ({ kind: s.done ? "dim" : "out", body: `[${s.done ? "x" : " "}] ${s.label}` }) as Line),
    ];
  if (cmd === "mcp")
    return [
      { kind: "out", body: "This site is also an MCP server. Add it to Claude and ask about my work." },
      { kind: "out", body: <a href="#mcp">How to connect →</a> },
    ];
  if (cmd === "facts") return [{ kind: "out", body: <a href="/facts">The one-page summary →</a> }];
  if (cmd === "contact" || HIRE_WORDS.some((w) => cmd.includes(w)))
    return [
      { kind: "out", body: "Email is the best way to reach me." },
      { kind: "out", body: <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a> },
      { kind: "dim", body: "Or DM me on X: @vishalvana_" },
    ];

  const hits = search(q);
  if (!hits.length)
    return [
      { kind: "out", body: `Nothing in my projects matches "${q}".` },
      { kind: "dim", body: "Try a broader word, or type help." },
    ];
  return [
    { kind: "dim", body: `${hits.length} match${hits.length === 1 ? "" : "es"}` },
    ...hits.map((p) => ({ kind: "out", body: projectLine(p) }) as Line),
  ];
}

const BOOT: Line[] = [
  { kind: "dim", body: `console ready · ${projects.length} projects indexed` },
  { kind: "out", body: "Ask about my work. Type a keyword or a command." },
  { kind: "dim", body: "Try: android, scraping, cache, mcp, or help" },
];

export function Console() {
  const [lines, setLines] = useState<Line[]>(BOOT);
  const [value, setValue] = useState("");
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight });
  }, [lines]);

  function run(input: string) {
    if (input.trim().toLowerCase() === "whoami") {
      setLines((prev) => [...prev, { kind: "you", body: "> whoami" }, { kind: "dim", body: "reading CAM-01…" }]);
      // The console is drawn in ink, so its ground is dark exactly when the ink colour is dark
      asciiPortrait(isDark(themeColors().ink)).then(
        (art) =>
          setLines((prev) => [
            ...prev.slice(0, -1),
            { kind: "out", body: <pre aria-label="ASCII portrait of Vishal Vana">{art}</pre> },
            { kind: "out", body: `${profile.name}. ${profile.role}.` },
          ]),
        () => setLines((prev) => [...prev.slice(0, -1), { kind: "dim", body: "Camera offline. Try again." }]),
      );
      return;
    }
    const reply = respond(input);
    if (reply === "clear") return setLines([]);
    if (!input.trim()) return;
    setLines((prev) => [...prev, { kind: "you", body: `> ${input.trim()}` }, ...reply]);
  }

  return (
    <section className="panel console span-5" aria-labelledby="console-h">
      <div className="panel-head">
        <h2 id="console-h">Console</h2>
        <span>search my work</span>
      </div>
      <div className="console-out" ref={outRef} aria-live="polite">
        {lines.map((l, i) => (
          <p key={i} className={l.kind === "out" ? undefined : l.kind}>
            {l.body}
          </p>
        ))}
      </div>
      <div className="chips">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => run(s)}>
            {s}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
          setValue("");
        }}
      >
        <label htmlFor="console-input">&gt;</label>
        <input
          id="console-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. spring boot, flutter, scraping"
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </section>
  );
}
