import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "span" | "p" | "div";
  tone?: "mute" | "paper";
};

export function SmallCaps({
  children,
  className = "",
  as: Tag = "span",
  tone = "mute",
}: Props) {
  return (
    <Tag
      className={`small-caps ${className}`}
      style={{ color: tone === "paper" ? "var(--paper)" : "var(--mute)" }}
    >
      {children}
    </Tag>
  );
}
