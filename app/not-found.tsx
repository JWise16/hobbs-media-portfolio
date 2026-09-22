import { NotFound } from "@/components/NotFound";
import { ThemeShell } from "@/components/ThemeShell";
import { fontClassName } from "@/fonts/dark";

/** Unknown top-level paths (no theme segment) fall back to the dark theme's 404. */
export default function RootNotFound() {
  return (
    <ThemeShell theme="dark" fontClassName={fontClassName}>
      <NotFound theme="dark" />
    </ThemeShell>
  );
}
