import { useRef, useState } from 'react';
import { uploadFile } from '../utils/api';
import { IconAttach, IconSend } from './Icons';
// import { encryptMessage } from '../utils/encryption';

export default function MessageInput({
  onSend,
  conversationId,
  socket,
  encryptionEnabled,
}) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const typingTimeout = useRef(null);
  const fileRef = useRef(null);

  const emitTyping = (isTyping) => {
    if (!socket || !conversationId) return;
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
  };

  const handleChange = (e) => {
    setText(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false), 1500);
  };

  const sendPayload = (payload) => {
    onSend(payload);
    setText('');
    emitTyping(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    let content = text.trim();
    let encrypted = false;

    // if (encryptionEnabled) {
    //   content = await encryptMessage(content);
    //   encrypted = true;
    // }

    sendPayload({
      conversationId,
      content,
      encrypted,
      messageType: 'text',
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      sendPayload({
        conversationId,
        content: file.name,
        messageType: uploaded.messageType,
        fileUrl: uploaded.url,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        ref={fileRef}
        type="file"
        hidden
        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        onChange={handleFile}
      />
      <button
        type="button"
        className="btn-icon"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Attach file"
      >
        {uploading ? '…' : <IconAttach width={19} height={19} />}
      </button>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Type a message..."
        disabled={uploading}
      />
      <button type="submit" className="btn btn-primary" disabled={!text.trim() || uploading}>
        <IconSend width={16} height={16} />
        Send
      </button>
    </form>
  );
}
