"use client";

import { useRef } from "react";
import { at, Block, drawn, onFront, onTop, Part, rounded, topFace, TONES, type Point, type Tone } from "@/components/desk/iso";
import { along, FrontTag, light, Packet, place, TopTag, useBuild, useClock } from "./kit";
import styles from "./Rigs.module.css";

/**
 * A web application, in layers, and shipped.
 *
 * Four sheets make the app, each a step above and behind the one before: the
 * database's tables, the API's routes over it, the frontend's components over
 * that, and on top the browser, showing the page those components render.
 * Beside them a belt runs through build, test and deploy to a live server. It
 * is drawn and set down, and then works on its own clock: a release rides the
 * belt through each station — built, its tests counted, deployed — and into
 * the server, which counts it; and a visitor's cursor moves about the page and
 * clicks Buy, and the order travels down through the app, lighting the Buy
 * component, the POST /buy route and the orders table in turn, and the cart on
 * the page counts it.
 */

const SHEET = { x0: -110, x1: 70, y0: -80, y1: 80, h: 5, step: 42, back: 44 };
const sheet = (i: number) => ({ x0: SHEET.x0 - i * SHEET.back, x1: SHEET.x1 - i * SHEET.back, z: i * SHEET.step });
const SHEETS: { name: string; tone: Tone }[] = [
  { name: "database", tone: TONES.concrete },
  { name: "api", tone: TONES.sage },
  { name: "frontend", tone: TONES.sienna },
  { name: "browser", tone: TONES.paper },
];
const BELT = { x0: 120, x1: 330, y0: 20, y1: 50 };
const STATIONS = [{ x: 160, name: "build" }, { x: 222, name: "test" }, { x: 284, name: "deploy" }];
const SERVER = { x0: 345, x1: 395, y0: 0, y1: 60, h: 110 };
const RELEASE = 3200;

// the page on the browser sheet, in the sheet's own units: across it and down it
const PAGE = sheet(3);
const pageAt = (u: number, v: number) => at(PAGE.x0 + u, SHEET.y0 + v, PAGE.z + SHEET.h);
const BUY: Point = [108, 118];
// where the order goes after the click: the component, the route, the table
const ORDER = (() => {
  const [ui, api, db] = [sheet(2), sheet(1), sheet(0)];
  const points = [pageAt(BUY[0] - 3, BUY[1] - 2), at(ui.x1 - 21, 21, ui.z + SHEET.h + 4), at(api.x1 - 25, 1, api.z + SHEET.h + 5), at(db.x1 - 26, 3, db.z + SHEET.h + 5)];
  return points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
})();
const CURSOR_STOPS: Point[] = [
  [40, 40],
  [120, 70],
  [BUY[0], BUY[1]],
  [BUY[0], BUY[1]],
  [60, 110],
];

export default function WebRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const release = useRef<SVGGElement>(null);
  const stations = useRef<(SVGGElement | null)[]>([]);
  const server = useRef<SVGGElement>(null);
  const version = useRef<SVGTextElement>(null);
  const cursor = useRef<SVGGElement>(null);
  const buy = useRef<SVGGElement>(null);
  const order = useRef<SVGPathElement>(null);
  const orderPacket = useRef<SVGGElement | null>(null);
  const layers = useRef<(SVGGElement | null)[]>([]);
  const cart = useRef<SVGTextElement>(null);
  const progress = useRef<SVGRectElement>(null);
  const tests = useRef<SVGTextElement>(null);
  const drives = useRef<(SVGCircleElement | null)[]>([]);

  useClock(built, svg, (ms) => {
    // the release along the belt, into the server
    const n = Math.floor(ms / RELEASE);
    const u = (ms % RELEASE) / RELEASE;
    const x = BELT.x0 - 10 + u * 1.12 * (SERVER.x0 + 10 - BELT.x0);
    const inside = x > SERVER.x0 + 6;
    place(release.current, inside ? [-999, -999] : ([at(x, 35, 8)[0] - at(0, 35, 8)[0], at(x, 35, 8)[1] - at(0, 35, 8)[1]] as Point));
    stations.current.forEach((station, i) => light(station, Math.abs(x - STATIONS[i].x) < 18));
    light(server.current, inside);
    if (version.current) version.current.textContent = `v1.${Math.floor((n + (inside ? 1 : 0)) / 10)}.${(n + (inside ? 1 : 0)) % 10}`;
    // the visitor's cursor, gliding from stop to stop, and the click on Buy
    const t = (ms % 6000) / 1200;
    const i = Math.floor(t);
    const f = t - i;
    const ease = f * f * (3 - 2 * f);
    const [a, b] = [CURSOR_STOPS[i], CURSOR_STOPS[(i + 1) % CURSOR_STOPS.length]];
    place(cursor.current, pageAt(a[0] + (b[0] - a[0]) * ease, a[1] + (b[1] - a[1]) * ease));
    light(buy.current, i === 2 && f > 0.2 && f < 0.7 ? "warm" : false);
    // the order, down through the app after the click
    const going = i === 2 ? Math.max(0, (f - 0.6) / 0.4) * 0.34 : i === 3 ? 0.34 + f * 0.66 : -1;
    place(orderPacket.current, going >= 0 ? along(order.current, going) : [-999, -999]);
    layers.current.forEach((layer, k) => light(layer, going >= 0 && Math.abs(going - (k + 1) / 3) < 0.12 ? (k === 2 ? "warm" : true) : false));
    const bought = Math.floor(ms / 6000) + (i >= 4 ? 1 : 0);
    if (cart.current) cart.current.textContent = `cart ${bought}`;
    // the stations' readouts: how far the build is, how many tests have passed
    progress.current?.setAttribute("width", (Math.max(0, Math.min(1, (x - STATIONS[0].x + 18) / 36)) * 24).toFixed(1));
    if (tests.current) tests.current.textContent = x > STATIONS[1].x - 18 ? "✓ 128" : "…";
    drives.current.forEach((drive, k) => drive?.setAttribute("fill", Math.sin(ms / (140 + k * 37) + k) > 0.3 ? "#80966b" : "#d3d6d0"));
  });

  return (
    <svg ref={svg} viewBox="76 100 634 540" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      {/* the four sheets of the app, the lowest first */}
      {SHEETS.map(({ name, tone }, i) => {
        const { x0, x1, z } = sheet(i);
        return (
          <Part key={name} arrival={{ lift: 50 + i * 16, from: 0.18 + i * 0.08, span: 0.16 }} style={drawn(0.02 + i * 0.07, 0.1 + i * 0.07)}>
            <g filter="url(#desk-card)">
              <Block x0={x0} x1={x1} y0={SHEET.y0} y1={SHEET.y1} z={z} h={SHEET.h} tone={tone} r={12} width={1.3} />
            </g>
            <FrontTag origin={at(x1 - 8, SHEET.y1, z + 2.5)} text={name} size={6.5} anchor="end" fill="#5e625c" />

            {/* what each sheet holds, along its front edge where the sheet above leaves it showing */}
            {i === 0 &&
              [-58, -12, 34].map((y) => (
                <g
                  key={y}
                  ref={(el) => {
                    if (y === -12) layers.current[2] = el;
                  }}
                >
                  <Block x0={x1 - 42} x1={x1 - 10} y0={y} y1={y + 30} z={z + SHEET.h} h={5} tone={TONES.paper} r={4} width={1} />
                  <path d={rounded(topFace(x1 - 40, x1 - 12, y + 2, y + 28, z + SHEET.h + 5), 3)} className={styles.glow} />
                  <g transform={onTop(at(x1 - 40, y + 3, z + SHEET.h + 5))}>
                    <path d="M3 7H27M3 13H27M3 19H27M11 3V26" stroke="#b8bcb5" strokeWidth={1.2} />
                  </g>
                </g>
              ))}
            {i === 1 &&
              [
                { y: -62, text: "GET /cart" },
                { y: -16, text: "POST /buy" },
                { y: 30, text: "auth" },
              ].map(({ y, text }) => (
                <g
                  key={y}
                  ref={(el) => {
                    if (text === "POST /buy") layers.current[1] = el;
                  }}
                >
                  <Block x0={x1 - 42} x1={x1 - 8} y0={y} y1={y + 34} z={z + SHEET.h} h={5} tone={TONES.sageDeep} r={5} width={1} />
                  <path d={rounded(topFace(x1 - 40, x1 - 10, y + 2, y + 32, z + SHEET.h + 5), 4)} className={styles.glow} />
                  <TopTag origin={at(x1 - 25, y + 17, z + SHEET.h + 5)} text={text} size={4.6} />
                </g>
              ))}
            {i === 2 && (
              <g>
                <g transform={onTop(at(x1 - 44, SHEET.y0 + 10, z + SHEET.h))}>
                  <path d="M17 18V70M17 44H32M17 70H32M17 96H32M17 70V96" fill="none" stroke="#bc4e26" strokeWidth={1.4} strokeLinecap="round" />
                </g>
                {[
                  { y: -76, text: "App" },
                  { y: -44, text: "Cart" },
                  { y: -18, text: "Item" },
                  { y: 8, text: "Buy" },
                ].map(({ y, text }, k) => (
                  <g
                    key={text}
                    ref={(el) => {
                      if (text === "Buy") layers.current[0] = el;
                    }}
                  >
                    <Block x0={x1 - (k ? 34 : 44)} x1={x1 - (k ? 8 : 18)} y0={y + 4} y1={y + 22} z={z + SHEET.h} h={4} tone={TONES.paper} r={4} width={1} />
                    <path d={rounded(topFace(x1 - (k ? 32 : 42), x1 - (k ? 10 : 20), y + 6, y + 20, z + SHEET.h + 4), 3)} className={styles.glow} />
                    <TopTag origin={at(x1 - (k ? 21 : 31), y + 13, z + SHEET.h + 4)} text={text} size={5.4} />
                  </g>
                ))}
              </g>
            )}
            {i === 3 && (
              <g>
                {/* the page: a bar along the top, a heading, a picture, and the Buy button */}
                <g transform={onTop(at(x0, SHEET.y0, z + SHEET.h))}>
                  <rect x={8} y={8} width={164} height={14} rx={5} fill="#d3d6d0" />
                  <circle cx={16} cy={15} r={3} fill="#d0714c" />
                  <rect x={16} y={34} width={90} height={9} rx={3} fill="#5e625c" />
                  <rect x={16} y={50} width={64} height={6} rx={3} fill="#b8bcb5" />
                  <rect x={16} y={62} width={76} height={6} rx={3} fill="#b8bcb5" />
                  <rect x={116} y={34} width={48} height={60} rx={6} fill="#e2e9da" stroke="rgba(45,47,43,0.4)" />
                  <path d="M122 84l12-16 9 10 7-6 10 12" fill="none" stroke="#80966b" strokeWidth={1.6} strokeLinejoin="round" />
                  <rect x={8} y={140} width={164} height={10} rx={4} fill="#e3e5e0" />
                  <text x={120} y={104} fontSize={6} fontWeight={700} fill="#2d2f2b">
                    sketchbook
                  </text>
                  <text x={120} y={112} fontSize={6} fontWeight={700} fill="#9c3f1d">
                    $24
                  </text>
                  <rect x={134} y={10} width={34} height={10} rx={5} fill="#f4f4f0" />
                  <text ref={cart} x={151} y={17.4} textAnchor="middle" fontSize={5.6} fontWeight={700} fill="#9c3f1d">
                    cart 0
                  </text>
                </g>
                <g ref={buy}>
                  <Block x0={x0 + BUY[0] - 30} x1={x0 + BUY[0] + 24} y0={SHEET.y0 + BUY[1] - 12} y1={SHEET.y0 + BUY[1] + 8} z={z + SHEET.h} h={4} tone={TONES.sienna} r={6} width={1.1} />
                  <path d={rounded(topFace(x0 + BUY[0] - 28, x0 + BUY[0] + 22, SHEET.y0 + BUY[1] - 10, SHEET.y0 + BUY[1] + 6, z + SHEET.h + 4), 5)} className={styles.glow} />
                  <TopTag origin={at(x0 + BUY[0] - 3, SHEET.y0 + BUY[1] - 2, z + SHEET.h + 4)} text="Buy" size={7} />
                </g>
              </g>
            )}
          </Part>
        );
      })}

      {/* the belt, its three stations and the server at the end of it */}
      <Part arrival={{ lift: 40, from: 0.42, span: 0.14 }} style={drawn(0.3, 0.4)}>
        <g filter="url(#desk-card)">
          <Block x0={BELT.x0} x1={BELT.x1} y0={BELT.y0} y1={BELT.y1} z={0} h={8} tone={TONES.dark} r={10} />
        </g>
        <g transform={onTop(at(BELT.x0 + 8, BELT.y0 + 15, 8))}>
          <path d={`M0 0H${BELT.x1 - BELT.x0 - 16}`} stroke="#7c817a" strokeWidth={1.4} strokeDasharray="4 7" />
        </g>
      </Part>
      <g ref={release}>
        <g filter="url(#desk-chip)">
          <Block x0={-7} x1={7} y0={28} y1={42} z={8} h={12} tone={TONES.sienna} r={3} width={1.1} />
        </g>
      </g>
      {STATIONS.map(({ x, name }, i) => (
        <Part key={name} arrival={{ lift: 40, from: 0.5 + i * 0.05, span: 0.1, fall: true }} style={drawn(0.46 + i * 0.05, 0.52 + i * 0.05, 0.06)}>
          <g
            ref={(el) => {
              stations.current[i] = el;
            }}
          >
            <g filter="url(#desk-chip)">
              <Block x0={x - 16} x1={x + 16} y0={BELT.y0 - 6} y1={BELT.y1 + 6} z={8} h={30} tone={TONES.concrete} r={6} width={1.2} />
            </g>
            <path d={rounded(topFace(x - 13, x + 13, BELT.y0 - 3, BELT.y1 + 3, 38), 4)} className={styles.glow} />
            <FrontTag origin={at(x, BELT.y1 + 6, 24)} text={name} size={6.5} anchor="middle" />
            <g transform={onFront(at(x - 13, BELT.y1 + 6, 34))} className={styles.tag}>
              {i === 0 && (
                <>
                  <rect x={1} y={0} width={24} height={4} rx={2} fill="#d3d6d0" />
                  <rect ref={progress} x={1} y={0} width={0} height={4} rx={2} fill="#80966b" />
                </>
              )}
              {i === 1 && (
                <text ref={tests} x={13} y={4} textAnchor="middle" fontSize={5.2} fontWeight={700} fill="#4c5e3e">
                  …
                </text>
              )}
              {i === 2 && (
                <text x={13} y={4} textAnchor="middle" fontSize={5.2} fontWeight={700} fill="#9c3f1d">
                  → prod
                </text>
              )}
            </g>
          </g>
        </Part>
      ))}
      <Part arrival={{ lift: 50, from: 0.6, span: 0.14 }} style={drawn(0.52, 0.6)}>
        <g ref={server}>
          <g filter="url(#desk-card)">
            <Block x0={SERVER.x0} x1={SERVER.x1} y0={SERVER.y0} y1={SERVER.y1} z={0} h={SERVER.h} tone={TONES.paper} r={10} />
          </g>
          <g transform={onFront(at(SERVER.x0, SERVER.y1, SERVER.h))}>
            {[16, 30, 44, 58].map((v, k) => (
              <g key={v}>
                <rect x={8} y={v} width={34} height={8} rx={3} fill="#e3e5e0" stroke="rgba(45,47,43,0.4)" strokeWidth={0.8} />
                <circle
                  ref={(el) => {
                    drives.current[k] = el;
                  }}
                  cx={36}
                  cy={v + 4}
                  r={1.8}
                  fill="#d3d6d0"
                />
              </g>
            ))}
            <text x={8} y={106} fontSize={5.4} fontWeight={700} fill="#647a52" className={styles.tag}>
              up 99.98%
            </text>
            <circle cx={38} cy={8} r={3} className={styles.led} stroke="rgba(45,47,43,0.55)" strokeWidth={0.8} />
            <text x={8} y={84} fontSize={6.6} fontWeight={700} fill="#2d2f2b" className={styles.tag}>
              live
            </text>
            <text ref={version} x={8} y={96} fontSize={7.4} fontWeight={700} fill="#9c3f1d" className={styles.tag}>
              v1.0.0
            </text>
          </g>
        </g>
      </Part>

      {/* the order's way down through the app */}
      <path ref={order} d={ORDER} fill="none" stroke="#d0714c" strokeOpacity={0.35} strokeWidth={1.4} strokeDasharray="2 5" strokeLinecap="round" className={styles.pipes} />
      {built && (
        <Packet
          colour="#d0714c"
          r={3.6}
          ref={(el) => {
            orderPacket.current = el;
          }}
        />
      )}

      {/* the visitor's cursor, upright over the page */}
      {built && (
        <g ref={cursor} transform="translate(-999 -999)">
          <path d="M0 0V17L4.5 12.8L8 19.6L10.8 18.3L7.4 11.6H13.6Z" fill="#f4f4f0" stroke="#2d2f2b" strokeWidth={1.2} strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}
