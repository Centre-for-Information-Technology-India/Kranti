export function canSignPetition(status: unknown): boolean {
  return status === "open" || status === "in_progress";
}
