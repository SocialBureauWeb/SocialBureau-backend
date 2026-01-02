const User = require("../models/userModel");

// 👍 Like / Unlike
exports.addLike = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $inc: {
      points: 1,
      "engagement.likes": 1,
    },
  });
};

exports.removeLike = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $inc: {
      points: -1,
      "engagement.likes": -1,
    },
  });
};

// 💬 Comment / Delete Comment
exports.addComment = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $inc: {
      points: 1,
      "engagement.comments": 1,
    },
  });
};

exports.removeComment = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $inc: {
      points: -1,
      "engagement.comments": -1,
    },
  });
};

// 🔁 Share logic unchanged
exports.addShare = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  user.engagement.shares += 1;

  if (user.engagement.shares % 3 === 0) {
    user.points += 1;
  }

  await user.save();
};
