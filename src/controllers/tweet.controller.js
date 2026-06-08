import { Tweet } from "../models/tweet.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
import { aggregatePaginate } from "mongoose-aggregate-paginate-v2";

// Create Tweet

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required");
  }
  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });
  res
    .status(201)
    .json(new ApiResponse(201, "Tweet created successfully", tweet));
});

// Get tweets by user

const getUserTweets = asyncHandler(async (req, res) => {
  const { sortBy, sortOrder = "desc", page = 1, limit = 10 } = req.query;
  const { username } = req.params;
  const user = await User.findOne({ username }).select("_id");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const tweets = Tweet.aggregate([
    {
      $match: {
        owner: user._id,
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
              avtar: 1,
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
        [sortBy]: sortOrder === "asc" ? 1 : -1,
      },
    },
  ]);
  const options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
  };
  const paginatedTweets = await Tweet.aggregatePaginate(tweets, options);
  res
    .status(200)
    .json(
      new ApiResponse(200, "Tweets retrieved successfully", paginatedTweets)
    );
});

// Update tweet

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!content || content?.trim() === "") {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  try {
    await Tweet.findByIdAndUpdate(
      tweetId,
      {
        content: content,
      },
      { new: true }
    );
  } catch (error) {
    throw new ApiError(500, "Failed to update tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet updated successfully", []));
});

// Delete tweet

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }
  await Tweet.findByIdAndDelete(tweetId);
  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully", []));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
