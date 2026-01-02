import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// Attempt to load optional mock API (safe when mock is not present)
// Mock API disabled to ensure connection to real Node.js backend
// import("./mock/setupMockAPI")
//   .then((mod) => mod.setupMockAPI && mod.setupMockAPI())
//   .catch(() => {
//     // mock not available — continue without it
//   });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
