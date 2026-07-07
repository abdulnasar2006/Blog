import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Loader2, PenSquare, ArrowLeft, Heart, MessageSquare, Sparkles } from "lucide-react";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import PostCard from "./components/PostCard";
import PostDetail from "./components/PostDetail";
import PostFormModal from "./components/PostFormModal";
import { Post, Comment, User } from "./types";

export default function App() {
  // Global States
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("inkwell_token"));
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [currentPostDetails, setCurrentPostDetails] = useState<{ post: Post; comments: Comment[] } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);

  // Initialize: Check active user session
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoadingPosts(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          // Token is invalid/expired
          localStorage.removeItem("inkwell_token");
          setToken(null);
        }
      } catch (err) {
        console.error("Failed to authenticate with token", err);
      }
    };

    fetchMe();
  }, [token]);

  // Load All Posts
  const fetchPosts = async (search = "") => {
    setLoadingPosts(true);
    try {
      const url = search ? `/api/posts?search=${encodeURIComponent(search)}` : "/api/posts";
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Error loading blog posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts(searchQuery);
  }, [searchQuery]);

  // Load Single Post Details & Comments
  const fetchPostDetails = async (postId: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (!res.ok) {
        throw new Error("Failed to load post details");
      }
      const data = await res.json();
      setCurrentPostDetails(data);
    } catch (err) {
      console.error("Error loading single post:", err);
      setCurrentPostId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (currentPostId) {
      fetchPostDetails(currentPostId);
    } else {
      setCurrentPostDetails(null);
    }
  }, [currentPostId]);

  // Auth Actions
  const handleAuthSuccess = (newToken: string, authenticatedUser: User) => {
    localStorage.setItem("inkwell_token", newToken);
    setToken(newToken);
    setUser(authenticatedUser);
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.error("Logout API request failed", e);
      }
    }
    localStorage.removeItem("inkwell_token");
    setToken(null);
    setUser(null);
  };

  // Create or Edit Post Submission
  const handlePostSubmit = async (title: string, content: string) => {
    if (!token) {
      setIsAuthModalOpen(true);
      throw new Error("Please log in to publish a post.");
    }

    const isEditing = !!postToEdit;
    const url = isEditing ? `/api/posts/${postToEdit.id}` : "/api/posts";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, content })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to save post");
    }

    // Refresh posts
    await fetchPosts(searchQuery);

    // If we're editing the currently viewed post, refresh its details too
    if (isEditing && currentPostId === postToEdit.id) {
      await fetchPostDetails(postToEdit.id);
    }
  };

  // Delete Post Action
  const handlePostDelete = async () => {
    if (!token || !currentPostId) return;

    if (window.confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      try {
        const res = await fetch(`/api/posts/${currentPostId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete post");
        }

        // Return to feed
        setCurrentPostId(null);
        await fetchPosts(searchQuery);
      } catch (err: any) {
        alert(err.message || "Failed to delete post");
      }
    }
  };

  // Add Comment Action
  const handleAddComment = async (commentText: string) => {
    if (!token || !currentPostId) {
      throw new Error("You must be logged in to comment.");
    }

    const res = await fetch(`/api/posts/${currentPostId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content: commentText })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to post comment");
    }

    // Refresh post details to see new comments
    await fetchPostDetails(currentPostId);
  };

  // Delete Comment Action
  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete comment");
      }

      // Refresh comments
      if (currentPostId) {
        await fetchPostDetails(currentPostId);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete comment");
    }
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-[#0c0a09] text-stone-200 selection:bg-stone-800 selection:text-white pb-20">
      {/* Navbar */}
      <Navbar
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenFormModal={() => {
          setPostToEdit(null);
          setIsFormModalOpen(true);
        }}
        onLogout={handleLogout}
        onGoHome={() => {
          setCurrentPostId(null);
          setSearchQuery("");
        }}
      />

      {/* Main Layout Stage */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {/* Detail View */}
          {currentPostId ? (
            loadingDetails || !currentPostDetails ? (
              <div id="detail-loader" className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="h-7 w-7 animate-spin text-stone-600" />
                <p className="font-sans text-xs uppercase tracking-widest text-stone-500">Loading article details...</p>
              </div>
            ) : (
              <PostDetail
                post={currentPostDetails.post}
                comments={currentPostDetails.comments}
                currentUser={user}
                onBack={() => setCurrentPostId(null)}
                onEdit={() => {
                  setPostToEdit(currentPostDetails.post);
                  setIsFormModalOpen(true);
                }}
                onDelete={handlePostDelete}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
              />
            )
          ) : (
            /* Feed View */
            <motion.div
              id="feed-view-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Blog Title & Search Section */}
              <div id="hero-banner" className="text-center md:text-left md:flex md:items-end md:justify-between border-b border-stone-800/60 pb-8 gap-8">
                <div className="space-y-3">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-stone-500 flex items-center justify-center md:justify-start gap-1.5">
                    <Sparkles className="h-3 w-3 text-stone-600" /> Verse Literary Manuscript
                  </span>
                  <h2 className="font-serif text-3xl font-medium tracking-tight text-stone-100 sm:text-4xl">
                    Stories, curated.
                  </h2>
                  <p className="font-sans text-sm text-stone-400 max-w-xl leading-relaxed">
                    Welcome to our personal publishing platform. Explore manuscripts written by thinkers around the world, and join the discussion by leaving constructive comments.
                  </p>
                </div>

                <div className="mt-6 md:mt-0 max-w-sm w-full relative block md:hidden">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-600">
                      <Search className="h-4 w-4" />
                    </div>
                    <input
                      id="feed-mobile-search"
                      type="text"
                      placeholder="Search manuscripts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded border border-stone-800 bg-[#080706] py-2 pl-9 pr-4 font-sans text-sm text-stone-200 placeholder-stone-600 focus:border-stone-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Grid or Empty State */}
              {loadingPosts ? (
                <div id="feed-loader" className="flex flex-col items-center justify-center py-24 space-y-4">
                  <Loader2 className="h-7 w-7 animate-spin text-stone-600" />
                  <p className="font-sans text-xs uppercase tracking-widest text-stone-500">Retrieving published stories...</p>
                </div>
              ) : posts.length > 0 ? (
                <div id="posts-grid" className="grid gap-6 sm:grid-cols-2">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onClick={() => setCurrentPostId(post.id)}
                    />
                  ))}
                </div>
              ) : (
                <div
                  id="empty-posts"
                  className="rounded border border-dashed border-stone-800 py-16 px-4 text-center bg-[#080706]/30"
                >
                  <PenSquare className="mx-auto h-8 w-8 text-stone-700 mb-3" />
                  <h3 className="font-serif text-lg text-stone-200 mb-1">
                    No articles found
                  </h3>
                  <p className="font-sans text-xs text-stone-400 max-w-sm mx-auto mb-6 leading-relaxed">
                    {searchQuery
                      ? "We couldn't find any articles matching your search query. Try another keyword!"
                      : "No blog posts have been written yet. Be the first to publish!"}
                  </p>
                  {user ? (
                    <button
                      id="btn-write-first-post"
                      onClick={() => {
                        setPostToEdit(null);
                        setIsFormModalOpen(true);
                      }}
                      className="inline-flex items-center space-x-1.5 rounded bg-stone-100 px-5 py-2.5 font-sans text-xs font-semibold text-stone-900 hover:bg-stone-200 transition-all cursor-pointer"
                    >
                      <PenSquare className="h-4 w-4" />
                      <span>Write Your First Post</span>
                    </button>
                  ) : (
                    <button
                      id="btn-login-first-post"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="inline-flex items-center space-x-1.5 rounded border border-stone-850 bg-stone-900/40 px-5 py-2.5 font-sans text-xs font-semibold text-stone-300 hover:bg-stone-900 hover:text-white transition-all cursor-pointer"
                    >
                      <span>Sign In to Start Writing</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Post Creation/Editing Modal */}
      <PostFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        postToEdit={postToEdit}
        onSubmit={handlePostSubmit}
      />
    </div>
  );
}
