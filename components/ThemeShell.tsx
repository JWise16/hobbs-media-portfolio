import { launchTheme } from "@/content/config";
import type { ThemeId } from "@/content/themes";

/**
 * Wraps every route of a theme. Sets `data-theme` (the token scope in
 * styles/tokens.css) and the theme's two font variables. The layout that
 * renders this is the only module that imports that theme's font module.
 *
 * `data-pair` turns on the prefers-color-scheme pairing (16A): once a theme
 * is chosen, `dark` follows a light-mode OS to the `light` tokens and vice
 * versa. During review the four links must show exactly their own theme, so
 * the pairing stays off until `launchTheme` is set.
 */
export function ThemeShell({ theme, fontClassName, children }: { theme: ThemeId; fontClassName: string; children: React.ReactNode }) {
  const pair = launchTheme !== null && (theme === "dark" || theme === "light");
  return (
    <div data-theme={theme} data-pair={pair ? "1" : undefined} className={`${fontClassName} theme-shell`.trim()}>
      {children}
    </div>
  );
}
