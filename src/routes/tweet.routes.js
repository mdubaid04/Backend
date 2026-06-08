import { verifyJwt } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.route("/create").post(verifyJwt, createTweet);

router.route("/:username").get(getUserTweets);
router.route("/:tweetId").patch(verifyJwt, updateTweet);
router.route("/:tweetId").delete(verifyJwt, deleteTweet);

export default router;
