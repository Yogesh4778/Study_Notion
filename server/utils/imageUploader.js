const cloudinary = require('cloudinary').v2;

exports.uploadImageToCloudinary = async(file,folder,height, quality) => {
    const options = {folder};
    if(height){ //if height is in input then add in option
        options.height = height;
    }
    if(quality){ //if quality is in input then add in option
        options.quality = quality;
    }
    options.resource_type = "auto"; //best practice auto determine which resource is coming

    return await cloudinary.uploader.upload(file.tempFilePath, options);
}