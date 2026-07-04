const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const {
      conversationId,
      content,
      encrypted,
      messageType,
      fileUrl,
      fileName,
      fileSize,
    } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation?.participants.some((p) => p.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: content || '',
      encrypted: Boolean(encrypted),
      messageType: messageType || 'text',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      readBy: [{ user: req.user._id }],
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('readBy.user', 'username');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const alreadyRead = message.readBy.some((r) => r.user.equals(req.user._id));
    if (!alreadyRead) {
      message.readBy.push({ user: req.user._id });
      await message.save();
    }

    const populated = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('readBy.user', 'username');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/conversation/:id/read-all', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation?.participants.some((p) => p.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const unread = await Message.find({
      conversation: conversation._id,
      sender: { $ne: req.user._id },
      'readBy.user': { $ne: req.user._id },
    });

    const now = new Date();
    await Promise.all(
      unread.map(async (msg) => {
        msg.readBy.push({ user: req.user._id, readAt: now });
        await msg.save();
      })
    );

    res.json({ count: unread.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
