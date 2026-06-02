import {
  loginUser,
  registerUser,
  logoutUser,
  regenerateAccessTokenRefreshToken,
  updatePassword,
  updateUserDetails,
  getUser,
  updateAvatarImage,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistry,
} from "../controllers/user.controller.js";
import { Router } from "express";
import upload from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    // this will handle multiple file uploads with different field names in the form data it takes an array of objects where each object has a name property which is the field name in the form data and a maxCount property which is the maximum number of files that can be uploaded for that field .Name must be same as the field name in the form data and maxCount must be 1 because we are only allowing one file to be uploaded for each field
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(upload.none(), loginUser);

// Protected Routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(regenerateAccessTokenRefreshToken);
router.route("/update-password").post(verifyJwt, updatePassword);
router.route("/update-details").patch(verifyJwt, updateUserDetails);
router.route("/current-user").post(verifyJwt, getUser);
router
  .route("/update-avatar")
  .patch(verifyJwt, upload.single("avatar"), updateAvatarImage);
router
  .route("/update-coverImage")
  .patch(verifyJwt, upload.single("coverImage"), updateCoverImage);

router.route("/channel/:username").get(verifyJwt, getUserChannelProfile);
router.route("/watch-history").get(verifyJwt, getWatchHistry);

export default router;
