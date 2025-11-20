import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Heart } from "lucide-react";
import { dummyPublishedCreationData } from "../assets/assets";

const Community = () => {
  const [creations, setcreations] = useState([]);
  const { user } = useUser();

  const fetchcreations = async () => {
    setcreations(dummyPublishedCreationData);
  };

  useEffect(() => {
    if (user) {
      fetchcreations();
    }
  }, [user]);

  return (
    <div className="flex-1 h-full flex flex-col gap-4 p-6 overflow-y-scroll">
      <h2 className="text-xl font-semibold">Community Creations</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {creations.map((creation, index) => (
          <div key={index} className="relative group">
            <img
              src={creation.content}
              alt=""
              className="w-full h-64 object-cover rounded-lg"
            />
            <div className="absolute bottom-0 top-0 right-0 left-0 flex gap-2 items-end justify-end group-hover:justify-between p-3 group-hover:bg-gradient-to-b from-transparent to-black/80 text-white rounded-lg transition-all">
              <p className="text-sm hidden group-hover:block">
                {creation.prompt}
              </p>
              <div className="flex gap-1 items-center">
                <p>{creation.likes.length}</p>
                <Heart
                  className={`min-w-5 h-5 hover:scale-110 cursor-pointer transition ${
                    creation.likes.includes(user?.id)
                      ? "fill-red-500 text-red-600"
                      : "text-white"
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Community;
