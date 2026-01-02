const Job = require("../models/JobModel");
const slugify = require("slugify");

// CREATE JOB
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create({
      ...req.body,
      slug: slugify(req.body.title, { lower: true }),
    });

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: "Job creation failed" });
  }
};

// GET ACTIVE JOBS
exports.getJobs = async (req, res) => {
  const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
  res.json(jobs);
};


// GET SINGLE JOB BY SLUG
exports.getJobBySlug = async (req, res) => {
  try {
    const job = await Job.findOne({
      slug: req.params.slug,
      isActive: true,
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch job" });
  }
};
