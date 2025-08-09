import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

// Disable StrictMode in development to suppress Ant Design warnings
const root = ReactDOM.createRoot(document.getElementById("root")!);

if (import.meta.env.PROD) {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  root.render(<App />);
}
