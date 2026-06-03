import { z } from "zod";

export const incidentTypes = [
  "communal_hate",
  "caste_discrimination",
  "gender_violence",
  "mob_violence",
  "hate_speech",
  "targeted_harassment",
  "religious_persecution",
  "other",
] as const;

export const reportSubmissionSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(500, "Title too long"),
  description: z.string().min(100, "Description must be at least 100 characters for safety documentation"),
  incidentType: z.enum(incidentTypes),
  incidentDate: z.string().min(1, "Incident date is required"),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  landmark: z.string().optional(),
  language: z.enum(["en", "hi"]),
  evidenceLinks: z.string().url("Must be a valid URL").array().optional(),
  evidenceRequired: z.boolean().refine((val) => val === true, "Evidence is mandatory for incident reports"),
  consent: z.boolean().refine((val) => val === true, "You must agree to the terms"),
});

export type ReportSubmissionValues = z.infer<typeof reportSubmissionSchema>;

export const reportDefaultValues: ReportSubmissionValues = {
  title: "",
  description: "",
  incidentType: "communal_hate",
  incidentDate: "",
  state: "",
  district: "",
  landmark: "",
  language: "en",
  evidenceLinks: [],
  evidenceRequired: false,
  consent: false,
};

export function buildReportSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}
