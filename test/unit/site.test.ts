import { afterEach, describe, expect, it } from "vitest";
import { clips } from "@/content/clips.generated";
import { parseColor } from "@/lib/contrast";
import { agentPlaque } from "@/lib/plaque";
import { isReview, stage } from "@/lib/stage";
import { OG_SIZE, makeAgentOg, makeHomeOg, makePropertyOg, ogPlaqueLine, posterDataUrl, readFont } from "@/site/og";
import { makeAgentRoute, makeHomeRoute, makePropertyRoute } from "@/site/page";
import { agentParams, propertyParams, routeTitle } from "@/site/routes";

describe("site/routes + site/og fallbacks", () => {
  it("routeTitle names agent and property routes and is undefined for home and unknown slugs; OG lines fall back to the home line", () => {
    expect(routeTitle({ kind: "home" })).toBeUndefined();
    expect(routeTitle({ kind: "agent", slug: "jessica" })).toBe("For Jessica Tran");
    expect(routeTitle({ kind: "agent", slug: "nobody" })).toBeUndefined();
    expect(routeTitle({ kind: "property", slug: "ocean-ave" })).toBe("1234 Ocean Ave");
    expect(routeTitle({ kind: "property", slug: "nowhere" })).toBeUndefined();

    const home = ogPlaqueLine({ kind: "home" });
    expect(ogPlaqueLine({ kind: "agent", slug: "nobody" })).toEqual(home);
    expect(ogPlaqueLine({ kind: "property", slug: "nowhere" })).toEqual(home);
    expect(home.clipId).toBe("needle-above-clouds");
  });

  it("readFont rejects with a named error when a file is missing and returns bytes otherwise; posterDataUrl inlines the poster; OG factories bind the static params", async () => {
    await expect(readFont("nope.ttf")).rejects.toThrow(/OG image font missing: .*fonts\/files\/nope\.ttf/);
    for (const f of ["InstrumentSerif-Regular.ttf", "Satoshi-Medium.ttf", "Manrope-Medium.ttf"]) {
      const buf = await readFont(f);
      expect(buf).toBeInstanceOf(ArrayBuffer);
      expect(buf.byteLength).toBeGreaterThan(1000);
    }
    const url = await posterDataUrl(clips["sailboat-sunset"].files.poster_1920);
    expect(url.startsWith("data:image/jpeg;base64,")).toBe(true);
    expect(url.length).toBeGreaterThan(1000);
    await expect(posterDataUrl("/clips/missing.jpg")).rejects.toThrow();

    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
    expect(makeAgentOg("dark").generateStaticParams).toBe(agentParams);
    expect(makePropertyOg("hobbs").generateStaticParams).toBe(propertyParams);
    expect(typeof makeHomeOg("light").Image).toBe("function");
  });

  it("route factories: known slugs get noindex metadata and a CallingCard, unknown slugs get empty metadata and a 404; home carries the brand", async () => {
    const agent = makeAgentRoute("twilight");
    expect(agent.generateStaticParams).toBe(agentParams);
    expect(await agent.generateMetadata({ params: Promise.resolve({ agent: "jessica" }) })).toMatchObject({
      title: "For Jessica Tran",
      robots: { index: false, follow: false },
    });
    expect(await agent.generateMetadata({ params: Promise.resolve({ agent: "nobody" }) })).toEqual({});
    await expect(agent.Page({ params: Promise.resolve({ agent: "nobody" }) })).rejects.toThrow(/NOT_FOUND|404/);
    const card = (await agent.Page({ params: Promise.resolve({ agent: "jessica" }) })) as { props: { theme: string; agent: { slug: string } } };
    expect(card.props.theme).toBe("twilight");
    expect(card.props.agent.slug).toBe("jessica");

    const property = makePropertyRoute("light");
    expect(property.generateStaticParams).toBe(propertyParams);
    expect(await property.generateMetadata({ params: Promise.resolve({ slug: "ocean-ave" }) })).toMatchObject({
      title: "1234 Ocean Ave",
      robots: { index: false, follow: false },
    });
    expect(await property.generateMetadata({ params: Promise.resolve({ slug: "nowhere" }) })).toEqual({});
    await expect(property.Page({ params: Promise.resolve({ slug: "nowhere" }) })).rejects.toThrow(/NOT_FOUND|404/);
    const pcard = (await property.Page({ params: Promise.resolve({ slug: "ocean-ave" }) })) as { props: { property: { slug: string }; agent?: { slug: string } } };
    expect(pcard.props.property.slug).toBe("ocean-ave");
    expect(pcard.props.agent?.slug).toBe("jessica");

    const home = makeHomeRoute("hobbs");
    expect(home.metadata.title).toEqual({ absolute: "Hobbs Media Co." });
    expect((home.Page() as { props: { theme: string } }).props.theme).toBe("hobbs");
  });
});

describe("small helpers", () => {
  const original = process.env.SITE_STAGE;
  afterEach(() => {
    if (original === undefined) delete process.env.SITE_STAGE;
    else process.env.SITE_STAGE = original;
  });

  it("stage() is review unless SITE_STAGE is exactly live; parseColor rejects junk; agentPlaque without a brokerage leaves line two empty", () => {
    delete process.env.SITE_STAGE;
    expect(stage()).toBe("review");
    expect(isReview()).toBe(true);
    process.env.SITE_STAGE = "Live";
    expect(stage()).toBe("review");
    process.env.SITE_STAGE = "live";
    expect(stage()).toBe("live");
    expect(isReview()).toBe(false);

    expect(() => parseColor("papayawhip")).toThrow(/unparsable color: papayawhip/);
    expect(() => parseColor("#fff")).toThrow(/unparsable/);
    expect(parseColor("rgba(1, 2, 3, 0.5)")).toEqual([1, 2, 3]);

    const p = agentPlaque({ slug: "solo", displayName: "Sam Solo" }, "sam@example.com");
    expect(p[0].text).toBe("PREPARED FOR SAM SOLO");
    expect(p[1]).toEqual({ text: "" });
    expect(p[2].href).toBe("mailto:sam@example.com");
  });
});
