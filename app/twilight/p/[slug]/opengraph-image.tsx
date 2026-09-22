import { makePropertyOg, OG_SIZE } from "@/site/og";

const og = makePropertyOg("twilight");

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Hobbs Media Co.";
export const generateStaticParams = og.generateStaticParams;
export default og.Image;
