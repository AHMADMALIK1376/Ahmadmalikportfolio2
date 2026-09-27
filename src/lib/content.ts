/**
 * Everything the site says about Ahmad, in one place, so no two sections can
 * disagree. Carried over from the first portfolio's resume.ts and site.ts.
 *
 * Deliberately left out, as before:
 *  - the phone number, which does not belong on a public page;
 *  - the Autonomous AI Testing Platform, whose details belong to a private product.
 */

/** The three colours of the site, used to tint cards, notes and highlights. */
export type Ink = "sage" | "sienna" | "concrete";

export const PERSON = {
  name: "Muhammad Ahmad Malik",
  first: "Muhammad",
  last: "Ahmad Malik",
  short: "M. Ahmad Malik",
  role: "Full-Stack AI Engineer",
  titles: ["Full-Stack AI Engineer", "MERN Developer", "Cloud Architect"],
  line: "I build production web apps and LLM-powered systems, and make complex AI feel simple to use.",
  location: "Rawalpindi, Pakistan",
  timeZone: "Asia/Karachi",
  email: "ahmadmalik1376@gmail.com",
  github: "https://github.com/AHMADMALIK1376",
  linkedin: "https://www.linkedin.com/in/ahmadmalik1376/",
} as const;

export const RESUME_PDF = "/M-Ahmad-Malik-Resume.pdf";

export const NAV = [
  { id: "about", label: "About" },
  { id: "services", label: "What I do" },
  { id: "work", label: "Work" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
] as const;

export const PROFILE: string[] = [
  "Full-Stack AI Engineer with hands-on experience shipping production-grade web apps and LLM-powered systems using React.js, Node.js, and Python/FastAPI.",
  "Built and deployed AI features including LLM integration, computer vision, and browser automation, turning complex AI capabilities into simple, usable interfaces.",
  "Strong background in scalable API design and database architecture (MongoDB, Oracle, PostgreSQL), with a focus on clean, modular, production-ready code.",
];

export type Service = {
  title: string;
  summary: string;
  steps: string[];
  ink: Ink;
  doodle: "llm" | "architecture" | "web" | "backend" | "frontend";
  /** what the work delivers, shown when the card is opened */
  delivers: string[];
  tools: string[];
  /** projects on this page where the work can be seen, by slug */
  seenIn: string[];
};

export const SERVICES: Service[] = [
  {
    title: "LLM model training",
    summary:
      "Training language models end to end: preparing the data, running forward and backward passes, and following the loss down until the model is ready to save.",
    steps: ["Data → tokens", "Forward · backward", "Loss ↓", "Checkpoints"],
    ink: "sage",
    doodle: "llm",
    delivers: [
      "Datasets cleaned, split and tokenized, ready to train on.",
      "Training runs that log their loss and save checkpoints as they go.",
      "The finished model served behind an API, with prompts engineered around it.",
    ],
    tools: ["Python", "FastAPI", "LangGraph", "Claude API", "Qwen"],
    seenIn: ["neuracache", "bid-response-engine", "hireme-agent"],
  },
  {
    title: "Software architecture",
    summary:
      "Designing systems floor by floor: clients on top, the gateway that meets them, the services that do the work and the data underneath — every connection planned before anything is built.",
    steps: ["Clients → gateway", "Services", "Event bus", "Data & cache"],
    ink: "sienna",
    doodle: "architecture",
    delivers: [
      "A system mapped out before it is built: clients, gateway, services and data.",
      "API contracts and event flows agreed up front, so parts can be built in parallel.",
      "Caches and queues placed where they pay for themselves.",
    ],
    tools: ["Node.js", "FastAPI", "PostgreSQL", "MongoDB", "Docker"],
    seenIn: ["folium", "focusflow"],
  },
  {
    title: "Web applications",
    summary:
      "Building web apps from the database up: the data, the API over it, the interface people use — then shipped through build, test and deploy to a live server.",
    steps: ["Database", "API", "Frontend", "Build · test · deploy"],
    ink: "concrete",
    doodle: "web",
    delivers: [
      "The database, the API and the interface, built together as one product.",
      "A build, test and deploy pipeline, so every change ships the same way.",
      "A live app on a real server — not a demo on a laptop.",
    ],
    tools: ["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    seenIn: ["folium", "routine-dashboard", "graphforge"],
  },
  {
    title: "Backend engineering",
    summary:
      "The server side that holds everything up: APIs that route and check every request, a cache in front of the database, workers for jobs that can wait, and monitoring that proves it's healthy.",
    steps: ["Load balancing", "APIs", "Cache & database", "Workers · monitoring"],
    ink: "sage",
    doodle: "backend",
    delivers: [
      "RESTful APIs that validate every request, with JWT authentication.",
      "A cache in front of the database, and queries that stay fast as data grows.",
      "Background workers and scheduled jobs for everything that can wait.",
    ],
    tools: ["Node.js", "Express.js", "FastAPI", "PostgreSQL", "Oracle 21c XE"],
    seenIn: ["focusflow", "bid-response-engine"],
  },
  {
    title: "Frontend development",
    summary:
      "Interfaces that hold up when someone looks closely: every box measured, every gap deliberate, every control reachable by keyboard and every colour readable against what's behind it.",
    steps: ["Box model", "Layout & spacing", "Keyboard focus", "Contrast · WCAG"],
    ink: "sienna",
    doodle: "frontend",
    delivers: [
      "Layouts measured to the pixel, with spacing that follows one scale.",
      "Every control reachable by keyboard, with a focus ring you can see.",
      "Colours that pass WCAG contrast, and markup a screen reader understands.",
    ],
    tools: ["React.js", "TypeScript", "Tailwind CSS", "Figma", "Playwright"],
    seenIn: ["graphforge", "routine-dashboard", "folium"],
  },
];

export type Role = {
  title: string;
  company: string;
  url?: string;
  period: string;
  detail: string;
  ink: Ink;
  points: string[];
};

export const EXPERIENCE: Role[] = [
  {
    title: "Full Stack AI Engineer",
    company: "Anma Tech",
    url: "https://anmapk.com",
    period: "Jul 2026 – Present",
    detail: "Remote · 6-month paid internship",
    ink: "sienna",
    points: [
      "Working as the sole developer on an assigned AI-powered product, owning the frontend, backend, and AI/LLM integration layer end-to-end.",
      "Holding full ownership of architecture, API design, and deployment decisions from planning through shipping, with no team support.",
    ],
  },
  {
    title: "Website Development Intern",
    company: "Growstep Technologies",
    period: "Jan 2026 – Apr 2026",
    detail: "Pakistan",
    ink: "sage",
    points: [
      "Completed a React.js website development internship, delivering assigned tasks on time within a professional team.",
      "Gained hands-on experience with Agile methodologies and team-based development workflows.",
    ],
  },
  {
    title: "UI/UX Designer",
    company: "Freelance",
    period: "Nov 2025 – Present",
    detail: "Remote",
    ink: "concrete",
    points: [
      "Design user-centered interfaces and interactive prototypes using Figma for web and mobile applications.",
      "Create wireframes, mockups, and design systems that prioritize usability, accessibility, and modern aesthetics.",
    ],
  },
  {
    title: "Freelance Full-Stack Developer",
    company: "Freelance",
    period: "2023 – Present",
    detail: "Remote",
    ink: "sage",
    points: [
      "Building and delivering full-stack web applications for individual clients — management systems, dashboards and portfolio sites.",
      "Taking projects end to end: gathering requirements, designing the database, building the frontend and backend, deploying, and writing the documentation.",
    ],
  },
];

/** The year freelancing began, which the About section counts from. */
export const BUILDING_SINCE = 2023;

export type Category = "ai" | "fullstack" | "tools";

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ai", label: "AI & LLM" },
  { id: "fullstack", label: "Full-stack" },
  { id: "tools", label: "Tools & viz" },
];

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  role: string;
  period: string;
  category: Category;
  stack: string[];
  points: string[];
  /** how it works, in the steps its drawing shows */
  flow: string[];
  repo?: string;
  ink: Ink;
};

/** In the order they are shown: strongest first. */
export const PROJECTS: Project[] = [
  {
    slug: "folium",
    flow: ["TipTap editor", "Live sync · y-sweet", "FastAPI · auth", "Postgres · versions"],
    title: "Folium",
    tagline: "Collaborative document editor",
    role: "Full-Stack Developer",
    period: "Jul 2026 – Present",
    category: "fullstack",
    stack: ["Next.js", "TypeScript", "FastAPI", "PostgreSQL", "Supabase", "TipTap", "y-sweet"],
    repo: "https://github.com/AHMADMALIK1376/Folium",
    ink: "sage",
    points: [
      "Rebuilt a timeboxed prototype into a full product: a Next.js frontend and a FastAPI backend on PostgreSQL, with real authentication through Supabase.",
      "Documents stored as TipTap JSON, with sharing at permission levels, soft delete to a trash folder, and file import and export.",
      "Version history that snapshots as you edit, with preview and restore.",
      "Live collaborative editing with shared cursors over y-sweet, falling back to single-user autosave when it is not configured.",
    ],
  },
  {
    slug: "bid-response-engine",
    flow: ["Upload a tender", "Claude extracts", "TF-IDF matching", "GO / NO-GO · DOCX"],
    title: "Bid & Proposal Engine",
    tagline: "AI-powered RFP and tender automation",
    role: "Full Stack AI Developer",
    period: "2026",
    category: "ai",
    stack: ["Claude API", "RAG (TF-IDF)", "Python", "DOCX Export"],
    repo: "https://github.com/AHMADMALIK1376/bid-response-engine",
    ink: "sienna",
    points: [
      "Built an end-to-end engine automating RFP/tender responses — a process that typically consumes 60–80% of bid preparation time.",
      "Used the Claude API to extract requirements, evaluation criteria, and deadlines from uploaded PDF/DOCX tender documents.",
      "Engineered a RAG-based matching system (TF-IDF) that scores requirements against a capability library with PASS/GAP/FAIL compliance checks.",
      "Built a win dashboard with a GO/NO-GO decision and probability score, plus AI-generated proposal drafts in 60 seconds with DOCX export.",
    ],
  },
  {
    slug: "hireme-agent",
    flow: ["CV → fields", "Adzuna search", "Top 3 letters", "You review"],
    title: "HireMe Agent",
    tagline: "AI job matching and cover letter generator",
    role: "Full Stack AI Developer",
    period: "2026",
    category: "ai",
    stack: ["Streamlit", "Claude (Anthropic)", "Adzuna Jobs API"],
    repo: "https://github.com/AHMADMALIK1376/JOB-MEETS",
    ink: "concrete",
    points: [
      "Built an AI agent that parses an uploaded CV (PDF/DOCX) into structured fields using Claude, then searches the Adzuna Jobs API for matching roles.",
      "Generates a tailored 3-paragraph cover letter for each of the top 3 postings, using only content verified from the candidate's actual CV.",
      "Designed with a human-in-the-loop review step — users edit and copy each letter before applying; nothing is sent automatically.",
    ],
  },
  {
    slug: "focusflow",
    flow: ["Tasks · schedule", "Attendance triggers", "Midnight cron", "Email reminders"],
    title: "FocusFlow",
    tagline: "Student productivity management system",
    role: "Full-Stack Developer",
    period: "Feb 2026 – Present",
    category: "fullstack",
    stack: ["React.js", "Node.js", "Express.js", "Oracle 21c XE", "JWT"],
    ink: "sage",
    points: [
      "Built a platform combining task management, academic scheduling, attendance tracking, and automated email notifications.",
      "Engineered a real-time attendance engine with database triggers and a midnight cron job for absence tracking.",
      "Designed a fully normalized Oracle database with 17 tables, stored procedures, triggers, and a materialized view.",
      "Built a RESTful API with 30+ endpoints across 7 modules and 5 background cron services.",
    ],
  },
  {
    slug: "graphforge",
    flow: ["Import data", "69+ chart types", "Registry pattern", "Export client-side"],
    title: "GraphForge",
    tagline: "Universal client-side data visualization platform",
    role: "Solo Developer",
    period: "May 2026 – Present",
    category: "tools",
    stack: ["React.js", "Recharts", "D3.js", "Chart.js", "SheetJS", "jsPDF"],
    repo: "https://github.com/AHMADMALIK1376/graphforge",
    ink: "sienna",
    points: [
      "Architected a modular SPA (92+ files) with 69+ chart types across 5 analytical categories.",
      "Built a dual export system (PNG/SVG/PDF + CSV/JSON/Excel), fully client-side for GDPR compliance.",
      "Achieved zero ESLint warnings across the codebase using a scalable Registry Pattern architecture.",
    ],
  },
  {
    slug: "animated-github-profile",
    flow: ["Daily workflow", "GitHub API", "Python → SVG", "Profile panels"],
    title: "Animated GitHub Profile",
    tagline: "A README that rebuilds itself from live data",
    role: "Solo Developer",
    period: "May 2026 – Present",
    category: "tools",
    stack: ["Python", "SVG", "CSS Animation", "GitHub Actions", "GitHub API"],
    repo: "https://github.com/AHMADMALIK1376/AHMADMALIK1376",
    ink: "concrete",
    points: [
      "Generates every panel on the profile as a self-contained animated SVG in Python — no scripts and no external requests, so nothing is stripped when GitHub renders it.",
      "A GitHub Actions workflow rebuilds the panels every day from the GitHub API and the public contributions calendar.",
      "Includes a world map sized by each language's share of code and a robotic-arm skills board that adds newly detected languages on its own.",
    ],
  },
  {
    slug: "neuracache",
    flow: ["A message in", "LangGraph state", "Memory profile", "Qwen replies"],
    title: "NeuraCache",
    tagline: "AI agent with persistent memory",
    role: "Hackathon Developer",
    period: "Jun 2026",
    category: "ai",
    stack: ["Python", "FastAPI", "LangGraph", "Qwen", "Alibaba Cloud"],
    repo: "https://github.com/AHMADMALIK1376/neuraCache",
    ink: "sage",
    points: [
      "Built for the Global AI Hackathon: an AI agent that remembers the people it talks to, running Qwen on Alibaba Cloud Bailian.",
      "Orchestrated the conversation as a LangGraph state graph that carries a per-user memory profile between turns.",
      "Feeds remembered details — name, preferences, last topic — back into the system prompt so the agent recalls the user in later conversations.",
    ],
  },
  {
    slug: "routine-dashboard",
    flow: ["Groups · tasks", "Live progress", "Firebase sync", "Dark mode"],
    title: "Routine Dashboard",
    tagline: "Task management web application",
    role: "Full-Stack Developer",
    period: "Apr 2026 – Present",
    category: "fullstack",
    stack: ["React.js", "Node.js", "Tailwind CSS", "Firebase"],
    ink: "sienna",
    points: [
      "Built a Monday.com-inspired dashboard with task CRUD, group organization, and live progress tracking.",
      "Implemented a custom design system with dark mode persisted via localStorage.",
    ],
  },
  {
    slug: "bugistan",
    flow: ["Diagnostics", "Creatures spawn", "Game engine", "60 FPS canvas"],
    title: "Bugistan",
    tagline: "VS Code extension for gamified debugging",
    role: "Solo Developer",
    period: "Apr 2026 – Present",
    category: "tools",
    stack: ["TypeScript", "HTML5 Canvas", "VS Code Extension API"],
    repo: "https://github.com/AHMADMALIK1376/bugistan",
    ink: "concrete",
    points: [
      "Built a VS Code extension turning code diagnostics into an interactive game with 38 creature species at 60 FPS.",
      "Designed a 2D game engine with creature AI and a dynamic particle system across 47+ files.",
    ],
  },
];

export type SkillGroup = { name: string; ink: Ink; items: string[] };

export const SKILLS: SkillGroup[] = [
  { name: "Frontend", ink: "sage", items: ["HTML5", "CSS3", "JavaScript (ES6+)", "React.js", "Tailwind CSS", "Vite", "Context API"] },
  { name: "Backend", ink: "sienna", items: ["Node.js", "Express.js", "FastAPI", "Python", "RESTful APIs", "JWT Authentication"] },
  { name: "Databases", ink: "concrete", items: ["MongoDB", "Firebase", "Oracle 21c XE", "PostgreSQL", "SQL"] },
  { name: "AI & LLM", ink: "sage", items: ["Anthropic Claude API", "LLM Integration", "Prompt Engineering", "Computer Vision", "Multi-modal AI"] },
  { name: "Cloud & DevOps", ink: "sienna", items: ["Google Cloud Platform", "AWS", "Docker", "Git/GitHub", "Vercel", "Netlify"] },
  { name: "Automation & Testing", ink: "concrete", items: ["Playwright", "Web Scraping", "Browser Automation", "Accessibility Testing (ARIA)"] },
  { name: "Languages", ink: "sage", items: ["Python", "TypeScript", "JavaScript", "Java", "C++", "SQL"] },
];

export const EDUCATION = {
  degree: "BS Computer Science",
  school: "Iqra University, Islamabad (H-9)",
  period: "Dec 2023 – Present",
};

export const CERTIFICATIONS: { kind: string; title: string; where: string }[] = [
  { kind: "Internship", title: "Website Development", where: "Growstep Technologies" },
  { kind: "Workshop", title: "GitHub Open Source Collaboration", where: "Iqra University Islamabad" },
  { kind: "Hackathon", title: "CUST Hackathon 2026", where: "National Hackathon" },
  { kind: "Hackathon", title: "Atom Camp Hackathon", where: "Agentic AI · 16–17 Jun 2026" },
];

/** Every tool named anywhere on the page, once each: the marquee under Skills. */
export const TOOLBOX: string[] = [...new Set(SKILLS.flatMap((g) => g.items))];
