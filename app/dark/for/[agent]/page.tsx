import { makeAgentRoute } from "@/site/page";

const route = makeAgentRoute("dark");

export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
