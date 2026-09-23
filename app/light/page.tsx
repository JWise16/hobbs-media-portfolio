import { makeHomeRoute } from "@/site/page";

const route = makeHomeRoute("light");

export const metadata = route.metadata;
export default route.Page;
