/**
 * Where the site lives, for the addresses that have to be absolute: the
 * sitemap, robots, and the picture shown when a link is shared.
 *
 * Set NEXT_PUBLIC_SITE_URL once there is a custom domain. On Vercel the
 * project's own production address is used until then, and locally it is
 * this machine. An empty variable counts as unset, a bare domain gets the
 * https it is missing, and anything that will not parse falls back to
 * localhost, because an address that cannot be parsed stops the build.
 */
const HERE = "http://localhost:3000";

const set = (value: string | undefined) => value?.trim() || undefined;

const wanted =
  set(process.env.NEXT_PUBLIC_SITE_URL) ??
  // Vercel gives "the-project.vercel.app", with no scheme in front
  set(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  set(process.env.VERCEL_URL) ??
  HERE;

const absolute = /^https?:\/\//i.test(wanted) ? wanted : `https://${wanted}`;

const parses = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const SITE_URL = (parses(absolute) ? absolute : HERE).replace(/\/+$/, "");
