const express=require("express")
const userController = require("../controllers/userController")
const upload = require("../middlewares/cloudinary")
const userRouter=express.Router()

userRouter.post('/register',upload.fields([{ name: 'coverImage', maxCount: 1 },{ name: 'idCard', maxCount: 1 },{ name: 'dp', maxCount: 1 },]),userController.register)
userRouter.get('/login',userController.login)
userRouter.get('/logout',userController.logout)
userRouter.get('/team',userController.getUsers)
module.exports=userRouter