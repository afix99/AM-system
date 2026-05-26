interface Props {
  size?: number;
  className?: string;
}

export function ClaudeSparkle({ size = 64, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center claude-sparkle-glow ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="claude-sparkle-spin">
        <defs>
          <radialGradient id="claudeCore" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#FFE4D2" />
            <stop offset="35%" stopColor="#F4A982" />
            <stop offset="75%" stopColor="#D97756" />
            <stop offset="100%" stopColor="#B85535" />
          </radialGradient>
          <radialGradient id="claudeHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D97756" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#D97756" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#claudeHalo)" className="claude-sparkle-pulse" />
        <g className="claude-sparkle-throb">
          {/* 4 main rays */}
          <path d="M50 2 C 53 38, 56 41, 98 50 C 56 59, 53 62, 50 98 C 47 62, 44 59, 2 50 C 44 41, 47 38, 50 2 Z"
                fill="url(#claudeCore)" />
          {/* 4 diagonal rays */}
          <path d="M50 2 C 53 38, 56 41, 98 50 C 56 59, 53 62, 50 98 C 47 62, 44 59, 2 50 C 44 41, 47 38, 50 2 Z"
                fill="url(#claudeCore)" opacity="0.85" transform="rotate(45 50 50)" />
          {/* inner highlight */}
          <circle cx="50" cy="50" r="9" fill="#FFF1E1" opacity="0.95" />
        </g>
      </svg>
    </span>
  );
}
