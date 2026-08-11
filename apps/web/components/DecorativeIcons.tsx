
"use client";

export default function DecorativeIcons() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center select-none"
    >
      <span
        className="font-mono font-bold text-white leading-none"
        style={{
          fontSize: "clamp(28rem, 60vw, 48rem)",
          opacity: 0.035,
          letterSpacing: "-0.05em",
        }}
      >
        {"</>"}
      </span>
    </div>
  );
}