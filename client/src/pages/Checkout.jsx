import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Crown } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

const Checkout = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cardType, setCardType] = useState("");
  const [formData, setFormData] = useState({
    cardNumber: "",
    expirationDate: "",
    securityCode: "",
    fullName: "",
    country: "",
    addressLine: "",
  });

  // Detect card type from card number
  const detectCardType = (number) => {
    const cleanNumber = number.replace(/\s/g, "");
    
    if (/^4/.test(cleanNumber)) return "visa";
    if (/^5[1-5]/.test(cleanNumber) || /^2(22[1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[0-1][0-9]|720)/.test(cleanNumber)) {
      return "mastercard";
    }
    if (/^3[47]/.test(cleanNumber)) return "amex";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "cardNumber") {
      const cleanValue = value.replace(/\D/g, "");
      const limitedValue = cleanValue.slice(0, 16);
      const formattedValue = limitedValue.replace(/(\d{4})/g, "$1 ").trim();
      
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
      setCardType(detectCardType(limitedValue));
    } else if (name === "expirationDate") {
      const cleanValue = value.replace(/\D/g, "");
      
      // Limit month input to 01-12
      if (cleanValue.length >= 2) {
        const month = parseInt(cleanValue.slice(0, 2));
        if (month > 12) return; // Don't allow month > 12
      }
      
      // Limit year input to maximum 10 years from now
      if (cleanValue.length >= 4) {
        const year = parseInt("20" + cleanValue.slice(2, 4));
        const currentYear = new Date().getFullYear();
        const maxYear = currentYear + 10;
        if (year > maxYear) return; // Don't allow year > maxYear
      }
      
      const limitedValue = cleanValue.slice(0, 4);
      const formattedValue = limitedValue.length >= 2 
        ? `${limitedValue.slice(0, 2)}/${limitedValue.slice(2)}` 
        : limitedValue;
      
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    } else if (name === "securityCode") {
      const cleanValue = value.replace(/\D/g, "").slice(0, 3);
      setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const cleanCardNumber = formData.cardNumber.replace(/\s/g, "");
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      setError("Please enter a valid card number");
      setLoading(false);
      return;
    }

    const expParts = formData.expirationDate.split("/");
    if (expParts.length !== 2) {
      setError("Please enter a valid expiration date (MM/YY)");
      setLoading(false);
      return;
    }
    const month = parseInt(expParts[0]);
    const year = parseInt("20" + expParts[1]);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const maxYear = currentYear + 10;
    
    if (month < 1 || month > 12) {
      setError("Month must be between 01 and 12");
      setLoading(false);
      return;
    }
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      setError("Card has expired");
      setLoading(false);
      return;
    }
    if (year > maxYear) {
      setError(`Year cannot be more than ${maxYear}`);
      setLoading(false);
      return;
    }

    if (formData.securityCode.length !== 3) {
      setError("CVV must be exactly 3 digits");
      setLoading(false);
      return;
    }

    if (!formData.fullName.trim()) {
      setError("Please enter your full name");
      setLoading(false);
      return;
    }

    if (!formData.country) {
      setError("Please select a country");
      setLoading(false);
      return;
    }

    if (!formData.addressLine.trim()) {
      setError("Please enter your address");
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch("http://localhost:3000/api/ai/update-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: "premium" }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Payment failed");
      }

      // Show success state
      setSuccess(true);
      setFormData({ cardNumber: "", expirationDate: "", securityCode: "", fullName: "", country: "", addressLine: "" });
      
      // Reload user to get updated metadata
      if (user) {
        await user.reload();
      }
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/ai");
      }, 2000);
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-full animate-bounce">
            <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-3">Payment Successful!</h2>
          <p className="text-gray-300 mb-2 text-lg">Welcome to Premium</p>
          <p className="text-gray-400 mb-8">You now have access to all premium features. Redirecting to dashboard...</p>
          
          <div className="space-y-3">
            <p className="text-green-400 font-semibold flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              Subscription activated
            </p>
            <p className="text-blue-400 font-semibold flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              Premium access granted
            </p>
          </div>
          
          <button
            onClick={() => navigate("/ai")}
            className="mt-8 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all duration-300 shadow-xl"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/")}
            className="p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl transition-all duration-300 group"
          >
            <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform duration-300" />
          </button>
          <h1 className="text-4xl font-bold text-white">Configure your plan</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-xl text-red-200 animate-pulse">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Method */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                Payment method
              </h2>
              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    placeholder="Card number"
                    required
                    className="w-full px-4 py-4 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-400 border border-white/20 group-hover:border-white/30"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                    {cardType === "visa" && (
                      <div className="bg-white rounded px-2 py-1 animate-fadeIn">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
                          alt="Visa"
                          className="h-5"
                        />
                      </div>
                    )}
                    {cardType === "mastercard" && (
                      <div className="bg-white rounded px-2 py-1 animate-fadeIn">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                          alt="Mastercard"
                          className="h-5"
                        />
                      </div>
                    )}
                    {cardType === "amex" && (
                      <div className="bg-white rounded px-2 py-1 animate-fadeIn">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg"
                          alt="American Express"
                          className="h-5"
                        />
                      </div>
                    )}
                    {!cardType && (
                      <>
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
                          alt="Visa"
                          className="h-5 opacity-20"
                        />
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                          alt="Mastercard"
                          className="h-5 opacity-20"
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    required
                    className="px-4 py-4 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-400 border border-white/20 hover:border-white/30"
                  />
                  <input
                    type="text"
                    name="securityCode"
                    value={formData.securityCode}
                    onChange={handleChange}
                    placeholder="CVV"
                    required
                    className="px-4 py-4 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-400 border border-white/20 hover:border-white/30"
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6">Billing address</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                  className="w-full px-4 py-4 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-400 border border-white/20 hover:border-white/30"
                />
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all border border-white/20 hover:border-white/30 cursor-pointer"
                >
                  <option value="" className="bg-slate-800">Country or region</option>
                  <option value="US" className="bg-slate-800">United States</option>
                  <option value="LK" className="bg-slate-800">Sri Lanka</option>
                  <option value="IN" className="bg-slate-800">India</option>
                  <option value="UK" className="bg-slate-800">United Kingdom</option>
                  <option value="CA" className="bg-slate-800">Canada</option>
                </select>
                <input
                  type="text"
                  name="addressLine"
                  value={formData.addressLine}
                  onChange={handleChange}
                  placeholder="Address line 1"
                  required
                  className="w-full px-4 py-4 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-400 border border-white/20 hover:border-white/30"
                />
              </div>
            </div>
          </form>

          {/* Plan Summary */}
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 shadow-2xl h-fit sticky top-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Subscribe Plan</h2>
            </div>
            
            <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Top features</h3>
              <ul className="space-y-3 text-white">
                <li className="flex items-start gap-3 group">
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300">∞</span>
                  <span className="leading-relaxed">Unlimited premium features</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300">⚡</span>
                  <span className="leading-relaxed">Priority processing</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300">🎨</span>
                  <span className="leading-relaxed">Advanced AI tools access</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300">💼</span>
                  <span className="leading-relaxed">Commercial usage rights</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3 mb-6">
              <div className="flex justify-between text-white/90">
                <span>Monthly subscription</span>
                <span className="font-semibold">$12.00</span>
              </div>
              <div className="flex justify-between text-white/90">
                <span>Tax (0%)</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="flex justify-between text-white text-2xl font-bold pt-3 border-t border-white/20">
                <span>Due today</span>
                <span>$12.00</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-white text-purple-600 font-bold py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-105 transform"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Subscribe Now"
              )}
            </button>
            
            <p className="text-center text-white/70 text-sm mt-4">
              🔒 Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
