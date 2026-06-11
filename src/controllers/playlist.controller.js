import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
import Video from "../models/video.models.js";
import { Playlist } from "../models/playlist.models.js";
import { aggregatePaginate } from "mongoose-aggregate-paginate-v2";
import mongoose from "mongoose";

// create A Playlist

const createPlayList = asyncHandler(async (req, res) => {
  const { name, description, videos = [] } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "All fields are required");
  }
  if (name.trim() == "" || description.trim() == "") {
    throw new ApiError(400, "fields cannot be empty");
  }
  if (!Array.isArray(videos)) {
    throw new ApiError(400, "Videos must be an array");
  }
  if (videos.length > 0) {
    const isValid = videos.every((videoId) =>
      mongoose.isValidObjectId(videoId)
    ); // every returns boolean  true if all elements are valid else false
    if (!isValid) {
      throw new ApiError(400, "Invalid video ids");
    }
  }
  const exsistedPlaylist = await Playlist.findOne({
    name,
    owner: req.user._id,
  });
  if (exsistedPlaylist) {
    throw new ApiError(409, "Playlist already exsist");
  }
  const playlist = await Playlist.create({
    name,
    description,
    videos,
    owner: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, "Playlist created successfully", playlist));
});

//Delete Playlist

const deletePlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this playlist");
  }
  try {
    await Playlist.findByIdAndDelete(playlistId);
    return res
      .status(200)
      .json(new ApiResponse(true, "Playlist deleted successfully", []));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to delete playlist");
  }
});

// Update Playlist

const updatePlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  if (!name && !description) {
    throw new ApiError(
      400,
      "At least one field (name or description) is required"
    );
  }
  const updateFieldData = {};
  if (name?.trim() != "") {
    updateFieldData.name = name;
  }
  if (description?.trim() != "") {
    updateFieldData.description = description;
  }
  try {
    await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $set: { ...updateFieldData },
      },
      { new: true }
    );
    return res
      .status(200)
      .json(new ApiResponse(200, "Playlist updated successfully", []));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to update playlist");
  }
});

// Get All Users'Playlists

const usersPlaylist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const playlist = await Playlist.aggregate([
    {
      $match: {
        owner: userId,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
      $unwind: "$videos",
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, "Playlist fetched successfully", playlist));
});

// Add Video To Playlist

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { videoId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: videoId },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Video added to playlist successfully", []));
});

// Delete Video From Playlist

const deleteVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { videoId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(404, "Video not found in playlist");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }
  Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Video deleted from playlist successfully", []));
});

// get playlist by id

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "Playlist ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const playlistWithVideos = await Playlist.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
      $unwind: "$videos",
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Playlist fetched successfully", playlistWithVideos)
    );
});

export {
  createPlayList,
  deletePlayList,
  updatePlayList,
  usersPlaylist,
  addVideoToPlaylist,
  deleteVideoFromPlaylist,
  getPlaylistById,
};
