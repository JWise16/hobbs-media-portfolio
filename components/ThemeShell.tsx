import type { ThemeId } from "@/content/themes";

/**
 * Wraps every route of a theme. Sets `data-theme` (the token scope in
 * styles/tokens.css) and the theme's two font variables. The layout that
 * renders this is the only module that imports that theme's font module.
 */
export function ThemeShell({ theme, fontClassName, children }: { theme: ThemeId; fontClassName: string; children: React.ReactNode }) {
  return (
    <div data-theme={theme} className={`${fontClassName} theme-shell`}>
      {children}
    </div>
  );
}
