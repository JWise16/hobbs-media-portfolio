import { ThemeShell } from "@/components/ThemeShell";
import { fontClassName } from "@/fonts/light";

export default function LightLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeShell theme="light" fontClassName={fontClassName}>
      {children}
    </ThemeShell>
  );
}
