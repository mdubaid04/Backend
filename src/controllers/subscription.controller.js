import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
import Video from "../models/video.models.js";
import mongoose from "mongoose";

// Toggle Subscripton/Unsubscribe

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }
  if (channelId === req.user._id) {
    throw new ApiError(400, "You cannot subscribe to yourself");
  }
  const alreadySubscribed = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });
  if (alreadySubscribed) {
    await Subscription.findByIdAndDelete(alreadySubscribed._id);
    return res
      .status(200)
      .json(new ApiResponse(200, "Unsubscribed from channel successfully", []));
  }
  const newSubscription = await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, "Subscribed to channel successfully", []));
});

// get Subscribersdeatails

const getSubscribersDetails = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }
  const subscribers = await Subscription.aggregate([
    { $match: { channel: channelId } },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
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
      $unwind: "$subscribers",
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Subscribers details fetched successfully",
        subscribers
      )
    );
});

// get channel subscribed details // channel ne kitne channel subscribe kare

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }
  const subscribedChannels = await Subscription.aggregate([
    { $match: { channel: channelId } },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribers",
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
      $unwind: "$channel",
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Subscribers details fetched successfully",
        subscribedChannels
      )
    );
});

export { toggleSubscription, getSubscribersDetails, getSubscribedChannels };
