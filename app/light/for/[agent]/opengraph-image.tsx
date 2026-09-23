import { makeAgentOg, OG_SIZE } from "@/site/og";

const og = makeAgentOg("light");

export const dynamic = "force-static";
export const dynamicParams = false;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Hobbs Media Co.";
export const generateStaticParams = og.generateStaticParams;
export default og.Image;
