import mongoose from "mongoose";
import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPost = async (req, res) => {
  try {
    const { postedBy, text } = req.body;
    let { img } = req.body;

    if (!postedBy || !text) {
      return res
        .status(400)
        .json({ error: "Postedby and text fields are required" });
    }

    const user = await User.findById(postedBy);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: "Unauthorized to create post" });
    }

    const maxLength = 500;
    if (text.length > maxLength) {
      return res
        .status(400)
        .json({ error: `Text must be less than ${maxLength} characters` });
    }

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }
    // The <NAME> you use in multer's upload.single(<NAME>) function
    // must be the same as the one you use in
    // <input type="file" name="<NAME>" ...>.

    let videoUrl;
    if (req.file) {
      // Check if video file is uploaded
      const uploadedVideo = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "video",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          )
          .end(req.file.buffer); // Stream directly from Multer memory storage
      });
      videoUrl = uploadedVideo;
    }
    const videoMetadata = await cloudinary.v2.api.resource(videoUrl, {
      resource_type: "video",
    });
    const newPost = new Post({
      postedBy,
      text,
      img,
      video: videoUrl,
      videoMetadata: {
        duration: videoMetadata.duration,
        width: videoMetadata.width,
        height: videoMetadata.height,
        format: videoMetadata.format,
        size: videoMetadata.bytes,
      },
    });
    await newPost.save();

    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(err);
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: "Unauthorized to delete post" });
    }

    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const likeUnlikePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      // Unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      res.status(200).json({ message: "Post unliked successfully" });
    } else {
      // Like post
      post.likes.push(userId);
      await post.save();
      res.status(200).json({ message: "Post liked successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const replyToPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;
    const userProfilePic = req.user.profilePic;
    const username = req.user.username;

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const reply = { userId, text, userProfilePic, username };

    post.replies.push(reply);
    await post.save();

    res.status(200).json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const following = user.following;

    const feedPosts = await Post.find({ postedBy: { $in: following } }).sort({
      createdAt: -1,
    });

    res.status(200).json(feedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserPosts = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await Post.find({ postedBy: user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const streamVideo = async (req, res) => {
  try {
    const videoUrl = req.query.url;

    if (!videoUrl) {
      return res.status(400).send("Video URL is required");
    }

    const post = await Post.findOne({ video: videoUrl });

    if (!post) {
      return res.status(404).send("Video not found in database");
    }

    let videoMetadata;

    // Check if metadata is already cached in the Post model
    if (post.videoMetadata && post.videoMetadata.duration) {
      videoMetadata = post.videoMetadata;
      console.log("Using cached metadata:", videoMetadata);
    } else {
      // Fetch video metadata from Cloudinary if not cached
      const cloudinaryMetadata = await cloudinary.v2.api.resource(videoUrl, {
        resource_type: "video",
      });

      // Update post with the new metadata
      post.videoMetadata = {
        duration: cloudinaryMetadata.duration,
        width: cloudinaryMetadata.width,
        height: cloudinaryMetadata.height,
        format: cloudinaryMetadata.format,
        size: cloudinaryMetadata.bytes,
      };
      await post.save();

      videoMetadata = post.videoMetadata;
      console.log("Fetched and cached new metadata:", videoMetadata);
    }

    // Apply automatic compression and format optimization
    const compressedVideoUrl = cloudinary.url(videoUrl, {
      resource_type: "video",
      quality: "auto", // Adjusts video quality based on network conditions
      fetch_format: "auto", // Selects the best format (e.g., WebM, MP4) for the client
    });

    // Fetch the video from Cloudinary using Axios
    const response = await axios.get(compressedVideoUrl, {
      responseType: "stream", // Stream the video
    });

    // Set headers to forward the stream to the client
    res.setHeader("Content-Type", `video/${videoMetadata.format || "mp4"}`);
    res.setHeader("Content-Length", videoMetadata.size);

    // Stream video from Cloudinary to client
    response.data.pipe(res);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export default {
  createPost,
  getPost,
  deletePost,
  likeUnlikePost,
  replyToPost,
  getFeedPosts,
  getUserPosts,
  streamVideo,
};
