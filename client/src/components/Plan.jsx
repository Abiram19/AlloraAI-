import React, { useMemo, useState } from "react";
import { Check, Crown, ShieldCheck } from "lucide-react";
import { useUser, SignInButton, SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const Plan = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const currentPlan = useMemo(() => {
    const metaPlan = user?.publicMetadata?.plan || user?.privateMetadata?.plan;
    return metaPlan || "free";
  }, [user]);

  const plans = useMemo(
    () => [
      {
        id: "free",
        title: "Free Plan",
        price: "$0",
        cadence: "forever",
        accent: "from-[#4A7AFF] to-[#65ADFF]",
        icon: ShieldCheck,
        description: "Great for trying the tools and keeping simple workflows running.",
        features: ["Core AI tools", "Up to 10 free generations", "Community access"],
      },
      {
        id: "premium",
        title: "Subscribe Plan",
        price: "$12",
        cadence: "per month",
        accent: "from-[#FF6A3D] to-[#F6AB41]",
        icon: Crown,
        description: "Full access to premium tools including background removal and exports.",
        features: ["Unlimited premium features", "Priority processing", "Commercial usage"],
      },
    ],
    []
  );

  const setPlan = async (planId) => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setMessage({ type: "error", text: "Please sign in to choose a plan." });
      return;
    }

    if (planId === "premium") {
      // Navigate to checkout page
      navigate("/checkout");
      return;
    }

    // For free plan, just update metadata
    setLoadingPlan(planId);
    setMessage({ type: "", text: "" });
    try {
      // Call backend to update plan
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      const response = await fetch("http://localhost:3000/api/ai/update-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      // Check if response is valid JSON
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server error: Invalid response format. Make sure the backend server is running on port 3000.");
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      setMessage({ type: "success", text: data.message });
      // Refresh user data to reflect the new plan
      await user?.reload();
    } catch (err) {
      console.error("Plan update error:", err);
      setMessage({ type: "error", text: err?.message || "Could not update plan." });
    } finally {
      setLoadingPlan("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto z-20 my-30 px-4">
      <div className="text-center">
        <h2 className="text-slate-700 text-[42px] font-semibold mb-4">
          Choose Your Plan
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Stay on Free or subscribe to unlock premium AI tools. Your choice is saved to your account.
        </p>
      </div>

      {message.text && (
        <div
          className={`mt-6 mx-auto max-w-xl rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                isCurrent ? "border-blue-500" : "border-gray-200"
              }`}
            >
              {isCurrent && (
                <span className="absolute right-4 top-4 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Current Plan
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className={`rounded-full bg-gradient-to-r ${plan.accent} p-3 text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-800">{plan.title}</p>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </div>
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-800">{plan.price}</span>
                <span className="text-sm text-gray-500">{plan.cadence}</span>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <SignedIn>
                <button
                  onClick={() => setPlan(plan.id)}
                  disabled={loadingPlan === plan.id || isCurrent}
                  className={`mt-6 w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isCurrent
                      ? "bg-gray-100 text-gray-500 cursor-default"
                      : "bg-gradient-to-r from-[#4A7AFF] to-[#65ADFF] text-white hover:opacity-90"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loadingPlan === plan.id ? "Saving..." : isCurrent ? "Selected" : "Choose plan"}
                </button>
              </SignedIn>

              <SignedOut>
                <div className="mt-6 w-full">
                  <SignInButton mode="modal">
                    <button className="w-full rounded-lg bg-gradient-to-r from-[#4A7AFF] to-[#65ADFF] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                      Sign in to choose
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Plan;
