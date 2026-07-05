import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../utils/api';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import CreateGroupModal from '../components/CreateGroupModal';

export default function Chat() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  // const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const loadConversations = useCallback(async () => {
    const data = await api('/conversations');
    setConversations(data);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!socket) return undefined;

    const refreshOnline = () => loadConversations();

    socket.on('user:online', refreshOnline);
    socket.on('message:new', refreshOnline);

    return () => {
      socket.off('user:online', refreshOnline);
      socket.off('message:new', refreshOnline);
    };
  }, [socket, loadConversations]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        setNotificationsEnabled(perm === 'granted');
      });
    } else if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const notify = useCallback(
    (title, body) => {
      if (!notificationsEnabled || document.hasFocus()) return;
      new Notification(title, { body: body?.slice(0, 100), icon: '/favicon.svg' });
    },
    [notificationsEnabled]
  );

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    setConversations((prev) => {
      const exists = prev.some((c) => c._id === conversation._id);
      if (exists) {
        return prev.map((c) => (c._id === conversation._id ? conversation : c));
      }
      return [conversation, ...prev];
    });
  };

  return (
    <div className={`chat-app ${activeConversation ? 'mobile-chat-open' : ''}`}>
      <Sidebar
        conversations={conversations}
        activeId={activeConversation?._id}
        currentUser={user}
        onSelect={handleSelectConversation}
        onNewGroup={() => setShowGroupModal(true)}
        onLogout={logout}
        connected={connected}
      />

      <main className="chat-main">
        {/* <div className="chat-toolbar">
          <label className="toggle">
            <input
              type="checkbox"
              checked={encryptionEnabled}
              onChange={(e) => setEncryptionEnabled(e.target.checked)}
            />
            End-to-end encryption (AES-GCM)
          </label>
        </div> */}

        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            currentUser={user}
            // encryptionEnabled={encryptionEnabled}
            onConversationUpdate={loadConversations}
            notify={notify}
            onBack={() => setActiveConversation(null)}
          />
        ) : (
          <div className="chat-empty">
            <h2>Welcome, {user.username}</h2>
            <p>Search for a user or select a conversation to start chatting.</p>
          </div>
        )}
      </main>

      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={handleSelectConversation}
        />
      )}
    </div>
  );
}
