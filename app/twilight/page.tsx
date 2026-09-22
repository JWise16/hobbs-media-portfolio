import { makeHomeRoute } from "@/site/page";

const route = makeHomeRoute("twilight");

export const metadata = route.metadata;
export default route.Page;
