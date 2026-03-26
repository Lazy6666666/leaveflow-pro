const PUTER_SCRIPT_URL = "https://js.puter.com/v2/";

type PuterAuthApi = {
  getUser: () => Promise<unknown>;
  isSignedIn: () => Promise<boolean>;
  signIn: () => Promise<unknown>;
};

type PuterAiApi = {
  chat: (messages: unknown, options?: Record<string, unknown>) => Promise<unknown>;
};

export type PuterClient = {
  ai: PuterAiApi;
  auth: PuterAuthApi;
};

declare global {
  interface Window {
    puter?: PuterClient;
  }
}

let puterClientPromise: Promise<PuterClient> | null = null;

function getPuterFromWindow() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.puter ?? null;
}

export function isPuterEnabled() {
  return import.meta.env.VITE_PUTER_ENABLED !== "false";
}

export async function loadPuterClient() {
  const existing = getPuterFromWindow();
  if (existing) {
    return existing;
  }

  if (typeof document === "undefined") {
    throw new Error("Puter requires a browser environment.");
  }

  if (!puterClientPromise) {
    puterClientPromise = new Promise<PuterClient>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PUTER_SCRIPT_URL;
      script.async = true;

      script.onload = () => {
        const loadedClient = getPuterFromWindow();
        if (!loadedClient) {
          reject(new Error("Puter loaded without exposing window.puter."));
          return;
        }

        resolve(loadedClient);
      };

      script.onerror = () => {
        reject(new Error("Failed to load Puter."));
      };

      document.head.appendChild(script);
    }).catch((error) => {
      puterClientPromise = null;
      throw error;
    });
  }

  return puterClientPromise;
}
