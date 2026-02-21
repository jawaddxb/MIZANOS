"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/atoms/display/Avatar";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateComment, useDeleteComment, useCreateComment } from "@/hooks/mutations/useTaskCommentMutations";
import type { TaskComment, ProductMember } from "@/lib/types";
import { MessageSquare, Pencil, Trash2, X, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MentionInput } from "@/components/atoms/inputs/MentionInput";

interface CommentItemProps {
  comment: TaskComment;
  taskId: string;
  members: ProductMember[];
  depth?: number;
}

function renderContent(content: string, members: ProductMember[]): string {
  return content.replace(/@\[([0-9a-f-]{36})\]/g, (_, id) => {
    const member = members.find((m) => m.profile_id === id);
    const name = member?.profile?.full_name ?? member?.profile?.email ?? "Unknown";
    return `@${name}`;
  });
}

export function CommentItem({ comment, taskId, members, depth = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const createReply = useCreateComment(taskId);

  const isAuthor = user?.profile_id === comment.author_id;

  const EDIT_WINDOW_MS = 10 * 60 * 1000;
  const [canEdit, setCanEdit] = useState(() => {
    return Date.now() - new Date(comment.created_at).getTime() < EDIT_WINDOW_MS;
  });

  useEffect(() => {
    const remaining = EDIT_WINDOW_MS - (Date.now() - new Date(comment.created_at).getTime());
    if (remaining <= 0) {
      setCanEdit(false);
      return;
    }
    setCanEdit(true);
    const timer = setTimeout(() => setCanEdit(false), remaining);
    return () => clearTimeout(timer);
  }, [comment.created_at]);
  const initials = (comment.author?.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    updateComment.mutate(
      { commentId: comment.id, content: editContent },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleReply = () => {
    if (!replyContent.trim()) return;
    createReply.mutate(
      { content: replyContent, parentId: comment.parent_id ?? comment.id },
      { onSuccess: () => { setReplyContent(""); setShowReply(false); } },
    );
  };

  return (
    <div className={depth > 0 ? "ml-6 border-l border-muted pl-3" : ""}>
      <div className="flex gap-2 py-1.5">
        <Avatar className="h-5 w-5 shrink-0 mt-0.5">
          <AvatarFallback className="text-[8px]">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-semibold">{comment.author?.full_name ?? "Unknown"}</span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>

          {isEditing ? (
            <div className="mt-1 space-y-1">
              <BaseTextarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} className="text-xs" />
              <div className="flex gap-0.5">
                <button onClick={handleSaveEdit} disabled={updateComment.isPending} className="inline-flex items-center text-[10px] text-muted-foreground hover:text-foreground px-1 py-0.5">
                  <Check className="h-2.5 w-2.5 mr-0.5" /> Save
                </button>
                <button onClick={() => setIsEditing(false)} className="inline-flex items-center text-[10px] text-muted-foreground hover:text-foreground px-1 py-0.5">
                  <X className="h-2.5 w-2.5 mr-0.5" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-foreground/90 whitespace-pre-wrap">{renderContent(comment.content, members)}</p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-0.5 mt-0.5">
              <button onClick={() => setShowReply(!showReply)} className="inline-flex items-center text-[10px] text-muted-foreground hover:text-foreground px-1 py-0.5">
                <MessageSquare className="h-2.5 w-2.5 mr-0.5" /> Reply
              </button>
              {isAuthor && canEdit && (
                <>
                  <button onClick={() => { setIsEditing(true); setEditContent(comment.content); }} className="inline-flex items-center text-[10px] text-muted-foreground hover:text-foreground px-1 py-0.5">
                    <Pencil className="h-2.5 w-2.5 mr-0.5" /> Edit
                  </button>
                  <button onClick={() => deleteComment.mutate(comment.id)} className="inline-flex items-center text-[10px] text-destructive/70 hover:text-destructive px-1 py-0.5">
                    <Trash2 className="h-2.5 w-2.5 mr-0.5" /> Delete
                  </button>
                </>
              )}
            </div>
          )}

          {showReply && (
            <div className="mt-1.5">
              <MentionInput
                value={replyContent}
                onChange={setReplyContent}
                members={members}
                currentUserId={user?.profile_id}
                placeholder="Write a reply..."
                onSubmit={handleReply}
                className="text-xs"
              />
              <div className="flex gap-1 mt-1">
                <button onClick={handleReply} disabled={!replyContent.trim() || createReply.isPending} className="text-[10px] font-medium bg-primary text-primary-foreground rounded px-2 py-0.5 disabled:opacity-50">
                  Reply
                </button>
                <button onClick={() => setShowReply(false)} className="text-[10px] text-muted-foreground hover:text-foreground px-1 py-0.5">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} taskId={taskId} members={members} depth={depth + 1} />
      ))}
    </div>
  );
}
