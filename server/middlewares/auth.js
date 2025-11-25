import { clerkClient } from "@clerk/express";

// Middleware to check  userID and hasPremiumPlan
export const auth = async (req, res, next) => {
  try {
    // clerkMiddleware + requireAuth populated req.auth
    let { userId, has } = req.auth || {};

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

    const hasPremiumPlan = has?.({ permission: "premiumPlan" }) || false;
    const user = await clerkClient.users.getUser(userId);

    if (!hasPremiumPlan && user.privateMetadata.free_usage) {
      req.free_usage = user.privateMetadata.free_usage;
    } else {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: 0 },
      });
      req.free_usage = 0;
    }

    req.plan = hasPremiumPlan ? "premium" : "free";
    next();
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
