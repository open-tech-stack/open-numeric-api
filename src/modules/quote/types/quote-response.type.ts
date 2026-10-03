import type { SubmissionStatus } from '../../../generated/prisma/client.js';

export interface QuoteRequestResponse {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
  status: SubmissionStatus;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedQuotes {
  items: QuoteRequestResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}