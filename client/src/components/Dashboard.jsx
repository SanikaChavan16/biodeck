// client/src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [message, setMessage] = useState("Loading dashboard...");

  useEffect(() => {
    // Example: later you can call API to fetch dashboard data
    setTimeout(() => {
      setMessage("Welcome to your BioDeck Dashboard 🎉");
    }, 1000);
  }, []);

  return (
    <div className="container mt-5">
      <h2>Dashboard</h2>
      <p>{message}</p>
    </div>
  );
}
