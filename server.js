import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import Post from "./Post.js";

const app = express();
app.set("json spaces", 2);
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/data-hub";
mongoose.connect(MONGODB_URI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use(express.json());
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} | ${req.method} | ${req.url}`
  );
  next();
});
app.get("/", async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    res.status(200).json({
      success: true,
      message: "Welcome to The Data Hub API",
      project: "The Data Hub",
      version: "1.0.0",
      totalPosts,
      status: "Running",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error querying total posts from database",
    });
  }
});
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});
app.get("/posts", async (req, res) => {
  try {
    const sortedPosts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(sortedPosts);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve posts",
    });
  }
});
app.get("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: `Post with ID ${id} not found`,
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: `Post with ID ${id} not found`,
      });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve the post",
    });
  }
});

app.post("/posts", async (req, res) => {
  try {
    const { title, content, ...otherDetails } = req.body;
    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      !title.trim() ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Title and content are required and must be non-empty strings",
      });
    }
    const newPost = await Post.create({
      title: title.trim(),
      content: content.trim(),
      ...otherDetails,
    });
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create the post",
    });
  }
});
app.put("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: `Post with ID ${id} not found`,
      });
    }
    const updates = {};
    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: "Title must be a non-empty string",
        });
      }
      updates.title = title.trim();
    }
    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: "Content must be a non-empty string",
        });
      }
      updates.content = content.trim();
    }
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        error: `Post with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update the post",
    });
  }
});
app.delete("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: `Post with ID ${id} not found`,
      });
    }
    const deletedPost = await Post.findByIdAndDelete(id);
    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        error: `Post with ID ${id} not found`,
      });
    }
    res.status(200).json({
      success: true,
      message: `Post with ID ${id} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete the post",
    });
  }
});
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
});
const server = app.listen(PORT, () => {
  console.log(`The Data Hub Server Running`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Port: ${PORT}`);
});
server.on("error", (err) => {
  console.error("Server Error:", err);
});