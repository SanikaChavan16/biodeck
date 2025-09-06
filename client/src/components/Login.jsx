// client/src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import useAuthCheck from "../hooks/useAuthCheck";

export default function Login() {
  useAuthCheck(); // redirect to /dashboard if already logged in

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      // expects backend /api/auth/login to set cookie (or return token)
      const res = await api.post("/auth/login", { email, password }, { withCredentials: true });

      // if backend returns a success message or token, handle accordingly
      // If backend sets httpOnly cookie, we can just navigate to dashboard
      if (res.status === 200) {
        setMessage("Login successful! Redirecting...");
        navigate("/dashboard", { replace: true });
      } else {
        setMessage(res.data?.message || "Login successful");
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Login failed. Please try again.";
      setMessage(errMsg);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">Log In</button>
      </form>

      {message && <div className="alert alert-info mt-3">{message}</div>}
    </div>
  );
}
