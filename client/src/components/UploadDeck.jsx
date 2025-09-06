// client/src/components/UploadDeck.jsx
import React, { useState, useEffect } from "react";
import api from "../api"; // ensure api uses REACT_APP_API_URL and withCredentials if needed

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
        // ignore or show
      }
    })();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("Select a PDF");

    const fd = new FormData();
    fd.append("deck", file);

    try {
      const res = await api.post("/decks", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => setProgress(Math.round((100 * ev.loaded) / ev.total)),
      });
      setMessage("Upload successful");
      setDecks((d) => [res.data.deck, ...d]);
      setFile(null);
      setProgress(0);
    } catch (err) {
      setMessage(err?.response?.data?.error || err.message || "Upload failed");
    }
  };

  return (
    <div>
      <h3>Upload Pitch Deck (PDF)</h3>
      <form onSubmit={handleUpload}>
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit">Upload</button>
      </form>
      {progress > 0 && <div>Progress: {progress}%</div>}
      {message && <div>{message}</div>}

      <h4>My Decks</h4>
      <ul>
        {decks.map((d) => (
          <li key={d._id}>
            {d.originalName} — {Math.round(d.size / 1024)} KB —{" "}
            <a href={`${process.env.REACT_APP_API_URL}/decks/${d._id}/download`} target="_blank" rel="noreferrer">Download</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
