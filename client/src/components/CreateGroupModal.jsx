import { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        const users = await api(`/users/search?q=${encodeURIComponent(query)}`);
        setResults(users);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const toggleUser = (user) => {
    setSelected((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const conversation = await api('/conversations/group', {
        method: 'POST',
        body: JSON.stringify({
          name,
          participantIds: selected.map((u) => u._id),
        }),
      });
      onCreated(conversation);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create group</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Group name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Project Team"
            />
          </label>
          <label>
            Add members
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
            />
          </label>
          {selected.length > 0 && (
            <div className="chip-list">
              {selected.map((u) => (
                <span key={u._id} className="chip">
                  {u.username}
                  <button type="button" onClick={() => toggleUser(u)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <ul className="search-results">
            {results.map((u) => (
              <li key={u._id}>
                <button type="button" onClick={() => toggleUser(u)}>
                  {u.username}
                  {selected.some((s) => s._id === u._id) ? ' ✓' : ''}
                </button>
              </li>
            ))}
          </ul>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
