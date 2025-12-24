// Minimal mock API setup used only during development.
// This file satisfies the dynamic import in main.jsx and provides
// a tiny example mock for `/api/ping` to avoid runtime import errors.
export function setupMockAPI() {
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.DEV
  ) {
    // Prevent double-initialization
    if (window.__setupMockAPIInitialized) return;
    window.__setupMockAPIInitialized = true;
    console.info("setupMockAPI: initializing lightweight mock API (dev only)");

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      try {
        const url = typeof input === "string" ? input : input.url;
        if (url && url.endsWith("/api/ping")) {
          return new Response(JSON.stringify({ pong: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        // fall through to real fetch
      }
      return originalFetch(input, init);
    };
  }
}
