import mongoose from 'mongoose';

const contactSubmissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 160
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending'
  }
}, { timestamps: true });

export default mongoose.model('ContactSubmission', contactSubmissionSchema);
