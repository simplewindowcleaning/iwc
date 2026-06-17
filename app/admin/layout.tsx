export const metadata = { title: "Admin — Ladderless Windows" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#080810", fontFamily: "var(--font-grotesk, sans-serif)" }}>
      {children}
    </div>
  );
}
