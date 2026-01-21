import express from "express";
import {
  generateArticle,
  generateBlogTitle,
  generateImage,
  removeBackground,
  reviewResume,
  updateUserPlan,
} from "../controllers/aiController.js";
import { auth } from "../middlewares/auth.js";
import multer from "multer";

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const aiRouter = express.Router();
aiRouter.post("/generate-article", auth, generateArticle);
aiRouter.post("/generate-blog-title", auth, generateBlogTitle);
aiRouter.post("/generate-image", auth, generateImage);
aiRouter.post("/remove-background", auth, upload.single("image"), removeBackground);
aiRouter.post("/review-resume", auth, upload.single("resume"), reviewResume);
aiRouter.post("/update-plan", auth, updateUserPlan);

export default aiRouter;
