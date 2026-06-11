import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  createPlayList,
  deletePlayList,
  updatePlayList,
  usersPlaylist,
  addVideoToPlaylist,
  deleteVideoFromPlaylist,
  getPlaylistById,
} from "../controllers/playlist.controller.js";

import { Router } from "express";

const router = Router();

router.route("/create-playlist").post(verifyJwt, createPlayList);
router.route("/users-playlist").get(verifyJwt, usersPlaylist);
router.route("/update-playlist/:playlistId").patch(verifyJwt, updatePlayList);
router.route("/delete-playlist/:playlistId").delete(verifyJwt, deletePlayList);
router
  .route("/add-video-to-playlist/:playlistId")
  .post(verifyJwt, addVideoToPlaylist);
router
  .route("/delete-video-from-playlist/:playlistId")
  .delete(verifyJwt, deleteVideoFromPlaylist);
router.route("/playlist/:playlistId").get(verifyJwt, getPlaylistById);

export default router;
