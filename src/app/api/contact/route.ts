import { NextResponse, type NextRequest } from "next/server";
import { PERSON } from "@/lib/content";

/**
 * The contact form's messages, emailed to Ahmad through Resend.
 *
 * Only this site's own pages may post here, a few messages an hour per
 * visitor, each checked and cut to size. The mail goes to PERSON.email with
 * the sender as Reply-To, so answering it answers them. It is sent as plain
 * text, so nothing a visitor writes can become markup.
 *
 * Needs RESEND_API_KEY. CONTACT_FROM sets the sender; without it Resend's own
 * test sender is used, which can deliver only to the Resend account's own
 * address. Without a key it answers 503 and the form asks visitors to email
 * directly.
 */

const LIMITS = { name: 100, email: 200, message: 5000 };
const WINDOW = 60 * 60 * 1000;
const PER_WINDOW = 5;
const EMAIL = /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[a-z]{2,}$/i;

// recent sends per visitor; kept in this server's memory, so best effort rather than exact
const recent = new Map<string, number[]>();

const refuse = (error: string, status: number) => NextResponse.json({ error }, { status });

/** A value from the form as trimmed text, or "" if it is not text. */
const field = (body: Record<string, unknown>, key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");

export async function POST(request: NextRequest) {
  // only from this site's own pages
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).host !== request.headers.get("host")) return refuse("forbidden", 403);
  } catch {
    return refuse("forbidden", 403);
  }

  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const times = (recent.get(visitor) ?? []).filter((t) => now - t < WINDOW);
  if (times.length >= PER_WINDOW) return refuse("busy", 429);
  // forget visitors who have not sent anything within the hour, so the memory stays small
  if (recent.size > 500) for (const [who, sent] of recent) if (sent.every((t) => now - t >= WINDOW)) recent.delete(who);

  // a message is a few kilobytes at most; anything much larger is not read
  const size = Number(request.headers.get("content-length") ?? NaN);
  if (!Number.isFinite(size) || size > 20_000) return refuse("invalid", 413);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return refuse("invalid", 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return refuse("invalid", 400);
  }

  // a bot filled in the field no person can see: say it went, and send nothing
  if (field(body, "hp_trap_x7")) return NextResponse.json({ ok: true });

  // no line breaks in the name, which goes into the subject line
  const name = field(body, "name").replace(/[\r\n\t]+/g, " ");
  const email = field(body, "email");
  const message = field(body, "message");
  if (!name || name.length > LIMITS.name) return refuse("invalid", 400);
  if (!EMAIL.test(email) || email.length > LIMITS.email) return refuse("invalid", 400);
  if (message.length < 10 || message.length > LIMITS.message) return refuse("invalid", 400);

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // said in the server's log, so a message that never arrives is not a mystery
    console.error("contact: not sent — RESEND_API_KEY is not set (put it in .env.local, and in the Vercel project's environment variables)");
    return refuse("unavailable", 503);
  }

  recent.set(visitor, [...times, now]);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>",
      to: [PERSON.email],
      reply_to: email,
      subject: `Portfolio message from ${name}`,
      text: `${message}\n\n— ${name} <${email}>\nSent from the contact form on the portfolio.`,
    }),
  }).catch(() => null);

  if (!res?.ok) {
    const why = res ? `${res.status} ${await res.text().catch(() => "")}` : "Resend could not be reached";
    console.error(`contact: not sent — ${why}`);
    return refuse("failed", 502);
  }
  return NextResponse.json({ ok: true });
}
