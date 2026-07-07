import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, AlertCircle, Loader2, Info } from "lucide-react";
import { Post } from "../types";

interface PostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  postToEdit: Post | null;
  onSubmit: (title: string, content: string) => Promise<void>;
}

export default function PostFormModal({ isOpen, onClose, postToEdit, onSubmit }: PostFormModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title);
      setContent(postToEdit.content);
    } else {
      setTitle("");
      setContent("");
    }
    setError(null);
  }, [postToEdit, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!content.trim()) {
      setError("Content is required.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(title.trim(), content.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="post-form-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            id="post-form-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            id="post-form-card"
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-lg bg-[#0c0a09] p-6 shadow-2xl border border-stone-800 flex flex-col max-h-[90vh]"
          >
            {/* Close Button */}
            <button
              id="post-form-close"
              onClick={onClose}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-200 rounded p-1 hover:bg-stone-900 transition-all cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Header */}
            <div className="mb-6 mt-1">
              <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-100">
                {postToEdit ? "Edit Manuscript" : "Write a New Manuscript"}
              </h2>
              <p className="font-sans text-xs text-stone-400 mt-1">
                {postToEdit
                  ? "Update your manuscript's details and save draft or publish"
                  : "Share your thoughts, reflections, or knowledge formatted in simple prose"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col overflow-y-auto pr-1">
              {/* Error Message */}
              {error && (
                <div
                  id="form-error-banner"
                  className="flex items-start space-x-2 rounded border border-red-900/40 bg-red-950/10 p-3 text-sm text-red-400"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="font-sans">{error}</span>
                </div>
              )}

              {/* Title Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                  Manuscript Title
                </label>
                <input
                  id="post-title-input"
                  type="text"
                  required
                  placeholder="e.g. The Architecture of Digital Silence"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border border-stone-800 bg-[#080706] py-2.5 px-4 font-sans text-sm text-stone-200 placeholder-stone-600 focus:border-stone-600 focus:outline-none transition-colors"
                />
              </div>

              {/* Content Field */}
              <div className="flex-1 flex flex-col min-h-[160px]">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                  Manuscript Prose Content
                </label>
                <textarea
                  id="post-content-textarea"
                  required
                  placeholder="Write your article here. Supports double linebreaks for paragraphs and simple bullet points starting with - or *..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full flex-1 rounded border border-stone-800 bg-[#080706] p-4 font-sans text-sm text-stone-200 placeholder-stone-600 focus:border-stone-600 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Formatting Helper Panel */}
              <div id="formatting-tips" className="rounded border border-stone-850 bg-[#080706]/40 p-3 flex items-start space-x-2.5">
                <Info className="h-4 w-4 text-stone-500 mt-0.5 flex-shrink-0" />
                <div className="text-[11px] text-stone-400 space-y-1 font-sans">
                  <p className="font-semibold text-stone-300">Manuscript Formatting Tips:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Use a double line-break to create a new paragraph.</li>
                    <li>Add <strong>## Heading</strong> or <strong>### Subheading</strong> at the start of a line to format sections.</li>
                    <li>Add <strong>- item</strong> at the start of a line to generate styled list items.</li>
                  </ul>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-800 mt-2">
                <button
                  id="btn-form-cancel"
                  type="button"
                  onClick={onClose}
                  className="rounded border border-stone-800 bg-transparent px-5 py-2.5 font-sans text-sm font-semibold text-stone-300 hover:bg-stone-900 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-form-submit"
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 rounded bg-stone-100 px-5 py-2.5 font-sans text-sm font-semibold text-stone-900 hover:bg-stone-200 disabled:bg-stone-900/40 disabled:text-stone-600 disabled:border-stone-800 disabled:border transition-colors cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>{postToEdit ? "Save Changes" : "Publish Manuscript"}</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
