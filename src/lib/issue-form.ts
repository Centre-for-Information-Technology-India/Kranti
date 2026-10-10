import { z } from "zod";

export const issueCategories = [
  "governance",
  "infrastructure",
  "education",
  "healthcare",
  "environment",
  "transport",
  "water",
  "sanitation",
  "safety",
  "corruption",
  "utilities",
  "police",
  "other",
] as const;

export const evidenceLevels = ["low", "medium", "high"] as const;
export const issueLanguages = ["en", "hi"] as const;

export const issueSubmissionSchema = z.object({
  title: z.string().min(12, "Add a specific title.").max(180, "Keep the title within 180 characters."),
  description: z.string().min(80, "Add enough context for a moderator to understand the issue."),
  category: z.enum(issueCategories),
  state: z.string().min(2, "State is required.").max(100, "Keep the state within 100 characters."),
  district: z.string().min(2, "District is required.").max(100, "Keep the district within 100 characters."),
  landmark: z.string().min(3, "Add a nearby landmark or locality."),
  evidenceLevel: z.enum(evidenceLevels),
  evidenceLinks: z.string().url("Must be a valid URL").array().optional(),
  language: z.enum(issueLanguages),
  consent: z.boolean().refine((value) => value, {
    message: "Please confirm the information is accurate to the best of your knowledge.",
  }),
});

export type IssueSubmissionValues = z.infer<typeof issueSubmissionSchema>;

export const issueDefaultValues: IssueSubmissionValues = {
  title: "",
  description: "",
  category: "other",
  state: "",
  district: "",
  landmark: "",
  evidenceLevel: "medium",
  evidenceLinks: [],
  language: "en",
  consent: false,
};

export function buildIssueSlug(title: string, issueId: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${base || "issue"}-${issueId}`;
}
