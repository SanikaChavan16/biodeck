// src/hooks/useAuthCheck.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function useAuthCheck() {
  const navigate = useNavigate();
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/auth/me"); // server must expose this
        if (mounted && res?.data?.user) navigate("/dashboard", { replace: true });
      } catch (err) {
        /* not logged in — do nothing */
      }
    })();
    return () => { mounted = false; };
  }, [navigate]);
}
