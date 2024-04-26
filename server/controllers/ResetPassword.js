const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

//resetPasswordToken
exports.resetPasswordToken = async(req,res) => {
    //get email from req body
    try{
        const email = req.body.email;

        //check user for this email, email validation
        const user = await User.findOne({email: email});
        if(!user){
            return res.json({
                success:false,
                message:`This Email: ${email} is not Registered With Us Enter a Valid Email `,
            });
        }

        //generate token (crypto is used)
        //The crypto module provides a way of handling encrypted data.
        // const token = crypto.randomUUID(); //Universally Unique Identifier (UUID)
        const token = crypto.randomBytes(20).toString('hex');

//*********************************************************************************** */
        //update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
            {email : email}, //on the basis of email
            {  //Update this
                token : token,
                resetPasswordExpires : Date.now() + 5*60*1000,   //5 min
            },
            {new : true}    //it returns updated docs
        );
        console.log("DETAILS", updatedDetails);
        //create URL
        const url = `http://localhost:3000/update-password/${token}`;

        //send mail containing the URL
        await mailSender(email, 
            "Password Reset Link",
            `Your Link for update password is ${url}. Please click this url to reset your password.`);
        //return response
        return res.json({
            success:true,
            message:"Email sent successfully, please check your email"
        });
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"Something went wrong while sending reset pwd mail",
            Error : err.message,
        });
}


}

//resetPassword
exports.resetPassword = async (req,res) => {
    try{
        //data fetch
        const {password, confirmPassword, token} = req.body;
        //FE put token in req because we pass token in url

        //validation
        if(confirmPassword !== password){
            return res.json({
                success:false,
                message:"Password not matched",
            });
        }
        //get user details from DB using token
        const userDetails = await User.findOne({token : token});

        //if no entry - invalid token
        if(!userDetails){
            return res.json({
                success:false,
                message:"Invalid token",
            });
        }
        //token time check
        if((userDetails.resetPasswordExpires < Date.now())){
            return res.status(403).json({
                success:false,
                message:"Token Expires, please regenerate your token",
            });
        }
        //hash pwd
        const hashedPassword = await bcrypt.hash(password,10);

        //update pwd
        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true},
        );
        //return response
        return res.status(200).json({
            success:true,
            message:"Password reset Successfully",
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while reset password",
        });
    }
};
