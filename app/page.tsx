import { Suspense } from "react";
import Link from "next/link";
import { capabilities, experience, mission, profile, projects, research, statusLabel } from "@/content/profile";
import { getShipLog } from "@/lib/github";
import { Clocks, DaysLeft } from "@/components/Clocks";
import { Console } from "@/components/Console";
import { CopyButton } from "@/components/CopyButton";
import { Portrait } from "@/components/Portrait";

const SITE = process.env.SITE_URL ?? (process.env.VERCEL ? "https://vishalvana.vercel.app" : "http://localhost:3000");
const MCP_URL = `${SITE}/mcp`;
const CLAUDE_CODE_CMD = `claude mcp add --transport http vishal-vana ${MCP_URL}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

async function ShipLog() {
  const log = await getShipLog(8);
  if (!log.length) {
    return (
      <p className="muted">
        GitHub didn&apos;t answer just now. Everything is on <a href={profile.contact.github}>github.com/{profile.handle}</a>.
      </p>
    );
  }
  return (
    <ul className="log">
      {log.map((e) => (
        <li key={e.url}>
          <time dateTime={e.date}>{shortDate(e.date)}</time>
          <span className="repo">{e.repo}</span>
          <a href={e.url}>{e.message}</a>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const doneSteps = mission.steps.filter((s) => s.done).length;

  return (
    <div className="shell">
      <header className="strip">
        <Link href="/" className="strip-id">
          VISHAL VANA / MISSION CONTROL
        </Link>
        <span>
          <span className="dot" aria-hidden="true" />
          Shipping weekly
        </span>
        <Clocks />
      </header>

      <main className="deck">
        <section className="panel identity span-7" aria-labelledby="who-h">
          <div className="identity-text">
            <span className="who">
              {profile.role} · {profile.location}
            </span>
            <h1 id="who-h">
              I build AI agents and automations that <em>do real work.</em>
            </h1>
            <p className="intro">{profile.intro}</p>
            <div className="actions">
              <a className="btn primary" href="#projects">
                See what I&apos;ve built
              </a>
              <Link className="btn" href="/facts">
                Just the facts
              </Link>
            </div>
          </div>
          <Portrait />
        </section>

        <Console />

        <section className="panel mission span-5" aria-labelledby="mission-h">
          <div className="panel-head">
            <h2 id="mission-h">Current mission</h2>
            <span>
              due {shortDate(mission.due)} · <DaysLeft due={mission.due} />
            </span>
          </div>
          <h3>{mission.name}</h3>
          <p>{mission.goal}</p>
          <div className="gauge" role="img" aria-label={`${doneSteps} of ${mission.steps.length} steps done`}>
            <span style={{ width: `${(doneSteps / mission.steps.length) * 100}%` }} />
          </div>
          <ul className="steps">
            {mission.steps.map((s) => (
              <li key={s.label} className={s.done ? "done" : undefined}>
                <span className="mark">{s.done ? "[x]" : "[ ]"}</span>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
          <div className="countdown">
            <a href={mission.repo}>Follow the repo</a>
            <a href={profile.contact.x}>Updates on X</a>
          </div>
        </section>

        <section className="panel span-7" aria-labelledby="log-h">
          <div className="panel-head">
            <h2 id="log-h">Ship log</h2>
            <span>latest commits · from GitHub</span>
          </div>
          <Suspense fallback={<p className="muted">Reading the latest commits…</p>}>
            <ShipLog />
          </Suspense>
        </section>

        <section className="panel span-12" aria-labelledby="build-h">
          <div className="panel-head">
            <h2 id="build-h">What I build</h2>
            <span>each one backed by real projects</span>
          </div>
          <div className="caps">
            {capabilities.map((c) => (
              <div key={c.title} className="cap">
                <h3>{c.title}</h3>
                <p>{c.line}</p>
                <p className="proof">
                  {c.proof.map((slug) => {
                    const p = projects.find((x) => x.slug === slug);
                    return p ? (
                      <a key={slug} href={`#${slug}`}>
                        {p.name}
                      </a>
                    ) : null;
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel span-12" id="projects" aria-labelledby="projects-h">
          <div className="panel-head">
            <h2 id="projects-h">Projects</h2>
            <span>{projects.length} builds</span>
          </div>
          <div className="table-wrap">
            <table className="projects">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">What it does</th>
                  <th scope="col">Stack</th>
                  <th scope="col">Status</th>
                  <th scope="col">Links</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.slug} id={p.slug}>
                    <td>
                      <span className="name">{p.name}</span>
                      <span className="kind">
                        {p.kind} · {p.year}
                      </span>
                    </td>
                    <td>{p.summary}</td>
                    <td className="stack">{p.stack.join(" · ")}</td>
                    <td>
                      <span className={`status ${p.status}`}>{statusLabel[p.status]}</span>
                    </td>
                    <td>
                      <span className="links">
                        {p.links.length ? p.links.map((l) => <a key={l.url} href={l.url}>{l.label}</a>) : <span className="muted">Private</span>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel span-6" aria-labelledby="record-h">
          <div className="panel-head">
            <h2 id="record-h">Record</h2>
          </div>
          <div className="about">
            {profile.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <ul className="record">
            {experience.map((e) => (
              <li key={e.what}>
                <span className="when">{e.when}</span>
                <span>
                  <span className="what">
                    {e.what}, {e.where}
                  </span>
                  {e.note ? <span className="note"> {e.note}</span> : null}
                </span>
              </li>
            ))}
            {research.map((r) => (
              <li key={r.title}>
                <span className="when">
                  {r.venue}
                  {r.when ? ` · ${r.when}` : ""}
                </span>
                <span>{r.title}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel span-6" id="mcp" aria-labelledby="mcp-h">
          <div className="panel-head">
            <h2 id="mcp-h">Plug me into Claude</h2>
            <span>MCP server</span>
          </div>
          <p>
            This site is also an MCP server. Connect it to Claude, then ask things like &ldquo;what has Vishal built with
            Spring Boot?&rdquo; or &ldquo;what is he shipping this week?&rdquo;
          </p>
          <p className="muted">Claude Code:</p>
          <pre className="snippet">{CLAUDE_CODE_CMD}</pre>
          <div className="row">
            <CopyButton text={CLAUDE_CODE_CMD} label="Copy command" />
            <CopyButton text={MCP_URL} label="Copy server URL" />
          </div>
          <p className="muted">
            Claude.ai: Settings → Connectors → Add custom connector, and paste the server URL.
          </p>
          <ul className="tools" aria-label="Tools the server offers">
            {["get_profile", "list_projects", "get_project", "get_current_mission", "get_recent_activity"].map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="foot">
        <span>
          <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
        </span>
        <nav aria-label="Elsewhere">
          <a href={profile.contact.github}>GitHub</a>
          <a href={profile.contact.linkedin}>LinkedIn</a>
          <a href={profile.contact.x}>X</a>
          <a href={profile.contact.youtube}>YouTube</a>
          <a href={profile.contact.substack}>Substack</a>
        </nav>
      </footer>
    </div>
  );
}
