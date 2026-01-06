import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/components/app/app";
import "@/styles/globals.css";
import "leaflet/dist/leaflet.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
