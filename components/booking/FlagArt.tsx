import type { NationalityCode } from "@/lib/data/mock-catalog";
import { cn } from "@/lib/utils";

/** Simplified vector flags (emoji flags render as letters on Windows). */
export function FlagArt({
  code,
  className,
}: {
  code: NationalityCode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={cn("block overflow-hidden", className)}
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      {FLAGS[code]}
    </svg>
  );
}

function Sun({ cx, cy, r, fill = "#F6B40E" }: { cx: number; cy: number; r: number; fill?: string }) {
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8;
    return (
      <line
        key={i}
        x1={cx + Math.cos(a) * r * 1.1}
        y1={cy + Math.sin(a) * r * 1.1}
        x2={cx + Math.cos(a) * r * 1.75}
        y2={cy + Math.sin(a) * r * 1.75}
        stroke={fill}
        strokeWidth={r * 0.28}
        strokeLinecap="round"
      />
    );
  });
  return (
    <g>
      {rays}
      <circle cx={cx} cy={cy} r={r} fill={fill} />
    </g>
  );
}

function Star({ cx, cy, r, fill = "#fff" }: { cx: number; cy: number; r: number; fill?: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.4;
    return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
  }).join(" ");
  return <polygon points={pts} fill={fill} />;
}

const FLAGS: Record<NationalityCode, React.ReactNode> = {
  COL: (
    <>
      <rect width="60" height="20" fill="#FCD116" />
      <rect y="20" width="60" height="10" fill="#003893" />
      <rect y="30" width="60" height="10" fill="#CE1126" />
    </>
  ),
  ECU: (
    <>
      <rect width="60" height="20" fill="#FFDD00" />
      <rect y="20" width="60" height="10" fill="#034EA2" />
      <rect y="30" width="60" height="10" fill="#ED1C24" />
      <ellipse cx="30" cy="20" rx="5" ry="6.5" fill="#6B8E23" stroke="#8B5A2B" strokeWidth="1" />
    </>
  ),
  MEX: (
    <>
      <rect width="20" height="40" fill="#006847" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#CE1126" />
      <ellipse cx="30" cy="20" rx="5" ry="5.5" fill="#8B5A2B" />
      <path d="M24.5 23.5 Q30 28 35.5 23.5" stroke="#006847" strokeWidth="1.4" fill="none" />
    </>
  ),
  PER: (
    <>
      <rect width="20" height="40" fill="#D91023" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#D91023" />
    </>
  ),
  CHL: (
    <>
      <rect width="60" height="20" fill="#fff" />
      <rect y="20" width="60" height="20" fill="#D52B1E" />
      <rect width="20" height="20" fill="#0039A6" />
      <Star cx={10} cy={10} r={5} />
    </>
  ),
  ARG: (
    <>
      <rect width="60" height="40" fill="#74ACDF" />
      <rect y="13.33" width="60" height="13.34" fill="#fff" />
      <Sun cx={30} cy={20} r={3.2} />
    </>
  ),
  URY: (
    <>
      <rect width="60" height="40" fill="#fff" />
      {[1, 3, 5, 7].map((i) => (
        <rect key={i} y={i * 4.44} width="60" height="4.44" fill="#0038A8" />
      ))}
      <rect width="24" height="22.2" fill="#fff" />
      <Sun cx={12} cy={11.1} r={3.4} fill="#FCD116" />
    </>
  ),
  BRA: (
    <>
      <rect width="60" height="40" fill="#009C3B" />
      <polygon points="30,5 55,20 30,35 5,20" fill="#FFDF00" />
      <circle cx="30" cy="20" r="8.5" fill="#002776" />
      <path d="M22 18.5 Q30 15.5 38 21.5" stroke="#fff" strokeWidth="1.4" fill="none" />
    </>
  ),
  CRI: (
    <>
      <rect width="60" height="40" fill="#002B7F" />
      <rect y="6.67" width="60" height="26.66" fill="#fff" />
      <rect y="13.33" width="60" height="13.34" fill="#CE1126" />
    </>
  ),
  PAN: (
    <>
      <rect width="60" height="40" fill="#fff" />
      <rect x="30" width="30" height="20" fill="#D21034" />
      <rect y="20" width="30" height="20" fill="#005293" />
      <Star cx={15} cy={10} r={4.5} fill="#005293" />
      <Star cx={45} cy={30} r={4.5} fill="#D21034" />
    </>
  ),
};
