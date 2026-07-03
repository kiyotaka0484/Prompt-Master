let lastCapturedError: Error | null = null;

if (typeof process !== "undefined" && process.on) {
  process.on("uncaughtException", (error) => {
    lastCapturedError = error;
  });

  process.on("unhandledRejection", (reason) => {
    lastCapturedError =
      reason instanceof Error ? reason : new Error(String(reason));
  });
}

export function captureError(error: Error) {
  lastCapturedError = error;
}

export function consumeLastCapturedError(): Error | null {
  const error = lastCapturedError;
  lastCapturedError = null;
  return error;
}

export function getLastCapturedError(): Error | null {
  return lastCapturedError;
}
