// // src/components/Landing.jsx
// import React from "react";
// import { Link } from "react-router-dom";
// import useAuthCheck from "../hooks/useAuthCheck";

// export default function Landing() {
//   useAuthCheck(); // redirects to /dashboard if already logged in
//   return (
//     <div style={{ padding: 40, fontFamily: "Inter, system-ui, sans-serif" }}>
//       <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <h1 style={{ color: "#0b5cff" }}>BioDeck</h1>
//         <nav>
//           <Link to="/login" style={{ marginRight: 16 }}>Login</Link>
//           <Link to="/signup" style={{ padding: "8px 12px", background: "#0b5cff", color: "#fff", borderRadius: 6 }}>Get Started</Link>
//         </nav>
//       </header>

//       <main style={{ marginTop: 60, display: "grid", gridTemplateColumns: "1fr 360px", gap: 40 }}>
//         <section>
//           <h2 style={{ fontSize: 32 }}>AI feedback + secure investor matchmaking for life sciences</h2>
//           <p style={{ color: "#444" }}>Upload your pitch deck, get AI feedback, and safely match with investors.</p>
//           <Link to="/signup" style={{ display: "inline-block", marginTop: 20, padding: "10px 16px", background: "#0b5cff", color: "#fff", borderRadius: 8 }}>Create account</Link>
//         </section>
//         <aside style={{ background: "#f7f9ff", padding: 20, borderRadius: 8 }}>
//           <h4 style={{ marginTop: 0 }}>Why BioDeck?</h4>
//           <ul>
//             <li>Domain-specific AI feedback</li>
//             <li>Encrypted storage & NDA gating</li>
//             <li>Investor matchmaking</li>
//           </ul>
//         </aside>
//       </main>
//     </div>
//   );
// }
// src/components/Landing.jsx
import React from "react";
import { Link } from "react-router-dom";
import useAuthCheck from "../hooks/useAuthCheck";
import heroImg from '../assets/hero-illustration.jpg';

export default function Landing() {
  useAuthCheck(); // redirects to /dashboard if already logged in

  return (
    <div className="bg-light">
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold text-primary" to="/">
            BioDeck
          </Link>
          <div className="d-flex">
            <Link to="/login" className="btn btn-outline-primary me-2">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="py-5 bg-gradient">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6 text-center text-lg-start">
              <h1 className="fw-bold display-5 text-dark">
                AI feedback + secure investor matchmaking <br /> for life sciences
              </h1>
              <p className="lead text-secondary mt-3">
                Upload your pitch deck, get domain-aware AI feedback, control sharing via NDA gating, and connect with trusted investors who understand biopharma and healthcare.
              </p>
              <div className="mt-4">
                <Link to="/signup" className="btn btn-primary btn-lg me-3">
                  Create Account
                </Link>
                <a href="#upload" className="btn btn-outline-secondary btn-lg">
                  Try a Demo Upload
                </a>
              </div>
            </div>
            <div className="col-lg-6 text-center mt-4 mt-lg-0">
              <img
  src={heroImg}
  alt="BioDeck hero"
  className="img-fluid rounded-3 shadow"
     style={{ maxWidth: "520px" }}
/>
            </div>
          </div>
        </div>
      </header>

      {/* FEATURES */}
      <section className="py-5">
        <div className="container">
          <div className="row text-center g-4">
            <div className="col-md-4">
              <div className="card shadow-sm h-100 border-0">
                <div className="card-body">
                  <h5 className="fw-bold">Domain-aware AI</h5>
                  <p className="text-muted">
                    Feedback tuned for biotech & pharma investors.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm h-100 border-0">
                <div className="card-body">
                  <h5 className="fw-bold">Encrypted Storage</h5>
                  <p className="text-muted">
                    End-to-end confidentiality and secure access controls.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm h-100 border-0">
                <div className="card-body">
                  <h5 className="fw-bold">Investor Matchmaking</h5>
                  <p className="text-muted">
                    Connect with investors who fund your stage and domain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS / CTA */}
      <section className="py-5 bg-primary text-white text-center">
        <div className="container">
          <h2 className="fw-bold">Trusted by 148+ biotech teams</h2>
          <p className="mt-2">
            Join BioDeck to get curated investor matches and actionable AI insights.
          </p>
          <Link to="/signup" className="btn btn-light btn-lg mt-3">
            Join Now
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-dark text-white py-4 mt-5">
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
          <div>
            © {new Date().getFullYear()} BioDeck — Privacy-first fundraising for life sciences
          </div>
          <div className="mt-3 mt-md-0">
            <Link to="/about" className="text-white me-3">
              About
            </Link>
            <Link to="/privacy" className="text-white me-3">
              Privacy
            </Link>
            <Link to="/terms" className="text-white">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
