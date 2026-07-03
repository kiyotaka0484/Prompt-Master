import {
  newThreadId,
  loadThreads,
  saveThreads,
  type ThreadRecord,
} from "@/lib/threads";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prompt Master — Interview Mode" },
      {
        name: "description",
        content:
          "Prompt Master interviews you, then writes the perfect prompt for ChatGPT, Gemini, or Claude.",
      },
    ],
  }),
  component: HomeRedirect,
  loader: () => null,
});

function HomeRedirect() {
  useEffect(() => {
    const threads = loadThreads();
    const fresh = threads.find((t) => t.messages.length === 0);
    let targetId: string;
    if (fresh) {
      targetId = fresh.id;
    } else {
      targetId = newThreadId();
      const newThread: ThreadRecord = {
        id: targetId,
        expert: null,
        title: "New session",
        updatedAt: Date.now(),
        messages: [],
      };
      saveThreads([newThread, ...threads]);
    }
    window.location.replace(`/chat/${targetId}`);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading…
    </div>
  );
}
