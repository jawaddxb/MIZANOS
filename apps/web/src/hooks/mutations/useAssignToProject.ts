"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { teamRepository } from "@/lib/api/repositories";

export function useAssignToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profileId,
      productId,
    }: {
      profileId: string;
      productId: string;
    }) =>
      teamRepository.assignToProject(profileId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Team member assigned to project");
    },
    onError: (error: Error) => {
      toast.error("Failed to assign to project: " + error.message);
    },
  });
}
