const express=require("express")
const jwt=require("jsonwebtoken")
require("dotenv").config()

const userAuthentication=(req,res,next)=>{
    const {token} =req.cookies
    if(!token){
        throw new Error("User not authenticated")
    }
    const decoded=jwt.verify(token,process.env.JWT_SECRET_KEY)
    req.user={
        email:decoded.email,
        id:decoded.id
    }
    next()
}
module.exports=userAuthentication