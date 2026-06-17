"use client";

interface Props {
  children: React.ReactNode;
}

export function AppWrapper({ children }: Props) {
  return (
    <div style={{ minHeight: "100dvh", background: "#080810" }}>
      {children}
    </div>
  );
}
