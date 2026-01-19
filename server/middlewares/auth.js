import { clerkClient } from "@clerk/express";

// Middleware to check  userID and hasPremiumPlan
export const auth = async (req, res, next) => {
  try {
    // Support both deprecated req.auth object and new req.auth() function
    const authInfo = typeof req.auth === "function" ? (req.auth() || {}) : (req.auth || {});
    let { userId, has, sessionClaims } = authInfo;

    // DEV FALLBACK: decode Bearer JWT if req.auth missing (Clerk redirect issues)
    if (!userId) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const parts = token.split(".");
        if (parts.length === 3) {
          try {
            const payloadJson = Buffer.from(parts[1], "base64").toString(
              "utf8"
            );
            const payload = JSON.parse(payloadJson);
            userId = payload.sub; // Clerk user id in dev
          } catch (e) {
            console.warn("JWT decode failed:", e.message);
          }
        }
      }
    }

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - No userId" });
    }

    const user = await clerkClient.users.getUser(userId);
    
    // Determine plan: prefer Clerk permissions via req.auth.has, else metadata
    const metaPlan = user.publicMetadata?.plan || user.privateMetadata?.plan || "free";
    // Some Clerk setups include plan in session claims, e.g., sessionClaims.pla === 'u:premium'
    const claimPlan = sessionClaims?.pla === 'u:premium' ? 'premium' : undefined;
    const hasPremiumPermission = typeof has === "function" && !!has({ permission: "premiumPlan" });
    let plan = hasPremiumPermission ? "premium" : (claimPlan || metaPlan);

    // LAST RESORT: decode Bearer token to inspect 'pla' claim if still not premium
    if (plan !== "premium") {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const parts = token.split(".");
        if (parts.length === 3) {
          try {
            const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
            const payload = JSON.parse(payloadJson);
            if (payload.pla === "u:premium") {
              plan = "premium";
              console.log("[Auth Middleware] Upgraded plan to premium from JWT 'pla' claim.");
            } else {
              console.log("[Auth Middleware] JWT payload 'pla' claim not premium:", payload.pla);
            }
          } catch (e) {
            console.warn("[Auth Middleware] JWT parse failed for plan check:", e.message);
          }
        }
      }
    }

    console.log("[Auth Middleware] userId:", userId, "| final plan:", plan, "| hasPremiumPermission:", hasPremiumPermission, "| claimPlan:", claimPlan, "| publicMetadata:", user.publicMetadata, "| privateMetadata:", user.privateMetadata);
    const hasPremiumPlan = plan === "premium";

    if (!hasPremiumPlan && typeof user.privateMetadata?.free_usage === "number") {
      req.free_usage = user.privateMetadata.free_usage;
    } else {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: 0 },
      });
      req.free_usage = 0;
    }

    req.plan = plan;
    next();
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
