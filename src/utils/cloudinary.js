import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadFileToCloudinary = async (localFilePath) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  if (!localFilePath) return null;
  try {
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File uploaded to Cloudinary:", uploadResult);
    return uploadResult;
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    fs.unlinkSync(localFilePath);
  }
};

export const deleteFileFromCloudinary = async (publicId) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  try {
    if (!publicId) {
      console.log("Public ID is required to delete file from Cloudinary");
      return null;
    }
    const deleteResult = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
    });
    console.log("File deleted from Cloudinary:", deleteResult);
    return deleteResult;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export default uploadFileToCloudinary;
