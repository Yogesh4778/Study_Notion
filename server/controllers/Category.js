const Category = require("../models/Category");


function getRandomInt(max){
    return Math.floor(Math.random() * max)
}

//create Category handler fn
exports.createCategory = async(req,res) => {
    try{
        //fetch data
        const {name, description} = req.body;

        //validation
        if(!name || !description){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            })
        }

        //create entry in DB
        const categoryDetails = await Category.create({
            name:name,
            description:description,
        });
        console.log(categoryDetails);

        //return response
        return res.status(200).json({
            success:true,
            message:"Category created successfully",
        });
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:err.message,
        });
    }

}; 


//get ALl categories
exports.showAllCategories = async (req,res) => {
    try{
        // console.log("INSIDE SHOW ALL CATEGORIES");
        const allCategories = await Category.find({},{name:true, description:true}); //we are not finding on any criteria but make sure we have name & description present 
        return res.status(200).json({
            success:true,
            message:"All Categories returned successfully",
            data: allCategories,
        });
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:err.message,
        });
    }
};

//category page details
exports.categoryPageDetails = async(req,res) => {
    try{
        //get category id
        const {categoryId} = req.body;
        console.log("PRINTING CATEGORY ID: ", categoryId);
        //get courses for specified category id
        const selectedCategory = await Category.findById(categoryId)
                                // change 1
                                        .populate({
                                            path: "courses",
                                            match: {status: "Published"},
                                            // populate: "ratingAndReviews",  3comment
                                        })
                                        .exec();

        //validation (Handle the case when the category is not found)
        if(!selectedCategory){
            console.log("Category not found.")
            return res.status(404).json({
                success:false,
                message:"Category Not Found",
            });
        }
        // Handle the case when there are no courses (Change 2)
      if (selectedCategory.courses.length === 0) {
        console.log("No courses found for the selected category.")
        return res.status(404).json({
          success: false,
          message: "No courses found for the selected category.",
        })
      }

      // Get courses for other categories
      const categoriesExceptSelected = await Category.find({
        _id: { $ne: categoryId }, //not equal
      })
      let differentCategory = await Category.findOne(
        categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
          ._id
      )
        .populate({
          path: "courses",
          match: { status: "Published" },
        })
        .exec()
        
        //get top selling courses
        const allCategories = await Category.find()
        .populate({
            path: "courses",
            match: {status: "Published"},
            populate: {
                path:"instructor"
            },
        })
        .exec()
        const allCourses = allCategories.flatMap((category) => category.courses)
        const mostSellingCourses = allCourses
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 10)
         // console.log("mostSellingCourses COURSE", mostSellingCourses)
        //nested populate
                      
        
        //return res 
        return res.status(200).json({
            success:true,
            data:{
                selectedCategory,
                differentCategory,
                mostSellingCourses,
            },
        });
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:err.message,
        });
    }
}