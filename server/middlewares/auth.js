const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");


//auth
exports.auth = async(req,res, next) => {
    try{
        //extract token
        const token = req.cookies.token
                     || req.body.token
                     || req.header("Authorization").replace("Bearer ","");

        //if token missing, then return response
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Token is missing",
            });
        }

        //verify the token (using verify method)
        try{
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            // console.log("Decode: ",decode);
            req.user = decode; //put decode in user object
        }
        catch(err){
            //verification - issue
            return res.status(401).json({
                success:false,
                message:"Token is invalid",
            });
        }
        next();     //go to next middleware
    }
    catch(err){
        return res.status(401).json({
            success:false,
            messsage:"Something went wrong while validating the Token",
        });
    }
}

//since we pass payload while generating jwt token so after decoding the token here
//we got email, userId, accountType so we can easily check the account Type here
//isStudent
exports.isStudent = async(req,res,next) => {
    try{
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Students only",
            });
        }
        next();
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified, please try again",
        });
    }
}


//isInstructor
exports.isInstructor = async(req,res,next) => {
    try{
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Instructor only",
            });
        }
        next();
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified, please try again",
        });
    }
}


//isAdmin
exports.isAdmin = async(req,res,next) => {
    try{
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Admin only",
            });
        }
        next();
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified, please try again",
        });
    }
}