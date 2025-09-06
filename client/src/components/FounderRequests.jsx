import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * FounderRequests
 * Props:
 *  - deckId (string) : ID of the deck to fetch requests for
 *
 * Usage:
 *  <FounderRequests deckId={deckId} />
 *
 * Notes:
 *  - Assumes your backend is mounted at the same origin (relative API paths).
 *  - If you use a bearer token auth, ensure axios includes it (see comment below).
 *  - Endpoints used:
 *     GET  /api/decks/:id/requests
 *     POST /api/decks/:id/approve-investor   { investorId }
 *     POST /api/decks/nda/:ndaId/reject
 */

export default function FounderRequests({ deckId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // ndaId being processed
  const [error, setError] = useState(null);

  // If you store a token in localStorage or similar, set default header:
  // axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

  useEffect(() => {
    if (!deckId) return;
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  async function fetchRequests() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/decks/${deckId}/requests`);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Failed to fetch requests", err);
      setError(err.response?.data?.error || err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(nda) {
    if (!nda || !nda.investorId) return;
    const investorId = nda.investorId._id || nda.investorId;
    if (!window.confirm(`Approve access for ${nda.investorId.name || nda.investorId.email || investorId}?`)) return;

    setActionLoading(nda._id);
    try {
      await axios.post(`/api/decks/${deckId}/approve-investor`, { investorId });
      // optimistic UI: remove this request from list
      setRequests((prev) => prev.filter((r) => String(r._id) !== String(nda._id)));
    } catch (err) {
      console.error("Approve failed", err);
      alert(err.response?.data?.error || "Approve failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(nda) {
    if (!window.confirm("Reject this NDA request? This action cannot be undone.")) return;
    setActionLoading(nda._id);
    try {
      await axios.post(`/api/decks/nda/${nda._id}/reject`);
      setRequests((prev) => prev.filter((r) => String(r._id) !== String(nda._id)));
    } catch (err) {
      console.error("Reject failed", err);
      alert(err.response?.data?.error || "Reject failed");
    } finally {
      setActionLoading(null);
    }
  }

  if (!deckId) return <div className="alert alert-warning">No deck selected.</div>;

  return (
    <div className="card my-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Pending NDA Requests</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchRequests} disabled={loading}>
            Refresh
          </button>
        </div>

        {loading && <div className="text-center py-4">Loading…</div>}

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && requests.length === 0 && <div className="text-muted">No pending requests.</div>}

        {!loading && requests.length > 0 && (
          <div className="list-group">
            {requests.map((r) => {
              const investor = r.investorId || {};
              const name = investor.name || investor.fullName || investor.email || "Investor";
              const email = investor.email || "";
              return (
                <div key={r._id} className="list-group-item d-flex flex-column flex-md-row gap-3 align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2">
                      <strong>{name}</strong>
                      {email && <span className="text-muted small"> &nbsp;•&nbsp; {email}</span>}
                    </div>
                    <div className="text-muted small mt-1">
                      Requested at: {new Date(r.createdAt).toLocaleString()}
                    </div>
                    {/* show any note if present */}
                    {r.note && <div className="mt-2"><em className="text-muted small">Note: {r.note}</em></div>}
                  </div>

                  <div className="d-flex gap-2 align-self-center">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleApprove(r)}
                      disabled={actionLoading === r._id}
                    >
                      {actionLoading === r._id ? "Working…" : "Approve"}
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleReject(r)}
                      disabled={actionLoading === r._id}
                    >
                      {actionLoading === r._id ? "Working…" : "Reject"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
