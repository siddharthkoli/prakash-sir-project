const mongoose = require('mongoose');

const userInquirySchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, minlength: 1 },
  lastName: { type: String, required: true, trim: true, minlength: 1 },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: props => `${props.value} is not a valid email`
    }
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    streetAddress1: { type: String, required: true },
    streetAddress2: { type: String }, // optional
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: {
      type: String, required: true, validate: {
        validator: v => /^\d{6}$/.test(v),
        message: props => `${props.value} is not a valid 6-digit pincode`
      }
    },
  },
  whereToMeet: {
    type: String,
    required: false,
    trim: true
  },
  comments: {
    type: String,
    required: false,
    trim: true
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserInquiry', userInquirySchema);
