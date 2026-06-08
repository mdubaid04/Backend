import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishVideo,
  updateVideo,
  userVideos,
} from "../controllers/video.controller.js";
import { Router } from "express";
import upload from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/publish").post(
  verifyJwt,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);
router.route("/video/:videoid").get(verifyJwt, getVideoById);
router.route("/:username").get(verifyJwt, userVideos);
router.route("/update-video/:videoid").patch(verifyJwt, updateVideo);
router.route("/delete-video/:videoid").delete(verifyJwt, deleteVideo);
router.route("/toggle-video/:videoid").patch(verifyJwt, togglePublishVideo);
router.route("/get-videos").get(getAllVideos);

export default router;
