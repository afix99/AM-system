interface Props {
  size?: number;
  className?: string;
}

export function ClaudeSparkle({ size = 40, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center claude-sparkle-glow ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="claude-sparkle-spin">
        <defs>
          <radialGradient id="claudeCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F4A982" />
            <stop offset="55%" stopColor="#D97756" />
            <stop offset="100%" stopColor="#C86645" />
          </radialGradient>
        </defs>
        <g className="claude-sparkle-pulse">
          <path
            d="M50 4 C 52 36, 54 38, 96 50 C 54 62, 52 64, 50 96 C 48 64, 46 62, 4 50 C 46 38, 48 36, 50 4 Z"
            fill="url(#claudeCore)"
          />
          <path
            d="M50 18 C 51 42, 52 43, 82 50 C 52 57, 51 58, 50 82 C 49 58, 48 57, 18 50 C 48 43, 49 42, 50 18 Z"
            fill="#FFE4D2"
            opacity="0.85"
          />
        </g>
      </svg>
    </span>
  );
}
