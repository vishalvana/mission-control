// The single source of truth about Vishal. The home page, /facts and the /mcp server all read from here.
// Only facts that can be checked (repos, READMEs, records) go in this file.

export type ProjectStatus = "live" | "building" | "shipped";

export type Project = {
  slug: string;
  name: string;
  kind: string;
  summary: string;
  details: string[];
  stack: string[];
  tags: string[];
  status: ProjectStatus;
  year: string;
  links: { label: string; url: string }[];
};

export const profile = {
  name: "Vishal Vana",
  handle: "vishalvana",
  role: "Developer at BelWo",
  location: "India (IST, UTC+5:30)",
  headline: "I build AI agents and automations that do real work.",
  intro:
    "12 builds so far, from multi-tenant backends to apps that talk to hardware. Now I build AI agents and the backends they run on. Give me the problem; I'll pick the tools.",
  about: [
    "I started with Android apps and Spring Boot backends, and I still go deepest on the parts most people skip: auth, caching, load balancing. That plumbing decides whether a system holds up.",
    "Now my focus is AI agents and automation. AI tools make me faster at things I already understand. They don't replace understanding them.",
    "I like system design, making slow things fast, and research, with one IEEE paper so far. I build in public and write about it on Substack.",
  ],
  contact: {
    email: "vishalvana592003@gmail.com",
    github: "https://github.com/vishalvana",
    linkedin: "https://www.linkedin.com/in/vishalvana",
    x: "https://x.com/vishalvana_",
    youtube: "https://www.youtube.com/@vishuvanaa",
    substack: "https://vishalvana.substack.com",
  },
};

export const mission = {
  name: "Agent-first BaaS",
  goal: "Turn my Spring Boot Backend-as-a-Service into an MCP server, so Claude can set up a whole backend from one prompt.",
  due: "2026-10-26",
  repo: "https://github.com/vishalvana/BackendAsService",
  steps: [
    { label: "Secrets moved out of the repo", done: true },
    { label: "API keys locked to their own project", done: true },
    { label: "One-command run + end-to-end smoke test", done: true },
    { label: "16 unit tests: auth, JWT, data, API keys", done: true },
    { label: "MCP tools: projects, API keys, collections", done: false },
    { label: "MCP tools: documents and app users", done: false },
    { label: "Live demo: Claude builds a backend", done: false },
  ],
};

// What I build, each backed by projects below (slugs)
export const capabilities = [
  {
    title: "Agents & automation",
    line: "AI agents wired to real tools through MCP, and jobs that run on their own.",
    proof: ["mission-control", "baas", "job-aggregator"],
  },
  {
    title: "Backends & APIs",
    line: "Auth, multi-tenant data, API keys and caching, with tests.",
    proof: ["baas", "atomicflow", "mini-cache"],
  },
  {
    title: "Scraping & data",
    line: "Pull data from the web, clean it, and make it searchable.",
    proof: ["web-scraper", "mern-job-scraper", "job-aggregator"],
  },
  {
    title: "Mobile apps",
    line: "Flutter and native Android, including apps that set up hardware.",
    proof: ["kharcha", "nomo-toyz", "medoc-claim", "ridesphere"],
  },
];

export const experience = [
  { when: "Aug 2026 – now", what: "Developer L1", where: "BelWo" },
  {
    when: "Nov 2025 – Mar 2026",
    what: "Mobile Developer Intern",
    where: "Nomo Toyz",
    note: "Built their cross-platform Flutter app from scratch, including ESP32 device provisioning.",
  },
  { when: "2022 – 2026", what: "B.E. Computer Science", where: "Chandigarh University" },
];

export const research = [
  {
    title: "Navigating the Future of Mental Health: A Comprehensive Review of Tracking Applications",
    venue: "IEEE",
    when: "Dec 2024",
  },
  { title: "Self-Calibrating EMG System for Adaptive Signal Processing", venue: "Patent (proposed)", when: "" },
  { title: "Secure Healthcare Data Storage on Blockchain using Deep Learning", venue: "Paper", when: "" },
];

export const projects: Project[] = [
  {
    slug: "baas",
    name: "BaaS Platform",
    kind: "Backend-as-a-Service",
    summary: "A backend other apps plug into: sign-up, login, API keys and data storage, isolated per project.",
    details: [
      "JWT auth for both platform developers and their app users",
      "Isolated projects, each with its own API key, users and collections; a key only works for its own project",
      "Dynamic JSON document storage on PostgreSQL",
      "Email + OTP verification and per-endpoint API usage tracking",
      "16 unit tests and an end-to-end smoke test",
      "Next: an MCP server so AI agents can provision backends themselves",
    ],
    stack: ["Java", "Spring Boot", "PostgreSQL", "JWT"],
    tags: ["backend", "auth", "mcp", "agents", "multi-tenant", "api"],
    status: "building",
    year: "2026",
    links: [{ label: "Repo", url: "https://github.com/vishalvana/BackendAsService" }],
  },
  {
    slug: "mission-control",
    name: "Mission Control",
    kind: "This site + an MCP server",
    summary: "A portfolio Claude can read: connect it as an MCP server and ask what I've built.",
    details: [
      "Hand-written MCP server (Streamable HTTP) with 5 tools",
      "Ship log pulled live from GitHub",
      "Halftone and depth portraits drawn in canvas and WebGL from one photo",
    ],
    stack: ["Next.js", "TypeScript", "WebGL", "MCP"],
    tags: ["agents", "mcp", "frontend", "fullstack"],
    status: "live",
    year: "2026",
    links: [
      { label: "Repo", url: "https://github.com/vishalvana/mission-control" },
      { label: "MCP", url: "https://vishalvana.vercel.app/mcp" },
    ],
  },
  {
    slug: "kharcha",
    name: "Kharcha",
    kind: "Personal money buddy (Android)",
    summary: "I'm bad with money, so I built an app that tells me how much I can spend today, and when to stop.",
    details: [
      "Turns bank SMS into a daily safe-to-spend limit that recalculates every day",
      "Scan & Pay through any UPI app, with today's budget shown before paying",
      "Offline by design: no server, no internet permission; fingerprint lock and encrypted backups",
      "Hinglish nudges and a 10 PM day summary",
      "136 unit tests on the money logic, written test-first",
    ],
    stack: ["Flutter", "Dart", "Kotlin", "SQLite"],
    tags: ["mobile", "flutter", "android", "offline", "personal-finance", "tdd"],
    status: "shipped",
    year: "2026",
    links: [],
  },
  {
    slug: "nomo-toyz",
    name: "Nomo Toyz app",
    kind: "IoT mobile app (internship)",
    summary: "Set up a smart toy from your phone: the app provisions the ESP32 inside it.",
    details: [
      "Built from scratch through the full development cycle",
      "ESP32 hardware provisioning for device onboarding",
      "Modular authentication",
    ],
    stack: ["Flutter", "Dart", "Firebase", "ESP32"],
    tags: ["mobile", "iot", "flutter", "client-work"],
    status: "shipped",
    year: "2025–26",
    links: [],
  },
  {
    slug: "atomicflow",
    name: "AtomicFlow",
    kind: "Team task manager",
    summary: "Teams plan projects, assign tasks and track progress, with permissions by role.",
    details: ["Role-based access control", "Projects, tasks and progress tracking", "Separate backend and frontend, both deployed"],
    stack: ["Java", "Spring Boot", "JavaScript"],
    tags: ["backend", "fullstack", "auth"],
    status: "live",
    year: "2026",
    links: [
      { label: "Backend", url: "https://github.com/vishalvana/AtomicFlow" },
      { label: "Frontend", url: "https://github.com/vishalvana/atomic-Frontend" },
    ],
  },
  {
    slug: "job-aggregator",
    name: "Job aggregation platform",
    kind: "Search across job sources",
    summary: "One search across many job sources, with filters and duplicates removed.",
    details: ["Aggregates jobs from multiple sources", "Unified search and filtering", "Duplicate removal and automatic refresh"],
    stack: ["JavaScript"],
    tags: ["scraping", "automation", "search", "fullstack"],
    status: "building",
    year: "2026",
    links: [{ label: "Repo", url: "https://github.com/vishalvana/Doda" }],
  },
  {
    slug: "mern-job-scraper",
    name: "MERN job scraper",
    kind: "Scraper + search UI",
    summary: "Pulls RemoteOK and We Work Remotely feeds, normalizes them into MongoDB, and makes them searchable.",
    details: ["Uses only public JSON/RSS feeds meant for programmatic use", "Normalized postings in MongoDB", "React UI to browse, search and filter"],
    stack: ["MongoDB", "Express", "React", "Node.js"],
    tags: ["scraping", "automation", "fullstack"],
    status: "shipped",
    year: "2026",
    links: [{ label: "Repo", url: "https://github.com/vishalvana/ROK_Scrapper-" }],
  },
  {
    slug: "web-scraper",
    name: "Spring Boot web scraper",
    kind: "Page extraction tool",
    summary: "Paste a URL, get the page back as structured data: title, meta, headings, links, images, text.",
    details: ["Jsoup-based extraction", "Optional custom CSS selector", "Built-in web UI and a JSON API"],
    stack: ["Java", "Spring Boot", "Jsoup"],
    tags: ["scraping", "automation", "backend", "api"],
    status: "shipped",
    year: "2026",
    links: [{ label: "Repo", url: "https://github.com/vishalvana/Spring-Scrapper" }],
  },
  {
    slug: "mini-cache",
    name: "Mini Cache Engine",
    kind: "In-memory cache",
    summary: "A cache engine built from scratch: TTL expiry, thread-safe storage, hit and miss stats.",
    details: ["Thread-safe storage on ConcurrentHashMap", "Configurable TTL with scheduled cleanup", "Hit and miss statistics over REST"],
    stack: ["Java", "Spring Boot"],
    tags: ["backend", "system-design", "performance"],
    status: "shipped",
    year: "2026",
    links: [{ label: "Repo", url: "https://github.com/vishalvana/mini-cache" }],
  },
  {
    slug: "medoc-claim",
    name: "Medoc-Claim",
    kind: "Insurance claim system",
    summary: "The full insurance claim workflow in one Flutter app.",
    details: ["Complete claim workflow", "Built as a Flutter intern assignment"],
    stack: ["Flutter", "Dart"],
    tags: ["mobile", "flutter"],
    status: "live",
    year: "2026",
    links: [
      { label: "Demo", url: "https://medoc-claim.netlify.app/" },
      { label: "Repo", url: "https://github.com/vishalvana/Medoc-Claim" },
    ],
  },
  {
    slug: "ridesphere",
    name: "RideSphere",
    kind: "Android carpooling app",
    summary: "Host, search and manage carpools, with live location on Google Maps.",
    details: ["Real-time location tracking", "Multi-role authentication", "Firebase backend"],
    stack: ["Java", "Android", "Firebase", "Google Maps"],
    tags: ["mobile", "android"],
    status: "shipped",
    year: "2024",
    links: [{ label: "Repo", url: "https://github.com/vishalvana/j_ridesphere" }],
  },
  {
    slug: "shellspeak",
    name: "ShellSpeak",
    kind: "Terminal chat",
    summary: "Client-server chat over raw TCP sockets, written to learn threading and synchronization.",
    details: ["Concurrent reads and writes on separate threads", "Core Java only, no dependencies"],
    stack: ["Java"],
    tags: ["networking", "system-design"],
    status: "shipped",
    year: "2026",
    links: [{ label: "Repo", url: "https://github.com/vishalvana/ShellSpeak" }],
  },
];

export const statusLabel: Record<ProjectStatus, string> = {
  live: "Live",
  building: "Building",
  shipped: "Shipped",
};
