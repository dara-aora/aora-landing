type Props = {
  size?: number;
  className?: string;
  label?: string;
};

export function LiveDot({ size = 8, className = "", label }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      role={label ? undefined : "presentation"}
      aria-label={label}
    >
      <span
        className="live-dot inline-block rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: "var(--green)",
          boxShadow: "0 0 12px 0 var(--green)",
        }}
      />
      {label ? (
        <span className="small-caps" style={{ color: "var(--paper)" }}>
          {label}
        </span>
      ) : null}
    </span>
  );
}
