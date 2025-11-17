const express=require("express");
const clickupRoutes = require("./clickupRoutes");
const userRouter = require("./userRoutes");
const reviewRoutes = require("./reviewRoutes");
const qaRoutes = require("./qaRoutes");
const blogRoutes = require("./blogRoutes");
const router=express()

router.use(express.json())

router.use("/clickup", clickupRoutes);
router.use("/user", userRouter);
router.use("/review", reviewRoutes);
router.use("/qa", qaRoutes);
router.use("/blog", blogRoutes);

module.exports=router