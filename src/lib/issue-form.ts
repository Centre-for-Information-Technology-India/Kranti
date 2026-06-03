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
  title: z.string().min(12, "Add a specific title."),
  description: z.string().min(80, "Add enough context for a moderator to understand the issue."),
  category: z.enum(issueCategories),
  state: z.string().min(2, "State is required."),
  district: z.string().min(2, "District is required."),
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
  consent: true,
};

export function buildIssueSlug(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "issue"}-${suffix}`;
}
