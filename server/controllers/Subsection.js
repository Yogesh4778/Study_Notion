const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

//create a new subsection for a given section
exports.createSubSection = async(req,res) => {
    try{
        //fetch data from req body
        const {sectionId, title, description} = req.body;

        //extract file/video
        const video = req.files.video;

        //validation
        if(!sectionId || !title || !description || !video){
            return res.status(404).json({
                success:false,
                message:"All fields are required",
            });
        }
        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(
            video, 
            process.env.FOLDER_NAME
        );

        //create a new sub section with the necessary information
        const subSectionDetails = await SubSection.create({
            title:title,
            timeDuration:`${uploadDetails.duration}`,
            description:description,
            videoUrl:uploadDetails.secure_url,
        })

        //update section with this sub section object ID
        const updatedSection = await Section.findByIdAndUpdate({_id:sectionId}, //on the basis of section id
                                                    { //what changes 
                                                        $push:{
                                                            subSection:subSectionDetails._id,
                                                        }
                                                    },
                                                    {new:true}
                                                    //HW : log updated section here, after adding populate query
                                                    ).populate("subSection");

        //return response
        return res.status(200).json({
            success:true,
            message:"Sub Section Created Successfully",
            data: updatedSection,
        });
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"Internal Server error",
            error:err.message,
        });
    }
};


//HW
//update & delete subsection
exports.updateSubSection = async(req,res) => {
    try{
        const {sectionId,subSectionId, title, description} = req.body;
        const subSection = await SubSection.findById(subSectionId);

        if(!subSection){
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            })
        }
        if(title !== undefined){
            subSection.title = title;
    }

    if(description !== undefined){
        subSection.description = description;
    }

    if(req.files && req.files.video !== undefined){
        const video = req.files.video;
        const uploadDetails = await uploadImageToCloudinary(video,
            process.env.FOLDER_NAME)
            subSection.videoUrl = uploadDetails.secure_url  
            subSection.timeDuration = `${uploadDetails.duration}`
    }
    await subSection.save();

    //problem ed-2
    const upatedSection = await Section.findById(sectionId).populate("subSection");

    return res.status(200).json({
        success: true,
        data:upatedSection,
        message: "Section updated successfully",
    })
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message: "An error occures while updating the section",
        });
    }
};

exports.deleteSubSection = async (req, res) => {
    try {
      const { subSectionId, sectionId } = req.body
      await Section.findByIdAndUpdate(
        { _id: sectionId },
        {
            // The $pull operator removes from an existing array all instances of a value or values that match a specified condition
          $pull: {
            subSection: subSectionId,
          },
        }
      )
      const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })
  
      if (!subSection) {
        return res.status(404).json({ 
            success: false,
             message: "SubSection not found" });
      }

      //Ed-2 problem
      const upatedSection = await Section.findById(sectionId).populate("subSection");
  
      return res.status(200).json({
        success: true,
        data: upatedSection,
        message: "SubSection deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
      });
    }
  };