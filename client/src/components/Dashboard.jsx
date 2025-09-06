// client/src/components/UploadDeck.jsx
import React, { useState, useEffect } from "react";
import api from "../api";

export default function UploadDeck() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [decks, setDecks] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/decks/my");
        setDecks(res.data.decks || []);
      } catch (err) {
        // ignore errors silently for now
      }
    })();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("Select a PDF first");

    const fd = new FormData();
    fd.append("deck", file);

    try {
      const res = await api.post("/decks", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => setProgress(Math.round((100 * ev.loaded) / ev.total)),
      });
      setMessage("Upload successful ✅");
      setDecks((d) => [res.data.deck, ...d]);
      setFile(null);
      setProgress(0);
    } catch (err) {
      setMessage(err?.response?.data?.error || err.message || "Upload failed");
    }
  };

  return (
    <div>
      <h3 className="mb-3">Upload Pitch Deck</h3>

      <form onSubmit={handleUpload} className="mb-4">
        <div className="input-group">
          <input
            type="file"
            className="form-control"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button type="submit" className="btn btn-primary">
            Upload
          </button>
        </div>
      </form>

      {progress > 0 && (
        <div className="progress mb-3" style={{ height: "20px" }}>
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      {message && <div className="alert alert-info">{message}</div>}

      <h4 className="mt-4">My Decks</h4>
      <div className="row">
        {decks.length === 0 && <p>No decks uploaded yet.</p>}
        {decks.map((d) => (
          <div className="col-md-4 mb-3" key={d._id}>
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title" style={{ fontSize: "1rem" }}>
                  {d.originalName}
                </h5>
                <p className="card-text text-muted">
                  {(d.size / 1024).toFixed(1)} KB <br />
                  {new Date(d.createdAt).toLocaleDateString()}
                </p>
                <a
                  href={`${process.env.REACT_APP_API_URL}/decks/${d._id}/download`}
                  className="btn btn-sm btn-outline-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
