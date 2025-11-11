import { Protect } from "@clerk/clerk-react";
import { Sparkles, Gem } from "lucide-react";
import React, { useState, useEffect } from "react";
import CreationItem from "../components/CreationItem";
import { dummyCreationData } from "../assets/assets";

const Dashboard = () => {
  const [creations, setCreations] = useState([]);

  useEffect(() => {
    setCreations(dummyCreationData);
  }, []);

  return (
    <div className="h-full overflow-y-scroll p-6">
      <div className="flex justify-start gap-4 flex-wrap">
        {/* Total creation card */}
        <div className="flex justify-between items-center w-72 p-4 bg-white rounded-xl border border-gray-200">
          <div className="text-slate-600">
            <p className="text-sm">Total Creations</p>
            <h2 className="text-xl font-semibold">{creations.length} </h2>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center">
            <Sparkles className="w-5 text-white" />
          </div>
        </div>
        {/* Active Plan card */}
        <div className="flex justify-between items-center w-72 p-4 bg-white rounded-xl border border-gray-200">
          <div className="text-slate-600">
            <p className="text-sm">Active Plan</p>
            <h2 className="text-xl font-semibold">
              <Protect plan="premium" fallback="Free">
                Premium
              </Protect>
            </h2>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ec4899] to-[#8b5cf6] text-white flex justify-center items-center">
            <Gem className="w-5 text-white" />
          </div>
        </div>
      </div>
      <div className="mt-6">
        <p className="mb-4 font-medium text-sm text-gray-700">
          Recent Creations
        </p>
        <div className="space-y-3 -mx-06">
          {creations.map((item) => (
            <CreationItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
