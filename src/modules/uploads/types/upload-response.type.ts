export interface UploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface PaginatedUploads {
  items: UploadResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}