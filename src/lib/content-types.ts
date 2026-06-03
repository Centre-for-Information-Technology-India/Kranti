export interface IssueEvidence {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  publicUrl: string;
  sanitized: boolean;
}

export interface IssueComment {
  $id: string;
  issue_id: string;
  user_name: string;
  avatar_url?: string;
  content: string;
  status: "pending_review" | "approved" | "flagged";
  createdAt: string;
}

export interface IssueRecord {
  $id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  state: string;
  district: string;
  landmark: string;
  status: "pending_review" | "open" | "in_progress" | "escalated" | "resolved" | "rejected";
  supporter_count: number;
  evidence_count: number;
  created_by: string;
  creatorName: string;
  creatorAvatar?: string;
  language: string;
  location: [number, number];
  createdAt: string;
  evidence: IssueEvidence[];
}

export interface PetitionRecord {
  $id: string;
  title: string;
  slug: string;
  description: string;
  demand: string;
  targetAuthority: string;
  category: string;
  state: string;
  district?: string;
  status: "pending_review" | "open" | "in_progress" | "resolved" | "successful";
  signature_count: number;
  signature_goal: number;
  evidence_count: number;
  created_by: string;
  creatorName: string;
  creatorAvatar?: string;
  language: string;
  featured: boolean;
  createdAt: string;
  evidence: IssueEvidence[];
}

export interface ReportRecord {
  $id: string;
  title: string;
  slug: string;
  description: string;
  incidentType: string;
  incidentDate: string;
  state: string;
  district: string;
  landmark?: string;
  status: "pending_review" | "under_investigation" | "verified" | "resolved";
  visibility: "moderated" | "public" | "restricted";
  evidence_count: number;
  created_by: string;
  creatorName: string;
  creatorAvatar?: string;
  language: string;
  createdAt: string;
  evidence: IssueEvidence[];
}

export interface CampaignRecord {
  $id: string;
  title: string;
  slug: string;
  description: string;
  goals: string;
  category: string;
  state: string;
  status: "pending_review" | "active" | "completed" | "paused";
  volunteer_count: number;
  featured: boolean;
  created_by: string;
  creatorName: string;
  creatorAvatar?: string;
  language: string;
  start_date?: string;
  end_date?: string;
  createdAt: string;
}
