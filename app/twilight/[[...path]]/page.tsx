import { makeThemePage } from "@/site/page";

const route = makeThemePage("twilight");

export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
