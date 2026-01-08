// // cron/newsletterCron.js
// const cron = require("node-cron");
// const { sendLatestBlogNewsletter } = require("../controllers/newsletterController");

// console.log("🗓️ Scheduling newsletter cron: '0 10 * * 1'");
// cron.schedule("0 10 * * 1", async () => {
//   console.log("⏰ Running weekly blog newsletter");
//   try {
//     await sendLatestBlogNewsletter();
//   } catch (err) {
//     console.error("Newsletter cron error:", err && err.message ? err.message : err);
//   }
// });



const cron = require("node-cron");
const { sendLatestBlogNewsletter } = require("../controllers/newsLetterController");

// ========== DEVELOPMENT/TESTING ==========
// Run every 1 minute (for quick testing)
// console.log("🗓️ Scheduling newsletter cron: '* * * * *' (every minute)");
// cron.schedule("* * * * *", async () => {
//   console.log("⏰ Running blog newsletter (every minute test)");
//   try {
//     await sendLatestBlogNewsletter();
//   } catch (err) {
//     console.error("Newsletter cron error:", err && err.message ? err.message : err);
//   }
// });

// ========== PRODUCTION ==========
// Uncomment this when you're done testing
// Runs every Monday at 10:00 AM UTC

console.log("🗓️ Scheduling newsletter cron: '0 10 * * 1' (Monday 10 AM)");
cron.schedule("0 10 * * 1", async () => {
  // console.log("⏰ Running weekly blog newsletter");
  try {
    await sendLatestBlogNewsletter();
  } catch (err) {
    console.error("Newsletter cron error:", err && err.message ? err.message : err);
  }
});