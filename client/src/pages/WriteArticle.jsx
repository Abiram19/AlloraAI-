import { Sparkles, Edit } from "lucide-react";
import React, { useState } from "react";

const WriteArticle = () => {
  const articleLengthOptions = [
    { value: 800, label: "Short (500–800 words)" },
    { value: 1200, label: "Medium (800–1200 words)" },
    { value: 1600, label: "Long (1200+ words)" },
  ];

  const [selectedLength, setSelectedLength] = useState(
    articleLengthOptions[0].value
  );
  const [input, setInput] = useState("");

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
          <Sparkles className="w-6 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">Article Configuration</h1>
        </div>
        <p className="mt-6 text-sm font-medium">Article Topic</p>
        <input
          type="text"
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="The future of artificial intelligence is..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
        />
        <p className="mt-4 text-sm font-medium">Article Length </p>
        <div className="mt-3 flex gap-2 flex-wrap">
          {articleLengthOptions.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setSelectedLength(opt.value)}
              className={`text-xs px-4 py-1 rounded-full border transition-colors ${
                selectedLength === opt.value
                  ? "bg-[#5044e5] text-white border-transparent"
                  : "bg-white text-slate-700 border-gray-300 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <br />
        <button className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#226BFF] to-[#65ADFF] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer">
          <Edit className="w-5" />
          Generate article
        </button>
      </form>
      {/* Right col */}
      <div className="w-1/2 p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]">
        <div className="flex items-center gap-3">
          <Edit className="w-5 h-5 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">Generated Article</h1>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
            <Edit className="w-9 h-9" />
            <p>Enter a topic and click "Generate article" to get started.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteArticle;
