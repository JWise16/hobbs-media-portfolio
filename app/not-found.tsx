import { NotFound } from "@/components/NotFound";

/**
 * Unknown top-level paths (no theme segment). This file sits in the root
 * layout's module graph for every page, so it must not import a theme font
 * module (a `hobbs` page would otherwise preload Satoshi). It renders the
 * dark tokens with the fallback faces.
 */
export default function RootNotFound() {
  return (
    <div data-theme="dark" className="theme-shell">
      <NotFound theme="dark" />
    </div>
  );
}
