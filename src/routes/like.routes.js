import {
  getUsersLikedVideo,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

import { Router } from "express";

const router = Router();

router.route("/video/:videoId/toggle-like").post(verifyJwt, toggleVideoLike);
router.route("/tweet/:tweetId/toggle-like").post(verifyJwt, toggleTweetLike);
router
  .route("/comment/:commentId/toggle-like")
  .post(verifyJwt, toggleCommentLike);
router.route("/like-videos").get(verifyJwt, getUsersLikedVideo);

export default router;
