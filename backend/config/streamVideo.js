import { createReadStream } from "fs";
import path from "path";

const streamVideo = (req, res) => {
  const videoUrl = req.videoUrl; // Video URL, fetched from database (could be null)

  // Edge case: If no video exists for the post, return a relevant message or empty response.
  if (!videoUrl) {
    return res
      .status(404)
      .json({ message: "No video available for this post" });
  }

  const videoSize = 50 * 1024 * 1024; // Assuming max 50MB video files
  const range = req.headers.range;

  if (!range) {
    return res.status(400).send("Requires Range header");
  }

  // Simulating a video stream. For cloud storage (like Cloudinary), fetch from cloud instead.
  const videoPath = path.resolve(videoUrl); // Example: video stored locally, replace with cloud fetch logic

  const videoStart = Number(range.replace(/\D/g, ""));
  const videoEnd = Math.min(videoStart + 10 ** 6, videoSize - 1); // 1MB chunks

  const contentLength = videoEnd - videoStart + 1;
  const headers = {
    "Content-Range": `bytes ${videoStart}-${videoEnd}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4", // Adjust based on video type
  };

  res.writeHead(206, headers);

  const videoStream = createReadStream(videoPath, {
    start: videoStart,
    end: videoEnd,
  });
  videoStream.pipe(res);
};
