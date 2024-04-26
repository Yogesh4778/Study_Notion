const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");

// create new section 
exports.createSection = async(req,res)=>{
    try{
        //fetch data
        const {sectionName, courseId} = req.body;

        //data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:"Missing Properties",
            });
        }

        //create a new section with the given name
        const newSection = await Section.create({sectionName});
        
       // Add the new section to the course's content array
        const updatedCourse = await Course.findByIdAndUpdate(
                                    courseId,  //update using course id
                                    {
                                        $push:{
                                            courseContent:newSection._id, //push section id into course content
                                        }
                                    },
                                    {new:true},
                                )
                                //hw how to use populate so that we populate section and subsection both in updatedCourseDetails
                                .populate({
                                    path: "courseContent",
                                    populate: {
                                        path: "subSection",
                                    }
                                })
                                .exec();
        //return response
        return res.status(200).json({
            success:true,
            message:"Section created successfully",
            updatedCourse,
        });
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"Unable to create section",
            error:err.message,
        });
    }
};           


//update section
exports.updateSection = async(req,res) => {
    try{
        //data fetch
        const {sectionName, sectionId, courseId} = req.body;

        //data validation
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success:false,
                message:"Missing Properties",
            });
        }
        //why we dont need to update in course model because course just contains the section id and we are updating section data, id remains same
        //update data
        const section = await Section.findByIdAndUpdate(sectionId,
                                                        {sectionName},
                                                        {new:true});

        const course = await Course.findById(courseId)
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection",
            },
        })
        .exec();

        //return response
        return res.status(200).json({
            success:true,
            message:`${section} Section Updated Successfully`,
            data: course,
        });
        
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"Unable to update section",
            error:err.message,
        });
    }
};


/*
//delete section
exports.deleteSection = async(req,res) => {
    try{
        //get ID - assuming that we are sending id in params
        const {sectionId} = req.params;
        //HW test with req.params
        //hw update course details also when section deleted

        //use findByIdandDelete
        await Section.findByIdAndDelete(sectionId);
        //todo ; do we need to delete the entry from course schema?

        //return response
        return res.status(200).json({
            success:true,
            message:"Section Deleted Successfully",
        });
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"Unable to delete section",
            error:err.message,
        });
    }
};
*/


// DELETE a section
exports.deleteSection = async (req, res) => {
	try {

		const { sectionId, courseId }  = req.body;
		await Course.findByIdAndUpdate(courseId, {
			$pull: {
				courseContent: sectionId,
			}
		})
		const section = await Section.findById(sectionId);
		console.log(sectionId, courseId);
		if(!section) {
			return res.status(404).json({
				success:false,
				message:"Section not Found",
			})
		}

		//delete sub section
		await SubSection.deleteMany({_id: {$in: section.subSection}});
        //  ($in operator) is used to match documents where the field contains any values in an array.

		await Section.findByIdAndDelete(sectionId);

		//find the updated course and return 
		const course = await Course.findById(courseId).populate({
			path:"courseContent",
			populate: {
				path: "subSection"
			}
		})
		.exec();

		res.status(200).json({
			success:true,
			message:"Section deleted",
			data:course
		});
	} catch (error) {
		console.error("Error deleting section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};   