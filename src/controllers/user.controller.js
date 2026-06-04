import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.models.js";
import uploadFileToCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const AccessToken = user.generateAccessToken();
    const RefreshToken = user.generateRefreshToken();
    user.refreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });
    return { AccessToken, RefreshToken };
  } catch (error) {
    console.log(Error, error);
    return null;
  }
};

//RegisterUser Controller

const registerUser = asyncHandler(async (req, res) => {
  //get user details
  const { username, email, fullname, password } = req.body;
  console.log(email, username);

  //validation
  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields Required");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid Email Format");
  }
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters long and contain at least one letter and one number"
    );
  }

  //check if user already exists
  const exsistedUser = await User.findOne({ $or: [{ email }, { username }] });
  console.log("User Object : ", exsistedUser);
  if (exsistedUser) {
    throw new ApiError(409, "username or email already exsist");
  }

  // file handling
  console.log("files Object : ", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  // let coverImageLocalPath;
  // if (
  //   req.files &&
  //   Array.isArray(req.files.coverImage) &&
  //   req.files.coverImage.length > 0
  // ) {
  //   coverImageLocalPath = req.files.coverImage[0].path;
  // }
  console.log(avatarLocalPath);
  console.log(coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(404, "Avatar Image Not Found");
  }

  // upload on cloudinary
  const cloudinaryUrlAvatar = await uploadFileToCloudinary(avatarLocalPath);
  const cloudinaryUrlCoverImage =
    await uploadFileToCloudinary(coverImageLocalPath);

  if (!cloudinaryUrlAvatar) {
    throw new ApiError(500, "Avatar Image Required");
  }
  console.log("Username : ", username);

  //create user

  const user = await User.create({
    fullname,
    password,
    avatar: cloudinaryUrlAvatar,
    coverImage: cloudinaryUrlCoverImage ? cloudinaryUrlCoverImage : "",
    email,
    username: username.toLowerCase(),
  });

  // check for user creation and remove password and refreshToken from response it returns user object with password and refreshToken field
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, "User registered Successfully", createdUser));
});

// LoginUser Controller

const loginUser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Provide Username or Email ");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiError(404, "No User Found");
  }

  const passwordCorrect = await user.comparePassword(password);

  if (!passwordCorrect) {
    throw new ApiError(400, "Password is not correct");
  }

  const { AccessToken, RefreshToken } = await generateAccessTokenRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .cookie("accessToken", AccessToken, option)
    .cookie("refreshToken", RefreshToken, option)
    .json(
      new ApiResponse(200, "User LoggedIn Successfully", {
        user: loggedInUser,
        RefreshToken,
        AccessToken,
      })
    );
});

// LogOutUser Controller

const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user;
  console.log(user);
  await User.findByIdAndUpdate(
    user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .status(200)
    .json(new ApiResponse(200, "User Logout Successfully"));
});

// Regenereate AccessToken Controller

const regenerateAccessTokenRefreshToken = asyncHandler(async (req, res) => {
  const IncomingRefreshtoken =
    req.cookies?.refreshToken || req.body(refreshToken);
  if (!IncomingRefreshtoken) {
    throw new ApiError(404, "Token Not Found");
  }
  const decodeToken = jwt.verify(
    IncomingRefreshtoken,
    process.env.JWT_REFRESH_TOKEN_SECRET_KEY
  );
  if (!decodeToken) {
    throw new ApiError(401, "UnAuthorized Request");
  }
  const user = await User.findById(decodeToken.userId);

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }
  if (user.refreshToken != IncomingRefreshtoken) {
    throw new ApiError(401, "Token Is Expired Or Used Already");
  }
  const { AccessToken, RefreshToken } = await generateAccessTokenRefreshToken(
    user._id
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .cookie("accessToken", AccessToken, option)
    .cookie("refreshToken", RefreshToken, option)
    .status(200)
    .json(
      new ApiResponse(200, "Access Token Regenerated", {
        AccessToken: AccessToken,
        RefreshToken: RefreshToken,
      })
    );
});

//UpdatePassword

const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if ([oldPassword, newPassword].some((field) => !field?.trim())) {
    throw new ApiError(400, "All Fields Required");
  }
  const regExPassowrd = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!regExPassowrd.test(newPassword)) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters long and contain at least one letter and one number"
    );
  }
  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.comparePassword(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(404, "Passowrd is Invalid");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, "Password Updated Successfully", {}));
});

// UpdateUserDetails

const updateUserDetails = asyncHandler(async (req, res) => {
  const { username, fullname, email } = req.body;
  let updateFields = {};
  if (username?.trim()) updateFields.username = username;
  if (fullname?.trim()) updateFields.fullname = fullname;
  const regExEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email?.trim() && regExEmail.test(email)) {
    updateFields.email = email;
  } else if (email?.trim() && !regExEmail.test(email)) {
    throw new ApiError(400, "Invalid Email Format");
  }
  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "Provide Valid Fields to Update");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { ...updateFields },
    },
    { new: true }
  ).select("-password -refreshToken");
  if (!updatedUser) {
    throw new ApiError(400, "Update Failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Update Successfully", updatedUser));
});

// GetUser

const getUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Get User Successfully", req.user));
});

//Update AvatarImage

const updateAvatarImage = asyncHandler(async (req, res) => {
  const avatarImageLocalPath = req.file?.path;
  if (!avatarImageLocalPath) {
    throw new ApiError(404, "Not Found");
  }
  const cloudinaryUrl = await uploadFileToCloudinary(avatarImageLocalPath);
  console.log("cloudinaryPath : ", cloudinaryUrl);

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: cloudinaryUrl },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(
      new ApiResponse(200, "Avatar Image Updated Successfully", updatedUser)
    );
});

// Update CoverImage

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(404, "Not Found");
  }
  const cloudinaryUrl = await uploadFileToCloudinary(coverImageLocalPath);
  console.log("cloudinaryPath : ", cloudinaryUrl);

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverImage: cloudinaryUrl },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(
      new ApiResponse(200, "Cover Image Updated Successfully", updatedUser)
    );
});

// GetUserChannelProfile

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username.trim()) {
    throw new ApiError(400, "Username Is Missing");
  }
  const channel = await User.aggregate([
    { $match: { username: username?.toLowerCase() } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribersTo",
      },
    },
    {
      $addFields: {
        subscriberCount: { $size: subscribers },
        channelSubscribedTo: { $size: subscribersTo },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, subscribers] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  // aggregate returns array

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, "User Channel Fetched Successfully", channel[0])
    );
});

// get watchHistory

const getWatchHistry = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user?._id) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
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
                {
                  $addFields: { owner: { $first: $owner } },
                },
              ],
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Watch history fetched successfully",
        user[0].watchHistory
      )
    );
});

// Add to Watch History

const addToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId.trim()) {
    throw new ApiError(400, "Video Id is required");
  }
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $addToSet: { watchHistory: videoId }, // $addToSet operator adds a value to an array unless the value is already present, in which case it does nothing. This ensures that the same videoId is not added multiple times to the watchHistory array.
    },
    { new: true }
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Video added to watch history successfully", {})
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  regenerateAccessTokenRefreshToken,
  updatePassword,
  updateUserDetails,
  getUser,
  updateAvatarImage,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistry,
  addToWatchHistory,
};
