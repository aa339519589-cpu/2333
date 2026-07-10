import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import AetherGridApp from "./components/AetherGridApp";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./styles.css";

registerSW({ immediate: true });
const root = document.getElementById("root");
if (root === null) throw new Error("Root element missing");
createRoot(root).render(<StrictMode><AppErrorBoundary><AetherGridApp/></AppErrorBoundary></StrictMode>);
