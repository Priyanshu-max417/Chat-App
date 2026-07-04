import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../utils/api';

function getConversationTitle(conversation, currentUserId) {
  if (conversation.isGroup) {
    return conversation.name || 'Group chat';
  }
  const other = conversation.participants.find((p) => p._id !== currentUserId);
  return other?.username || 'Unknown';
}

function getConversationAvatar(conversation, currentUserId) {
  if (conversation.isGroup) {
    return conversation.name?.[0]?.toUpperCase() || 'G';
  }
  const other = conversation.participants.find((p) => p._id !== currentUserId);
  return other?.username?.[0]?.toUpperCase() || '?';
}

function getOnlineStatus(conversation, currentUserId) {
  if (conversation.isGroup) return null;
  const other = conversation.participants.find((p) => p._id !== currentUserId);
  return other?.isOnline;
}

export default function Sidebar({
  conversations,
  activeId,
  currentUser,
  onSelect,
  onNewGroup,
  onLogout,
  connected,
}) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        const users = await api(`/users/search?q=${encodeURIComponent(query)}`);
        setSearchResults(users);
      } catch {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const startDirectChat = async (userId) => {
    const conversation = await api('/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    onSelect(conversation);
    setQuery('');
    setSearchResults([]);
  };

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div>
          <h2>ChatFlow</h2>
          <span className={`status-dot ${connected ? 'online' : 'offline'}`}>
            {connected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
        <div className="sidebar-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onNewGroup} title="New group">
            +
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="sidebar-user">
        <div className="avatar">{currentUser.username[0].toUpperCase()}</div>
        <span>{currentUser.username}</span>
      </div>

      <div className="search-box">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users to chat..."
        />
      </div>

      {searchResults.length > 0 && (
        <ul className="search-results sidebar-search">
          {searchResults.map((u) => (
            <li key={u._id}>
              <button type="button" onClick={() => startDirectChat(u._id)}>
                <span className="avatar sm">{u.username[0].toUpperCase()}</span>
                {u.username}
                <span className={`presence ${u.isOnline ? 'online' : ''}`} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ul className="conversation-list">
        {conversations.map((c) => {
          const title = getConversationTitle(c, currentUser._id);
          const isOnline = getOnlineStatus(c, currentUser._id);
          const preview = c.lastMessage?.content || 'No messages yet';

          return (
            <li key={c._id}>
              <button
                type="button"
                className={activeId === c._id ? 'active' : ''}
                onClick={() => onSelect(c)}
              >
                <span className="avatar">{getConversationAvatar(c, currentUser._id)}</span>
                <div className="conv-info">
                  <div className="conv-title">
                    <span>{title}</span>
                    {isOnline !== null && (
                      <span className={`presence ${isOnline ? 'online' : ''}`} title={isOnline ? 'Online' : 'Offline'} />
                    )}
                  </div>
                  <p className="conv-preview">{preview.slice(0, 40)}</p>
                </div>
                <time className="conv-time">
                  {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                </time>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
