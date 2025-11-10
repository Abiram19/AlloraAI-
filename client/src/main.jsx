import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";

// Import your Publishable Key (optional in local dev)
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const Root = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// If a publishable key is provided, wrap the app with ClerkProvider. Otherwise render app without it.
if (PUBLISHABLE_KEY) {
  createRoot(document.getElementById("root")).render(
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Root />
    </ClerkProvider>
  );
} else {
  createRoot(document.getElementById("root")).render(<Root />);
}
