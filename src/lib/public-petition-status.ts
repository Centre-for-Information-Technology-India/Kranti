export const publicPetitionStatuses = ["open", "in_progress", "successful", "resolved"] as const;

export function isPublicPetitionStatus(status: unknown): boolean {
  return publicPetitionStatuses.some((publicStatus) => publicStatus === status);
}
