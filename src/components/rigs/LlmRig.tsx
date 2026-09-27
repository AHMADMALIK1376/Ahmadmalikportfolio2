"use client";

import { useRef, type CSSProperties } from "react";
import { at, Block, Detail, dot, drawn, onFront, onSide, onTop, Part, rounded, sideFace, TONES, type Point, type Tone } from "@/components/desk/iso";
import { along, FrontTag, light, Packet, place, TopTag, useBuild, useClock } from "./kit";
import styles from "./Rigs.module.css";

/**
 * A model being trained, on a desk.
 *
 * A stack of data and its tokenizer, a board of three GPUs with their fans,
 * four glass layers of a network, a loss chart and a checkpoint disk. They are
 * drawn, coloured in and set down, and then it trains on its own clock: tokens
 * stream from the data through the tokenizer into the first layer, the layers
 * light one after another as the forward pass runs through them and back again
 * for the backward pass, the loss falls epoch by epoch on the chart, and the
 * checkpoint's light blinks as each epoch is saved.
 */

const GLASS: Tone = { top: "rgba(238,243,233,0.8)", left: "rgba(214,229,198,0.55)", right: "rgba(226,236,216,0.6)" };
const LAYERS = [-95, -40, 15, 70];
const LAYER = { y0: -70, y1: 30, z: 8, h: 118, w: 8 };
const NODES: Point[] = [20, 50, 80].flatMap((u) => [26, 60, 94].map((v): Point => [u, v]));
const GPUS = [-130, -45, 40];
const EPOCH = 2000;
const EPOCHS = 12;
const loss = (e: number) => 0.18 + 2.2 * Math.exp(-e / 3.2) + 0.05 * Math.sin(e * 1.7);
// the chart, in its own units on the panel's face
const CHART = { u0: 16, u1: 138, v0: 124, v1: 30 };
const chartPoint = (e: number, l: number): Point => [CHART.u0 + (e / (EPOCHS - 1)) * (CHART.u1 - CHART.u0), CHART.v0 - (l / 2.5) * (CHART.v0 - CHART.v1)];
const TOKEN_PATH = `M${at(-220, 10, 26).join(" ")}L${at(-126, 5, 28).join(" ")}L${at(-94, -18, 72).join(" ")}`;

export default function LlmRig({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const built = useBuild(svg);
  const layers = useRef<(SVGGElement | null)[]>([]);
  const tokens = useRef<(SVGGElement | null)[]>([]);
  const tokenPath = useRef<SVGPathElement>(null);
  const curve = useRef<SVGPolylineElement>(null);
  const epochText = useRef<SVGTextElement>(null);
  const checkpoint = useRef<SVGPathElement>(null);

  useClock(built, svg, (ms) => {
    const e = Math.floor(ms / EPOCH) % EPOCHS;
    const t = ms % EPOCH;
    // forward through the layers, then back
    layers.current.forEach((layer, k) => {
      const forward = t >= k * 220 && t < k * 220 + 320;
      const backward = t >= 1000 + (3 - k) * 220 && t < 1000 + (3 - k) * 220 + 320;
      light(layer, forward ? true : backward ? "warm" : false);
    });
    tokens.current.forEach((token, k) => place(token, along(tokenPath.current, ((ms / 1500 + k / 4) % 1))));
    // the loss so far, the newest point sliding down into place as the epoch runs
    const done = Array.from({ length: e }, (_, i) => chartPoint(i, loss(i)));
    const u = Math.min(1, t / 1600);
    const now = chartPoint(e, e ? loss(e - 1) + (loss(e) - loss(e - 1)) * u : loss(0));
    curve.current?.setAttribute("points", [...done, now].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" "));
    if (epochText.current) epochText.current.textContent = `epoch ${String(e + 1).padStart(2, "0")} · ${loss(e).toFixed(2)}`;
    light(checkpoint.current, t > 1800 ? "warm" : false);
  });

  return (
    <svg ref={svg} viewBox="100 180 562 410" className={`${styles.rig} ${built ? styles.running : ""} ${className ?? ""}`} aria-hidden="true" focusable="false">
      {/* the loss chart, standing at the back */}
      <Part arrival={{ lift: 30, from: 0.3, span: 0.14 }} style={drawn(0.12, 0.22)}>
        <g filter="url(#desk-card)">
          <Block x0={60} x1={210} y0={-126} y1={-120} z={0} h={140} tone={TONES.paper} r={10} />
        </g>
        <g transform={onFront(at(60, -120, 140))} className={styles.tag}>
          <text x={14} y={18} fontSize={9} fontWeight={700} fill="#2d2f2b">
            loss
          </text>
          <text ref={epochText} x={140} y={18} textAnchor="end" fontSize={7.5} fontWeight={700} fill="#9c3f1d">
            epoch 01 · {loss(0).toFixed(2)}
          </text>
          <path d={`M${CHART.u0} ${CHART.v1 - 4}V${CHART.v0}H${CHART.u1 + 4}`} fill="none" stroke="rgba(45,47,43,0.55)" strokeWidth={1.4} strokeLinecap="round" />
          <polyline ref={curve} points={`${chartPoint(0, loss(0)).join(",")}`} fill="none" stroke="#bc4e26" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      </Part>

      {/* the data, a stack of sheets, and the stream of tokens from it */}
      <g style={drawn(0.02, 0.12)} filter="url(#desk-card)">
        {[0, 9, 18].map((z) => (
          <Block key={z} x0={-250} x1={-190} y0={-20} y1={40} z={z} h={6} tone={TONES.paper} r={6} width={1.2} />
        ))}
      </g>
      <g transform={onTop(at(-246, -16, 24))} className={styles.tag}>
        <path d="M10 14H44M10 24H40M10 34H46M10 44H30" stroke="#b8bcb5" strokeWidth={2.2} strokeLinecap="round" />
      </g>
      <TopTag origin={at(-205, 22, 24)} text="data" size={7} />
      <path ref={tokenPath} d={TOKEN_PATH} fill="none" stroke="#b8bcb5" strokeWidth={1.4} strokeDasharray="3 5" strokeLinecap="round" className={styles.tag} />

      {/* the GPU board, with the tokenizer and three GPUs on it */}
      <g style={drawn(0.06, 0.16)} filter="url(#desk-card)">
        <Block x0={-150} x1={170} y0={-90} y1={90} z={0} h={8} tone={TONES.concrete} r={16} />
      </g>
      <FrontTag origin={at(-140, 90, 4)} text="GPU × 3" size={6} fill="#5e625c" />
      <Part arrival={{ lift: 36, from: 0.34, span: 0.1, fall: true }} style={drawn(0.3, 0.36, 0.06)}>
        <g filter="url(#desk-chip)">
          <Block x0={-140} x1={-112} y0={-10} y1={20} z={8} h={18} tone={TONES.sienna} r={5} width={1.2} />
        </g>
        <TopTag origin={at(-126, 5, 26)} text="tok" size={6.5} />
      </Part>
      {GPUS.map((x, i) => (
        <Part key={x} arrival={{ lift: 36, from: 0.38 + i * 0.05, span: 0.1, fall: true }} style={drawn(0.34 + i * 0.05, 0.4 + i * 0.05, 0.06)}>
          <g filter="url(#desk-chip)">
            <Block x0={x} x1={x + 65} y0={52} y1={82} z={8} h={10} tone={TONES.dark} r={5} width={1.2} />
          </g>
          <g transform={onTop(at(x + 22, 67, 18))}>
            <circle r={10} fill="#3b3d39" stroke="#9a9f98" strokeWidth={1} />
            <g className={styles.spin}>
              <path d="M0 -8V8M-8 0H8M-5.6 -5.6L5.6 5.6M-5.6 5.6L5.6 -5.6" stroke="#b8bcb5" strokeWidth={1.6} strokeLinecap="round" />
            </g>
          </g>
          <Detail d={dot(at(x + 52, 67, 18), 2.6)} fill="#80966b" width={0.8} style={{ "--fs": 0.85, "--fl": 0.05 } as CSSProperties} />
        </Part>
      ))}

      {/* the network: four glass layers, their nodes on the faces turned to the right */}
      {LAYERS.map((x, k) => (
        <Part key={x} arrival={{ lift: 60, from: 0.44 + k * 0.06, span: 0.12 }} style={drawn(0.4 + k * 0.06, 0.48 + k * 0.06, 0.08)}>
          <g
            ref={(el) => {
              layers.current[k] = el;
            }}
          >
            <Block x0={x} x1={x + LAYER.w} y0={LAYER.y0} y1={LAYER.y1} z={LAYER.z} h={LAYER.h} tone={GLASS} r={4} width={1.3} />
            <path d={rounded(sideFace(x + LAYER.w, LAYER.y0 + 4, LAYER.y1 - 4, LAYER.z + 4, LAYER.z + LAYER.h - 4), 6)} className={styles.glow} />
            <g transform={onSide(at(x + LAYER.w, LAYER.y1, LAYER.z + LAYER.h))}>
              {NODES.map(([u, v]) => (
                <circle key={`${u}-${v}`} cx={u} cy={v} r={5.5} className={styles.led} stroke="rgba(45,47,43,0.55)" strokeWidth={1} />
              ))}
            </g>
          </g>
        </Part>
      ))}

      {/* the checkpoint disk, and its light */}
      <Part arrival={{ lift: 36, from: 0.62, span: 0.1, fall: true }} style={drawn(0.58, 0.64, 0.06)}>
        <g filter="url(#desk-card)">
          <Block x0={190} x1={245} y0={60} y1={115} z={0} h={16} tone={TONES.paper} r={24} />
        </g>
        <TopTag origin={at(212, 88, 16)} text="ckpt" size={7} />
        <path ref={checkpoint} d={dot(at(232, 78, 16), 3.2)} className={styles.led} stroke="rgba(45,47,43,0.55)" strokeWidth={0.9} />
      </Part>

      {/* the tokens, once it runs */}
      {built &&
        [0, 1, 2, 3].map((k) => (
          <Packet
            key={k}
            colour={k % 2 ? "#d0714c" : "#80966b"}
            r={3.2}
            ref={(el) => {
              tokens.current[k] = el;
            }}
          />
        ))}
    </svg>
  );
}
