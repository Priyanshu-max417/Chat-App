const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

const populateConversation = (query) =>
  query
    .populate('participants', 'username email avatar isOnline lastSeen')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'username avatar' },
    });

router.get('/', auth, async (req, res) => {
  try {
    const conversations = await populateConversation(
      Conversation.find({ participants: req.user._id }).sort({ updatedAt: -1 })
    );

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/direct', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId] },
    }).where('participants').size(2);

    if (!conversation) {
      conversation = await Conversation.create({
        isGroup: false,
        participants: [req.user._id, userId],
      });
    }

    conversation = await populateConversation(
      Conversation.findById(conversation._id)
    );

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/group', auth, async (req, res) => {
  try {
    const { name, participantIds } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const ids = [...new Set([...(participantIds || []), req.user._id.toString()])];

    const conversation = await Conversation.create({
      name: name.trim(),
      isGroup: true,
      participants: ids,
      admin: req.user._id,
    });

    const populated = await populateConversation(
      Conversation.findById(conversation._id)
    );

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const remainingParticipants = conversation.participants.filter(
      (participant) => !participant.equals(req.user._id)
    );

    if (remainingParticipants.length === 0) {
      await Message.deleteMany({ conversation: conversation._id });
      await Conversation.findByIdAndDelete(conversation._id);
    } else {
      conversation.participants = remainingParticipants;
      if (conversation.admin && conversation.admin.equals(req.user._id)) {
        conversation.admin = remainingParticipants[0];
      }
      await conversation.save();
    }

    res.json({ success: true, conversationId: conversation._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/messages', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation?.participants.some((p) => p.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const before = req.query.before;

    const filter = { conversation: conversation._id };
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('readBy.user', 'username');

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
