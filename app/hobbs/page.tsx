import { makeHomeRoute } from "@/site/page";

const route = makeHomeRoute("hobbs");

export const metadata = route.metadata;
export default route.Page;
