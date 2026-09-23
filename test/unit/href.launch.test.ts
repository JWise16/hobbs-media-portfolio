import { describe, expect, it, vi } from "vitest";

vi.mock("@/content/config", () => ({ launchTheme: "dark", siteUrl: () => "http://localhost:3000" }));

import { agentHref, homeHref, href, propertyHref, workHref } from "@/lib/href";

describe("href() once launchTheme is set", () => {
  it("drops the segment for the launch theme, keeps it for the others, and normalizes a missing leading slash", () => {
    expect(href("dark")).toBe("/");
    expect(href("dark", "for/jessica")).toBe("/for/jessica");
    expect(homeHref("dark")).toBe("/");
    expect(workHref("dark")).toBe("/#work");
    expect(agentHref("dark", "jessica")).toBe("/for/jessica");
    expect(propertyHref("dark", "ocean-ave")).toBe("/p/ocean-ave");

    expect(href("light", "for/jessica")).toBe("/light/for/jessica");
    expect(homeHref("hobbs")).toBe("/hobbs");
    expect(workHref("twilight")).toBe("/twilight#work");
  });
});
