const express = require("express");
const router = express.Router();
const Job = require("../models/JobModel");
const { createJob, getJobs } = require("../controllers/jobController");

router.post("/", createJob);   // admin form
router.get("/", getJobs);      // careers page + email
router.get("/:slug", async (req, res) => {
  const job = await Job.findOne({ slug: req.params.slug, isActive: true });
  if(!job) return res.status(404).json({message:"Job is not found"});
  res.json(job);
});

module.exports = router;
