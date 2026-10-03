export interface ClientResponse {
  id: string;
  name: string;
  logo: string;
  url: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}