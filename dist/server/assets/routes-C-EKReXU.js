import { a as saveThreads, i as newThreadId, n as loadThreads } from "./threads-CMz_wR2n.js";
import { useEffect } from "react";
import { jsx } from "react/jsx-runtime";
//#region src/routes/index.tsx?tsr-split=component
function HomeRedirect() {
	useEffect(() => {
		const threads = loadThreads();
		const fresh = threads.find((t) => t.messages.length === 0);
		let targetId;
		if (fresh) targetId = fresh.id;
		else {
			targetId = newThreadId();
			saveThreads([{
				id: targetId,
				expert: null,
				title: "New session",
				updatedAt: Date.now(),
				messages: []
			}, ...threads]);
		}
		window.location.replace(`/chat/${targetId}`);
	}, []);
	return /* @__PURE__ */ jsx("div", {
		className: "flex h-screen items-center justify-center bg-background text-sm text-muted-foreground",
		children: "Loading…"
	});
}
//#endregion
export { HomeRedirect as component };
