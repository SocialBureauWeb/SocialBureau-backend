// const Newsletter = require("../models/Newsletter");

// // POST /api/newsletter/subscribe
// exports.subscribe = async (req, res) => {
//   try {
//     const { email, preferences } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email is required" });
//     }

//     // Check existing
//     const existing = await Newsletter.findOne({ email });

//     if (existing) {
//       if (existing.status === "unsubscribed") {
//         existing.status = "active";
//         await existing.save();
//         return res.json({ message: "Subscription reactivated" });
//       }

//       return res.status(409).json({ message: "Email already subscribed" });
//     }

//     await Newsletter.create({
//       email,
//       preferences: preferences || {
//         blogs: true,
//         jobs: true,
//       },
//     });

//     return res.json({ success: true, message: "Subscribed successfully" });
//   } catch (error) {
//     console.error("Newsletter subscribe error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // POST /api/newsletter/unsubscribe
// exports.unsubscribe = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email is required" });
//     }

//     const user = await Newsletter.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: "Email not found" });
//     }

//     user.status = "unsubscribed";
//     await user.save();

//     res.json({ message: "Unsubscribed successfully" });
//   } catch (error) {
//     console.error("Newsletter unsubscribe error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // PUT /api/newsletter/preferences
// exports.updatePreferences = async (req, res) => {
//   try {
//     const { email, preferences } = req.body;

//     if (!email || !preferences) {
//       return res.status(400).json({ message: "Invalid request" });
//     }

//     const updated = await Newsletter.findOneAndUpdate(
//       { email },
//       { preferences },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ message: "Email not found" });
//     }

//     res.json({
//       message: "Preferences updated",
//       preferences: updated.preferences,
//     });
//   } catch (error) {
//     console.error("Update preferences error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
