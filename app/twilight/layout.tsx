import { ThemeShell } from "@/components/ThemeShell";
import { fontClassName } from "@/fonts/twilight";

export default function TwilightLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeShell theme="twilight" fontClassName={fontClassName}>
      {children}
    </ThemeShell>
  );
}
