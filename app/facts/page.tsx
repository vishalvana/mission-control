import type { Metadata } from "next";
import Link from "next/link";
import { experience, mission, profile, projects, research, statusLabel } from "@/content/profile";

export const metadata: Metadata = {
  title: "Vishal Vana · Facts",
  description: `${profile.name}: ${profile.headline}`,
};

// The plain version for anyone in a hurry: no console, no panels, just the record.
export default function Facts() {
  return (
    <main className="facts">
      <p className="muted">
        <Link href="/">← Mission control</Link>
      </p>
      <h1>{profile.name}</h1>
      <p className="muted">
        {profile.role} · {profile.location}
      </p>
      <p className="lead">
        {profile.headline} {profile.intro}
      </p>

      <h2>Now</h2>
      <p>
        {mission.name}: {mission.goal}
      </p>

      <h2>Experience and education</h2>
      <ul>
        {experience.map((e) => (
          <li key={e.what}>
            {e.what}, {e.where} ({e.when}){e.note ? `. ${e.note}` : ""}
          </li>
        ))}
      </ul>

      <h2>Projects</h2>
      <ul>
        {projects.map((p) => (
          <li key={p.slug}>
            <strong>{p.name}</strong> ({statusLabel[p.status].toLowerCase()}, {p.year}): {p.summary}{" "}
            {p.links[0] ? <a href={p.links[0].url}>{p.links[0].label}</a> : null}
          </li>
        ))}
      </ul>

      <h2>Research</h2>
      <ul>
        {research.map((r) => (
          <li key={r.title}>
            {r.title} ({r.venue}
            {r.when ? `, ${r.when}` : ""})
          </li>
        ))}
      </ul>

      <h2>Contact</h2>
      <ul>
        <li>
          Email: <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
        </li>
        <li>
          <a href={profile.contact.github}>GitHub</a> · <a href={profile.contact.linkedin}>LinkedIn</a> ·{" "}
          <a href={profile.contact.x}>X</a>
        </li>
      </ul>
    </main>
  );
}
