import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider, ClerkLoaded, ClerkLoading } from "@clerk/clerk-react";

// Import your Publishable Key (optional in local dev)
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const Root = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// If a publishable key is provided, wrap the app with ClerkProvider. Otherwise render app without it.
const mountNode = document.getElementById("root");

if (PUBLISHABLE_KEY) {
  console.info("[Clerk] Using publishable key prefix:", PUBLISHABLE_KEY.slice(0, 10));
  createRoot(mountNode).render(
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{ variables: { colorPrimary: '#4A7AFF' } }}
    >
      <ClerkLoading>
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',fontFamily:'sans-serif',color:'#555'}}>
          Loading authentication...
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        <Root />
      </ClerkLoaded>
    </ClerkProvider>
  );
} else {
  console.warn("[Clerk] No publishable key found. Running without authentication.");
  createRoot(mountNode).render(<Root />);
}
