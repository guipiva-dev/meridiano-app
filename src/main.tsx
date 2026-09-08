import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "./styles/global.css";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("#root não encontrado");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
