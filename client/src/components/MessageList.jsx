import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { decryptMessage } from '../utils/encryption';

function ReadReceipt({ message, currentUserId, participantCount }) {
  if (message.sender._id === currentUserId) {
    const readCount = message.readBy?.length || 0;
    const othersRead = readCount >= Math.min(participantCount, 2);
    return (
      <span className="read-receipt" title={`Read by ${readCount}`}>
        {othersRead ? '✓✓' : '✓'}
      </span>
    );
  }
  return null;
}

function MessageContent({ message, decryptedText }) {
  if (message.messageType === 'image') {
    return (
      <a href={message.fileUrl} target="_blank" rel="noreferrer">
        <img src={message.fileUrl} alt={message.fileName || 'Shared image'} className="msg-image" />
      </a>
    );
  }

  if (message.messageType === 'file') {
    return (
      <a href={message.fileUrl} target="_blank" rel="noreferrer" className="msg-file">
        📄 {message.fileName || 'Download file'}
      </a>
    );
  }

  return <p>{decryptedText}</p>;
}

export default function MessageList({
  messages,
  currentUser,
  participantCount,
  onMessagesVisible,
}) {
  const bottomRef = useRef(null);
  const [decrypted, setDecrypted] = useState({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    onMessagesVisible?.();
  }, [messages, onMessagesVisible]);

  useEffect(() => {
    messages.forEach(async (msg) => {
      if (msg.encrypted && msg.messageType === 'text' && !decrypted[msg._id]) {
        const text = await decryptMessage(msg.content);
        setDecrypted((prev) => ({ ...prev, [msg._id]: text }));
      }
    });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((msg) => {
        const isMine = msg.sender._id === currentUser._id;
        const text = msg.encrypted
          ? decrypted[msg._id] || 'Decrypting...'
          : msg.content;

        return (
          <div key={msg._id} className={`message ${isMine ? 'mine' : 'theirs'}`}>
            {!isMine && (
              <span className="message-sender">{msg.sender.username}</span>
            )}
            <div className="message-bubble">
              <MessageContent message={msg} decryptedText={text} />
              <div className="message-meta">
                <time>{format(new Date(msg.createdAt), 'HH:mm')}</time>
                <ReadReceipt
                  message={msg}
                  currentUserId={currentUser._id}
                  participantCount={participantCount}
                />
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
