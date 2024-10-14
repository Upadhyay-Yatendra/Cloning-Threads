import express from "express";
import postController from "../controllers/postController.js";

import protectRoute from "../middlewares/protectRoute.js";
import { upload } from "../config/multer.js";

const router = express.Router();

const {
  createPost,
  deletePost,
  getPost,
  likeUnlikePost,
  replyToPost,
  getFeedPosts,
  getUserPosts,
  streamVideo
} = postController;

router.get("/feed", protectRoute, getFeedPosts);
router.get("/:id", getPost);
router.get("/user/:username", getUserPosts);
router.post("/create", protectRoute, upload.single('video') ,createPost);
router.delete("/:id", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:id", protectRoute, replyToPost);
router.get('/videos/:filename', streamVideo);
export default router;
