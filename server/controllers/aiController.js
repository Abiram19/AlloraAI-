import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import FormData from "form-data";
import https from "https";

// Ensure Cloudinary is configured
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Separate OpenAI client for image generation (if OPENAI_API_KEY set)
const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const generateArticle = async (req, res) => {
  try {
    console.log("generateArticle req.auth:", req.auth);
    const { userId } = req.auth || {};
    let { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10)
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });

    if (!/^write|generate|create/i.test(prompt.trim())) {
      prompt = `Write a complete article starting from the introduction. Topic: ${prompt}`;
    } else {
      prompt = `Write a complete article starting from the introduction. ${prompt}`;
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: Math.max(Number(length) || 1200, 2048),
    });

    const content = response.choices?.[0]?.message?.content || "";
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Auth missing userId" });
    }
    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article') `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({
      success: true,
      content,
      message: "Article generated successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    console.log("generateBlogTitle req.auth:", req.auth);
    const { userId } = req.auth || {};
    let { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10)
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });

    if (!/^write|generate|create/i.test(prompt.trim())) {
      prompt = `Write a complete article starting from the introduction. Topic: ${prompt}`;
    } else {
      prompt = `Write a complete article starting from the introduction. ${prompt}`;
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices?.[0]?.message?.content || "";
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Auth missing userId" });
    }
    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title') `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({
      success: true,
      content,
      message: "Blog title generated successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    console.log("[generateImage] req.auth:", req.auth);
    const { userId } = req.auth || {};
    let { prompt, publish } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    console.log("[generateImage] userId:", userId, "| plan:", plan, "| free_usage:", free_usage);

    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "This feature is only available for premium subscription.",
      });
    }

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: "Prompt required" });
    }

    let imageBase64 = null;
    let provider = null;

    // Try OpenAI responses API with image_generation tool (if key available)
    if (openaiClient) {
      try {
        console.log("[generateImage] Attempting OpenAI responses API with image_generation...");
        const response = await openaiClient.responses.create({
          model: "gpt-5",
          input: prompt,
          tools: [{ type: "image_generation" }],
        });

        const imageData = response.output
          .filter((output) => output.type === "image_generation_call")
          .map((output) => output.result);

        if (imageData.length > 0 && imageData[0]) {
          imageBase64 = imageData[0];
          provider = "openai";
          console.log("[generateImage] OpenAI responses API image generated successfully.");
        } else {
          console.warn("[generateImage] No image in OpenAI responses output.");
        }
      } catch (err) {
        console.warn("[generateImage] OpenAI responses API error:", err.message);
      }
    }

    // Fallback: try Pollinations
    if (!imageBase64 && plan === "premium") {
      try {
        console.log("[generateImage] Attempting Pollinations fallback...");
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
        const pollRes = await axios.get(pollinationsUrl, {
          responseType: "arraybuffer",
          validateStatus: () => true,
        });

        if (pollRes.status === 200) {
          imageBase64 = `data:image/png;base64,${Buffer.from(pollRes.data, "binary").toString("base64")}`;
          provider = "pollinations";
          console.log("[generateImage] Pollinations image generated successfully.");
        } else {
          console.warn("[generateImage] Pollinations failed status:", pollRes.status);
        }
      } catch (err) {
        console.warn("[generateImage] Pollinations error:", err.message);
      }
    }

    // Last resort: placeholder
    if (!imageBase64 && plan === "premium") {
      try {
        console.log("[generateImage] Creating placeholder...");
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='768' height='512'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='#4A7AFF'/><stop offset='100%' stop-color='#65ADFF'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><text x='50%' y='50%' fill='#fff' font-size='28' font-family='Arial' text-anchor='middle' dominant-baseline='middle'>Image temporarily unavailable</text></svg>`;
        imageBase64 = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
        provider = "placeholder";
        console.log("[generateImage] Placeholder created.");
      } catch (err) {
        console.warn("[generateImage] Placeholder error:", err.message);
      }
    }

    // If all failed, return error
    if (!imageBase64) {
      return res.status(502).json({
        success: false,
        message: "Image generation is temporarily unavailable. Please try again later.",
      });
    }

    // Upload to Cloudinary
    try {
      const base64Image = imageBase64.startsWith("data:")
        ? imageBase64
        : `data:image/png;base64,${imageBase64}`;

      console.log("[generateImage] Uploading to Cloudinary... base64 length:", base64Image.length);
      const uploadResult = await cloudinary.uploader.upload(base64Image);
      console.log("[generateImage] Cloudinary upload successful. URL:", uploadResult.secure_url);
      const { secure_url } = uploadResult;

      if (!userId) {
        console.warn("[generateImage] Missing userId after image generation");
        return res.status(401).json({ success: false, message: "Auth missing userId" });
      }

      console.log("[generateImage] Saving to database... userId:", userId);
      await sql`INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;
      console.log("[generateImage] Image saved to database successfully");

      res.json({ success: true, secure_url, provider });
    } catch (uploadErr) {
      console.error("[generateImage] Cloudinary upload or DB save failed:", uploadErr.message, uploadErr.stack);
      return res.status(500).json({ success: false, message: `Failed to save image: ${uploadErr.message}` });
    }
  } catch (error) {
    console.error("[generateImage] Unexpected error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const removeBackground = async (req, res) => {
  try {
    console.log("[removeBackground] Starting background removal...");
    const { userId } = req.auth || {};
    const plan = req.plan;

    // Premium-only check
    if (plan !== "premium") {
      console.log("[removeBackground] Non-premium user attempted access. Plan:", plan);
      return res.status(402).json({
        success: false,
        message: "This feature is only available for premium subscription",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      console.log("[removeBackground] No file uploaded");
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    console.log("[removeBackground] File received:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Convert buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    
    console.log("[removeBackground] Uploading to Cloudinary with background removal...");
    
    // Upload to Cloudinary with AI background removal transformation
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: "background-removal",
      resource_type: "image",
      transformation: [
        { effect: "background_removal" }
      ]
    });

    console.log("[removeBackground] Cloudinary processing successful:", uploadResult.secure_url);

    // Save to database
    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${"Background Removal"}, ${uploadResult.secure_url}, ${"background-removal"}, ${false})
    `;

    console.log("[removeBackground] Saved to database successfully");

    res.json({
      success: true,
      secure_url: uploadResult.secure_url,
      message: "Background removed successfully",
    });
  } catch (error) {
    console.error("[removeBackground] Error:", error.message);
    if (error.response) {
      console.error("[removeBackground] API Error Status:", error.response.status);
      console.error("[removeBackground] API Error Data:", error.response.data?.toString());
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove background",
    });
  }
};

export const reviewResume = async (req, res) => {
  try {
    console.log("[reviewResume] Starting resume review...");
    const { userId } = req.auth || {};
    const plan = req.plan;
    const free_usage = req.free_usage;

    // Check usage limits
    if (plan !== "premium" && free_usage >= 10) {
      return res.status(402).json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      console.log("[reviewResume] No file uploaded");
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      });
    }

    console.log("[reviewResume] File received:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Verify it's a PDF
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Only PDF files are supported",
      });
    }

    console.log("[reviewResume] Analyzing resume...");

    // Mock resume review data - Replace with real API once authenticated
    const mockReviewData = {
      ats_score: 7.8,
      format_score: 8.2,
      content_score: 7.5,
      keyword_score: 7.3,
      strengths: [
        "Clear and concise formatting with proper section headers",
        "Good use of action verbs and quantifiable achievements",
        "Professional contact information and LinkedIn profile included",
        "Relevant work experience aligned with target position",
        "Educational background clearly presented"
      ],
      improvements: [
        "Add more industry-specific keywords to improve ATS matching",
        "Expand bullet points with more quantifiable metrics",
        "Consider adding a professional summary or objective section",
        "Ensure consistent date formatting throughout the document",
        "Add relevant certifications or technical skills section"
      ],
      summary: "Your resume shows strong potential with a solid foundation. The formatting is professional and easy to parse. To further improve your ATS score, focus on incorporating more industry keywords and expanding your achievements with specific metrics. Consider restructuring some sections for better visual hierarchy.",
      filename: req.file.originalname,
      analysis_date: new Date().toISOString(),
    };

    console.log("[reviewResume] Mock analysis complete");

    // Save to database
    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${"Resume Review: " + req.file.originalname}, ${JSON.stringify(mockReviewData)}, ${"resume-review"}, ${false})
    `;

    // Update usage if not premium
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    console.log("[reviewResume] Resume review saved to database");

    res.json({
      success: true,
      data: mockReviewData,
      message: "Resume reviewed successfully",
    });
  } catch (error) {
    console.error("[reviewResume] Error:", error.message);
    console.error("[reviewResume] Error stack:", error.stack);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to review resume",
    });
  }
};

export const updateUserPlan = async (req, res) => {
  try {
    console.log("[updateUserPlan] Request received", { userId: req.auth?.userId, body: req.body });
    
    const { userId } = req.auth || {};
    const { planId } = req.body;

    if (!userId) {
      console.error("[updateUserPlan] Missing userId");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!planId) {
      console.error("[updateUserPlan] Missing planId");
      return res.status(400).json({ success: false, message: "planId is required" });
    }

    console.log("[updateUserPlan] Updating user metadata for userId:", userId, "planId:", planId);

    // Update user metadata in Clerk
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { plan: planId },
      privateMetadata: { free_usage: 0 },
    });

    console.log("[updateUserPlan] User metadata updated successfully");

    res.json({
      success: true,
      message: planId === "premium" ? "Subscribed to Premium." : "Switched to Free.",
    });
  } catch (error) {
    console.error("[updateUserPlan] Error:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update plan",
    });
  }
};
