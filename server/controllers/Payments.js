const {instance} = require("../config/razorpay");
const Course = require('../models/Course');
const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const {courseEnrollmentEmail} = require("../mail/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const {paymentSuccessEmail} = require("../mail/paymentSuccessEmail");
const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress");


//capture the payment and initialize the razorpay order
exports.capturePayment = async(req,res) => {
    
    const {courses} = req.body;
    const userId = req.user.id;  //from middleware

    if(courses.length === 0){
        return res.json({
            success: false,
            message: "Please provide Course Id",
        });
    }

    //validate course details
    let totalAmount = 0;
    for(const course_id of courses){
        let course;
        try{
            // add amount of each course through course id
            course = await Course.findById(course_id); 

            if(!course){
                return res.status(400).json({
                    success: false,
                    message: "Could not find the course",
                });
            }

            //check if the user is already enrolled in course or not
            //userId type string to objectId(conversion)
            const uid = new mongoose.Types.ObjectId(userId);
            if(course.studentsEnrolled.includes(uid)){
                return res.status(400).json({
                    success: false,
                    message: "Student is already Enrolled"
                });
            }
            //now calc totalAMt
            totalAmount += course.price;
        }
        catch(err){
            console.log(err);
            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
    const currency = "INR";
    //create option
    const options = {
        amount : totalAmount * 100,
        currency,
        receipt : Math.random(Date.now()).toString(),
        // notes:{ commenting here
        //     courseId: courses,
        //     userId,
        // }
    }

        //create order
    try{
        const paymentResponse = await instance.orders.create(options);
        res.status(200).json({
            success:true,
            message: paymentResponse,
        })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"Could not Initiate Order",
        });
    }
}

//verify the payment
exports.verifyPayment = async(req,res) => {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;
    const userId = req.user.id; 

    if(!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature || !courses || !userId){
            return res.status(400).json({
                success: false,
                message:"Payment Failed",
            });
        }

        //predefined steps
        let body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_SECRET)
                .update(body.toString())
                .digest("hex");

        if(expectedSignature === razorpay_signature){
            // enroll student
            await enrollStudents(courses,userId,res); 

            //return res
            return res.status(200).json({
                success: true,
                message:"Payment Verified",
            });
        }      
        return res.status(400).json({
            success:false,
            message:"Payment Failed",
        });
} 

const enrollStudents = async(courses, userId, res) => {
        if(!courses || !userId){
            return res.status(400).json({
                success: false,
                message: "Please Provide data for Courses or UserId",
            });
        }

        for(const courseId of courses){
           try{
             //find the course and enroll the student in it
             const enrolledCourse = await Course.findByIdAndUpdate(
                {_id:courseId},
                {$push:{studentsEnrolled:userId}},
                {new:true},
            )
            if(!enrolledCourse){
                return res.status(500).json({
                    success:false,
                    message:"Course not Found",
                });
            } 

            //create a coursre progress field here
            const courseProgress = await CourseProgress.create({
                courseID: courseId,
                userId:userId,
                completedVideos:[],
            })


            //find the student & add the course to their list of enrolledCourses
            const enrolledStudent = await User.findByIdAndUpdate(userId,
                {$push:{
                    courses: courseId, 
                    courseProgress: courseProgress._id,
                }},
                {new:true});

                //send the mail
                const emailResponse = await mailSender(
                    enrollStudents.email,
                    `Successfully Enrolled into ${enrolledCourse.courseName}`,
                    courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
                ) 
            //   console.log("Email Sent Successfully", emailResponse.response);  
           }
           catch(err){
            console.log(err);
            return res.status(500).json({
                success:false,
                message:err.message,
            });
           }
        }

}

//mail sending
exports.sendPaymentSuccessEmail = async(req, res) => {
    const {orderId, paymentId, amount} = req.body;

    const userId = req.user.id;

    if(!orderId || !paymentId || !amount || !userId){
        return res.status(400).json({
            success: false,
            message: "Please provide all the fields",
        });
    }

    //now we have user id so we get the email of the user and then send the mail
    try{
        //find student
        const enrolledStudent = await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            `Payment Received`,
            paymentSuccessEmail(`${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
                                    amount/100,
                                    orderId,
                                    paymentId) 
        )
    }
    catch(err){
        console.log("Error in sending mail", err);
        return res.status(500).json({
            success:false,
            message:"Could not send email",
        });
    }

}








/* ****************ONLY FOR SINGLE ITEM *****************************
//capture the payment and initiate the Razorpay order
exports.capturePayment = async(req,res) => {
    //get courseID, userID
    const {course_id} = req.body;
    const userId = req.user.id;

    //validation
    //valid Course ID
    if(!course_id){
        return res.json({
            success:false,
            message:"Plz, provide valid courser Id",
        })
    };

    //valid courseDetail
    let course;
    try{
        course = await Course.findById(course_id);
        if(!course){
            return res.json({
                success:false,
                message:"Could not find the course",
            });
        }

        //user already pay for the same course(since we store every user obj id in course model so we use that id)
        const uid = new mongoose.Types.ObjectId(userId); //convert user id from string to obj id
        if(course.studentsEnrolled.includes(uid)){ //if student is already enrolled in the course
            return res.status(200).json({
                success:false,
                message:"Student is already enrolled",
            });
        }
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        });
    }

    //order create
     const amount = course.price;
     const currency = "INR";

     const options = {
        amount : amount * 100,
        currency,
        receipt : Math.random(Date.now()).toString(),
        notes:{
            courseId : course_id,
            userId,
        }  //notes we need after payment is authorized and we need to enroll student in the course
     };

     try{
        //initiate the payment using razorpay
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);
        
        //return response
        return res.status(200).json({
            success:true,
            courseName : course.courseName,
            courseDescription : course.courseDescription,
            thumbnail : course.thumbnail,
            orderId : paymentResponse.id,
            currency:paymentResponse.currency,
            amount:paymentResponse.amount,
        });
     }
     catch(err){
        console.log(err);
        return res.json({
            success:false,
            message:"Could not initiate order",
        });
     }
};



//verify signature of Razorpay and Server
exports.verifySignature = async(req,res) => {
    const webhookSecret = "12345678";

    const signature = req.headers["x-razorpay-signature"]; //razorpay bydefault signature

    //hashed pwd
    //convert normal webhooksecret to hashed form
    //SHA = secure hashing algo
    //Hmac = hashed based msg authentication code
    //digest = normal pwd converted to hashed pwd is called digest
                                    //Algo    scrt_key
    const shasum = crypto.createHmac("sha256",webhookSecret);
    shasum.update(JSON.stringify(req.body)); //convert in string
    const digest = shasum.digest("hex");


    //now match both signature
    if(signature === digest){
        console.log("Payment is authorized");

    //now take action(update course details in st. account)
    //since we pass id in notes so we use notes obj here to fetch id
        
    const {courseId, userId} = req.body.payload.payment.entity.notes;

    try{
        //fulfill the action

        //find the course and enroll student in it
        const enrolledCourse = await Course.findOneAndUpdate(
                                        {_id : courseId},
                                        {$push:{studentsEnrolled:userId}},
                                        {new:true},
        );

        //validate response
        if(!enrolledCourse){
            return res.status(500).json({
                success:false,
                message:"Course not found",
            });
        }

        //if all goes well
        console.log(enrolledCourse);

        //now find student and add the course to their list enrolled courses

        const enrolledStudent = await User.findOneAndUpdate(
                                        {_id : userId},
                                        {$push:{courses:courseId}},
                                        {new:true},
        );
        console.log(enrolledStudent);


        //Now send confirmation mail using template
        const emailResponse = await mailSender(
                                    enrolledStudent.email,
                                    "Course enrollment successful",
                                    "Congratulations you are onboarded into new studyNotion  course",
        );

        console.log(emailResponse);
        return res.status(200).json({
            success:true,
            message:"Signature verified and course added",
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
  else{
        return res.status(400).json({
            success:false,
            message:"Invalid request",
        });
  }
};

*/