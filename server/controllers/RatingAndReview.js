const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const {mongo, default: mongoose } = require("mongoose");

//createRating
exports.createRating = async(req,res) => {
    try{
        //get user id
        const userId = req.user.id;

        //fetch data
        const{rating,review,courseId} = req.body;

        //check if user is enrolled or not
        const courseDetails = await Course.findOne(
                                        {_id:courseId,
                                        studentsEnrolled:{$elemMatch: {$eq : userId}}, //element match & equal operator
                                    }); //if it exists then user is enrolled in the course
         
        if(!courseDetails){
            return res.status(404).json({
                success:false,
                message:"Student is not enrolled in the course",
            });
        }
        //check if user already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
                                        user:userId,
                                        course:courseId,
                                        });
        if(alreadyReviewed){
                return res.status(403).json({
                    success:false,
                    message:"Course is already reviewed by the user",
                });
            }

        //create rating and review
        const ratingReview = await RatingAndReview.create({
                                        rating, review,
                                        course:courseId,
                                        user:userId,
                                        });
                                        
        //update course with this rating and review
        const updatedCourseDetails = await Course.findByIdAndUpdate({_id:courseId},
                                    {
                                        $push: {
                                            ratingAndReviews : ratingReview._id,
                                        }
                                    },
                                        {new:true}
                                    );
        console.log(updatedCourseDetails);
        //return response
        return res.status(200).json({
            success:true,
            message:"Rating and Review created successfully",
            ratingReview,
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        });
    }
}

//get avg rating
exports.getAverageRating = async(req, res) => {
    try{
        //get courseId
        const courseId = req.body.courseId;

        //calculate Avg Rating
        const result = await RatingAndReview.aggregate([
            {
                //ratingandReview k andr 1 esi entry find krke do jiski
                //course ki field k andr courseId pdi ho(match krrhi ho is is se)
                $match:{
                    course: new mongoose.Types.ObjectId(courseId),//convert course id into string
                },
            },
            {
                //jitni bhi entries aayi thi sbko ek gp bna diya
                $group:{
                    _id : null,
                    averageRating : {$avg: "$rating"},
                }
            }
        ])
        //Return rating
        if(result.length > 0){
            return res.status(200).json({
                success:true,
                averageRating:result[0].averageRating, //aggregate fn return an array
            })
        }

        //if no rating exists
        return res.status(200).json({
            success:true,
            message:"Average Rating is 0, no rating is given till now",
            averageRating:0,

        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        });
    }
}


//get all rating
exports.getAllRating = async (req,res) => {
    try{
    const allReviews = await RatingAndReview.find({})
                             .sort({rating: "desc"})
                             .populate({
                                path:"user", //user data is stored in form of id
                                select:"firstName lastName email image", //ye fields chiye output me
                             })
                             .populate({
                                path:"course", //course data is stored in form of id
                                select:"courseName",
                             })
                             .exec();

        return res.status(200).json({
            success:true,
            message:"All reviews fetched successfully",
            data : allReviews,
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        });
    }
}