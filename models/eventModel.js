const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    venue: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['workshop', 'webinar', 'conference', 'meetup', 'training', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    registrationLink: {
      type: String,
      trim: true,
    },
    maxAttendees: {
      type: Number,
      min: 0,
    },
    attendees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // Guest registrations (when user registers via website without a User account)
    registrations: [
      {
        name: { type: String, trim: true },
        email: {
          type: String,
          trim: true,
          lowercase: true,
          match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
        },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isPublished: {
      type: Boolean,
      default: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    organizer: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to check if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return new Date() < this.startDate && this.status === 'upcoming';
});

// Virtual to check if event is past
eventSchema.virtual('isPast').get(function() {
  return new Date() > this.endDate;
});

// Method to generate calendar event data
eventSchema.methods.toCalendarEvent = function() {
  return {
    title: this.title,
    description: this.description,
    location: this.location || this.venue || '',
    startDate: this.startDate,
    endDate: this.endDate,
  };
};

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
