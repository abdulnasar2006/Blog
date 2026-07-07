import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

// Helper function to hash password with native crypto
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// ==========================================
// Mongoose Models
// ==========================================

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  username: { type: String, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: String, required: true }
}, { _id: false });
const User = mongoose.model("User", userSchema);

const sessionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  createdAt: { type: String, required: true }
}, { _id: false });
const Session = mongoose.model("Session", sessionSchema);

const postSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, { _id: false });
const Post = mongoose.model("Post", postSchema);

const commentSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  postId: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  createdAt: { type: String, required: true }
}, { _id: false });
const Comment = mongoose.model("Comment", commentSchema);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize MongoDB
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/blog";
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB at", mongoURI);
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }

  // Authentication Middleware
  async function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: Missing token" });
      return;
    }

    const sessionId = authHeader.substring(7);
    try {
      const sessionData = await Session.findById(sessionId);

      if (!sessionData) {
        res.status(401).json({ error: "Unauthorized: Invalid or expired session" });
        return;
      }

      req.user = {
        id: sessionData.userId,
        username: sessionData.username
      };
      next();
    } catch (err: any) {
      console.error("Authentication error:", err);
      res.status(500).json({ error: "Internal server error during authentication" });
    }
  }

  // ==========================================
  // RESTful APIs
  // ==========================================

  // Auth: Get current user
  app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.json({ user: null });
      return;
    }

    const sessionId = authHeader.substring(7);
    try {
      const sessionData = await Session.findById(sessionId);

      if (!sessionData) {
        res.json({ user: null });
        return;
      }

      res.json({
        user: {
          id: sessionData.userId,
          username: sessionData.username
        }
      });
    } catch (err) {
      res.json({ user: null });
    }
  });

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || typeof username !== "string" || username.trim().length < 3) {
      res.status(400).json({ error: "Username must be at least 3 characters long" });
      return;
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long" });
      return;
    }

    const cleanUsername = username.trim();

    try {
      // Check if username exists
      const existingUser = await User.findOne({ username: cleanUsername });

      if (existingUser) {
        res.status(400).json({ error: "Username is already taken" });
        return;
      }

      // Create new user
      const userId = crypto.randomUUID();
      const newUser = new User({
        _id: userId,
        username: cleanUsername,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
      });

      await newUser.save();

      // Create login session automatically
      const sessionId = crypto.randomUUID();
      const newSession = new Session({
        _id: sessionId,
        userId,
        username: cleanUsername,
        createdAt: new Date().toISOString()
      });
      await newSession.save();

      res.status(201).json({
        message: "Registration successful",
        token: sessionId,
        user: {
          id: userId,
          username: cleanUsername
        }
      });
    } catch (err: any) {
      console.error("Register error:", err);
      res.status(500).json({ error: "Internal server error during registration" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const cleanUsername = username.trim();

    try {
      // Find user
      const userData = await User.findOne({ username: cleanUsername });

      if (!userData) {
        res.status(400).json({ error: "Invalid username or password" });
        return;
      }

      // Verify password hash
      const checkHash = hashPassword(password);
      if (userData.passwordHash !== checkHash) {
        res.status(400).json({ error: "Invalid username or password" });
        return;
      }

      // Create session
      const sessionId = crypto.randomUUID();
      const newSession = new Session({
        _id: sessionId,
        userId: userData._id,
        username: userData.username,
        createdAt: new Date().toISOString()
      });
      await newSession.save();

      res.json({
        message: "Login successful",
        token: sessionId,
        user: {
          id: userData._id,
          username: userData.username
        }
      });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Internal server error during login" });
    }
  });

  // Auth: Logout
  app.post("/api/auth/logout", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(400).json({ error: "Missing token" });
      return;
    }

    const sessionId = authHeader.substring(7);
    try {
      await Session.findByIdAndDelete(sessionId);
      res.json({ message: "Logout successful" });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to log out" });
    }
  });

  // ==========================================
  // Blog Posts APIs
  // ==========================================

  // GET: Get all blog posts
  app.get("/api/posts", async (req, res) => {
    const { search, authorId } = req.query;

    try {
      let filter: any = {};
      if (authorId && typeof authorId === "string") {
        filter.authorId = authorId;
      }

      let posts = await Post.find(filter).sort({ createdAt: -1 });

      // Transform _id to id for client
      let transformedPosts = posts.map((post: any) => ({
        id: post._id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        authorName: post.authorName,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }));

      // Client-side/In-memory Search
      if (search && typeof search === "string" && search.trim() !== "") {
        const queryTerm = search.toLowerCase();
        transformedPosts = transformedPosts.filter((post: any) => 
          post.title.toLowerCase().includes(queryTerm) || 
          post.content.toLowerCase().includes(queryTerm)
        );
      }

      res.json({ posts: transformedPosts });
    } catch (err: any) {
      console.error("Get posts error:", err);
      res.status(500).json({ error: "Failed to load blog posts" });
    }
  });

  // GET: Get single blog post with comments
  app.get("/api/posts/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const post = await Post.findById(id);

      if (!post) {
        res.status(404).json({ error: "Blog post not found" });
        return;
      }

      const postData = {
        id: post._id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        authorName: post.authorName,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      };

      // Get comments
      const commentsDocs = await Comment.find({ postId: id }).sort({ createdAt: 1 });
      const comments = commentsDocs.map((c: any) => ({
        id: c._id,
        postId: c.postId,
        content: c.content,
        authorId: c.authorId,
        authorName: c.authorName,
        createdAt: c.createdAt
      }));

      res.json({ post: postData, comments });
    } catch (err: any) {
      console.error("Get single post error:", err);
      res.status(500).json({ error: "Failed to retrieve blog post details" });
    }
  });

  // POST: Create a blog post
  app.post("/api/posts", authenticate, async (req, res) => {
    const { title, content } = req.body;
    const user = req.user!;

    if (!title || typeof title !== "string" || title.trim() === "") {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    if (!content || typeof content !== "string" || content.trim() === "") {
      res.status(400).json({ error: "Content is required" });
      return;
    }

    try {
      const postId = crypto.randomUUID();
      const now = new Date().toISOString();

      const newPost = new Post({
        _id: postId,
        title: title.trim(),
        content: content,
        authorId: user.id,
        authorName: user.username,
        createdAt: now,
        updatedAt: now
      });

      await newPost.save();
      
      res.status(201).json({
        id: newPost._id,
        title: newPost.title,
        content: newPost.content,
        authorId: newPost.authorId,
        authorName: newPost.authorName,
        createdAt: newPost.createdAt,
        updatedAt: newPost.updatedAt
      });
    } catch (err: any) {
      console.error("Create post error:", err);
      res.status(500).json({ error: "Failed to create blog post" });
    }
  });

  // PUT: Update a blog post
  app.put("/api/posts/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const user = req.user!;

    if (!title || typeof title !== "string" || title.trim() === "") {
      res.status(400).json({ error: "Title cannot be empty" });
      return;
    }
    if (!content || typeof content !== "string" || content.trim() === "") {
      res.status(400).json({ error: "Content cannot be empty" });
      return;
    }

    try {
      const post = await Post.findById(id);

      if (!post) {
        res.status(404).json({ error: "Blog post not found" });
        return;
      }

      if (post.authorId !== user.id) {
        res.status(403).json({ error: "Forbidden: You are not the author of this post" });
        return;
      }

      post.title = title.trim();
      post.content = content;
      post.updatedAt = new Date().toISOString();

      await post.save();

      res.json({
        id: post._id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        authorName: post.authorName,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      });
    } catch (err: any) {
      console.error("Update post error:", err);
      res.status(500).json({ error: "Failed to update blog post" });
    }
  });

  // DELETE: Delete a blog post
  app.delete("/api/posts/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const user = req.user!;

    try {
      const post = await Post.findById(id);

      if (!post) {
        res.status(404).json({ error: "Blog post not found" });
        return;
      }

      if (post.authorId !== user.id) {
        res.status(403).json({ error: "Forbidden: You are not the author of this post" });
        return;
      }

      await Post.findByIdAndDelete(id);
      await Comment.deleteMany({ postId: id });

      res.json({ message: "Blog post and associated comments deleted successfully" });
    } catch (err: any) {
      console.error("Delete post error:", err);
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });

  // ==========================================
  // Comments APIs
  // ==========================================

  // POST: Add a comment to a blog post
  app.post("/api/posts/:postId/comments", authenticate, async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const user = req.user!;

    if (!content || typeof content !== "string" || content.trim() === "") {
      res.status(400).json({ error: "Comment content is required" });
      return;
    }

    try {
      const post = await Post.findById(postId);

      if (!post) {
        res.status(404).json({ error: "Blog post not found" });
        return;
      }

      const commentId = crypto.randomUUID();
      const now = new Date().toISOString();

      const newComment = new Comment({
        _id: commentId,
        postId,
        content: content.trim(),
        authorId: user.id,
        authorName: user.username,
        createdAt: now
      });

      await newComment.save();
      
      res.status(201).json({
        id: newComment._id,
        postId: newComment.postId,
        content: newComment.content,
        authorId: newComment.authorId,
        authorName: newComment.authorName,
        createdAt: newComment.createdAt
      });
    } catch (err: any) {
      console.error("Create comment error:", err);
      res.status(500).json({ error: "Failed to post comment" });
    }
  });

  // DELETE: Delete a comment
  app.delete("/api/comments/:commentId", authenticate, async (req, res) => {
    const { commentId } = req.params;
    const user = req.user!;

    try {
      const comment = await Comment.findById(commentId);

      if (!comment) {
        res.status(404).json({ error: "Comment not found" });
        return;
      }

      if (comment.authorId !== user.id) {
        const post = await Post.findById(comment.postId);
        
        if (!post || post.authorId !== user.id) {
          res.status(403).json({ error: "Forbidden: You cannot delete this comment" });
          return;
        }
      }

      await Comment.findByIdAndDelete(commentId);
      res.json({ message: "Comment deleted successfully" });
    } catch (err: any) {
      console.error("Delete comment error:", err);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // ==========================================
  // Vite Integration & Static Files
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
