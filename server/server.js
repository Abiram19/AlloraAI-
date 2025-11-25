import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import aiRouter from "./routes/aiRoutes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Configure Clerk middleware with secret key
// Clerk middleware auto-reads keys from env; no manual config object needed
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("Server is Live!");
});

// Mount AI routes; auth handled inside /middlewares/auth.js with fallback decoding
app.use(
  "/api/ai",
  (req, _res, next) => {
    if (!req.auth?.userId) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const parts = token.split(".");
        if (parts.length === 3) {
          try {
            const payloadJson = Buffer.from(parts[1], "base64").toString(
              "utf8"
            );
            const payload = JSON.parse(payloadJson);
            req.auth = { userId: payload.sub, has: () => false };
          } catch (e) {
            console.warn("Pre-router JWT decode failed:", e.message);
          }
        }
      }
    }
    next();
  },
  aiRouter
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
