import { verifyJwt } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import {
  createComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.route("/:videoId/create-comment").post(verifyJwt, createComment);

router.route("/:videoId/comments").get(getVideoComments);

router.route("/:commentId/update-comment").patch(verifyJwt, updateComment);

router.route("/:commentId/delete-comment").delete(verifyJwt, deleteComment);

export default router;
