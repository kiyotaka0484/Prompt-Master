import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/routes/chat.$threadId.tsx
var $$splitComponentImporter = () => import("./chat._threadId-BL2UreuP.js");
var Route = createFileRoute("/chat/$threadId")({
	head: () => ({ meta: [{ title: "Session — Prompt Master" }, {
		name: "description",
		content: "Your Prompt Master interview session."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
