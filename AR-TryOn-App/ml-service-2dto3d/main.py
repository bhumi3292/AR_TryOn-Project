import uvicorn  # type: ignore[import-not-found]

if __name__ == "__main__":
    # Default host/port; set via env vars if needed
    host = "0.0.0.0"
    port = int(__import__("os").environ.get("PORT", 8000))
    uvicorn.run("app:app", host=host, port=port, reload=True)
