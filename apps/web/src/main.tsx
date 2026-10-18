import { createRoot } from "react-dom/client";

import App from "./App.tsx";

const root = document.querySelector("#root");

if (!root) {
  throw new Error("Root element #root was not found.");
}

createRoot(root).render(<App />);
