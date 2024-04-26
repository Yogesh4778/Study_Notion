const CourseProgress = require("../models/CourseProgress");
const SubSection = require("../models/SubSection");


exports.updateCourseProgress = async(req,res) => {
    const {courseId, subSectionId} = req.body;
    const userId = req.user.id;

    try{
        //chk if the subsection is valid
        const subSection = await SubSection.findById(subSectionId);

        if(!subSection){
            return res.status(404).json({
                error:"Invalid SubSection"
            });
        }
        //chk for old entry
        let courseProgress = await CourseProgress.findOne({
            courseID:courseId,
            userId:userId,
        });
        if(!courseProgress){
            return res.status(400).json({
                success: false,
                message: "Course Progress does not exist",
            });
        }
        else{
            //chk for re-completing video/subsection
            if(courseProgress.completedVideos.includes(subSectionId)){
                return res.status(400).json({
                   error:"SubSection already completed",
                });
            }
            //push into completed video
            courseProgress.completedVideos.push(subSectionId);
        }
        //save this state
        await courseProgress.save();
        //without this we got an issue in shoeing toast
        return res.status(200).json({
            success:true,
            message:"Course Progress Updated Successfully",
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            error:"Internal Server error",
        });
    }
}