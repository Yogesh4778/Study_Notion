//since we have make a null profile so we only need to update profile
//we doesn't need to create new profile

const Profile = require('../models/profile');
const User = require('../models/User');
const Course = require("../models/Course");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

exports.updateProfile = async(req,res) => {
    try{
        //get data
        const {dateOfBirth="", about="", contactNumber } = req.body;

        //get user id
        const id = req.user.id;     
        //middleware after user logged in we store id in payload after decoding token, 
        //and put it in req.user at auth.js

        //validation
        if(!contactNumber || !id ){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            });
        }
        //first we have user id so we find profile id from user and then  get profile data from profile id

        //find profile
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        const profile = await Profile.findById(profileId);

        //update profile fields
        profile.dateofBirth = dateOfBirth;
        profile.about = about;
        // profileDetails.gender = gender;
        profile.contactNumber=contactNumber;

        await profile.save();      //save in DB

        //return response
        return res.status(200).json({
            success:true,
            message:"Profile Details Updated Successfully",
            profile,
        });
    }
    catch(err){
        return res.status(500).json({
            success:false,
            error:err.message,
        });
    }
};


//delete account
//how can we schedule delete job
exports.deleteAccount = async(req,res) => {
    try{
        //get id
        const id = req.user.id;

        //validation
        const user = await User.findById({_id: id});
        if(!user){
            return res.status(404).json({
                success:false,
                message:'User Not Found',
            });
        }

        //delete Assosiated Profile with the User
        await Profile.findByIdAndDelete({_id: user.additionalDetails});
        
        //HW unenroll user from all enrolled courses
        //delete user
        await User.findByIdAndDelete({_id:id});

        //return response
        return res.status(200).json({
            success:true,
            message:"User deleted successfully",
        });
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"User cannot be deleted successfully",
            error : err.message,
        });
    }
};

//get all details of user
exports.getAllUserDetails = async(req,res) => {
    try{
        //get id
        const id = req.user.id;

        //validation
        const userDetails = await User.findById(id)
              .populate("additionalDetails")
              .exec();
        console.log(userDetails);
        //response return
        return res.status(200).json({
            success:true,
            message:"User data fetched Successfully",
            data: userDetails,
        });
    }
catch(err){
    return res.status(500).json({
        success:false,
        message:"User details not fetched",
    });
}
};

exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000  //height & quality
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};
  
exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate("courses")
        .exec()
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};

//course & stats of Instructor
exports.instructorDashboard = async(req,res) => {
  try{
    const courseDetails = await Course.find({instructor:req.user.id});
    //current logged in user is instructor so we get id from req

      const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnrolled.length;
      const totalAmountGenerated = totalStudentsEnrolled * course.price;

      //create a new object with the additional fields
      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        totalStudentsEnrolled,
        totalAmountGenerated,
      }
      return courseDataWithStats
    })
    res.status(200).json({
      courses: courseData,
    });
  }
  catch(err){
    console.error(err);
    res.status(500).json({
      message:"Internal Server Error",
    });
  }
}