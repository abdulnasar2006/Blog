import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Edit3, Trash2, Calendar, User, MessageSquare, CornerDownRight, Loader2, AlertCircle } from "lucide-react";
import { Post, Comment, User as UserType } from "../types";

interface PostDetailProps {
  post: Post;
  comments: Comment[];
  currentUser: UserType | null;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

export default function PostDetail({
  post,
  comments,
  currentUser,
  onBack,
  onEdit,
  onDelete,
  onAddComment,
  onDeleteComment
}: PostDetailProps) {
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!commentText.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onAddComment(commentText.trim());
      setCommentText("");
    } catch (err: any) {
      setError(err.message || "Failed to post comment.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Safe and beautiful custom renderer for simple blog content/markdown paragraphs
  const renderContent = (content: string) => {
    if (!content) return null;
    return content.split(/\n\s*\n/).map((para, idx) => {
      const cleanPara = para.trim();
      if (!cleanPara) return null;

      // Handle custom list styling
      if (cleanPara.startsWith("- ") || cleanPara.startsWith("* ")) {
        const items = cleanPara.split(/\n[*-]\s+/);
        return (
          <ul key={idx} className="list-disc pl-6 my-4 space-y-1.5 text-stone-300 font-sans">
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>{item.replace(/^[*-]\s+/, "")}</li>
            ))}
          </ul>
        );
      }

      // Handle simple headers
      if (cleanPara.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-serif text-lg font-bold text-stone-100 mt-6 mb-2">
            {cleanPara.replace("### ", "")}
          </h4>
        );
      }
      if (cleanPara.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-serif text-xl font-bold text-stone-100 mt-8 mb-3">
            {cleanPara.replace("## ", "")}
          </h3>
        );
      }

      return (
        <p key={idx} className="font-sans text-stone-300 leading-relaxed text-base mb-4 whitespace-pre-line">
          {cleanPara}
        </p>
      );
    });
  };

  const isPostAuthor = currentUser && currentUser.id === post.authorId;

  return (
    <motion.div
      id="post-detail-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 pb-12"
    >
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-feed"
          onClick={onBack}
          className="flex items-center space-x-2 text-sm text-stone-500 hover:text-stone-200 font-sans transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </button>

        {isPostAuthor && (
          <div id="author-actions" className="flex items-center space-x-2">
            <button
              id="btn-edit-post"
              onClick={onEdit}
              className="flex items-center space-x-1 rounded border border-stone-800 px-3 py-1.5 text-xs font-semibold text-stone-300 hover:bg-stone-900 hover:text-white transition-all cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Post</span>
            </button>
            <button
              id="btn-delete-post"
              onClick={onDelete}
              className="flex items-center space-x-1 rounded border border-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Post Section */}
      <article className="border-b border-stone-800 pb-8">
        {/* Metadata header */}
        <div className="flex flex-wrap items-center gap-4 border-b border-stone-800/60 pb-4 text-xs font-mono text-stone-500">
          <div className="flex items-center space-x-1">
            <User className="h-3.5 w-3.5" />
            <span className="font-semibold text-stone-300 uppercase tracking-wide">
              {post.authorName}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Published {formatDate(post.createdAt)}</span>
          </div>
          {post.updatedAt !== post.createdAt && (
            <span className="rounded bg-stone-900 border border-stone-800 px-2 py-0.5 text-[9px] uppercase tracking-wider text-stone-400">
              Edited
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-serif text-3xl font-medium tracking-tight text-stone-100 sm:text-4xl lg:text-5xl my-6">
          {post.title}
        </h2>

        {/* Render content */}
        <div id="post-body" className="prose prose-invert max-w-none text-stone-300">
          {renderContent(post.content)}
        </div>
      </article>

      {/* Comments Section */}
      <div id="comments-section" className="space-y-6">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-stone-300" />
          <h3 className="font-serif text-lg text-stone-100">
            Comments ({comments.length})
          </h3>
        </div>

        {/* Comment Input */}
        {currentUser ? (
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            {error && (
              <div
                id="comment-error-banner"
                className="flex items-start space-x-2 rounded border border-red-900/40 bg-red-950/10 p-3 text-sm text-red-400"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <textarea
              id="comment-textarea"
              rows={3}
              placeholder="What are your thoughts on this manuscript?"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full rounded border border-stone-800 bg-[#080706] p-3 font-sans text-sm text-stone-200 placeholder-stone-600 focus:border-stone-600 focus:outline-none transition-colors"
            />
            <div className="flex justify-end">
              <button
                id="btn-submit-comment"
                type="submit"
                disabled={loading || !commentText.trim()}
                className="flex items-center space-x-1.5 rounded bg-stone-100 px-4 py-2 font-sans text-xs font-semibold text-stone-900 hover:bg-stone-200 disabled:bg-stone-900/40 disabled:text-stone-600 disabled:border-stone-800 disabled:border transition-all cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span>Post Comment</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div
            id="login-to-comment"
            className="rounded border border-dashed border-stone-800 bg-stone-900/10 p-6 text-center"
          >
            <p className="font-sans text-sm text-stone-400">
              You must be logged in to leave a comment.
            </p>
          </div>
        )}

        {/* Comment List */}
        <div id="comments-list" className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => {
              const isCommentAuthor = currentUser && currentUser.id === comment.authorId;
              const isPostAuthorOfComment = currentUser && currentUser.id === post.authorId;

              return (
                <motion.div
                  id={`comment-item-${comment.id}`}
                  key={comment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex space-x-3 rounded border border-stone-800 bg-stone-900/20 p-4"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-stone-850 border border-stone-700 text-xs font-bold text-stone-300">
                    {comment.authorName[0]?.toUpperCase() || "C"}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-sans text-sm font-semibold text-stone-200">
                          {comment.authorName}
                        </span>
                        {comment.authorId === post.authorId && (
                          <span className="rounded bg-stone-800 px-2 py-0.5 font-mono text-[9px] font-bold text-stone-400 border border-stone-700/60">
                            Author
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-stone-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>

                      {/* Comment delete capability for comment author or post author */}
                      {(isCommentAuthor || isPostAuthorOfComment) && (
                        <button
                          id={`btn-delete-comment-${comment.id}`}
                          onClick={() => onDeleteComment(comment.id)}
                          title="Delete Comment"
                          className="rounded p-1 text-stone-500 hover:bg-stone-800 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="font-sans text-sm text-stone-300 leading-relaxed whitespace-pre-line">
                      {comment.content}
                    </p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div id="empty-comments" className="py-6 text-center">
              <CornerDownRight className="mx-auto h-8 w-8 text-stone-700 mb-2" />
              <p className="font-sans text-sm text-stone-500">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
