// client/src/components/VerifyEmail.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Verifying...");

  useEffect(() => {
    (async () => {
      try {
        const jwtFromRedirect = searchParams.get("token");
        const verifiedFlag = searchParams.get("verified");

        if (jwtFromRedirect) {
          localStorage.setItem("token", jwtFromRedirect);
          setMsg("Email verified. Redirecting to dashboard...");
          setTimeout(() => navigate("/dashboard"), 800);
          return;
        }

        const token = searchParams.get("token");
        const email = searchParams.get("email");
        if (!token || !email) {
          setMsg("Invalid verification link.");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/auth/verify-email", {
          params: { token, email },
        });

        if (res.data?.token) {
          localStorage.setItem("token", res.data.token);
        }

        setMsg(res.data?.message || "Verification successful. Redirecting...");
        setTimeout(() => navigate("/dashboard"), 800);
      } catch (err) {
        console.error("verify error", err);
        const serverMsg = err?.response?.data || err.message;
        if (serverMsg && serverMsg.toString().toLowerCase().includes("already")) {
          setMsg("Email already verified. Redirecting...");
          setTimeout(() => navigate("/dashboard"), 800);
          return;
        }
        setMsg(serverMsg || "Verification failed");
      }
    })();
  }, [searchParams, navigate]);

  return (
    <div className="container mt-5">
      <h3>Email verification</h3>
      <div className="alert alert-info">{msg}</div>
    </div>
  );
}
