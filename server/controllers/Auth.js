const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const Profile = require("../models/profile");
const jwt = require("jsonwebtoken");
const { passwordUpdated } = require("../mail/passwordUpdate");
const mailSender = require("../utils/mailSender");
require("dotenv").config();

// const { options } = require("nodemon/lib/config");

//sendOTP
exports.sendotp = async(req,res) => {
 try{
    //fetch email from req body
    const {email} = req.body;

    //chk if user already exist
    const checkUserPresent = await User.findOne({email});

    //if user already exist, then return a response
    if(checkUserPresent){
        // Return 401 Unauthorized status code with error message
    return res.status(401).json ({
        success:false,
        message: "User is already registered",
    });
  } 

  //generate OTP
  var otp = otpGenerator.generate(6, {
    upperCaseAlphabets:false,
    lowerCaseAlphabets:false,
    specialChars:false,
  });
  console.log("OTP generated : ", otp);

  //check unique otp or not
  let result = await OTP.findOne({otp: otp});

  //if found then again generate otp
  while(result){
    otp = otpGenerator.generate(6,{
        upperCaseAlphabets:false,
        // lowerCaseAlphabets:false,
        // specialChars:false,
    });
    result = await OTP.findOne({otp: otp});
  }

  //now we have generated unique otp
  //check in model OTP for otp schema then make an entry accordingly in db here we didn't pass created at because we give the bydefault logic in model i.e. current date
  const otpPayload = {email, otp};  

  //create an entry in db for OTP
  const otpBody = await OTP.create(otpPayload);
  console.log("OTP IN DB: ", otpBody);

  //return response successful
  res.status(200).json({
    success:true,
    message:"OTP Sent Successfully",
    otp,
  });

}catch(err){
    console.log("Error found : ", err);
    return res.status(500).json({
        success:false,
        message:"OTP FAT GYA",
    });
}

};

//signUp Controller for Registering Users
exports.signup = async (req,res) => {
    try{
        //data fetch from req body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType, //it is a tab so we have atleast one value already student or instructor
            contactNumber,
            otp
        } = req.body;

        //validate data
        if(!firstName || !lastName || !email || !password || !confirmPassword
            || !otp) {
                return res.status(403).json({
                    success : false,
                    message :"All fields are required",
                });
            }


        //2 pwd match
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:"Password not matched",
            });
        }

        //check user already exists or not 
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:"User already registerd. Please sign in to continue.",
            });
        }

        //find most recent OTP stored for the user
        const recentOTP = await OTP.find({email}).sort({createdAt:-1}).limit(1); //sort basis on timestamp and fetch recent most value
        console.log("Recent OTP : ",recentOTP);

        //validate OTP
        if(recentOTP.length === 0){
            //OTP not found
            return res.status(400).json({
                success:false,
                message:"OTP Not found",
            });
        }
        else if(otp !== recentOTP[0].otp)
        {
            //Invalid OTP
            return res.status(400).json({
                success:false,
                message:"Invalid OTP",
            });
        }

        //Hah pwd
        const hashedPassword = await bcrypt.hash(password,10);

        //create the user
        let approved = "";
        approved === "Instructor" ? (approved = false) : (approved = true);

        //create entry in DB
        //Make a null Profile
        const profileDetails = await Profile.create({
            gender:null,
            dateofBirth:null,
            about:null,
            contactNumber:null,
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType : accountType,
            additionalDetails:profileDetails._id, //profile id from DB
            image : `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`, //4 profile
        });

        //return res
        return res.status(200).json({
            suceess:true,
            message:"User registered Successfully",
            user,
        });
    }
    catch(err){
        console.log("Error in register User: ",err);
        return res.status(500).json({
            success:false,
            message:"User cannot registered, Please try again"
        });
    }

};

//Login controller for authenticating users
exports.login = async(req,res) => {
    try{
        //data fetch
        const {email,password} = req.body;

        //data validation
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"All fields are required, Please fill all fields",
            });
        }

        //check user exists or not
        const user = await User.findOne({email}).populate("additionalDetails"); //populate optional 
       
        // If user not found with provided email
        if(!user){
            // Return 401 Unauthorized status code with error message
            return res.status(401).json({
                success:false,
                message:"User is not registered, please signup first",
            });
        }
        
        //generate JWT token after pwd matching
        // if(await bcrypt.compare(password, user.password)){
        //     const payload = {
        //         email : user.email,
        //         id : user._id,
        //         accountType : user.accountType,
        //     }
        //     //generate token
        //     const token = jwt.sign(payload, process.env.JWT_SECRET, {
        //         expiresIn:"2h",
        //     });

        // // Generate JWT token and Compare Password
		if (await bcrypt.compare(password, user.password)) {
			const token = jwt.sign(
				{ email: user.email, id: user._id, accountType: user.accountType },
				process.env.JWT_SECRET,
				{
					expiresIn: "24h",
				}
			);
            
        // Save token to user document in database
        user.token = token;
        user.password = undefined;
            //create cookie and send response
            const options = {
                expires : new Date(Date.now() + 3*24*60*60*1000), //3 days
                httpOnly:true,
            }
                      //name,   value,  option
            res.cookie("token", token, options).status(200).json({
                success:true,
                token,
                user,
                message:"User Login Successfully",
            });
        }
        else{
            return res.status(401).json({
                success:false,
                message:'Password is incorrect',
            });
        }

    }
    catch(err){
        console.log(err);
        // Return 500 Internal Server Error status code with error message
        return res.status(500).json({
            success:false,
            message:"Login Failure, please try again",
        });
    }
};

//change Pwd (HW)
exports.changePassword = async(req,res) => {
    try{
    //fetch data
    const userDetails = await User.findById(req.user.id);

    //get oldpwd, newpwd, confirmNewpwd from req.body
    const {oldPassword, newPassword, confirmNewPassword } = req.body;

    //validate old pwd
    const isPasswordMatch = await bcrypt.compare(
        oldPassword,
        userDetails.password,
    );

    if(!isPasswordMatch){
        //If old password does not match, return a 401 (unauthorized) error
        return res.status(401).json({
            success: false,
            message: "The password is incorrect"
        });  
    }
    //Match new pwd and confirm new pwd
    if(newPassword !== confirmNewPassword){
        //If new pwd and confirm pwd do not match, return a 400 (bad req. error)
        return res.status(400).json({
            success:false,
            message:"The password and confirm password does not match",
        });
    }

    //update Pwd in DB
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(req.user.id,
                                                            {password: encryptedPassword},
                                                            {new: true}
                                                            );

    //send Mail - PWD updated
    try{
        const emailResponse = await mailSender(
            updatedUserDetails.email,
            passwordUpdated(
                updatedUserDetails.email,
                `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
            )
        );
        console.log("Email sent successfully:", emailResponse.response);
    }
    catch(err){
    // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
    console.error("Error occured while sending the email: ",err);
    return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: err.message,
    });
    }
    //return response
    return res.status(200).json({
        success: true,
        message: "Password updated successfully",
    });
    }
    catch(err){
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while updating password:", err);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: err.message,
		});
    }
};