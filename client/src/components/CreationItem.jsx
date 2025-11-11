import React from "react";

const CreationItem = ({ item = {} }) => {
  // Format the type for display (e.g., "blog-title" -> "Blog Title")
  const formatType = (type) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format date safely
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  // Build a short content preview to increase card height naturally
  const rawContent = (item?.content ?? "").toString().trim();
  const preview = rawContent
    ? (rawContent.length > 110 ? rawContent.slice(0, 110) + "…" : rawContent)
    : "";

  return (
    <div className="py-4 px-6 w-full bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h2 className="font-semibold text-gray-800 text-base">{item?.prompt}</h2>
          <p className="text-gray-500 text-xs mt-1">{formatDate(item?.created_at)}</p>
          {preview && (
            <p className="text-gray-600 text-sm mt-3 leading-relaxed">{preview}</p>
          )}
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium rounded-full whitespace-nowrap hover:from-indigo-600 hover:to-purple-700 transition-all self-start">
          {formatType(item?.type || "")}
        </button>
      </div>
    </div>
  );
};

export default CreationItem;
