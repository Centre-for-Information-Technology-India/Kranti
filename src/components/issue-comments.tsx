"use client";

import { useState } from "react";
import { MessageSquare, Send, ShieldAlert, CheckCircle2, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { IssueComment } from "@/lib/content-types";
import { Button } from "@/components/ui/button";

interface IssueCommentsProps {
  issueSlug: string;
  issueId: string;
  initialComments: IssueComment[];
}

export default function IssueComments({ issueSlug, issueId, initialComments }: IssueCommentsProps) {
  const { user, isLoaded } = useUser();
  const [comments, setComments] = useState<IssueComment[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch(`/api/issues/${encodeURIComponent(issueSlug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newCommentText }),
      });
      const data = await response.json();
      if (!response.ok || !data?.comment) {
        setSubmitError(response.status === 400 ? "Check your comment and try again." : "Your comment could not be saved. Please try again.");
        return;
      }

      const addedComment: IssueComment = {
        $id: String(data.comment.$id ?? `comment_${Date.now()}`),
        issue_id: issueId,
        user_name: String(data.comment.user_name ?? user?.fullName ?? user?.username ?? "Citizen User"),
        avatar_url: data.comment.avatar_url ?? user?.imageUrl,
        content: newCommentText,
        status: "approved",
        createdAt: String(data.comment.createdAt ?? new Date().toISOString()),
      };

      setComments((current) => [addedComment, ...current]);
      setNewCommentText("");
    } catch {
      setSubmitError("Your comment could not be saved. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-900/5 pb-4 dark:border-white/5">
        <MessageSquare className="h-5 w-5 text-slate-500" />
        <h3 className="text-xl font-semibold">Discussion ({comments.length})</h3>
      </div>

      {/* Comment Form */}
      {isLoaded && user ? (
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border bg-slate-100 dark:bg-slate-800">
            {user.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt={user.fullName ?? "User"} className="h-full w-full object-cover" />
            ) : (
              <User className="h-full w-full p-2 text-slate-400" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              value={newCommentText}
              onChange={(e) => {
                setNewCommentText(e.target.value);
                setSubmitError("");
              }}
              placeholder="Add your voice... Keep comments factual, civil, and constructive."
              rows={3}
              aria-invalid={Boolean(submitError)}
              aria-describedby={submitError ? "comment-submit-error" : undefined}
              className="w-full rounded-2xl border border-slate-900/10 bg-white/90 p-4 text-sm focus:border-slate-950/20 focus:outline-none dark:border-white/10 dark:bg-slate-900/90"
            />
            {submitError && <p id="comment-submit-error" role="alert" className="text-sm text-red-700 dark:text-red-300">{submitError}</p>}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                Comments are subject to civic moderation guidelines.
              </span>
              <Button type="submit" disabled={isSubmitting} className="rounded-full gap-1.5 h-10 px-5 bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                {isSubmitting ? "Posting..." : "Post Comment"}
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-900/10 bg-white/50 p-6 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/30">
          Please log in to join the discussion and share your feedback.
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.$id} className="flex gap-4 rounded-3xl border border-slate-900/5 bg-white/70 p-5 dark:border-white/5 dark:bg-slate-900/40">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border bg-slate-100 dark:bg-slate-800">
              {comment.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={comment.avatar_url} alt={comment.user_name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-full w-full p-2 text-slate-400" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{comment.user_name}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Verified Citizen
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
