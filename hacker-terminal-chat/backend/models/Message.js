const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['global', 'dm', 'system'],
    default: 'global'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  deleted: {
    type: Boolean,
    default: false
  }
});

messageSchema.index({ timestamp: -1 });
messageSchema.index({ type: 1, deleted: 1 });
messageSchema.index({ recipient: 1 });

module.exports = mongoose.model('Message', messageSchema);