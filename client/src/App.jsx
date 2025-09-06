// client/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./components/Landing";
import Signup from "./components/Signup";
import VerifyEmail from "./components/VerifyEmail";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import DeckAdminPage from "./pages/DeckAdminPage";
// import DeckAdminPage from "./pages/DeckAdminPage";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
         <Route path="/" element={<Landing />} />
         <Route path="/signup" element={<Signup />} />
         <Route path="/login" element={<Login />} />
         <Route path="/admin/decks/:id" element={<DeckAdminPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/decks/:id" element={<DeckAdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
