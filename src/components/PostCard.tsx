import { motion } from "motion/react";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Post } from "../types";

interface PostCardProps {
  post: Post;
  onClick: () => void;
  key?: string | number;
}

export default function PostCard({ post, onClick }: PostCardProps) {
  // Helper to format date cleanly
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to strip simple markdown for an elegant text excerpt
  const getExcerpt = (markdown: string, maxLength: number = 160) => {
    if (!markdown) return "";
    const cleanText = markdown
      .replace(/[#*`_~\[\]]/g, "") // strip common markdown syntax
      .replace(/\s+/g, " ")
      .trim();
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + "...";
  };

  return (
    <motion.article
      id={`post-card-${post.id}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="group flex flex-col justify-between overflow-hidden rounded-lg border border-stone-800 bg-stone-900/40 p-6 hover:border-stone-600 transition-all cursor-pointer"
    >
      <div className="space-y-3">
        {/* Author & Date metadata */}
        <div className="flex items-center justify-between border-b border-stone-800/40 pb-3">
          <div className="flex items-center space-x-2 font-mono text-[10px] text-stone-400">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3 text-stone-500" />
              <span className="font-semibold text-stone-300 uppercase tracking-wider">
                {post.authorName}
              </span>
            </div>
            <span className="text-stone-700">•</span>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3 text-stone-500" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-stone-800/50 text-[9px] tracking-widest uppercase text-stone-400 border border-stone-700/60 rounded">
            Manuscript
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg font-medium tracking-tight text-stone-100 group-hover:text-white transition-colors">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="font-sans text-xs text-stone-500 leading-relaxed italic line-clamp-3">
          {getExcerpt(post.content)}
        </p>
      </div>

      {/* Footer trigger */}
      <div className="mt-5 flex items-center justify-between border-t border-stone-800/40 pt-4">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-500 group-hover:text-stone-300 transition-colors">
          Read Manuscript
        </span>
        <div className="rounded bg-stone-800/50 border border-stone-700/60 p-1.5 text-stone-400 group-hover:bg-stone-100 group-hover:text-stone-900 group-hover:border-transparent transition-all">
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </motion.article>
  );
}
