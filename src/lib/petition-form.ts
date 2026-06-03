import { z } from "zod";

export const petitionCategories = [
  "policy_change",
  "justice",
  "environment",
  "education",
  "health",
  "safety",
  "infrastructure",
  "corruption",
  "rights",
  "other",
] as const;

export const petitionSubmissionSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(500, "Title too long"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  demand: z.string().min(20, "Please clearly state your demand (minimum 20 characters)"),
  targetAuthority: z.string().min(5, "Please specify the target authority"),
  category: z.enum(petitionCategories),
  state: z.string().min(2, "State is required"),
  district: z.string().optional(),
  signatureGoal: z.number().min(10, "Signature goal must be at least 10").max(10000000, "Goal too high"),
  language: z.enum(["en", "hi"]),
  evidenceLevel: z.enum(["high", "medium", "low"]),
  evidenceLinks: z.string().url("Must be a valid URL").array().optional(),
  consent: z.boolean().refine((val) => val === true, "You must agree to the terms"),
});

export type PetitionSubmissionValues = z.infer<typeof petitionSubmissionSchema>;

export const petitionDefaultValues: PetitionSubmissionValues = {
  title: "",
  description: "",
  demand: "",
  targetAuthority: "",
  category: "policy_change",
  state: "",
  district: "",
  signatureGoal: 1000,
  language: "en",
  evidenceLevel: "medium",
  evidenceLinks: [],
  consent: false,
};

export function buildPetitionSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}
