/**
 * The noise filters every sketchy edge on the site is drawn through, placed
 * once in the page so CSS can refer to them as url(#id).
 *
 * The first four are the design's own, unchanged except for a filter region a
 * little larger than the default, so the offset shadow is never clipped on
 * small buttons. The last three are gentler cousins for larger surfaces: card
 * frames wobble slowly along their length instead of fizzing, and chips get a
 * cheaper filter because there are many of them.
 */

const REGION = { x: "-20%", y: "-20%", width: "140%", height: "140%" } as const;

function Noise({ id, scale, seed, frequency = 0.1, octaves = 8 }: { id: string; scale: number; seed?: number; frequency?: number; octaves?: number }) {
  return (
    <filter id={id} {...REGION}>
      <feTurbulence result="noise" numOctaves={octaves} baseFrequency={frequency} seed={seed} type="fractalNoise" />
      <feDisplacementMap yChannelSelector="G" xChannelSelector="R" scale={scale} in2="noise" in="SourceGraphic" />
    </filter>
  );
}

export default function SketchFilters() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <Noise id="handDrawnNoise" scale={3} />
      <Noise id="handDrawnNoise2" scale={3} seed={1010} />
      <Noise id="handDrawnNoiset" scale={6} />
      <Noise id="handDrawnNoiset2" scale={6} seed={1010} />
      <Noise id="sketchFrame" scale={5} frequency={0.035} octaves={2} />
      <Noise id="sketchFrame2" scale={5} frequency={0.035} octaves={2} seed={1010} />
      <Noise id="sketchChip" scale={2.5} octaves={3} />
    </svg>
  );
}
