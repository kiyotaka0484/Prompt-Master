import { t as Route } from "./chat._threadId-DIOUcjj2.js";
import { a as detectExpert, n as EXPERT_LIST, t as EXPERTS } from "./experts-BmytS0qP.js";
import { a as saveThreads, i as newThreadId, n as loadThreads, r as messageText, t as deriveTitle } from "./threads-CMz_wR2n.js";
import * as React from "react";
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { DefaultChatTransport } from "ai";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { Bone, Check, Circle, Copy, CornerDownLeft, Info, Loader, Menu, Plus, RefreshCw, Sparkles, Square, Target, Trash2, X } from "lucide-react";
import { Streamdown } from "streamdown";
import { nanoid } from "nanoid";
import { motion } from "motion/react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
//#region src/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region src/components/ui/button.tsx
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9",
			"icon-sm": "h-8 w-8"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
createContext(null);
var streamdownPlugins = {
	cjk,
	code,
	math,
	mermaid
};
var MessageResponse = memo(({ className, ...props }) => /* @__PURE__ */ jsx(Streamdown, {
	className: cn("size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className),
	plugins: streamdownPlugins,
	...props
}), (prevProps, nextProps) => prevProps.children === nextProps.children && nextProps.isAnimating === prevProps.isAnimating);
MessageResponse.displayName = "MessageResponse";
//#endregion
//#region src/components/ui/textarea.tsx
var Textarea = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
//#endregion
//#region src/components/ui/input-group.tsx
function InputGroup({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "input-group",
		role: "group",
		className: cn("group/input-group border-input dark:bg-input/30 shadow-xs relative flex w-full items-center rounded-md border outline-none transition-[color,box-shadow]", "h-9 has-[>textarea]:h-auto", "has-[>[data-align=inline-start]]:[&>input]:pl-2", "has-[>[data-align=inline-end]]:[&>input]:pr-2", "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3", "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3", "has-[[data-slot=input-group-control]:focus-visible]:ring-ring has-[[data-slot=input-group-control]:focus-visible]:ring-1", "has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40", className),
		...props
	});
}
var inputGroupAddonVariants = cva("text-muted-foreground flex h-auto cursor-text select-none items-center justify-center gap-2 py-1.5 text-sm font-medium group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4", {
	variants: { align: {
		"inline-start": "order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",
		"inline-end": "order-last pr-3 has-[>button]:mr-[-0.4rem] has-[>kbd]:mr-[-0.35rem]",
		"block-start": "[.border-b]:pb-3 order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5",
		"block-end": "[.border-t]:pt-3 order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5"
	} },
	defaultVariants: { align: "inline-start" }
});
function InputGroupAddon({ className, align = "inline-start", ...props }) {
	return /* @__PURE__ */ jsx("div", {
		role: "group",
		"data-slot": "input-group-addon",
		"data-align": align,
		className: cn(inputGroupAddonVariants({ align }), className),
		onClick: (e) => {
			if (e.target.closest("button")) return;
			e.currentTarget.parentElement?.querySelector("input")?.focus();
		},
		...props
	});
}
var inputGroupButtonVariants = cva("flex items-center gap-2 text-sm shadow-none", {
	variants: { size: {
		xs: "h-6 gap-1 rounded-[calc(var(--radius)-5px)] px-2 has-[>svg]:px-2 [&>svg:not([class*='size-'])]:size-3.5",
		sm: "h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5",
		"icon-xs": "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",
		"icon-sm": "size-8 p-0 has-[>svg]:p-0"
	} },
	defaultVariants: { size: "xs" }
});
function InputGroupButton({ className, type = "button", variant = "ghost", size = "xs", ...props }) {
	return /* @__PURE__ */ jsx(Button, {
		type,
		"data-size": size,
		variant,
		className: cn(inputGroupButtonVariants({ size }), className),
		...props
	});
}
function InputGroupTextarea({ className, ...props }) {
	return /* @__PURE__ */ jsx(Textarea, {
		"data-slot": "input-group-control",
		className: cn("flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent", className),
		...props
	});
}
//#endregion
//#region src/components/ui/spinner.tsx
function Spinner({ className, ...props }) {
	return /* @__PURE__ */ jsx(Loader, {
		role: "status",
		"aria-label": "Loading",
		className: cn("size-4 animate-spin", className),
		...props
	});
}
//#endregion
//#region src/components/ai-elements/prompt-input.tsx
var convertBlobUrlToDataUrl = async (url) => {
	try {
		const blob = await (await fetch(url)).blob();
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.onerror = () => resolve(null);
			reader.readAsDataURL(blob);
		});
	} catch {
		return null;
	}
};
var PromptInputController = createContext(null);
var ProviderAttachmentsContext = createContext(null);
var useOptionalPromptInputController = () => useContext(PromptInputController);
var useOptionalProviderAttachments = () => useContext(ProviderAttachmentsContext);
var LocalAttachmentsContext = createContext(null);
var usePromptInputAttachments = () => {
	const provider = useOptionalProviderAttachments();
	const context = useContext(LocalAttachmentsContext) ?? provider;
	if (!context) throw new Error("usePromptInputAttachments must be used within a PromptInput or PromptInputProvider");
	return context;
};
var LocalReferencedSourcesContext = createContext(null);
var PromptInput = ({ className, accept, multiple, globalDrop, syncHiddenInput, maxFiles, maxFileSize, onError, onSubmit, children, ...props }) => {
	const controller = useOptionalPromptInputController();
	const usingProvider = !!controller;
	const inputRef = useRef(null);
	const formRef = useRef(null);
	const [items, setItems] = useState([]);
	const files = usingProvider ? controller.attachments.files : items;
	const [referencedSources, setReferencedSources] = useState([]);
	const filesRef = useRef(files);
	useEffect(() => {
		filesRef.current = files;
	}, [files]);
	const openFileDialogLocal = useCallback(() => {
		inputRef.current?.click();
	}, []);
	const matchesAccept = useCallback((f) => {
		if (!accept || accept.trim() === "") return true;
		return accept.split(",").map((s) => s.trim()).filter(Boolean).some((pattern) => {
			if (pattern.endsWith("/*")) {
				const prefix = pattern.slice(0, -1);
				return f.type.startsWith(prefix);
			}
			return f.type === pattern;
		});
	}, [accept]);
	const addLocal = useCallback((fileList) => {
		const incoming = [...fileList];
		const accepted = incoming.filter((f) => matchesAccept(f));
		if (incoming.length && accepted.length === 0) {
			onError?.({
				code: "accept",
				message: "No files match the accepted types."
			});
			return;
		}
		const withinSize = (f) => maxFileSize ? f.size <= maxFileSize : true;
		const sized = accepted.filter(withinSize);
		if (accepted.length > 0 && sized.length === 0) {
			onError?.({
				code: "max_file_size",
				message: "All files exceed the maximum size."
			});
			return;
		}
		setItems((prev) => {
			const capacity = typeof maxFiles === "number" ? Math.max(0, maxFiles - prev.length) : void 0;
			const capped = typeof capacity === "number" ? sized.slice(0, capacity) : sized;
			if (typeof capacity === "number" && sized.length > capacity) onError?.({
				code: "max_files",
				message: "Too many files. Some were not added."
			});
			const next = [];
			for (const file of capped) next.push({
				filename: file.name,
				id: nanoid(),
				mediaType: file.type,
				type: "file",
				url: URL.createObjectURL(file)
			});
			return [...prev, ...next];
		});
	}, [
		matchesAccept,
		maxFiles,
		maxFileSize,
		onError
	]);
	const removeLocal = useCallback((id) => setItems((prev) => {
		const found = prev.find((file) => file.id === id);
		if (found?.url) URL.revokeObjectURL(found.url);
		return prev.filter((file) => file.id !== id);
	}), []);
	const addWithProviderValidation = useCallback((fileList) => {
		const incoming = [...fileList];
		const accepted = incoming.filter((f) => matchesAccept(f));
		if (incoming.length && accepted.length === 0) {
			onError?.({
				code: "accept",
				message: "No files match the accepted types."
			});
			return;
		}
		const withinSize = (f) => maxFileSize ? f.size <= maxFileSize : true;
		const sized = accepted.filter(withinSize);
		if (accepted.length > 0 && sized.length === 0) {
			onError?.({
				code: "max_file_size",
				message: "All files exceed the maximum size."
			});
			return;
		}
		const currentCount = files.length;
		const capacity = typeof maxFiles === "number" ? Math.max(0, maxFiles - currentCount) : void 0;
		const capped = typeof capacity === "number" ? sized.slice(0, capacity) : sized;
		if (typeof capacity === "number" && sized.length > capacity) onError?.({
			code: "max_files",
			message: "Too many files. Some were not added."
		});
		if (capped.length > 0) controller?.attachments.add(capped);
	}, [
		matchesAccept,
		maxFileSize,
		maxFiles,
		onError,
		files.length,
		controller
	]);
	const clearAttachments = useCallback(() => usingProvider ? controller?.attachments.clear() : setItems((prev) => {
		for (const file of prev) if (file.url) URL.revokeObjectURL(file.url);
		return [];
	}), [usingProvider, controller]);
	const clearReferencedSources = useCallback(() => setReferencedSources([]), []);
	const add = usingProvider ? addWithProviderValidation : addLocal;
	const remove = usingProvider ? controller.attachments.remove : removeLocal;
	const openFileDialog = usingProvider ? controller.attachments.openFileDialog : openFileDialogLocal;
	const clear = useCallback(() => {
		clearAttachments();
		clearReferencedSources();
	}, [clearAttachments, clearReferencedSources]);
	useEffect(() => {
		if (!usingProvider) return;
		controller.__registerFileInput(inputRef, () => inputRef.current?.click());
	}, [usingProvider, controller]);
	useEffect(() => {
		if (syncHiddenInput && inputRef.current && files.length === 0) inputRef.current.value = "";
	}, [files, syncHiddenInput]);
	useEffect(() => {
		const form = formRef.current;
		if (!form) return;
		if (globalDrop) return;
		const onDragOver = (e) => {
			if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
		};
		const onDrop = (e) => {
			if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
			if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) add(e.dataTransfer.files);
		};
		form.addEventListener("dragover", onDragOver);
		form.addEventListener("drop", onDrop);
		return () => {
			form.removeEventListener("dragover", onDragOver);
			form.removeEventListener("drop", onDrop);
		};
	}, [add, globalDrop]);
	useEffect(() => {
		if (!globalDrop) return;
		const onDragOver = (e) => {
			if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
		};
		const onDrop = (e) => {
			if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
			if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) add(e.dataTransfer.files);
		};
		document.addEventListener("dragover", onDragOver);
		document.addEventListener("drop", onDrop);
		return () => {
			document.removeEventListener("dragover", onDragOver);
			document.removeEventListener("drop", onDrop);
		};
	}, [add, globalDrop]);
	useEffect(() => () => {
		if (!usingProvider) {
			for (const f of filesRef.current) if (f.url) URL.revokeObjectURL(f.url);
		}
	}, [usingProvider]);
	const handleChange = useCallback((event) => {
		if (event.currentTarget.files) add(event.currentTarget.files);
		event.currentTarget.value = "";
	}, [add]);
	const attachmentsCtx = useMemo(() => ({
		add,
		clear: clearAttachments,
		fileInputRef: inputRef,
		files: files.map((item) => ({
			...item,
			id: item.id
		})),
		openFileDialog,
		remove
	}), [
		files,
		add,
		remove,
		clearAttachments,
		openFileDialog
	]);
	const refsCtx = useMemo(() => ({
		add: (incoming) => {
			const array = Array.isArray(incoming) ? incoming : [incoming];
			setReferencedSources((prev) => [...prev, ...array.map((s) => ({
				...s,
				id: nanoid()
			}))]);
		},
		clear: clearReferencedSources,
		remove: (id) => {
			setReferencedSources((prev) => prev.filter((s) => s.id !== id));
		},
		sources: referencedSources
	}), [referencedSources, clearReferencedSources]);
	const handleSubmit = useCallback(async (event) => {
		event.preventDefault();
		const form = event.currentTarget;
		const text = usingProvider ? controller.textInput.value : (() => {
			return new FormData(form).get("message") || "";
		})();
		if (!usingProvider) form.reset();
		try {
			const result = onSubmit({
				files: await Promise.all(files.map(async ({ id: _id, ...item }) => {
					if (item.url?.startsWith("blob:")) {
						const dataUrl = await convertBlobUrlToDataUrl(item.url);
						return {
							...item,
							url: dataUrl ?? item.url
						};
					}
					return item;
				})),
				text
			}, event);
			if (result instanceof Promise) try {
				await result;
				clear();
				if (usingProvider) controller.textInput.clear();
			} catch {}
			else {
				clear();
				if (usingProvider) controller.textInput.clear();
			}
		} catch {}
	}, [
		usingProvider,
		controller,
		files,
		onSubmit,
		clear
	]);
	const inner = /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("input", {
		accept,
		"aria-label": "Upload files",
		className: "hidden",
		multiple,
		onChange: handleChange,
		ref: inputRef,
		title: "Upload files",
		type: "file"
	}), /* @__PURE__ */ jsx("form", {
		className: cn("w-full", className),
		onSubmit: handleSubmit,
		ref: formRef,
		...props,
		children: /* @__PURE__ */ jsx(InputGroup, {
			className: "overflow-hidden",
			children
		})
	})] });
	const withReferencedSources = /* @__PURE__ */ jsx(LocalReferencedSourcesContext.Provider, {
		value: refsCtx,
		children: inner
	});
	return /* @__PURE__ */ jsx(LocalAttachmentsContext.Provider, {
		value: attachmentsCtx,
		children: withReferencedSources
	});
};
var PromptInputTextarea = ({ onChange, onKeyDown, className, placeholder = "What would you like to know?", ...props }) => {
	const controller = useOptionalPromptInputController();
	const attachments = usePromptInputAttachments();
	const [isComposing, setIsComposing] = useState(false);
	const handleKeyDown = useCallback((e) => {
		onKeyDown?.(e);
		if (e.defaultPrevented) return;
		if (e.key === "Enter") {
			if (isComposing || e.nativeEvent.isComposing) return;
			if (e.shiftKey) return;
			e.preventDefault();
			const { form } = e.currentTarget;
			if ((form?.querySelector("button[type=\"submit\"]"))?.disabled) return;
			form?.requestSubmit();
		}
		if (e.key === "Backspace" && e.currentTarget.value === "" && attachments.files.length > 0) {
			e.preventDefault();
			const lastAttachment = attachments.files.at(-1);
			if (lastAttachment) attachments.remove(lastAttachment.id);
		}
	}, [
		onKeyDown,
		isComposing,
		attachments
	]);
	const handlePaste = useCallback((event) => {
		const items = event.clipboardData?.items;
		if (!items) return;
		const files = [];
		for (const item of items) if (item.kind === "file") {
			const file = item.getAsFile();
			if (file) files.push(file);
		}
		if (files.length > 0) {
			event.preventDefault();
			attachments.add(files);
		}
	}, [attachments]);
	const handleCompositionEnd = useCallback(() => setIsComposing(false), []);
	const handleCompositionStart = useCallback(() => setIsComposing(true), []);
	const controlledProps = controller ? {
		onChange: (e) => {
			controller.textInput.setInput(e.currentTarget.value);
			onChange?.(e);
		},
		value: controller.textInput.value
	} : { onChange };
	return /* @__PURE__ */ jsx(InputGroupTextarea, {
		className: cn("field-sizing-content max-h-48 min-h-16", className),
		name: "message",
		onCompositionEnd: handleCompositionEnd,
		onCompositionStart: handleCompositionStart,
		onKeyDown: handleKeyDown,
		onPaste: handlePaste,
		placeholder,
		...props,
		...controlledProps
	});
};
var PromptInputFooter = ({ className, ...props }) => /* @__PURE__ */ jsx(InputGroupAddon, {
	align: "block-end",
	className: cn("justify-between gap-1", className),
	...props
});
var PromptInputSubmit = ({ className, variant = "default", size = "icon-sm", status, onStop, onClick, children, ...props }) => {
	const isGenerating = status === "submitted" || status === "streaming";
	let Icon = /* @__PURE__ */ jsx(CornerDownLeft, { className: "size-4" });
	if (status === "submitted") Icon = /* @__PURE__ */ jsx(Spinner, {});
	else if (status === "streaming") Icon = /* @__PURE__ */ jsx(Square, { className: "size-4" });
	else if (status === "error") Icon = /* @__PURE__ */ jsx(Bone, { className: "size-4" });
	const handleClick = useCallback((e) => {
		if (isGenerating && onStop) {
			e.preventDefault();
			onStop();
			return;
		}
		onClick?.(e);
	}, [
		isGenerating,
		onStop,
		onClick
	]);
	return /* @__PURE__ */ jsx(InputGroupButton, {
		"aria-label": isGenerating ? "Stop" : "Submit",
		className: cn(className),
		onClick: handleClick,
		size,
		type: isGenerating && onStop ? "button" : "submit",
		variant,
		...props,
		children: children ?? Icon
	});
};
//#endregion
//#region src/components/ai-elements/shimmer.tsx
var motionComponentCache = /* @__PURE__ */ new Map();
var getMotionComponent = (element) => {
	let component = motionComponentCache.get(element);
	if (!component) {
		component = motion.create(element);
		motionComponentCache.set(element, component);
	}
	return component;
};
var ShimmerComponent = ({ children, as: Component = "p", className, duration = 2, spread = 2 }) => {
	const MotionComponent = getMotionComponent(Component);
	const dynamicSpread = useMemo(() => (children?.length ?? 0) * spread, [children, spread]);
	return /* @__PURE__ */ jsx(MotionComponent, {
		animate: { backgroundPosition: "0% center" },
		className: cn("relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent", "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]", className),
		initial: { backgroundPosition: "100% center" },
		style: {
			"--spread": `${dynamicSpread}px`,
			backgroundImage: "var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))"
		},
		transition: {
			duration,
			ease: "linear",
			repeat: Number.POSITIVE_INFINITY
		},
		children
	});
};
var Shimmer = memo(ShimmerComponent);
//#endregion
//#region src/components/ui/tabs.tsx
var Tabs = TabsPrimitive.Root;
var TabsList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(TabsPrimitive.List, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = TabsPrimitive.List.displayName;
var TabsTrigger = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(TabsPrimitive.Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
var TabsContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(TabsPrimitive.Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = TabsPrimitive.Content.displayName;
//#endregion
//#region src/components/final-prompt-card.tsx
var MODELS = [
	{
		key: "chatgpt",
		label: "ChatGPT",
		emoji: "🟢",
		accent: "text-emerald-400",
		tint: "border-emerald-500/40"
	},
	{
		key: "claude",
		label: "Claude",
		emoji: "🟠",
		accent: "text-orange-400",
		tint: "border-orange-500/40"
	},
	{
		key: "gemini",
		label: "Gemini",
		emoji: "🔷",
		accent: "text-sky-400",
		tint: "border-sky-500/40"
	}
];
function FinalPromptCard({ prompts, onRegenerate, regenerating }) {
	const [copiedKey, setCopiedKey] = useState(null);
	const [tab, setTab] = useState("chatgpt");
	async function copy(key) {
		try {
			await navigator.clipboard.writeText(prompts[key]);
			setCopiedKey(key);
			setTimeout(() => setCopiedKey((k) => k === key ? null : k), 1800);
		} catch {}
	}
	MODELS.find((m) => m.key === tab);
	return /* @__PURE__ */ jsxs("div", {
		className: "my-3 overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-background to-background shadow-[0_0_40px_-15px_color-mix(in_oklch,var(--primary)_60%,transparent)]",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 px-4 py-2.5",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx("span", { className: "inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" }), /* @__PURE__ */ jsx("span", {
						className: "text-xs font-semibold uppercase tracking-wider text-primary",
						children: "Your Master Prompts · 3 models"
					})]
				}), onRegenerate && /* @__PURE__ */ jsxs(Button, {
					size: "sm",
					variant: "ghost",
					onClick: onRegenerate,
					disabled: regenerating,
					className: "h-8",
					children: [/* @__PURE__ */ jsx(RefreshCw, { className: "mr-1.5 h-3.5 w-3.5 " + (regenerating ? "animate-spin" : "") }), "Regenerate"]
				})]
			}),
			/* @__PURE__ */ jsxs(Tabs, {
				value: tab,
				onValueChange: (v) => setTab(v),
				children: [/* @__PURE__ */ jsx("div", {
					className: "border-b border-border/40 bg-card/40 px-3 pt-3",
					children: /* @__PURE__ */ jsx(TabsList, {
						className: "w-full justify-start gap-1 bg-transparent p-0",
						children: MODELS.map((m) => /* @__PURE__ */ jsxs(TabsTrigger, {
							value: m.key,
							className: "data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-md px-3 py-1.5 text-xs font-medium",
							children: [/* @__PURE__ */ jsx("span", {
								className: "mr-1.5",
								children: m.emoji
							}), m.label]
						}, m.key))
					})
				}), MODELS.map((m) => /* @__PURE__ */ jsxs(TabsContent, {
					value: m.key,
					className: "m-0",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between border-b border-border/40 bg-card/20 px-4 py-2 " + m.tint,
						children: [/* @__PURE__ */ jsxs("div", {
							className: "text-[11px] font-semibold uppercase tracking-wider " + m.accent,
							children: ["Optimized for ", m.label]
						}), /* @__PURE__ */ jsx(Button, {
							size: "sm",
							variant: copiedKey === m.key ? "secondary" : "default",
							onClick: () => copy(m.key),
							className: "h-8",
							children: copiedKey === m.key ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Check, { className: "mr-1.5 h-3.5 w-3.5" }), " Copied"] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
								/* @__PURE__ */ jsx(Copy, { className: "mr-1.5 h-3.5 w-3.5" }),
								" Copy for ",
								m.label
							] })
						})]
					}), /* @__PURE__ */ jsx("pre", {
						className: "max-h-[420px] overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground/90",
						children: prompts[m.key]
					})]
				}, m.key))]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-start gap-2 border-t border-border/40 bg-muted/20 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground",
				children: [/* @__PURE__ */ jsx(Info, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" }), /* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("div", {
						className: "mb-0.5 font-medium text-foreground/80",
						children: "Why are these prompts different?"
					}),
					"Each model thinks differently.",
					" ",
					/* @__PURE__ */ jsx("span", {
						className: "text-emerald-400",
						children: "ChatGPT"
					}),
					" responds best to explicit roles and structured formatting,",
					" ",
					/* @__PURE__ */ jsx("span", {
						className: "text-orange-400",
						children: "Claude"
					}),
					" shines with conversational context and thoughtful reasoning, and",
					" ",
					/* @__PURE__ */ jsx("span", {
						className: "text-sky-400",
						children: "Gemini"
					}),
					" is sharpest with direct, labeled task instructions. Same goal, three native styles."
				] })]
			})
		]
	});
}
//#endregion
//#region src/assets/prompt-master-logo.png
var prompt_master_logo_default = "/assets/prompt-master-logo-BON782nM.png";
//#endregion
//#region src/components/chat-window.tsx
var VAGUE_ANSWER_RE = /^(idk|i\s*don'?t\s*know|dunno|maybe|not\s*sure|nothing|anything|whatever|yes|no|yeah|nope|ok|okay|cool|fine|good|bad|fast|slow|a\s*lot|some|money|stuff|things?|👍|👌|🤷)\.?$/i;
function isSpecificAnswer(text) {
	const t = text.trim();
	if (t.length < 4) return false;
	if (VAGUE_ANSWER_RE.test(t)) return false;
	return t.split(/\s+/).length >= 2 || /\d/.test(t);
}
var SLOT_TAG_RE = /<!--\s*slot\s*:\s*([a-z0-9_]+)\s*-->/i;
var SLOT_TAG_GLOBAL_RE = /<!--\s*slot\s*:\s*[a-z0-9_]+\s*-->/gi;
var CERT_BLOCK_RE = /<!--\s*certificate\s*([\s\S]*?)-->/i;
function parseSlotTag(text) {
	const m = SLOT_TAG_RE.exec(text);
	return m ? m[1].toLowerCase() : null;
}
function stripSlotTag(text) {
	return text.replace(SLOT_TAG_GLOBAL_RE, "").trim();
}
function extractCertificate(text) {
	const m = CERT_BLOCK_RE.exec(text);
	if (!m) return null;
	const body = m[1];
	const num = (key) => {
		const r = new RegExp(`${key}\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)`, "i").exec(body);
		return r ? Number(r[1]) : null;
	};
	const clarity = num("clarity");
	const context = num("context");
	const constraints = num("constraints");
	const audience = num("audience");
	const output = num("output");
	const completeness = num("completeness");
	const overall = num("overall");
	if (clarity === null || context === null || constraints === null || audience === null || output === null || completeness === null || overall === null) return null;
	const revisions = num("revisions") ?? 1;
	const assumpRaw = /assumptions\s*:\s*(.+)/i.exec(body)?.[1]?.trim() ?? "";
	const assumptions = !assumpRaw || /^none$/i.test(assumpRaw) ? [] : assumpRaw.split(/[;|]/).map((s) => s.trim()).filter(Boolean);
	return {
		clarity,
		context,
		constraints,
		audience,
		output,
		completeness,
		overall,
		revisions: Math.max(1, Math.round(revisions)),
		assumptions
	};
}
function stripCertificate(text) {
	return text.replace(CERT_BLOCK_RE, "").trim();
}
var MODEL_FENCE_RE = /```(chatgpt|claude|gemini)\s*\n([\s\S]*?)```/gi;
var ANY_FENCE_RE = /```(?:prompt|markdown|md|text)?\s*\n?([\s\S]*?)```/i;
function extractFinalPrompt(text) {
	const found = {};
	let firstIndex = Infinity;
	let lastEnd = -1;
	let m;
	MODEL_FENCE_RE.lastIndex = 0;
	while ((m = MODEL_FENCE_RE.exec(text)) !== null) {
		const key = m[1].toLowerCase();
		const body = m[2].trim();
		if (body.length < 40) continue;
		found[key] = body;
		if (m.index < firstIndex) firstIndex = m.index;
		lastEnd = Math.max(lastEnd, m.index + m[0].length);
	}
	if (found.chatgpt && found.claude && found.gemini) return {
		intro: stripCertificate(text.slice(0, firstIndex)).trim(),
		prompts: {
			chatgpt: found.chatgpt,
			claude: found.claude,
			gemini: found.gemini
		},
		outro: stripCertificate(text.slice(lastEnd)).trim()
	};
	const legacy = ANY_FENCE_RE.exec(text);
	if (legacy && legacy[1].trim().length >= 80) {
		const prompt = legacy[1].trim();
		return {
			intro: stripCertificate(text.slice(0, legacy.index)).trim(),
			prompts: {
				chatgpt: prompt,
				claude: prompt,
				gemini: prompt
			},
			outro: stripCertificate(text.slice(legacy.index + legacy[0].length)).trim()
		};
	}
	return null;
}
/** Pull a short label out of an assistant question, e.g. "Question 3: Which country..." -> "Which country..." */
function shortQuestion(text) {
	const cleaned = stripSlotTag(text).replace(/```[\s\S]*?```/g, "").replace(/\*\*/g, "").trim();
	const qLine = cleaned.split(/\n+/).find((l) => /question\s*\d+\s*:/i.test(l));
	if (qLine) return qLine.replace(/.*question\s*\d+\s*:\s*/i, "").trim();
	const qMark = cleaned.match(/([^.?!\n]{6,200}\?)\s*$/);
	if (qMark) return qMark[1].trim();
	const lines = cleaned.split(/\n+/).filter(Boolean);
	return lines[lines.length - 1] ?? cleaned;
}
function questionNumber(text) {
	const m = /question\s*(\d+)\s*:/i.exec(text);
	return m ? Number(m[1]) : null;
}
function ChatWindow({ thread, onPersist, onProgress }) {
	const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
	const textareaRef = useRef(null);
	const detectedExpertRef = useRef(thread.expert);
	const activeExpertId = detectedExpertRef.current ?? thread.expert;
	const expert = activeExpertId ? EXPERTS[activeExpertId] : null;
	const { messages, sendMessage, status, error } = useChat({
		id: thread.id,
		messages: thread.messages,
		transport,
		onError: (err) => toast.error(err.message || "Something went wrong")
	});
	useEffect(() => {
		if (status === "ready") textareaRef.current?.focus();
	}, [status, thread.id]);
	const userMessages = messages.filter((m) => m.role === "user");
	const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
	const lastAssistantRaw = lastAssistant ? messageText(lastAssistant) : "";
	const lastAssistantText = stripSlotTag(lastAssistantRaw);
	const lastSlot = lastAssistant ? parseSlotTag(lastAssistantRaw) : null;
	const finalPromptObj = lastAssistant ? extractFinalPrompt(lastAssistantText) : null;
	const certificate = lastAssistant ? extractCertificate(lastAssistantRaw) : null;
	const hasFinalPrompt = !!finalPromptObj;
	const goalEntry = userMessages.map((message) => {
		const text = messageText(message).trim();
		return {
			message,
			text,
			expert: detectExpert(text)
		};
	}).find((entry) => entry.expert);
	const goal = goalEntry?.text ?? "";
	const goalMessageIndex = goalEntry ? messages.indexOf(goalEntry.message) : -1;
	const isIntentDiscovery = !goal;
	const pairs = [];
	for (let i = 0; i < userMessages.length; i++) {
		const userIdx = messages.indexOf(userMessages[i]);
		if (goalMessageIndex === -1 || userIdx <= goalMessageIndex) continue;
		const prevAssistant = [...messages.slice(0, userIdx)].reverse().find((m) => m.role === "assistant");
		if (!prevAssistant) continue;
		const qTextRaw = messageText(prevAssistant);
		pairs.push({
			question: shortQuestion(qTextRaw),
			answer: messageText(userMessages[i]),
			n: questionNumber(qTextRaw),
			slot: parseSlotTag(qTextRaw)
		});
	}
	const currentExpertId = isIntentDiscovery ? null : activeExpertId ?? goalEntry?.expert ?? null;
	const expertConfig = currentExpertId ? EXPERTS[currentExpertId] : null;
	const expertSlots = expertConfig?.slots ?? [];
	const criticalSlotIds = expertConfig?.criticalSlots ?? [];
	const filledSlotIds = new Set(pairs.map((p) => p.slot).filter((s) => Boolean(s)));
	const slotStatuses = expertSlots.map((s) => {
		const match = pairs.find((p) => p.slot === s.id);
		return {
			id: s.id,
			label: s.label,
			filled: !!match,
			value: match?.answer,
			priority: s.priority,
			why: s.why
		};
	});
	const missingCritical = criticalSlotIds.filter((id) => !filledSlotIds.has(id));
	const understanding = isIntentDiscovery ? 0 : hasFinalPrompt ? 100 : expertSlots.length > 0 ? Math.min(95, Math.round(filledSlotIds.size / expertSlots.length * 100)) : 0;
	const ready = expertSlots.length > 0 && understanding >= 80 && missingCritical.length === 0 && filledSlotIds.size >= 6;
	const showFinalPrompt = hasFinalPrompt && ready;
	const quality = (() => {
		if (isIntentDiscovery || expertSlots.length === 0) return 0;
		if (hasFinalPrompt && ready) return 10;
		const completeness = filledSlotIds.size / expertSlots.length;
		const criticality = criticalSlotIds.length === 0 ? 1 : (criticalSlotIds.length - missingCritical.length) / criticalSlotIds.length;
		const filledPairs = pairs.filter((p) => p.slot && filledSlotIds.has(p.slot));
		const specificity = filledPairs.length === 0 ? 0 : filledPairs.filter((p) => isSpecificAnswer(p.answer)).length / filledPairs.length;
		const raw = completeness * 4 + criticality * 4 + specificity * 2;
		return Math.round(Math.min(10, Math.max(0, raw)) * 10) / 10;
	})();
	useEffect(() => {
		if (status === "submitted" || status === "streaming") return;
		if (!currentExpertId || goalMessageIndex < 0) return;
		onPersist(messages.slice(goalMessageIndex), currentExpertId);
	}, [
		currentExpertId,
		goalMessageIndex,
		messages,
		status,
		onPersist
	]);
	useEffect(() => {
		onProgress?.({
			progress: understanding,
			quality,
			expert: currentExpertId,
			collected: pairs.map((p) => `${p.question} — ${p.answer}`),
			slots: slotStatuses,
			goal
		});
	}, [
		understanding,
		quality,
		messages.length,
		thread.id,
		currentExpertId,
		goal
	]);
	const isBusy = status === "submitted" || status === "streaming";
	const showWelcome = messages.length === 0;
	function handleSend(text) {
		if (!detectedExpertRef.current) {
			const detected = detectExpert(text);
			if (detected) detectedExpertRef.current = detected;
		}
		sendMessage({ text }, { body: { expert: detectedExpertRef.current ?? null } });
	}
	function handleWhy() {
		if (isBusy) return;
		sendMessage({ text: "Why are you asking this? How does my answer affect the final prompt?" }, { body: { expert: detectedExpertRef.current ?? null } });
	}
	function handleRegenerate() {
		if (!detectedExpertRef.current) return;
		sendMessage({ text: "Please regenerate all three master prompts (ChatGPT, Claude, Gemini) using every detail I shared above. Keep each one optimized for its model's style, and return them in the same three fenced blocks (```chatgpt, ```claude, ```gemini) followed by the certificate." }, { body: { expert: detectedExpertRef.current } });
	}
	function handleContinueInterview() {
		if (!detectedExpertRef.current || isBusy) return;
		const missingLabels = expertSlots.filter((s) => missingCritical.includes(s.id)).map((s) => s.label).join(", ");
		sendMessage({ text: `Not ready yet — please keep interviewing me. I still need to cover: ${missingLabels}. Ask the next most important question.` }, { body: { expert: detectedExpertRef.current } });
	}
	if (showWelcome) return /* @__PURE__ */ jsxs("div", {
		className: "relative flex h-full min-h-0 flex-col overflow-y-auto bg-background",
		children: [/* @__PURE__ */ jsx(BackgroundGlow, {}), /* @__PURE__ */ jsxs("div", {
			className: "relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-12 text-center",
			children: [
				/* @__PURE__ */ jsx("img", {
					src: prompt_master_logo_default,
					alt: "",
					width: 56,
					height: 56,
					className: "h-14 w-14"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground",
					children: [/* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }), " The AI that asks the questions you forgot to ask"]
				}),
				/* @__PURE__ */ jsxs("h1", {
					className: "mt-4 text-balance text-3xl font-semibold leading-tight sm:text-4xl",
					children: [
						"What are you trying to ",
						/* @__PURE__ */ jsx("span", {
							className: "text-primary",
							children: "achieve"
						}),
						"?"
					]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-3 max-w-lg text-balance text-sm text-muted-foreground",
					children: "Drop your goal in one sentence. Prompt Master will interview you with smart follow-up questions, then hand you a master prompt for ChatGPT, Gemini, or Claude."
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-[12px] font-medium tracking-wide text-primary/90",
					children: "Bridging human thinking and AI understanding."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-7 w-full",
					children: /* @__PURE__ */ jsx(ComposerForm, {
						disabled: isBusy,
						status,
						onSubmit: handleSend,
						textareaRef,
						placeholder: "e.g. I want to start a business…",
						big: true
					})
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-5 flex flex-wrap justify-center gap-2",
					children: [
						"I want to start a business",
						"I want to build a website",
						"I want to learn Python",
						"I want to start a YouTube channel"
					].map((s) => /* @__PURE__ */ jsx("button", {
						onClick: () => handleSend(s),
						disabled: isBusy,
						className: "rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground",
						children: s
					}, s))
				})
			]
		})]
	});
	const currentQuestionNumber = lastAssistant ? questionNumber(lastAssistantText) ?? userMessages.length + 1 : 1;
	return /* @__PURE__ */ jsxs("div", {
		className: "relative flex h-full min-h-0 flex-col overflow-hidden bg-background",
		children: [
			/* @__PURE__ */ jsx(BackgroundGlow, {}),
			/* @__PURE__ */ jsxs("header", {
				className: "relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 bg-background/70 px-5 py-3 backdrop-blur",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary",
						children: [
							/* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 animate-pulse rounded-full bg-primary" }),
							" ",
							"Interview Mode"
						]
					}), expert ? /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex h-8 w-8 items-center justify-center rounded-lg text-base",
							style: { backgroundColor: `color-mix(in oklch, ${expert.accent} 22%, transparent)` },
							children: expert.emoji
						}), /* @__PURE__ */ jsxs("div", {
							className: "leading-tight",
							children: [/* @__PURE__ */ jsx("div", {
								className: "text-[10px] uppercase tracking-wider text-muted-foreground",
								children: "Current Expert"
							}), /* @__PURE__ */ jsx("div", {
								className: "text-sm font-semibold",
								children: expert.name
							})]
						})]
					}) : null]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-4",
					children: [/* @__PURE__ */ jsx(QualityScore, { value: quality }), /* @__PURE__ */ jsx(ProgressDial, { value: understanding })]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative z-10 grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[1fr_360px]",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex min-h-0 flex-col overflow-y-auto px-5 py-6 sm:px-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "mx-auto w-full max-w-2xl space-y-6",
						children: [
							goal && /* @__PURE__ */ jsxs("div", {
								className: "rounded-xl border border-border/60 bg-card/50 p-4",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
									children: [/* @__PURE__ */ jsx(Target, { className: "h-3.5 w-3.5" }), " Your Goal"]
								}), /* @__PURE__ */ jsx("p", {
									className: "mt-1.5 text-base font-medium leading-snug",
									children: goal
								})]
							}),
							showFinalPrompt && finalPromptObj ? /* @__PURE__ */ jsxs("div", {
								className: "space-y-4",
								children: [
									finalPromptObj.intro && /* @__PURE__ */ jsx("div", {
										className: "rounded-xl border border-border/60 bg-card/50 p-4 text-sm",
										children: /* @__PURE__ */ jsx(MessageResponse, { children: finalPromptObj.intro })
									}),
									/* @__PURE__ */ jsx(FinalPromptCard, {
										prompts: finalPromptObj.prompts,
										onRegenerate: handleRegenerate,
										regenerating: isBusy
									}),
									certificate && /* @__PURE__ */ jsx(QualityCertificate, { cert: certificate }),
									finalPromptObj.outro && /* @__PURE__ */ jsx("div", {
										className: "text-xs text-muted-foreground",
										children: /* @__PURE__ */ jsx(MessageResponse, { children: finalPromptObj.outro })
									})
								]
							}) : /* @__PURE__ */ jsxs(Fragment, { children: [hasFinalPrompt && !ready && /* @__PURE__ */ jsxs("div", {
								className: "rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "font-semibold",
										children: "I still need a few important details before generating a world-class prompt."
									}),
									missingCritical.length > 0 && /* @__PURE__ */ jsxs("div", {
										className: "mt-1.5 text-xs text-amber-200/90",
										children: [
											"Still missing:",
											" ",
											expertSlots.filter((s) => missingCritical.includes(s.id)).map((s) => s.label).join(", "),
											"."
										]
									}),
									/* @__PURE__ */ jsx("button", {
										type: "button",
										onClick: handleContinueInterview,
										disabled: isBusy,
										className: "mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-400/60 bg-amber-400/20 px-3 py-1 text-xs font-medium text-amber-50 transition-colors hover:bg-amber-400/30 disabled:opacity-50",
										children: "Ask the next question"
									})
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "overflow-hidden rounded-2xl border border-primary/25 bg-card/60 shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_15%,transparent),0_20px_60px_-30px_color-mix(in_oklch,var(--primary)_55%,transparent)]",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between border-b border-border/50 bg-primary/5 px-4 py-2",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary",
											children: ["Question ", currentQuestionNumber]
										}), lastSlot && expertSlots.find((s) => s.id === lastSlot) && /* @__PURE__ */ jsx("span", {
											className: "rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary",
											children: expertSlots.find((s) => s.id === lastSlot)?.label
										})]
									}), /* @__PURE__ */ jsx("div", {
										className: "text-[10.5px] text-muted-foreground",
										children: isBusy ? "Preparing…" : "Awaiting your answer"
									})]
								}), /* @__PURE__ */ jsxs("div", {
									className: "p-5",
									children: [
										isBusy && !lastAssistantText ? /* @__PURE__ */ jsx(Shimmer, { children: "Thinking of the next question…" }) : lastAssistant ? /* @__PURE__ */ jsx("div", {
											className: "text-[15px] leading-relaxed",
											children: /* @__PURE__ */ jsx(MessageResponse, { children: lastAssistantText })
										}) : /* @__PURE__ */ jsx(Shimmer, { children: "Loading…" }),
										lastAssistant && !isBusy && /* @__PURE__ */ jsxs("button", {
											type: "button",
											onClick: handleWhy,
											className: "mt-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground",
											children: [/* @__PURE__ */ jsx(Circle, { className: "h-3 w-3" }), " Why am I being asked this?"]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "mt-5",
											children: [/* @__PURE__ */ jsx(ComposerForm, {
												disabled: isBusy,
												status,
												onSubmit: handleSend,
												textareaRef,
												placeholder: "Type your answer  ·  or ask: what does this mean?"
											}), /* @__PURE__ */ jsxs("div", {
												className: "mt-1.5 text-[11px] text-muted-foreground",
												children: [
													"Tip: ask",
													" ",
													/* @__PURE__ */ jsx("span", {
														className: "text-foreground",
														children: "\"what does this mean?\""
													}),
													" ",
													"any time to learn a term."
												]
											})]
										})
									]
								})]
							})] }),
							error && /* @__PURE__ */ jsx("div", {
								className: "rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive",
								children: error.message
							})
						]
					})
				}), /* @__PURE__ */ jsxs("aside", {
					className: "hidden min-h-0 flex-col border-l border-border/50 bg-sidebar/40 lg:flex",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between border-b border-border/50 px-4 py-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
							children: "Interview Roadmap"
						}), /* @__PURE__ */ jsxs("div", {
							className: "rounded-full bg-primary/15 px-2 py-0.5 text-[10.5px] font-semibold text-primary",
							children: [
								slotStatuses.filter((s) => s.filled).length,
								"/",
								slotStatuses.length || "—"
							]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "min-h-0 flex-1 overflow-y-auto px-4 py-4",
						children: [slotStatuses.length === 0 ? /* @__PURE__ */ jsx("div", {
							className: "text-xs text-muted-foreground/80",
							children: "Tracking will appear once we know which expert fits your goal."
						}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
							className: "mb-4 grid grid-cols-3 gap-2",
							children: [
								"critical",
								"important",
								"optional"
							].map((p) => {
								const missing = slotStatuses.filter((s) => s.priority === p && !s.filled).length;
								return /* @__PURE__ */ jsxs("div", {
									className: `rounded-md border px-2 py-1.5 text-center ${p === "critical" ? "border-rose-500/40 bg-rose-500/10 text-rose-200" : p === "important" ? "border-amber-500/40 bg-amber-500/10 text-amber-100" : "border-border/60 bg-card/40 text-muted-foreground"}`,
									children: [
										/* @__PURE__ */ jsx("div", {
											className: "text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80",
											children: p
										}),
										/* @__PURE__ */ jsx("div", {
											className: "text-base font-semibold tabular-nums",
											children: missing
										}),
										/* @__PURE__ */ jsx("div", {
											className: "text-[9.5px] opacity-70",
											children: "missing"
										})
									]
								}, p);
							})
						}), [
							"critical",
							"important",
							"optional"
						].map((p) => {
							const group = slotStatuses.filter((s) => s.priority === p);
							if (group.length === 0) return null;
							return /* @__PURE__ */ jsxs("div", {
								className: "mb-3",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
									children: [/* @__PURE__ */ jsx("span", { children: p === "critical" ? "Critical" : p === "important" ? "Important" : "Optional" }), /* @__PURE__ */ jsxs("span", { children: [
										group.filter((s) => s.filled).length,
										"/",
										group.length
									] })]
								}), /* @__PURE__ */ jsx("ul", {
									className: "space-y-1.5",
									children: group.map((s) => /* @__PURE__ */ jsxs("li", {
										title: s.why,
										className: "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors " + (s.filled ? "border-primary/30 bg-primary/10 text-foreground" : p === "critical" ? "border-rose-500/30 bg-rose-500/5 text-muted-foreground" : "border-border/60 bg-card/30 text-muted-foreground"),
										children: [/* @__PURE__ */ jsx("span", {
											className: "mt-0.5 text-[12px] leading-none",
											children: s.filled ? "✅" : "❌"
										}), /* @__PURE__ */ jsxs("div", {
											className: "min-w-0 flex-1",
											children: [
												/* @__PURE__ */ jsx("div", {
													className: "font-medium",
													children: s.label
												}),
												s.filled && s.value && /* @__PURE__ */ jsx("div", {
													className: "mt-0.5 line-clamp-2 text-[11px] text-foreground/80",
													children: s.value
												}),
												!s.filled && /* @__PURE__ */ jsx("div", {
													className: "mt-0.5 line-clamp-2 text-[10.5px] text-muted-foreground/80",
													children: s.why
												})
											]
										})]
									}, s.id))
								})]
							}, p);
						})] }), hasFinalPrompt && /* @__PURE__ */ jsx("div", {
							className: "mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary",
							children: "Interview complete — master prompt generated."
						})]
					})]
				})]
			})
		]
	});
}
function QualityScore({ value }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "hidden text-right leading-tight sm:block",
		children: [/* @__PURE__ */ jsx("div", {
			className: "text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
			children: "Prompt Quality"
		}), /* @__PURE__ */ jsxs("div", {
			className: "text-lg font-semibold tabular-nums " + (value >= 8 ? "text-primary" : value >= 5 ? "text-amber-300" : "text-muted-foreground"),
			children: [value.toFixed(1), /* @__PURE__ */ jsx("span", {
				className: "text-xs text-muted-foreground",
				children: "/10"
			})]
		})]
	});
}
function ProgressDial({ value }) {
	const radius = 22;
	const c = 2 * Math.PI * radius;
	const offset = c - value / 100 * c;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-3",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "text-right leading-tight",
			children: [/* @__PURE__ */ jsx("div", {
				className: "text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
				children: "Understanding"
			}), /* @__PURE__ */ jsxs("div", {
				className: "text-lg font-semibold tabular-nums",
				children: [value, "%"]
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "relative h-14 w-14",
			children: [/* @__PURE__ */ jsxs("svg", {
				viewBox: "0 0 56 56",
				className: "h-14 w-14 -rotate-90",
				children: [/* @__PURE__ */ jsx("circle", {
					cx: "28",
					cy: "28",
					r: radius,
					className: "fill-none stroke-muted",
					strokeWidth: "5"
				}), /* @__PURE__ */ jsx("circle", {
					cx: "28",
					cy: "28",
					r: radius,
					className: "fill-none stroke-primary transition-all duration-500",
					strokeWidth: "5",
					strokeLinecap: "round",
					strokeDasharray: c,
					strokeDashoffset: offset
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums",
				children: value
			})]
		})]
	});
}
function QualityCertificate({ cert }) {
	const dims = [
		["Clarity", cert.clarity],
		["Context", cert.context],
		["Constraints", cert.constraints],
		["Audience", cert.audience],
		["Output", cert.output],
		["Completeness", cert.completeness]
	];
	const tone = cert.overall >= 9.5 ? "text-primary" : cert.overall >= 8 ? "text-emerald-300" : "text-amber-300";
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-xl border border-primary/30 bg-card/60 p-4 shadow-[0_0_30px_-20px_var(--primary)]",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
					className: "text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
					children: "Final Quality Certificate"
				}), /* @__PURE__ */ jsxs("div", {
					className: "mt-2 space-y-1 text-xs",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-primary",
								children: "✓"
							}), " Interview Complete"]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-primary",
								children: "✓"
							}), " Prompt Reviewed"]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "text-primary",
									children: "✓"
								}),
								" Self-Corrected (",
								cert.revisions,
								" ",
								cert.revisions === 1 ? "pass" : "passes",
								")"
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-primary",
								children: "✓"
							}), " Quality Verified"]
						})
					]
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "text-right leading-tight",
					children: [/* @__PURE__ */ jsx("div", {
						className: "text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
						children: "Overall Score"
					}), /* @__PURE__ */ jsxs("div", {
						className: "text-3xl font-semibold tabular-nums " + tone,
						children: [cert.overall.toFixed(1), /* @__PURE__ */ jsx("span", {
							className: "text-sm text-muted-foreground",
							children: "/10"
						})]
					})]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3",
				children: dims.map(([label, v]) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between text-[11px]",
					children: [/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: label
					}), /* @__PURE__ */ jsx("span", {
						className: "tabular-nums font-medium",
						children: v.toFixed(1)
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-1 h-1.5 overflow-hidden rounded-full bg-muted",
					children: /* @__PURE__ */ jsx("div", {
						className: "h-full rounded-full bg-primary transition-all",
						style: { width: `${Math.min(100, Math.max(0, v / 10 * 100))}%` }
					})
				})] }, label))
			}),
			cert.assumptions.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "mt-4 rounded-lg border border-border/60 bg-background/40 p-3",
				children: [/* @__PURE__ */ jsx("div", {
					className: "text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
					children: "Assumptions Made"
				}), /* @__PURE__ */ jsx("ul", {
					className: "mt-1.5 space-y-1 text-xs text-foreground/80",
					children: cert.assumptions.map((a, i) => /* @__PURE__ */ jsxs("li", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-muted-foreground",
							children: "•"
						}), /* @__PURE__ */ jsx("span", { children: a })]
					}, i))
				})]
			})
		]
	});
}
function BackgroundGlow() {
	return /* @__PURE__ */ jsxs("div", {
		"aria-hidden": true,
		className: "pointer-events-none absolute inset-0 overflow-hidden",
		children: [/* @__PURE__ */ jsx("div", {
			className: "absolute -left-32 -top-32 h-80 w-80 rounded-full opacity-30 blur-3xl",
			style: { background: "radial-gradient(circle, var(--primary), transparent 60%)" }
		}), /* @__PURE__ */ jsx("div", {
			className: "absolute -bottom-40 right-0 h-96 w-96 rounded-full opacity-20 blur-3xl",
			style: { background: "radial-gradient(circle, var(--accent-cyan, #22d3ee), transparent 60%)" }
		})]
	});
}
function ComposerForm({ disabled, status, onSubmit, textareaRef, placeholder, big }) {
	return /* @__PURE__ */ jsxs(PromptInput, {
		onSubmit: ({ text }) => {
			const t = (text ?? "").trim();
			if (!t || disabled) return;
			onSubmit(t);
		},
		children: [/* @__PURE__ */ jsx(PromptInputTextarea, {
			ref: textareaRef,
			placeholder,
			className: big ? "min-h-[80px] text-base" : void 0
		}), /* @__PURE__ */ jsx(PromptInputFooter, {
			className: "justify-end",
			children: /* @__PURE__ */ jsx(PromptInputSubmit, {
				status,
				disabled
			})
		})]
	});
}
//#endregion
//#region src/components/thread-sidebar.tsx
function ThreadSidebar({ threads, activeThreadId, activeExpert, progress, quality, collected, slots, goal, onDelete }) {
	return /* @__PURE__ */ jsxs("aside", {
		className: "flex h-full w-72 shrink-0 flex-col border-r border-border/50 bg-sidebar/60 backdrop-blur",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 px-4 py-4",
				children: [/* @__PURE__ */ jsx("img", {
					src: prompt_master_logo_default,
					alt: "Prompt Master",
					width: 32,
					height: 32,
					className: "h-8 w-8"
				}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
					className: "text-sm font-semibold leading-tight",
					children: "Prompt Master"
				}), /* @__PURE__ */ jsx("div", {
					className: "text-[11px] text-muted-foreground",
					children: "Asks. Listens. Writes."
				})] })]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "px-3",
				children: /* @__PURE__ */ jsxs(Link, {
					to: "/",
					className: cn("flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm font-medium", "hover:bg-card/80 transition-colors"),
					children: [/* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }), " New session"]
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-5 px-4",
				children: [/* @__PURE__ */ jsx("div", {
					className: "mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
					children: "Expert Mode"
				}), /* @__PURE__ */ jsx("ul", {
					className: "space-y-1",
					children: EXPERT_LIST.map((e) => {
						const isActive = activeExpert === e.id;
						return /* @__PURE__ */ jsxs("li", {
							className: cn("flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors", isActive ? "border-transparent bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_45%,transparent)]" : "border-transparent text-muted-foreground/80"),
							style: isActive ? { backgroundImage: `linear-gradient(90deg, color-mix(in oklch, ${e.accent} 20%, transparent), transparent)` } : void 0,
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "text-base leading-none",
									children: e.emoji
								}),
								/* @__PURE__ */ jsx("span", {
									className: "flex-1 truncate font-medium",
									children: e.name
								}),
								isActive && /* @__PURE__ */ jsx("span", {
									className: "rounded-full bg-primary/30 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-foreground",
									children: "Active"
								})
							]
						}, e.id);
					})
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-5 px-4",
				children: /* @__PURE__ */ jsxs("div", {
					className: "space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-3",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
						className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
						children: "Current Goal"
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-0.5 line-clamp-2 text-[12px] font-medium leading-snug text-foreground",
						children: goal || "No goal identified yet"
					})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
						className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
						children: "Current Expert"
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-0.5 text-[12px] font-medium leading-snug text-foreground",
						children: activeExpert ? EXPERTS[activeExpert].name : "Waiting for intent"
					})] })]
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 px-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
						children: [/* @__PURE__ */ jsx("span", { children: "Understanding" }), /* @__PURE__ */ jsxs("span", {
							className: "text-foreground",
							children: [progress, "%"]
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "h-1.5 w-full overflow-hidden rounded-full bg-muted",
						children: /* @__PURE__ */ jsx("div", {
							className: "h-full rounded-full bg-gradient-to-r from-primary to-[color:var(--accent-rose)] transition-all duration-500",
							style: { width: `${progress}%` }
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
						children: [/* @__PURE__ */ jsx("span", { children: "Prompt Quality" }), /* @__PURE__ */ jsxs("span", {
							className: quality >= 8 ? "text-primary" : quality >= 5 ? "text-amber-300" : "text-foreground/80",
							children: [quality.toFixed(1), /* @__PURE__ */ jsx("span", {
								className: "text-[10px] text-muted-foreground",
								children: "/10"
							})]
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-1 text-[10.5px] text-muted-foreground",
						children: progress >= 100 ? "Master prompt ready ✦" : progress >= 90 ? "Almost there — finalising…" : progress === 0 ? "Send your goal to begin." : "Learning more about your situation…"
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-5 flex min-h-0 flex-1 flex-col px-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
					children: [/* @__PURE__ */ jsx("span", { children: "Missing Information" }), slots.length > 0 && /* @__PURE__ */ jsxs("span", {
						className: "text-foreground/80",
						children: [
							slots.filter((s) => s.filled).length,
							"/",
							slots.length
						]
					})]
				}), slots.length === 0 ? /* @__PURE__ */ jsx("div", {
					className: "text-xs text-muted-foreground/80",
					children: "Send your goal to see what Prompt Master needs to learn."
				}) : /* @__PURE__ */ jsx("ul", {
					className: "space-y-1 overflow-y-auto pr-1 text-xs",
					children: slots.map((s) => /* @__PURE__ */ jsxs("li", {
						className: cn("flex items-center gap-2 rounded-md px-2 py-1", s.filled ? "text-foreground" : "text-muted-foreground"),
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[12px] leading-none",
							children: s.filled ? "✅" : "❌"
						}), /* @__PURE__ */ jsx("span", {
							className: "line-clamp-1 flex-1",
							children: s.label
						})]
					}, s.id))
				})]
			}),
			threads.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "border-t border-border/50 px-2 py-3",
				children: [/* @__PURE__ */ jsx("div", {
					className: "mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
					children: "Recent"
				}), /* @__PURE__ */ jsx("ul", {
					className: "max-h-44 space-y-0.5 overflow-y-auto",
					children: threads.filter((t) => t.messages.length > 0).slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 12).map((t) => {
						const expert = t.expert ? EXPERTS[t.expert] : null;
						const isActive = t.id === activeThreadId;
						return /* @__PURE__ */ jsxs("li", {
							className: "group relative",
							children: [/* @__PURE__ */ jsxs(Link, {
								to: "/chat/$threadId",
								params: { threadId: t.id },
								className: cn("flex items-center gap-2 rounded-md px-2 py-1.5 pr-7 text-xs transition-colors", isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"),
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-sm leading-none",
									children: expert?.emoji ?? "✨"
								}), /* @__PURE__ */ jsx("span", {
									className: "min-w-0 flex-1 truncate",
									children: t.title
								})]
							}), /* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": "Delete session",
								onClick: (e) => {
									e.preventDefault();
									e.stopPropagation();
									if (confirm("Delete this session?")) onDelete(t.id);
								},
								className: "absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background/80 hover:text-destructive group-hover:opacity-100",
								children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" })
							})]
						}, t.id);
					})
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "border-t border-border/50 px-4 py-2 text-[10.5px] text-muted-foreground",
				children: "Sessions saved locally in this browser."
			})
		]
	});
}
//#endregion
//#region src/routes/chat.$threadId.tsx?tsr-split=component
function ChatThreadPage() {
	const { threadId } = Route.useParams();
	const navigate = useNavigate();
	const [threads, setThreads] = useState([]);
	const [ready, setReady] = useState(false);
	const [mobileSidebar, setMobileSidebar] = useState(false);
	const [liveProgress, setLiveProgress] = useState({
		progress: 0,
		quality: 0,
		collected: [],
		expert: null,
		slots: [],
		goal: ""
	});
	useEffect(() => {
		const loaded = loadThreads();
		if (!loaded.find((t) => t.id === threadId)) {
			const next = [{
				id: threadId,
				expert: null,
				title: "New session",
				updatedAt: Date.now(),
				messages: []
			}, ...loaded];
			saveThreads(next);
			setThreads(next);
		} else setThreads(loaded);
		setReady(true);
	}, [threadId]);
	const activeThread = useMemo(() => threads.find((t) => t.id === threadId), [threads, threadId]);
	useEffect(() => {
		setLiveProgress({
			progress: 0,
			quality: 0,
			collected: [],
			expert: activeThread?.expert ?? null,
			slots: [],
			goal: ""
		});
	}, [threadId, activeThread?.expert]);
	const handlePersist = useCallback((messages, expertOverride) => {
		setThreads((prev) => {
			const idx = prev.findIndex((t) => t.id === threadId);
			if (idx === -1) return prev;
			const cur = prev[idx];
			const title = cur.title === "New session" ? deriveTitle(messages) : cur.title;
			const updated = {
				...cur,
				expert: cur.expert ?? expertOverride ?? null,
				title,
				messages,
				updatedAt: Date.now()
			};
			const next = [...prev];
			next[idx] = updated;
			saveThreads(next);
			return next;
		});
	}, [threadId]);
	const handleDelete = useCallback((id) => {
		setThreads((prev) => {
			const next = prev.filter((t) => t.id !== id);
			saveThreads(next);
			return next;
		});
		if (id === threadId) {
			const fresh = {
				id: newThreadId(),
				expert: null,
				title: "New session",
				updatedAt: Date.now(),
				messages: []
			};
			setThreads((prev) => {
				const next = [fresh, ...prev];
				saveThreads(next);
				return next;
			});
			navigate({
				to: "/chat/$threadId",
				params: { threadId: fresh.id },
				replace: true
			});
		}
	}, [navigate, threadId]);
	if (!ready || !activeThread) return /* @__PURE__ */ jsx("div", {
		className: "flex h-screen items-center justify-center bg-background text-sm text-muted-foreground",
		children: "Loading session…"
	});
	const sidebar = /* @__PURE__ */ jsx(ThreadSidebar, {
		threads,
		activeThreadId: threadId,
		activeExpert: liveProgress.expert ?? activeThread.expert ?? null,
		progress: liveProgress.progress,
		quality: liveProgress.quality,
		collected: liveProgress.collected,
		slots: liveProgress.slots,
		goal: liveProgress.goal,
		onDelete: handleDelete
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-screen w-full overflow-hidden bg-background",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "hidden md:block",
				children: sidebar
			}),
			mobileSidebar && /* @__PURE__ */ jsxs("div", {
				className: "fixed inset-0 z-40 md:hidden",
				children: [/* @__PURE__ */ jsx("div", {
					className: "absolute inset-0 bg-black/60",
					onClick: () => setMobileSidebar(false),
					"aria-hidden": true
				}), /* @__PURE__ */ jsx("div", {
					className: "absolute inset-y-0 left-0 shadow-2xl",
					children: sidebar
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-1 flex-col",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between border-b border-border/50 px-3 py-2 md:hidden",
					children: [
						/* @__PURE__ */ jsx(Button, {
							variant: "ghost",
							size: "icon-sm",
							onClick: () => setMobileSidebar((v) => !v),
							"aria-label": "Toggle sidebar",
							children: mobileSidebar ? /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Menu, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ jsx("div", {
							className: "text-sm font-semibold",
							children: "Prompt Master"
						}),
						/* @__PURE__ */ jsx("div", { className: "w-8" })
					]
				}), /* @__PURE__ */ jsx("div", {
					className: "min-h-0 flex-1",
					children: /* @__PURE__ */ jsx(ChatWindow, {
						thread: activeThread,
						onPersist: handlePersist,
						onProgress: setLiveProgress
					}, activeThread.id)
				})]
			})
		]
	});
}
//#endregion
export { ChatThreadPage as component };
