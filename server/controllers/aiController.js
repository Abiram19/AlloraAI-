import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req, res) => {
  try {
    // Debug: inspect auth context
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

    // Ensure prompt requests a full article from the start
    if (!/^write|generate|create/i.test(prompt.trim())) {
      prompt = `Write a complete article starting from the introduction. Topic: ${prompt}`;
    } else {
      prompt = `Write a complete article starting from the introduction. ${prompt}`;
    }
    // Use a higher max_tokens to avoid truncation
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
