import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const FinanceAdvice = () => {
  const { currentUser } = useAuth();
  console.log("Current user in FinanceAdvice:", JSON.stringify(currentUser, null, 2));
  const [advice, setAdvice] = useState("Loading advice...");

  useEffect(() => {
    if (!currentUser?._id && !currentUser?.id) {
  setAdvice("No user logged in or ID missing.");
  return;
}


    axios.get(`/api/advice/${currentUser._id || currentUser.id}`)

      .then((res) => setAdvice(res.data.advice))
      .catch((err) => {
        console.error(err);
        setAdvice("Error fetching advice.");
      });
  }, [currentUser]);

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-lg font-bold mb-2">💡 AI Financial Advice</h2>
      <pre>{advice}</pre>
    </div>
  );
};

export default FinanceAdvice;
