import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Layout from "./pages/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import WriteArticle from "./pages/WriteArticle.jsx";
import BlogTitles from "./pages/BlogTitles.jsx";
import GenerateImages from "./pages/GenerateImages.jsx";
import RemoveBackground from "./pages/RemoveBackground.jsx";
import RemoveObject from "./pages/RemoveObject.jsx";
import Reviewresume from "./pages/Reviewresume.jsx";
import Community from "./pages/Community.jsx";
import { useAuth } from "@clerk/clerk-react";

const z = () => {
  const { getToken, isLoaded } = useAuth();
  useEffect(() => {
    if (!isLoaded) return; // wait until Clerk fully loaded to avoid timeout issues
    getToken()
      .then((token) => {
        console.info("[Auth] token prefix:", token?.slice(0, 12));
      })
      .catch((e) => console.warn("[Auth] getToken error:", e.message));
  }, [isLoaded, getToken]);

  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ai" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="write-article" element={<WriteArticle />} />
          <Route path="blog-titles" element={<BlogTitles />} />
          <Route path="generate-images" element={<GenerateImages />} />
          <Route path="remove-background" element={<RemoveBackground />} />
          <Route path="remove-object" element={<RemoveObject />} />
          <Route path="review-resume" element={<Reviewresume />} />
          <Route path="community" element={<Community />} />
        </Route>
      </Routes>
    </div>
  );
};

export default z;
