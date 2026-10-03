import type { SubmissionStatus } from '../../../generated/prisma/client.js';

export interface ContactSubmissionResponse {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: SubmissionStatus;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedContacts {
  items: ContactSubmissionResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}