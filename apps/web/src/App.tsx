import { message } from "@demo/hello";
import type { ReactElement } from "react";

export default function App(): ReactElement {
  return (
    <main>
      <h1>{message}</h1>
      <p>Vite+ checks this React app through qntx lint, format, and tsconfig presets.</p>
    </main>
  );
}
