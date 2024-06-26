const express = require("express");
const app = express();

//routes import
const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");

//dot env
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const {cloudinaryConnect} = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT || 4000;

//database connect
database.connect();

//middlewares
app.use(express.json()); //parse json
app.use(cookieParser());
app.use(      //add cors
    cors({
        origin:"http://localhost:3000",     //jo bhi request is origin se aaye (frontend) usko entertain krna h
        credentials : true,
    })
)

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir:"/tmp",
    })
)

//cloudinary Connect
cloudinaryConnect();

//routes
app.use("/api/v1/auth",userRoutes);
app.use("/api/v1/profile",profileRoutes);
app.use("/api/v1/course",courseRoutes);
app.use("/api/v1/payment",paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

//default routes
app.get("/",(req,res) => {
    return res.json({
        success : true,
        message : 'Your server is up and running successfully....'
    });
});

//activate server
app.listen(PORT, () => {
    console.log(`App is running at ${PORT}`)
})