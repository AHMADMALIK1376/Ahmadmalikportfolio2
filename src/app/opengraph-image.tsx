import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PERSON } from "@/lib/content";

/** The picture shown when a link to the site is shared: the sketchbook's first page. */

export const alt = `${PERSON.name} — ${PERSON.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#2d2f2b";

/** Courier Prime, bold, cut down to the letters used; null if Google Fonts cannot be reached. */
async function courier(text: string) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Courier+Prime:wght@700&text=${encodeURIComponent(text)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const font = await fetch(url);
    return font.ok ? await font.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const lines = ["hello, world — i'm", PERSON.first, PERSON.last, `> ${PERSON.role}`, PERSON.location, "github.com/AHMADMALIK1376"];
  const [font, photo] = await Promise.all([courier(lines.join("")), readFile(join(process.cwd(), "src/assets/ahmad.png"))]);
  const src = `data:image/png;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#eaebe6", color: INK, fontFamily: font ? "Courier Prime" : "monospace", padding: "70px 80px", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ fontSize: 30, color: "#5a5e58" }}>{lines[0]}</div>
          <div style={{ fontSize: 88, lineHeight: 1, marginTop: 18, letterSpacing: -2 }}>{lines[1]}</div>
          <div style={{ display: "flex", position: "relative", marginTop: 6 }}>
            <div style={{ position: "absolute", left: -8, right: -8, bottom: 8, height: 42, background: "rgba(140,172,112,0.55)", borderRadius: 14, transform: "skewX(-6deg)" }} />
            <div style={{ fontSize: 88, lineHeight: 1, letterSpacing: -2 }}>{lines[2]}</div>
          </div>
          <div style={{ display: "flex", fontSize: 36, marginTop: 34 }}>
            <span style={{ color: "#9c3f1d" }}>{">"}&nbsp;</span>
            {PERSON.role}
            <span style={{ width: 20, height: 36, background: "#80966b", marginLeft: 8 }} />
          </div>
          <div style={{ display: "flex", fontSize: 24, marginTop: 40, color: "#5a5e58" }}>
            <span>{lines[4]}</span>
            <span style={{ marginLeft: 36 }}>{lines[5]}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", marginLeft: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", background: "#f4f4f0", padding: "16px 16px 56px", borderRadius: 26, boxShadow: "8px 8px 0 1px rgba(45,47,43,0.4)", transform: "rotate(3deg)", position: "relative" }}>
            <div style={{ position: "absolute", top: -14, left: 110, width: 120, height: 36, background: "rgba(210,213,207,0.85)", transform: "rotate(-5deg)" }} />
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse draws plain img elements */}
            <img src={src} width={330} height={333} alt="" style={{ borderRadius: 16 }} />
          </div>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, background: "#bc4e26" }} />
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Courier Prime", data: font, weight: 700, style: "normal" }] : [] },
  );
}
