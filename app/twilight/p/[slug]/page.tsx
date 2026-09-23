import { makePropertyRoute } from "@/site/page";

const route = makePropertyRoute("twilight");

export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
