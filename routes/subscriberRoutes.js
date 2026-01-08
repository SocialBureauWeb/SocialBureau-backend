// routes/subscriberRoutes.js
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    await Subscriber.findOneAndUpdate(
      { email },
      { email },
      { upsert: true, new: true }
    );
    res.json({ message: "Subscribed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Subscription failed" });
  }
});
