import { describe, expect, it } from "vitest";
import { LIMITS, agentPlaque, checkAgentLimits, checkPlaqueLimits, checkPropertyLimits, homePlaqueLines, nameLine, propertyPlaque } from "@/lib/plaque";

const jessica = { slug: "jessica", displayName: "Jessica Tran", brokerage: "Windermere" };
const ocean = { slug: "ocean-ave", title: "1234 Ocean Ave", subtitle: "Aerial film", agent: "jessica" };

describe("plaque composition (17A)", () => {
  it("/for/: PREPARED FOR {NAME} / {BROKERAGE} / {PHONE} as tel:", () => {
    const p = agentPlaque(jessica, "(206) 555-0142", "+12065550142");
    expect(p[0].text).toBe("PREPARED FOR JESSICA TRAN");
    expect(p[1].text).toBe("WINDERMERE");
    expect(p[2]).toEqual({ text: "(206) 555-0142", tel: "tel:+12065550142" });
  });

  it("/p/: {TITLE} / PREPARED FOR {NAME} / {PHONE}", () => {
    const p = propertyPlaque(ocean, jessica, "(206) 555-0142", "+12065550142");
    expect(p[0].text).toBe("1234 OCEAN AVE");
    expect(p[1].text).toBe("PREPARED FOR JESSICA TRAN");
    expect(p[2].tel).toBe("tel:+12065550142");
  });

  it("/p/ without an agent leaves line two empty", () => {
    expect(propertyPlaque(ocean, undefined, "x", "+1")[1].text).toBe("");
  });

  it("home plaque lines pass through", () => {
    const p = homePlaqueLines(["A", "B", "C"]);
    expect(p.map((l) => l.text)).toEqual(["A", "B", "C"]);
    expect(p.every((l) => !l.tel)).toBe(true);
  });

  it("beat-two name line has no dangling dot", () => {
    expect(nameLine(jessica)).toBe("Jessica Tran · Windermere");
    expect(nameLine({ slug: "x", displayName: "Sam Solo" })).toBe("Sam Solo");
  });
});

describe("guard limits (17A)", () => {
  it("displayName ≤ 24, brokerage ≤ 20; violations name the string", () => {
    expect(checkAgentLimits(jessica)).toEqual([]);
    const long = { slug: "long", displayName: "Alexandria Montgomery-Whitfield", brokerage: "Coldwell Banker Bain Seattle" };
    const v = checkAgentLimits(long);
    expect(v).toHaveLength(2);
    expect(v[0]).toMatchObject({ what: "agents[long].displayName", limit: LIMITS.displayName, length: 31 });
    expect(v[1]).toMatchObject({ what: "agents[long].brokerage", limit: LIMITS.brokerage });
  });

  it("property title ≤ 28, address ≤ 40", () => {
    expect(checkPropertyLimits(ocean)).toEqual([]);
    const v = checkPropertyLimits({ ...ocean, title: "The Residences at Lakeshore Point", address: "12345 Northeast Lakeshore Boulevard, Kirkland WA" });
    expect(v.map((x) => x.what)).toEqual(["properties[ocean-ave].title", "properties[ocean-ave].address"]);
  });

  it("composed plaque line ≤ 32", () => {
    const ok = agentPlaque(jessica, "(206) 555-0142", "+1");
    expect(checkPlaqueLimits("x", ok)).toEqual([]);
    const over = agentPlaque({ slug: "a", displayName: "Christopher Montgomery", brokerage: "W" }, "(206) 555-0142", "+1");
    const v = checkPlaqueLimits("/for/a plaque", over);
    expect(v).toHaveLength(1);
    expect(v[0].what).toBe("/for/a plaque line 1");
    expect(v[0].value).toBe("PREPARED FOR CHRISTOPHER MONTGOMERY");
    expect(v[0].length).toBe(35);
  });

  it("the mandated home plaque fits: 32 is the ceiling", () => {
    expect("REAL ESTATE PHOTO·FILM·AERIAL".length).toBeLessThanOrEqual(LIMITS.plaqueLine);
    expect("REAL ESTATE PHOTO · FILM · AERIAL".length).toBe(33);
  });
});
