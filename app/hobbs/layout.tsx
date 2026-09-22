import { ThemeShell } from "@/components/ThemeShell";
import { fontClassName } from "@/fonts/hobbs";

export default function HobbsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeShell theme="hobbs" fontClassName={fontClassName}>
      {children}
    </ThemeShell>
  );
}
