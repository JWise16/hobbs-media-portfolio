import { makeThemePage } from "@/site/page";

const route = makeThemePage("dark");

export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
