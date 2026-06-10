import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
import Video from "../models/video.models.js";
import { aggregatePaginate } from "mongoose-aggregate-paginate-v2";
import { Comment } from "../models/comment.models.js";
import { Like } from "../models/like.models.js";
import mongoose from "mongoose";

// Toggle  Video Like

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const alreadyLiked = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });
  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked._id);
    return res
      .status(200)
      .json(new ApiResponse(200, "Unliked Successfully", {}));
  }
  await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });
  return res.status(200).json(new ApiResponse(200, "Liked Successfully", {}));
});

// Toggle Comment Like

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }
  const alreadyLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });
  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked._id);
    return res
      .status(200)
      .json(new ApiResponse(200, "Unliked Successfully", {}));
  }
  const comment = await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, "Liked Successfully", comment));
});

// Toggle Tweet Like

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  const alreadyLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });
  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked._id);
    return res
      .status(200)
      .json(new ApiResponse(200, "Unliked Successfully", {}));
  }
  await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });
  return res.status(200).json(new ApiResponse(200, "Liked Successfully", {}));
});

// Get User Like

const getUsersLikedVideo = asyncHandler(async (req, res) => {
  const { sortBy, sortOrder = "desc", page = 1, limit = 10 } = req.query;

  const videos = Like.aggregate([
    {
      $match: {
        likedBy: req.user._id,
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
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
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: "$owner",
          },
        ],
      },
    },
    {
      $unwind: "$video",
    },
  ]);

  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  };
  const paginatedLikedVideos = await Like.aggregatePaginate(videos, options);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Users Liked Videos Fetched Successfully",
        paginatedLikedVideos
      )
    );
});

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getUsersLikedVideo,
};
