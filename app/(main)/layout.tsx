import { AppWrapper } from "@/components/AppWrapper";
import { SparkleBackground } from "@/components/SparkleBackground";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SparkleBackground />
      <AppWrapper>{children}</AppWrapper>
    </>
  );
}
