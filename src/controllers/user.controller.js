import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.models.js";
import uploadFileToCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { response } from "express";

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

////LogOutUser Controller

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

export { registerUser, loginUser, logoutUser };
