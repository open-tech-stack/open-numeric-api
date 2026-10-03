/**
 * Type de contenu trouvé.
 */
export type SearchResultType =
  | 'project'
  | 'service'
  | 'team'
  | 'client'
  | 'testimonial'
  | 'nav';

/**
 * Un résultat unifié de recherche.
 * On expose les champs communs + un `matched` qui indique dans quel
 * champ la recherche a trouvé (title, description, etc.).
 */
export interface SearchResult {
  type: SearchResultType;
  id: string;
  /** Identifiant lisible pour construire l'URL (slug ou key) */
  slug: string;
  /** Titre affichable (dépend de la locale demandée) */
  title: string;
  /** Sous-titre ou extrait (optionnel) */
  excerpt?: string;
  /** URL côté front (précalculée côté backend) */
  url: string;
  /** Locale de la correspondance */
  locale: string;
  /** Score de pertinence (0-100) */
  score: number;
}

/**
 * Réponse groupée par type + liste à plat.
 */
export interface SearchResponse {
  query: string;
  locale: string;
  total: number;
  results: SearchResult[];
  byType: Partial<Record<SearchResultType, number>>;
  generatedAt: string;
}