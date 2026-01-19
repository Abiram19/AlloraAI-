import { Eraser, Sparkles, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";

const RemoveBackground = () => {
  const [input, setInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { getToken } = useAuth();
  const { user } = useUser();

  const plan = user?.publicMetadata?.plan || user?.privateMetadata?.plan || "free";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setInput(file);
    setError(null);
    setProcessedImage(null);
    
    // Create preview URL
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    if (!input) {
      setError("Please select an image file");
      return;
    }

    setLoading(true);
    setError(null);
    setProcessedImage(null);

    try {
      const token = await getToken({ skipCache: true });
      
      const formData = new FormData();
      formData.append("image", input);

      const response = await fetch("http://localhost:3000/api/ai/remove-background", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setProcessedImage(data.secure_url);
        setError(null);
      } else {
        setError(data.message || "Failed to remove background");
      }
    } catch (err) {
      console.error("Error removing background:", err);
      setError(err.message || "An error occurred while processing the image");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (processedImage) {
      const link = document.createElement("a");
      link.href = processedImage;
      link.download = "background-removed.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start gap-4 text-slate-700 flex-nowrap">
      {/* Left col */}
      <form
        onSubmit={onSubmitHandler}
        className="w-1/2 p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#FF4938]" />
          <h1 className="text-xl font-semibold">Background Removal</h1>
        </div>

        {plan !== "premium" && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⭐ This feature is only available for premium subscription
            </p>
          </div>
        )}

        <p className="mt-6 text-sm font-medium">Upload image</p>
        <input
          type="file"
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          accept="image/*"
          onChange={handleFileChange}
          required
          disabled={loading}
        />

        <p className="text-xs text-gray-500 font-light mt-1">
          Supports JPG, PNG, and other image formats
        </p>

        {previewUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-contain rounded-lg border border-gray-200"
            />
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !input}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#F6AB41] to-[#FF4938] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Eraser className="w-5" />
              Remove Background
            </>
          )}
        </button>
      </form>
      
      {/* Right col */}
      <div className="w-1/2 p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className="flex items-center gap-3">
          <Eraser className="w-5 h-5 text-[#FF4938]" />
          <h1 className="text-xl font-semibold">Processed Image</h1>
        </div>
        <div className="flex-1 flex justify-center items-center">
          {processedImage ? (
            <div className="w-full flex flex-col gap-4">
              <img
                src={processedImage}
                alt="Processed"
                className="w-full h-auto rounded-lg"
                style={{ backgroundColor: "#f0f0f0" }}
              />
              <button
                onClick={downloadImage}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Download Image
              </button>
            </div>
          ) : (
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <Eraser className="w-9 h-9" />
              <p>Upload an image and click "Remove background" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemoveBackground;
