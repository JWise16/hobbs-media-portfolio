import { ThemeShell } from "@/components/ThemeShell";
import { fontClassName } from "@/fonts/dark";

export default function DarkLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeShell theme="dark" fontClassName={fontClassName}>
      {children}
    </ThemeShell>
  );
}
