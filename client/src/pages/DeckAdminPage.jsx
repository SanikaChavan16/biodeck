// client/src/pages/DeckAdminPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import FounderRequests from "../components/FounderRequests";

export default function DeckAdminPage() {
  const { id } = useParams(); // deck id from route /admin/decks/:id
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchDeck() {
    setLoading(true);
    setError(null);
    try {
      // If your API uses a different path, change this URL.
      const res = await axios.get(`/api/decks/${id}`);
      // expected response: { deck: { ... } } or deck object directly
      const deckData = res.data.deck || res.data;
      setDeck(deckData);
    } catch (err) {
      console.error("Failed to load deck", err);
      const msg = err.response?.data?.error || err.message || "Failed to load deck";
      setError(msg);

      // optional: redirect if 404
      if (err.response?.status === 404) {
        // navigate('/dashboard'); // uncomment if you want to redirect
      }
    } finally {
      setLoading(false);
    }
  }

  // Quick helper to display privacy
  function renderPrivacy(p) {
    if (!p) return "private";
    if (p === "public") return "Public";
    if (p === "nda") return "NDA required";
    return p.charAt(0).toUpperCase() + p.slice(1);
  }

  if (loading) return <div className="container py-5">Loading deck…</div>;
  if (error) return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>;
  if (!deck) return <div className="container py-5"><div className="alert alert-warning">Deck not found.</div></div>;

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h2 className="mb-1">{deck.originalName || deck.title || "Untitled Deck"}</h2>
          <div className="text-muted small">
            Uploaded: {new Date(deck.createdAt || deck.created_at || Date.now()).toLocaleString()} &nbsp;•&nbsp;
            Privacy: <strong>{renderPrivacy(deck.privacy)}</strong>
          </div>
        </div>

        <div className="d-flex gap-2">
          <Link to={`/decks/${deck._id}/edit`} className="btn btn-outline-secondary btn-sm">Edit</Link>
          <a href={`/api/decks/${deck._id}/download`} className="btn btn-primary btn-sm">Download</a>
        </div>
      </div>

      {/* Additional deck meta */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Deck details</h6>
              {deck.description ? <p>{deck.description}</p> : <p className="text-muted small">No description provided.</p>}
              <dl className="row">
                <dt className="col-sm-3">File</dt>
                <dd className="col-sm-9">{deck.originalName}</dd>

                <dt className="col-sm-3">Size</dt>
                <dd className="col-sm-9">{(deck.size || 0) / 1024 / 1024 >= 1 ? `${((deck.size || 0) / 1024 / 1024).toFixed(2)} MB` : `${(deck.size || 0) / 1024} KB`}</dd>

                <dt className="col-sm-3">Allowed investors</dt>
                <dd className="col-sm-9">{(deck.allowedInvestorIds && deck.allowedInvestorIds.length) ? deck.allowedInvestorIds.length : 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {/* Quick actions */}
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Actions</h6>
              <div className="d-grid gap-2">
                <a className="btn btn-outline-primary btn-sm" href={`/api/decks/${deck._id}/download`}>Download deck</a>
                <Link to={`/admin/decks/${deck._id}/settings`} className="btn btn-outline-secondary btn-sm">Sharing settings</Link>
                <Link to="/dashboard" className="btn btn-link btn-sm">Back to dashboard</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FounderRequests component - shows pending NDA requests and Approve/Reject */}
      <FounderRequests deckId={deck._id} />
    </div>
  );
}
