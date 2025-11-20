import { Image, Sparkles, Hash } from "lucide-react";
import React, { useState } from "react";

const GenerateImages = () => {
  const imageStyles = [
    "Realistic",
    "Ghicli style",
    "Anime Style",
    "Cartoon Style",
    "Fantacy style",
    "Realistic style",
    "3D style",
    "Portrait style",
  ];

  const [selectedStyle, setSelectedStyle] = useState("Realistic");
  const [input, setInput] = useState("");
  const [publish, setPublish] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start gap-4 text-slate-700 flex-nowrap">
      {/* Left col */}
      <form
        onSubmit={onSubmitHandler}
        className="w-1/2 p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">AI Image Generator</h1>
        </div>
        <p className="mt-6 text-sm font-medium">Describe Your Image</p>
        <textarea
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="describe what you want to see in the image.."
          value={input}
          rows={4}
          onChange={(e) => setInput(e.target.value)}
          required
        />
        <p className="mt-4 text-sm font-medium">Style </p>
        <div className="mt-3 flex gap-2 flex-wrap">
          {imageStyles.map((item) => (
            <button
              type="button"
              onClick={() => setSelectedStyle(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer transition-colors ${
                selectedStyle === item
                  ? "bg-green-50 text-green-700 border-green-300"
                  : "text-gray-500 border-gray-300 hover:bg-gray-50"
              }`}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="my-6 flex items-center gap-3">
          <label
            htmlFor="publishToggle"
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="relative">
              <input
                id="publishToggle"
                type="checkbox"
                checked={publish}
                onChange={(e) => setPublish(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 rounded-full bg-slate-300 peer-checked:bg-green-500 transition-colors"></div>
              <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4"></div>
            </div>
            <span className="text-sm">Make this image public</span>
          </label>
        </div>

        <button className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00AD25] to-[#04FF50] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer">
          <Image className="w-5" />
          Generate Image
        </button>
      </form>
      {/* Right col */}
      <div className="w-1/2 p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]">
        <div className="flex items-center gap-3">
          <Image className="w-5 h-5 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">Generated Image</h1>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
            <Image className="w-9 h-9" />
            <p>
              Describe your image and click "Generate Image" to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateImages;
