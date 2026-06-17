"use client";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export default function Logo({ size = 32, showWordmark = false, className = "" }: LogoProps) {
  const id = "ebLogo";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 1024 1024"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="35%" stopColor="#7c3aed" />
            <stop offset="70%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* Squircle background */}
        <rect width="1024" height="1024" rx="240" fill="#05070f" />
        {/* E mark — vertical spine + 3 beams */}
        <path
          d="M 320 232 L 428 232 L 428 792 L 320 792 Z
             M 320 232 L 692 232 L 670 319.36 L 320 336 Z
             M 320 462.08 L 610.16 462.08 L 591.46 545.95 L 320 561.92 Z
             M 320 688 L 670 704.64 L 692 792 L 320 792 Z"
          fill={`url(#${id})`}
        />
      </svg>

      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--font-display, system-ui)",
            fontWeight: 700,
            fontSize: size * 0.55,
            background: "var(--genesis-text, linear-gradient(100deg,#c084fc,#818cf8 38%,#38bdf8 72%,#22d3ee))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          EasyBuilda
        </span>
      )}
    </span>
  );
}