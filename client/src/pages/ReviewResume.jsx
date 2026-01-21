import { FileText, Sparkles, Loader2, Download, CheckCircle, AlertCircle } from "lucide-react";
import React, { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";

const ReviewResume = () => {
  const [input, setInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();
  const { user } = useUser();

  const plan = user?.publicMetadata?.plan || user?.privateMetadata?.plan || "free";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setInput(file);
    setError(null);
    setReviewData(null);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!input) {
      setError("Please select a PDF file");
      return;
    }

    setLoading(true);
    setError(null);
    setReviewData(null);

    try {
      const token = await getToken({ skipCache: true });

      const formData = new FormData();
      formData.append("resume", input);

      const response = await fetch("http://localhost:3000/api/ai/review-resume", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.warn("Non-JSON response:", text);
        setError("Server returned an invalid response. Please try again.");
        return;
      }

      if (data.success) {
        setReviewData(data.data);
        setError(null);
      } else {
        setError(data.message || "Failed to review resume");
      }
    } catch (err) {
      console.error("Error reviewing resume:", err);
      setError(err.message || "An error occurred while reviewing the resume");
    } finally {
      setLoading(false);
    }
  };

  const renderScore = (label, score) => {
    const percentage = (score / 10) * 100;
    const getColor = (score) => {
      if (score >= 8) return "text-green-600";
      if (score >= 6) return "text-yellow-600";
      return "text-red-600";
    };

    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{label}</span>
          <span className={`text-sm font-bold ${getColor(score)}`}>{score}/10</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              score >= 8 ? "bg-green-600" : score >= 6 ? "bg-yellow-600" : "bg-red-600"
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start gap-4 text-slate-700 flex-nowrap">
      {/* Left col */}
      <form
        onSubmit={onSubmitHandler}
        className="w-1/2 p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">Resume Review & ATS Scoring</h1>
        </div>
        <p className="mt-6 text-sm font-medium">Upload Resume</p>
        <input
          type="file"
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          accept="application/pdf"
          onChange={handleFileChange}
          required
          disabled={loading}
        />

        <p className="text-xs text-gray-500 font-light mt-1">
          Supports PDF resume only (Max 10MB)
        </p>

        {input && (
          <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs text-gray-600">
              <FileText className="w-3 h-3 inline mr-1" />
              Selected: {input.name}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00DA83] to-[#009BB3] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileText className="w-5" />
              Review Resume
            </>
          )}
        </button>
      </form>

      {/* Right col */}
      <div className="w-1/2 p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">Analysis Results</h1>
        </div>

        {!reviewData && !loading && (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <FileText className="w-9 h-9" />
              <p>Upload a resume and click "Review Resume" to get started.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <Loader2 className="w-9 h-9 animate-spin" />
              <p>Analyzing your resume...</p>
            </div>
          </div>
        )}

        {reviewData && (
          <div className="space-y-6">
            {/* Overall ATS Score */}
            {reviewData.ats_score !== undefined && (
              <div className="p-4 bg-gradient-to-r from-[#00DA83]/10 to-[#009BB3]/10 rounded-lg border border-[#00DA83]/30">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#00DA83]" />
                  ATS Score
                </h2>
                {renderScore("ATS Compatibility", reviewData.ats_score)}
              </div>
            )}

            {/* Detailed Scores */}
            {(reviewData.format_score || reviewData.content_score || reviewData.keyword_score) && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Detailed Scores</h2>
                {reviewData.format_score && renderScore("Format Quality", reviewData.format_score)}
                {reviewData.content_score && renderScore("Content Quality", reviewData.content_score)}
                {reviewData.keyword_score && renderScore("Keyword Optimization", reviewData.keyword_score)}
              </div>
            )}

            {/* Strengths */}
            {reviewData.strengths && reviewData.strengths.length > 0 && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h2 className="text-lg font-semibold mb-3 text-green-600">Strengths</h2>
                <ul className="space-y-2">
                  {reviewData.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {reviewData.improvements && reviewData.improvements.length > 0 && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h2 className="text-lg font-semibold mb-3 text-orange-600">Areas for Improvement</h2>
                <ul className="space-y-2">
                  {reviewData.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary */}
            {reviewData.summary && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">Summary</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{reviewData.summary}</p>
              </div>
            )}

            {/* Raw data fallback - in case API returns different structure */}
            {!reviewData.ats_score && !reviewData.strengths && !reviewData.summary && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">Review Results</h2>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                  {JSON.stringify(reviewData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewResume;
