export const metadata = { title: "Admin — Simple Windows" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#080810", fontFamily: "var(--font-space-grotesk), sans-serif" }}>
      {children}
    </div>
  );
}
