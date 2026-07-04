import { t as Route$3 } from "./chat._threadId-DIOUcjj2.js";
import { a as detectExpert, i as buildPlannerContext, r as TRIAGE_PROMPT, t as EXPERTS } from "./experts-BmytS0qP.js";
import { useEffect } from "react";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
//#region src/styles.css?url
var styles_default = "/assets/styles-DCEcXCkE.css";
//#endregion
//#region src/routes/__root.tsx
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6",
					children: /* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	useEffect(() => {
		console.error("Root error boundary caught:", error);
	}, [error]);
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ jsx("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$2 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Prompt Master" },
			{
				name: "description",
				content: "Prompt Master is an AI web app that guides users to craft effective prompts for AI tools."
			},
			{
				name: "author",
				content: "Prompt Master"
			},
			{
				property: "og:title",
				content: "Prompt Master"
			},
			{
				property: "og:description",
				content: "Prompt Master is an AI web app that guides users to craft effective prompts for AI tools."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary"
			},
			{
				name: "twitter:title",
				content: "Prompt Master"
			},
			{
				name: "twitter:description",
				content: "Prompt Master is an AI web app that guides users to craft effective prompts for AI tools."
			}
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "en",
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [children, /* @__PURE__ */ jsx(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$2.useRouteContext();
	return /* @__PURE__ */ jsx(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ jsx(Outlet, {})
	});
}
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter = () => import("./routes-C-EKReXU.js");
var Route$1 = createFileRoute("/")({
	head: () => ({ meta: [{ title: "Prompt Master — Interview Mode" }, {
		name: "description",
		content: "Prompt Master interviews you, then writes the perfect prompt for ChatGPT, Gemini, or Claude."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component"),
	loader: () => null
});
//#endregion
//#region src/lib/ai-provider.ts
function createAIProviderError(code, message, cause) {
	return {
		code,
		message,
		cause
	};
}
function isAIProviderError(error) {
	return typeof error === "object" && error !== null && "code" in error && "message" in error;
}
function getProviderErrorMessage(error) {
	switch (error.code) {
		case "missing_api_key": return "AI service is not configured. Please add a Google AI API key to your environment.";
		case "rate_limit": return "Rate limit hit — please wait a moment and try again.";
		case "network_error": return "Network error — please check your connection and try again.";
		case "invalid_response": return "Received an invalid response from the AI service. Please try again.";
		default: return "Something went wrong generating a response. Please try again.";
	}
}
var cachedModel = null;
function getModel(config) {
	const modelId = config?.model ?? "gemini-2.5-flash";
	const apiKey = config?.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
	if (!apiKey) throw createAIProviderError("missing_api_key", "GOOGLE_GENERATIVE_AI_API_KEY is not configured");
	if (cachedModel && !config) return cachedModel;
	const model = createGoogleGenerativeAI({ apiKey })(modelId);
	if (!config) cachedModel = model;
	return model;
}
function validateApiKey() {
	if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return {
		valid: false,
		error: createAIProviderError("missing_api_key", "GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables")
	};
	return { valid: true };
}
//#endregion
//#region src/routes/api/chat.ts
var SLOT_TAG_RE = /<!--\s*slot\s*:\s*([a-z0-9_]+)\s*-->/i;
var Route = createFileRoute("/api/chat")({ server: { handlers: { POST: async ({ request }) => {
	const { messages, expert } = await request.json();
	if (!Array.isArray(messages)) return new Response("Messages are required", { status: 400 });
	const uiMessages = messages;
	const goalIndex = expert ? uiMessages.findIndex((m) => m.role === "user" && detectExpert(messageTextFromUi(m))) : -1;
	const modelMessages = goalIndex >= 0 ? uiMessages.slice(goalIndex) : uiMessages;
	let systemPrompt = expert && EXPERTS[expert] ? EXPERTS[expert].systemPrompt : TRIAGE_PROMPT;
	if (expert && EXPERTS[expert] && goalIndex >= 0) {
		const goalText = messageTextFromUi(uiMessages[goalIndex]).trim();
		const filled = {};
		for (let i = 0; i < uiMessages.length - 1; i++) {
			const m = uiMessages[i];
			if (m.role !== "assistant") continue;
			const tag = SLOT_TAG_RE.exec(messageTextFromUi(m));
			if (!tag) continue;
			const next = uiMessages[i + 1];
			if (next && next.role === "user") filled[tag[1].toLowerCase()] = messageTextFromUi(next);
		}
		systemPrompt += buildPlannerContext(EXPERTS[expert], goalText, filled);
	}
	const keyValidation = validateApiKey();
	if (!keyValidation.valid && keyValidation.error) return new Response(getProviderErrorMessage(keyValidation.error), { status: 500 });
	try {
		return streamText({
			model: getModel(),
			system: systemPrompt,
			messages: await convertToModelMessages(modelMessages)
		}).toUIMessageStreamResponse({ originalMessages: messages });
	} catch (err) {
		if (isAIProviderError(err)) return new Response(getProviderErrorMessage(err), { status: 500 });
		const status = err && typeof err === "object" && "statusCode" in err ? err.statusCode : 500;
		let message;
		if (status === 429) message = "Rate limit hit — please wait a moment and try again.";
		else if (status === 401 || status === 403) message = "API authentication failed. Please check your API key configuration.";
		else if (status === 502 || status === 503 || status === 504) message = "The AI service is temporarily unavailable. Please try again in a moment.";
		else if (err instanceof TypeError) message = "Network error — please check your connection and try again.";
		else message = "Something went wrong generating a response.";
		return new Response(message, { status });
	}
} } } });
function messageTextFromUi(message) {
	return message.parts.map((part) => part.type === "text" ? part.text : "").join("");
}
//#endregion
//#region src/routes/-routeTree.gen.ts
var IndexRoute = Route$1.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$2
});
var ChatThreadIdRoute = Route$3.update({
	id: "/chat/$threadId",
	path: "/chat/$threadId",
	getParentRoute: () => Route$2
});
var rootRouteChildren = {
	IndexRoute,
	ApiChatRoute: Route.update({
		id: "/api/chat",
		path: "/api/chat",
		getParentRoute: () => Route$2
	}),
	ChatThreadIdRoute
};
var routeTree = Route$2._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
