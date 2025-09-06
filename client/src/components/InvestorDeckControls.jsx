// src/components/InvestorDeckControls.jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function InvestorDeckControls({ deck }) {
  const [status, setStatus] = useState(deck.accessStatus || '');

  const requestAccess = async () => {
    try {
      const r = await axios.post(`/api/decks/${deck._id}/request-access`);
      setStatus(r.data.status);
      alert('Request sent');
    } catch (e) {
      alert(e.response?.data?.error || 'Request failed');
    }
  };

  if (deck.sharingMode === 'public') {
    return <a className="btn btn-primary" href={`/api/decks/${deck._id}/download`}>View Deck</a>;
  }
  if (deck.sharingMode === 'invite') {
    return <button className="btn btn-outline-primary" onClick={requestAccess}>Request Access</button>;
  }
  if (deck.sharingMode === 'nda_required') {
    if (status === 'accepted') return <a className="btn btn-primary" href={`/api/decks/${deck._id}/download`}>View Deck</a>;
    if (status === 'pending') return <button className="btn btn-secondary" disabled>Pending</button>;
    return <button className="btn btn-outline-primary" onClick={requestAccess}>Request NDA & Access</button>;
  }
  return null;
}
