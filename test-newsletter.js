require("dotenv").config();
const mongoose = require("mongoose");
const Subscriber = require("./models/Subscriber");
const Blog = require("./models/blogModel");

async function testNewsletter() {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Check subscribers
    const subscribers = await Subscriber.find({ isActive: true });
    console.log(`\n📧 Found ${subscribers.length} active subscribers:`);
    subscribers.forEach(s => console.log(`   - ${s.email}`));

    // Check published blogs
    const blogs = await Blog.find({ published: true }).sort({ publishedAt: -1 }).limit(3);
    console.log(`\n📰 Found ${blogs.length} published blogs:`);
    blogs.forEach(b => console.log(`   - ${b.title} (${b.slug})`));

    if (subscribers.length === 0) {
      console.log("\n⚠️ No subscribers! Add some first:");
      console.log("   db.subscribers.insertOne({ email: 'test@example.com', isActive: true })");
    }

    if (blogs.length === 0) {
      console.log("\n⚠️ No published blogs! Create one first.");
    }

    // Test email config
    console.log(`\n📧 Email Config:`);
    console.log(`   Service: ${process.env.MAIL_SERVICE}`);
    console.log(`   User: ${process.env.MAIL_USER}`);
    console.log(`   Password set: ${process.env.MAIL_PASS ? "✅ Yes" : "❌ No"}`);

    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

testNewsletter();
