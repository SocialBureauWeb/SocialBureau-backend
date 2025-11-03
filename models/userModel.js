const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    emp_id:{
      type:String
    },
    email:{
        type:String,
        require:true,
    },
    password:{
        type:String,
        require:true,
        minLength:[5,"Minimum 5 characters required"]
    },
    // Allow multiple tools (e.g., Word, ClickUp, etc.)
    tools: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tool",
      },
    ],

    // ClickUp ID (optional). Indexed for fast lookup; make unique if your app requires one-to-one mapping.
    clickupId: {
      type: String,
      trim: true,
      index: true,
    },

    // Multiple reviews authored/associated with this user
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],

    // Multiple achievements (reference the Achievement model)
    achievements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Achievement",
      },
    ],
    coverImage: { 
      type: String 
    },
    role: { 
      type: String 
    },
    rating: { 
      type: Number 
    },
    rate: { 
      type: Number 
    },
    exp: { 
      type: String 
    },
    idCard: { 
      type: String 
    },
    doj:{
      type:Date
    }    
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;