import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../hooks/useWebRTC';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CallModal from './CallModal';

function getOtherParticipant(conversation, currentUserId) {
  if (conversation.isGroup) return null;
  return conversation.participants.find((p) => p._id !== currentUserId);
}

function getTitle(conversation, currentUserId) {
  if (conversation.isGroup) return conversation.name;
  const other = getOtherParticipant(conversation, currentUserId);
  return other?.username || 'Chat';
}

export default function ChatWindow({
  conversation,
  currentUser,
  // encryptionEnabled,
  onConversationUpdate,
  notify,
}) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const other = getOtherParticipant(conversation, currentUser._id);
  const webrtc = useWebRTC(socket, other?._id);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/conversations/${conversation._id}/messages`);
      setMessages(data);
    } finally {
      setLoading(false);
    }
  }, [conversation._id]);

  useEffect(() => {
    loadMessages();
    socket?.emit('conversation:join', conversation._id);
    socket?.emit('messages:read-all', { conversationId: conversation._id });
    api(`/messages/conversation/${conversation._id}/read-all`, { method: 'POST' }).catch(() => {});
  }, [conversation._id, socket, loadMessages]);

  useEffect(() => {
    if (!socket) return undefined;

    const onNewMessage = (message) => {
      const convId = message.conversation?._id || message.conversation;
      if (convId?.toString() !== conversation._id.toString()) {
        return;
      }

      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });

      const isFromOther = message.sender._id !== currentUser._id;
      if (isFromOther) {
        socket.emit('message:read', {
          messageId: message._id,
          conversationId: conversation._id,
        });
        notify?.(`${message.sender.username}`, message.content || 'Sent a file');
      }

      onConversationUpdate?.();
    };

    const onTypingStart = ({ conversationId, userId, username }) => {
      if (conversationId !== conversation._id || userId === currentUser._id) return;
      setTypingUsers((prev) =>
        prev.some((u) => u.userId === userId) ? prev : [...prev, { userId, username }]
      );
    };

    const onTypingStop = ({ conversationId, userId }) => {
      if (conversationId !== conversation._id) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    const onMessageRead = ({ message }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? message : m))
      );
    };

    socket.on('message:new', onNewMessage);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('message:read', onMessageRead);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('message:read', onMessageRead);
    };
  }, [socket, conversation._id, currentUser._id, notify, onConversationUpdate]);

  const handleSend = (payload) => {
    socket?.emit('message:send', payload, (res) => {
      if (res?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.message._id)) return prev;
          return [...prev, res.message];
        });
        onConversationUpdate?.();
      }
    });
  };

  const handleMarkRead = useCallback(() => {
    socket?.emit('messages:read-all', { conversationId: conversation._id });
  }, [socket, conversation._id]);

  const typingLabel =
    typingUsers.length === 0
      ? ''
      : typingUsers.length === 1
        ? `${typingUsers[0].username} is typing...`
        : 'Several people are typing...';

  return (
    <section className="chat-window">
      <header className="chat-header">
        <div>
          <h3>{getTitle(conversation, currentUser._id)}</h3>
          {other && (
            <span className="presence-label">
              {other.isOnline ? 'Online' : 'Offline'}
            </span>
          )}
        </div>
        {!conversation.isGroup && other && (
          <div className="call-buttons">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => webrtc.startCall(other._id, conversation._id, 'audio')}
              title="Voice call"
            >
              📞
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => webrtc.startCall(other._id, conversation._id, 'video')}
              title="Video call"
            >
              📹
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <div className="chat-loading">Loading messages...</div>
      ) : (
        <MessageList
          messages={messages}
          currentUser={currentUser}
          participantCount={conversation.participants.length}
          onMessagesVisible={handleMarkRead}
        />
      )}

      {typingLabel && <div className="typing-indicator">{typingLabel}</div>}

      <MessageInput
        conversationId={conversation._id}
        socket={socket}
        onSend={handleSend}
        // encryptionEnabled={encryptionEnabled}
      />

      <CallModal
        callState={webrtc.callState}
        callType={webrtc.callType}
        incomingCall={webrtc.incomingCall}
        localStream={webrtc.localStream}
        remoteStream={webrtc.remoteStream}
        onAnswer={webrtc.answerCall}
        onReject={webrtc.rejectCall}
        onEnd={webrtc.endCall}
      />
    </section>
  );
}
