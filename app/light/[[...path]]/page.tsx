import { makeThemePage } from "@/site/page";

const route = makeThemePage("light");

export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
