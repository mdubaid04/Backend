import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Video from "../models/video.models.js";
import uploadFileToCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { deleteFileFromCloudinary } from "../utils/cloudinary.js";
import User from "../models/user.models.js";

// Publish a video

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoLocalPath = req.files?.video[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }
  const videoCloudinaryFile = await uploadFileToCloudinary(videoLocalPath);
  const thumbnailCloudinaryFile =
    await uploadFileToCloudinary(thumbnailLocalPath);
  const videoDuration = videoCloudinaryFile?.duration;

  if (!videoCloudinaryFile || !videoDuration) {
    throw new ApiError(500, "Failed to upload video to cloudinary");
  }
  if (!thumbnailCloudinaryFile) {
    throw new ApiError(500, "Failed to upload thumbnail to cloudinary");
  }

  const newVideo = await Video.create({
    title,
    description,
    videofile: videoCloudinaryFile.secure_url,
    videoPublicId: videoCloudinaryFile.public_id,
    thumbnail: thumbnailCloudinaryFile.secure_url,
    thumbnailPublicId: thumbnailCloudinaryFile.public_id,
    owner: req.user._id,
    duration: videoDuration,
  });
  return res
    .status(201)
    .json(new ApiResponse(true, "Video published successfully", newVideo));
});

// Get videoById

const getVideoById = asyncHandler(async (req, res) => {
  const { videoid } = req.params;
  if (!videoid) {
    throw new ApiError(400, "Video ID is required");
  }

  try {
    console.log("Updating view count and watch history...");
    await Promise.all([
      Video.findByIdAndUpdate(videoid, { $inc: { views: 1 } }),
      User.findByIdAndUpdate(req.user._id, {
        $addToSet: { watchHistory: videoid },
      }),
    ]);
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Failed to update view count and watch history"
    );
  }

  const fetchedVideo = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(videoid) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(true, "Video fetched successfully", fetchedVideo[0]));
});

//Get userVideos

const userVideos = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username: username });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const videos = Video.aggregate([
    // await nhi karenge kyuki aggregatePaginate already async hai vahan pr await karenge aur aggregate ke andar await nhi kar sakte kyuki aggregate paginate use kr rhe
    { $match: { owner: user._id } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
  ]);
  const option = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  };
  const paginatedVideos = await Video.aggregatePaginate(videos, option);
  return res
    .status(200)
    .json(
      new ApiResponse(true, "User videos fetched successfully", paginatedVideos)
    );
});

// Update Video

const updateVideo = asyncHandler(async (req, res) => {
  const { videoid } = req.params;
  const { title, description } = req.body;
  if (!title && !description) {
    throw new ApiError(
      400,
      "At least one field (title or description) is required"
    );
  }
  const updateFieldData = {};
  if (title?.trim() != "") {
    updateFieldData.title = title;
  }
  if (description?.trim() != "") {
    updateFieldData.description = description;
  }

  await Video.findByIdAndUpdate(
    videoid,
    {
      $set: { ...updateFieldData },
    },

    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Video updated successfully", []));
});

// Delete Video
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoid } = req.params;
  const video = await Video.findById(videoid);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    //dono id mongoose ki object id hai isliye toString krke compare kar rhe
    throw new ApiError(403, "You are not authorized to delete this video");
  }
  try {
    await Video.findByIdAndDelete(videoid);
    await deleteFileFromCloudinary(video.videoPublicId);
    await deleteFileFromCloudinary(video.thumbnailPublicId);

    return res
      .status(200)
      .json(new ApiResponse(true, "Video deleted successfully", []));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to delete video");
  }
});

// Toggle publish/unpublish video

const togglePublishVideo = asyncHandler(async (req, res) => {
  const { videoid } = req.params;
  const video = await Video.findById(videoid);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }
  video.isPublished = !video.isPublished;
  await video.save();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `Video ${video.isPublished ? "published" : "unpublished"} successfully`,
        []
      )
    );
});

// Get All videos

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sort = "asc",
    userId,
  } = req.query;
  const videos = Video.aggregate([
    {
      $match: {
        isPublished: true,
        ...(query && { title: { $regex: query, $options: "i" } }), //regex se title me query match krni chahiye, i option se case insensitive search hogi
        ...(userId && { owner: new mongoose.Types.ObjectId(userId) }),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    {
      $sort: {
        [sortBy]: sort === "asc" ? 1 : -1,
      },
    },
  ]);
  const option = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
  };
  const paginatedVideos = await Video.aggregatePaginate(videos, option);
  return res
    .status(200)
    .json(
      new ApiResponse(true, "Videos fetched successfully", paginatedVideos)
    );
});

export {
  publishAVideo,
  getVideoById,
  userVideos,
  updateVideo,
  deleteVideo,
  togglePublishVideo,
  getAllVideos,
};
