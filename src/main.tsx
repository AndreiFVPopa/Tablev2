import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@app/app";
import "@app/styles/global.scss";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root container #root is missing from index.html");
}
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
