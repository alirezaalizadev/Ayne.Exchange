'use client';

import * as React from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Environment, Lightformer } from '@react-three/drei';

/**
 * AYNE FINANCIAL CORE — procedural 3D brand sculpture.
 * Composition (desktop): 1 extruded Ayne "A" core, 3 rings, 4 financial
 * papers, 3 currency symbols, 2 minted tokens, 1 sparse particle field,
 * 3 tiny service labels. Everything is generated at runtime — no model
 * files, no HDRs, no external assets beyond the self-hosted brand font.
 *
 * Materials stay within four families (dark metal, brushed silver, smoked
 * glass, financial paper) and all colours come from the Ayne token palette.
 */

export interface SceneProps {
  theme: 'light' | 'dark';
  variant: 'desktop' | 'mobile';
  active: boolean;
  /** Normalised pointer (-1..1) supplied by the wrapper; parallax input. */
  pointer: React.MutableRefObject<{ x: number; y: number }>;
}

/* ----------------------------- palette ---------------------------------- */

const P = {
  navy: '#161b28',
  navyLight: '#232a3d',
  silver: '#c7cdd9',
  silverDark: '#8f97a8',
  paper: '#f4f1ea',
  accent: '#2563d8', // token primary family
  accentSoft: '#7fa8ff',
  emerald: '#1f8a70',
};

/* --------------------------- glyph planes -------------------------------- *
 * Crisp text via CanvasTexture on planes — no font files, no workers, fully
 * CSP-safe. Uses the site's loaded brand font family at draw time.           */

function makeGlyphTexture(text: string, px: number, color: string, weight = 800): THREE.CanvasTexture {
  const pad = 0.35 * px;
  const c = document.createElement('canvas');
  const family = getComputedStyle(document.body).fontFamily.split(',')[0].replace(/['"]/g, '') || 'sans-serif';
  const probe = c.getContext('2d')!;
  probe.font = `${weight} ${px}px ${family}`;
  const w = Math.ceil(probe.measureText(text).width + pad * 2);
  const h = Math.ceil(px * 1.45);
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  x.font = `${weight} ${px}px ${family}`;
  x.textBaseline = 'middle';
  x.fillStyle = color;
  x.fillText(text, pad, h / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function TextPlane({
  text,
  size,
  color,
  weight = 800,
  opacity = 1,
  position,
  rotation,
}: {
  text: string;
  size: number;
  color: string;
  weight?: number;
  opacity?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const tex = React.useMemo(() => makeGlyphTexture(text, 220, color, weight), [text, color, weight]);
  React.useEffect(() => () => tex.dispose(), [tex]);
  const aspect = (tex.image as HTMLCanvasElement).width / (tex.image as HTMLCanvasElement).height;
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[size * aspect, size]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ------------------------- shared geometry ------------------------------ */

/** Refined stylized "A" silhouette (solid wedge with a notched underside). */
function useCoreGeometry() {
  return React.useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.05, -1.15);
    s.lineTo(-0.16, 1.2);
    s.lineTo(0.16, 1.2);
    s.lineTo(1.05, -1.15);
    s.lineTo(0.62, -1.15);
    s.lineTo(0, 0.42);
    s.lineTo(-0.62, -1.15);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 3,
      curveSegments: 8,
    });
    geo.center();
    return geo;
  }, []);
}

/* ------------------------------ materials ------------------------------- */

function useMaterials(theme: 'light' | 'dark') {
  return React.useMemo(() => {
    const dark = theme === 'dark';
    return {
      darkMetal: new THREE.MeshStandardMaterial({
        color: dark ? P.navyLight : P.navy,
        metalness: 0.92,
        roughness: 0.32,
      }),
      silver: new THREE.MeshStandardMaterial({
        color: dark ? '#d6dbe6' : P.silver,
        metalness: 0.9,
        roughness: 0.28,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: dark ? '#3a4a6b' : '#9fb2d8',
        metalness: 0.2,
        roughness: 0.1,
        transparent: true,
        opacity: dark ? 0.28 : 0.22,
        side: THREE.DoubleSide,
      }),
    };
  }, [theme]);
}

/* ------------------------------- core ----------------------------------- */

function Core({ mats, enter }: { mats: ReturnType<typeof useMaterials>; enter: React.MutableRefObject<number> }) {
  const group = React.useRef<THREE.Group>(null);
  const geo = useCoreGeometry();

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = t * 0.16;
    const k = THREE.MathUtils.clamp(enter.current, 0, 1);
    const s = THREE.MathUtils.lerp(0.6, 1, easeOut(k));
    g.scale.setScalar(s);
  });

  return (
    <group ref={group}>
      <mesh geometry={geo} material={mats.darkMetal} />
      {/* Floating exchange crossbar — echo of the logo's bidirectional bar */}
      <RoundedBox args={[1.45, 0.2, 0.26]} radius={0.06} position={[0, -0.28, 0.34]} material={mats.silver} />
    </group>
  );
}

/* ------------------------------- rings ---------------------------------- */

function Rings({ mats, variant, enter }: { mats: ReturnType<typeof useMaterials>; variant: SceneProps['variant']; enter: React.MutableRefObject<number> }) {
  const g1 = React.useRef<THREE.Group>(null);
  const g2 = React.useRef<THREE.Group>(null);
  const g3 = React.useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const k = easeOut(THREE.MathUtils.clamp(enter.current - 0.25, 0, 1));
    if (g1.current) {
      g1.current.rotation.z = t * 0.07;
      g1.current.scale.setScalar(k);
    }
    if (g2.current) {
      g2.current.rotation.z = -t * 0.05;
      g2.current.scale.setScalar(k);
    }
    if (g3.current) {
      g3.current.rotation.z = t * 0.1;
      g3.current.scale.setScalar(k);
    }
  });

  return (
    <>
      {/* thin metallic */}
      <group ref={g1} rotation={[Math.PI / 2.25, 0.25, 0]}>
        <mesh material={mats.silver}>
          <torusGeometry args={[2.15, 0.013, 8, 96]} />
        </mesh>
      </group>
      {/* transparent glass */}
      <group ref={g2} rotation={[Math.PI / 1.85, -0.35, 0.15]}>
        <mesh material={mats.glass}>
          <torusGeometry args={[2.6, 0.05, 12, 96]} />
        </mesh>
      </group>
      {/* broken / segmented */}
      {variant === 'desktop' && (
        <group ref={g3} rotation={[Math.PI / 2.6, 0.55, -0.2]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2 + 0.35]} material={mats.darkMetal}>
              <torusGeometry args={[1.78, 0.022, 8, 32, Math.PI / 3.4]} />
            </mesh>
          ))}
        </group>
      )}
    </>
  );
}

/* --------------------------- financial papers --------------------------- */

interface PaperSpec {
  amount: string;
  code: string;
  word: string;
  finish: 'paper' | 'navy' | 'glass';
  radius: number;
  speed: number;
  phase: number;
  y: number;
}

const PAPERS_DESKTOP: PaperSpec[] = [
  { amount: '€ 10,000', code: 'EUR', word: 'TRANSFER', finish: 'paper', radius: 2.9, speed: 0.11, phase: 0.4, y: 0.55 },
  { amount: '$ 25,000', code: 'USD', word: 'PAYMENT', finish: 'navy', radius: 3.25, speed: 0.085, phase: 2.3, y: -0.35 },
  { amount: '₺ 500,000', code: 'TRY', word: 'EXCHANGE', finish: 'paper', radius: 2.7, speed: 0.13, phase: 4.1, y: -0.85 },
  { amount: '£ 8,500', code: 'GBP', word: 'TRANSFER', finish: 'glass', radius: 3.5, speed: 0.07, phase: 5.4, y: 1.05 },
];

/** Procedural note texture: AYNE branding, amount, code, word, guilloche. */
function makePaperTexture(spec: PaperSpec, theme: 'light' | 'dark'): THREE.CanvasTexture {
  const w = 512;
  const h = 288;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  const family = getComputedStyle(document.body).fontFamily.split(',')[0].replace(/['"]/g, '') || 'sans-serif';

  const navy = spec.finish === 'navy';
  const glass = spec.finish === 'glass';
  const bg = navy ? '#1a2133' : glass ? 'rgba(240,244,255,0.92)' : P.paper;
  const ink = navy ? '#e8ecf5' : '#1c2333';
  const sub = navy ? 'rgba(232,236,245,0.55)' : 'rgba(28,35,51,0.5)';
  const line = navy ? 'rgba(150,170,215,0.28)' : 'rgba(37,99,216,0.18)';

  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);

  // guilloche-style concentric arcs
  x.strokeStyle = line;
  x.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    x.beginPath();
    x.arc(w * 0.82, h * 1.15, 60 + i * 26, Math.PI, Math.PI * 2);
    x.stroke();
  }
  for (let i = 0; i < 7; i++) {
    x.beginPath();
    x.arc(w * 0.08, -h * 0.15, 40 + i * 30, 0, Math.PI);
    x.stroke();
  }
  // micro-pattern dots
  x.fillStyle = navy ? 'rgba(232,236,245,0.05)' : 'rgba(28,35,51,0.045)';
  for (let i = 0; i < 260; i++) {
    x.fillRect((i * 97) % w, (i * 53) % h, 1.5, 1.5);
  }

  // AYNE wordmark
  x.fillStyle = ink;
  x.font = `800 34px ${family}`;
  x.fillText('AYNE', 32, 58);
  x.font = `600 13px ${family}`;
  x.fillStyle = sub;
  x.fillText('E X C H A N G E', 33, 80);

  // word (top-end)
  x.font = `700 16px ${family}`;
  x.fillStyle = navy ? P.accentSoft : P.accent;
  const ww = x.measureText(spec.word).width;
  x.fillText(spec.word, w - ww - 34, 56);

  // amount (large)
  x.fillStyle = ink;
  x.font = `800 52px ${family}`;
  x.fillText(spec.amount, 32, h - 62);

  // code chip
  x.font = `700 18px ${family}`;
  x.fillStyle = sub;
  x.fillText(spec.code, 34, h - 26);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  void theme;
  return tex;
}

function Paper({ spec, theme, enter }: { spec: PaperSpec; theme: 'light' | 'dark'; enter: React.MutableRefObject<number> }) {
  const ref = React.useRef<THREE.Group>(null);
  const tex = React.useMemo(() => makePaperTexture(spec, theme), [spec, theme]);
  React.useEffect(() => () => tex.dispose(), [tex]);

  const mat = React.useMemo(() => {
    if (spec.finish === 'glass') {
      return new THREE.MeshPhysicalMaterial({
        map: tex,
        transparent: true,
        opacity: 0.55,
        roughness: 0.15,
        metalness: 0.15,
      });
    }
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.75,
      metalness: 0.06,
    });
  }, [tex, spec.finish]);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const a = t * spec.speed * Math.PI * 2 + spec.phase;
    g.position.set(Math.cos(a) * spec.radius, spec.y + Math.sin(t * 0.5 + spec.phase) * 0.16, Math.sin(a) * 1.5);
    g.rotation.y = -a + Math.PI / 2 + Math.sin(t * 0.4 + spec.phase) * 0.12;
    g.rotation.x = Math.sin(t * 0.33 + spec.phase) * 0.1;
    const k = easeOut(THREE.MathUtils.clamp(enter.current - 0.45, 0, 1));
    g.scale.setScalar(k);
  });

  return (
    <group ref={ref}>
      <RoundedBox args={[1.42, 0.8, 0.02]} radius={0.05} smoothness={2} material={mat} />
    </group>
  );
}

/* ------------------------ symbols, tokens, labels ------------------------ */

const SYMBOL_SETS = [
  ['€', '$', '₺'],
  ['£', '¥', '$'],
  ['€', '₽', '₺'],
];

function Symbols({ mats, variant, enter }: { mats: ReturnType<typeof useMaterials>; variant: SceneProps['variant']; enter: React.MutableRefObject<number> }) {
  const [setIdx, setSetIdx] = React.useState(0);
  React.useEffect(() => {
    const iv = setInterval(() => setSetIdx((i) => (i + 1) % SYMBOL_SETS.length), 18000);
    return () => clearInterval(iv);
  }, []);
  const chars = SYMBOL_SETS[setIdx].slice(0, variant === 'mobile' ? 2 : 3);

  return (
    <>
      {chars.map((ch, i) => (
        <OrbitingText
          key={`${ch}-${i}`}
          char={ch}
          radius={2.25 + i * 0.35}
          speed={0.09 + i * 0.02}
          phase={i * 2.2 + 1.1}
          y={0.9 - i * 0.75}
          size={0.34}
          color={i === 1 ? P.accent : undefined}
          mats={mats}
          enter={enter}
        />
      ))}
    </>
  );
}

function OrbitingText({
  char,
  radius,
  speed,
  phase,
  y,
  size,
  color,
  mats,
  enter,
}: {
  char: string;
  radius: number;
  speed: number;
  phase: number;
  y: number;
  size: number;
  color?: string;
  mats: ReturnType<typeof useMaterials>;
  enter: React.MutableRefObject<number>;
}) {
  const ref = React.useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const a = t * speed * Math.PI * 2 + phase;
    g.position.set(Math.cos(a) * radius, y + Math.sin(t * 0.6 + phase) * 0.12, Math.sin(a) * 1.2);
    g.rotation.y = Math.sin(t * 0.3 + phase) * 0.4;
    const k = easeOut(THREE.MathUtils.clamp(enter.current - 0.6, 0, 1));
    g.scale.setScalar(k);
  });
  return (
    <group ref={ref}>
      <TextPlane text={char} size={size * 1.4} color={color ?? `#${(mats.silver.color as THREE.Color).getHexString()}`} opacity={0.95} />
    </group>
  );
}

function Tokens({ mats, variant, enter }: { mats: ReturnType<typeof useMaterials>; variant: SceneProps['variant']; enter: React.MutableRefObject<number> }) {
  const specs = variant === 'mobile' ? [0] : [0, 1];
  return (
    <>
      {specs.map((i) => (
        <Token key={i} idx={i} mats={mats} enter={enter} />
      ))}
    </>
  );
}

function Token({ idx, mats, enter }: { idx: number; mats: ReturnType<typeof useMaterials>; enter: React.MutableRefObject<number> }) {
  const ref = React.useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const a = t * (0.06 + idx * 0.02) * Math.PI * 2 + idx * 3 + 2;
    g.position.set(Math.cos(a) * (3.1 - idx * 0.5), -1.2 + idx * 2.1 + Math.sin(t * 0.5 + idx) * 0.1, Math.sin(a) * 1.3);
    g.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.4 + idx) * 0.15;
    g.rotation.z = t * 0.25;
    const k = easeOut(THREE.MathUtils.clamp(enter.current - 0.7, 0, 1));
    g.scale.setScalar(k);
  });
  return (
    <group ref={ref}>
      <mesh material={idx === 0 ? mats.silver : mats.darkMetal}>
        <cylinderGeometry args={[0.3, 0.3, 0.045, 40]} />
      </mesh>
      <TextPlane
        text={idx === 0 ? '€' : 'AYNE'}
        size={idx === 0 ? 0.3 : 0.13}
        color={idx === 0 ? P.navy : P.silver}
        position={[0, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

function Labels({ enter, theme }: { enter: React.MutableRefObject<number>; theme: 'light' | 'dark' }) {
  const items = [
    { text: 'SWIFT', pos: [-2.7, 1.7, -0.6] as [number, number, number] },
    { text: 'SEPA', pos: [2.9, -1.5, -0.4] as [number, number, number] },
    { text: 'FX', pos: [-3, -1.1, 0.3] as [number, number, number] },
  ];
  const ref = React.useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const k = easeOut(THREE.MathUtils.clamp(enter.current - 0.8, 0, 1));
    g.scale.setScalar(k);
    g.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.06;
  });
  return (
    <group ref={ref}>
      {items.map((it) => (
        <TextPlane
          key={it.text}
          text={it.text}
          size={0.16}
          weight={700}
          color={theme === 'dark' ? '#8b93a6' : '#7d8496'}
          opacity={0.75}
          position={it.pos}
        />
      ))}
    </group>
  );
}

/* ------------------------------ particles -------------------------------- */

function Particles({ variant, theme, enter }: { variant: SceneProps['variant']; theme: 'light' | 'dark'; enter: React.MutableRefObject<number> }) {
  const count = variant === 'mobile' ? 50 : 130;
  const ref = React.useRef<THREE.Points>(null);
  const data = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.random() * 2.4;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 2] = Math.sin(a) * r - 0.5;
      seed[i] = Math.random();
    }
    return { pos, seed };
  }, [count]);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const arr = (pts.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      // drift slowly toward the core
      arr[ix] *= 1 - delta * 0.05;
      arr[ix + 1] *= 1 - delta * 0.03;
      arr[ix + 2] *= 1 - delta * 0.05;
      const r = Math.hypot(arr[ix], arr[ix + 2]);
      if (r < 0.5) {
        const a = data.seed[i] * Math.PI * 2;
        const nr = 2.6 + data.seed[i] * 1.8;
        arr[ix] = Math.cos(a) * nr;
        arr[ix + 1] = (data.seed[i] - 0.5) * 3;
        arr[ix + 2] = Math.sin(a) * nr;
      }
    }
    (pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    const m = pts.material as THREE.PointsMaterial;
    m.opacity = 0.5 * easeOut(THREE.MathUtils.clamp(enter.current - 0.9, 0, 1));
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color={theme === 'dark' ? P.accentSoft : P.accent}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------ rig + scene ------------------------------ */

function easeOut(k: number) {
  return 1 - Math.pow(1 - k, 3);
}

function Rig({ pointer, children }: { pointer: SceneProps['pointer']; children: React.ReactNode }) {
  const ref = React.useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    // heavy, weighty damping toward the pointer + tiny automatic drift
    const t = state.clock.elapsedTime;
    const targetY = pointer.current.x * 0.16 + Math.sin(t * 0.05) * 0.03;
    const targetX = -pointer.current.y * 0.1 + Math.cos(t * 0.04) * 0.02;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 1.6, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 1.6, delta);
  });
  return <group ref={ref}>{children}</group>;
}

function SceneContent({ theme, variant, pointer }: Omit<SceneProps, 'active'>) {
  const mats = useMaterials(theme);
  const enter = React.useRef(0);
  useFrame((_, delta) => {
    // master entrance progress: 0→~1.9 over ~2.8s (staggers gate on offsets)
    enter.current = Math.min(enter.current + delta * 0.68, 1.9);
  });

  const papers = variant === 'mobile' ? PAPERS_DESKTOP.slice(0, 2) : PAPERS_DESKTOP;
  const dark = theme === 'dark';

  return (
    <>
      <ambientLight intensity={dark ? 0.35 : 0.55} />
      <directionalLight position={[4, 6, 5]} intensity={dark ? 1.1 : 1.5} color="#ffffff" />
      <pointLight position={[0, 0, 3.2]} intensity={dark ? 1.0 : 0.5} color={P.accent} distance={9} />
      {/* Procedural studio environment — local cubemap, no downloads. */}
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={dark ? 1.6 : 2.4} position={[0, 4, 3]} scale={[9, 3, 1]} color="#ffffff" />
        <Lightformer intensity={dark ? 1.1 : 1.4} position={[-5, 1, -1]} rotation={[0, Math.PI / 2, 0]} scale={[6, 2, 1]} color="#dfe6f5" />
        <Lightformer intensity={dark ? 1.4 : 1.1} position={[5, -1, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 2, 1]} color={P.accentSoft} />
        <Lightformer intensity={dark ? 0.7 : 0.9} position={[0, -4, -2]} scale={[8, 2, 1]} color={dark ? '#40507a' : '#ffffff'} />
      </Environment>

      <Rig pointer={pointer}>
        <Core mats={mats} enter={enter} />
        <Rings mats={mats} variant={variant} enter={enter} />
        {papers.map((spec) => (
          <Paper key={spec.code} spec={spec} theme={theme} enter={enter} />
        ))}
        <Symbols mats={mats} variant={variant} enter={enter} />
        <Tokens mats={mats} variant={variant} enter={enter} />
        {variant === 'desktop' && <Labels enter={enter} theme={theme} />}
        <Particles variant={variant} theme={theme} enter={enter} />
      </Rig>
    </>
  );
}

export default function FinancialCore({ theme, variant, active, pointer }: SceneProps) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, variant === 'mobile' ? 1.4 : 1.75]}
      camera={{ position: [1.6, 0.5, 7.2], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
      aria-hidden
    >
      <SceneContent theme={theme} variant={variant} pointer={pointer} />
    </Canvas>
  );
}
