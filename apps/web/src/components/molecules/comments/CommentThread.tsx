"use client";

import { useState, useRef } from "react";
import { MentionInput } from "@/components/atoms/inputs/MentionInput";
import type { MentionInputHandle } from "@/components/atoms/inputs/MentionInput";
import { CommentItem } from "@/components/molecules/comments/CommentItem";
import { useTaskComments } from "@/hooks/queries/useTaskComments";
import { useCreateComment } from "@/hooks/mutations/useTaskCommentMutations";
import { useProductMembers } from "@/hooks/queries/useProductMembers";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/atoms/layout/ScrollArea";
import { MessageSquare } from "lucide-react";

interface CommentThreadProps {
  taskId: string;
  productId: string;
}

export function CommentThread({ taskId, productId }: CommentThreadProps) {
  const { data: comments = [], isLoading } = useTaskComments(taskId);
  const { data: members = [] } = useProductMembers(productId);
  const { user } = useAuth();
  const createComment = useCreateComment(taskId);
  const [newComment, setNewComment] = useState("");
  const mentionRef = useRef<MentionInputHandle>(null);

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    const storageContent = mentionRef.current
      ? mentionRef.current.toStorageFormat(newComment)
      : newComment;
    createComment.mutate(
      { content: storageContent },
      { onSuccess: () => setNewComment("") },
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 pb-1.5 border-b">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">
          Comments ({comments.length})
        </span>
      </div>

      <ScrollArea className="flex-1 py-1">
        {isLoading && (
          <p className="text-xs text-muted-foreground py-3 text-center">Loading...</p>
        )}
        {!isLoading && comments.length === 0 && (
          <p className="text-xs text-muted-foreground py-3 text-center">
            No comments yet. Start the conversation.
          </p>
        )}
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            taskId={taskId}
            members={members}
          />
        ))}
      </ScrollArea>

      <div className="border-t pt-2 space-y-1.5">
        <MentionInput
          ref={mentionRef}
          value={newComment}
          onChange={setNewComment}
          members={members}
          currentUserId={user?.profile_id}
          placeholder="Add a comment... Use @ to mention"
          onSubmit={handleSubmit}
          className="text-xs"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || createComment.isPending}
            className="text-xs font-medium bg-primary text-primary-foreground rounded px-3 py-1 disabled:opacity-50"
          >
            {createComment.isPending ? "Posting..." : "Comment"}
          </button>
        </div>
      </div>
    </div>
  );
}
