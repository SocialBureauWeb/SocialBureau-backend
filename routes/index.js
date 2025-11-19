const express=require("express");
const clickupRoutes = require("./clickupRoutes");
const userRouter = require("./userRoutes");
const reviewRoutes = require("./reviewRoutes");
const qaRoutes = require("./qaRoutes");
const blogRoutes = require("./blogRoutes");
const eventRoutes = require("./eventRoutes");
const router=express()

router.use(express.json())

router.use("/clickup", clickupRoutes);
router.use("/user", userRouter);
router.use("/review", reviewRoutes);
router.use("/qa", qaRoutes);
router.use("/blog", blogRoutes);
router.use("/event", eventRoutes);

module.exports=router