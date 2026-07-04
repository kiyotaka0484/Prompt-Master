import { a as detectExpert } from "./experts-BmytS0qP.js";
//#region src/lib/threads.ts
var KEY = "prompt-master.threads.v1";
function isBrowser() {
	return typeof window !== "undefined";
}
function loadThreads() {
	if (!isBrowser()) return [];
	try {
		const raw = window.localStorage.getItem(KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.map(normalizeThreadRecord);
	} catch {
		return [];
	}
}
function normalizeThreadRecord(thread) {
	const goalIndex = thread.messages.findIndex((m) => m.role === "user" && detectExpert(messageText(m)));
	if (goalIndex === -1) return {
		...thread,
		expert: null,
		title: "New session",
		messages: []
	};
	const messages = thread.messages.slice(goalIndex);
	const expert = thread.expert ?? detectExpert(messageText(messages[0]));
	return {
		...thread,
		expert,
		messages,
		title: deriveTitle(messages)
	};
}
function saveThreads(threads) {
	if (!isBrowser()) return;
	try {
		window.localStorage.setItem(KEY, JSON.stringify(threads));
	} catch {}
}
function newThreadId() {
	if (isBrowser() && "crypto" in window && "randomUUID" in window.crypto) return window.crypto.randomUUID();
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function messageText(m) {
	return m.parts.map((p) => p.type === "text" ? p.text : "").join("");
}
function deriveTitle(messages) {
	const firstUser = messages.find((m) => m.role === "user" && detectExpert(messageText(m)));
	if (!firstUser) return "New session";
	const text = messageText(firstUser).trim();
	if (!text) return "New session";
	return text.length > 48 ? text.slice(0, 48) + "…" : text;
}
//#endregion
export { saveThreads as a, newThreadId as i, loadThreads as n, messageText as r, deriveTitle as t };
