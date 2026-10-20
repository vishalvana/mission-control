import { cacheLife } from "next/cache";
import { profile } from "@/content/profile";

export type ShipLogEntry = {
  repo: string;
  message: string;
  date: string; // ISO
  url: string;
};

const API = "https://api.github.com";
const HEADERS: HeadersInit = {
  Accept: "application/vnd.github+json",
  "User-Agent": "vishalvana-mission-control",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

// Merges and empty first commits say nothing about the work
const NOISE = /^(merge (pull request|branch)|initial commit|first commit)/i;

// Latest commits across the most recently pushed (non-fork) repos.
// Cached for an hour: the unauthenticated GitHub API allows 60 requests an hour.
export async function getShipLog(limit = 8): Promise<ShipLogEntry[]> {
  "use cache";
  cacheLife("hours");

  try {
    const res = await fetch(`${API}/users/${profile.handle}/repos?sort=pushed&per_page=20`, { headers: HEADERS });
    if (!res.ok) return [];
    const repos: { name: string; fork: boolean; pushed_at: string }[] = await res.json();
    const recent = repos.filter((r) => !r.fork && r.name !== profile.handle).slice(0, 5);

    const perRepo = await Promise.all(
      recent.map(async (r) => {
        const c = await fetch(`${API}/repos/${profile.handle}/${r.name}/commits?per_page=3`, { headers: HEADERS });
        if (!c.ok) return [];
        const commits: { html_url: string; commit: { message: string; author: { date: string } } }[] = await c.json();
        return commits
          .filter((x) => !NOISE.test(x.commit.message))
          .map((x) => ({
            repo: r.name,
            message: x.commit.message.split("\n")[0],
            date: x.commit.author.date,
            url: x.html_url,
          }));
      }),
    );

    return perRepo
      .flat()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  } catch {
    return [];
  }
}
