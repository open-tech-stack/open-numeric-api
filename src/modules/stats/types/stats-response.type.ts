export interface StatsResponse {
  // Contenu
  content: {
    projects: {
      total: number;
      active: number;
      featured: number;
      published: number;
      inProgress: number;
      byCategory: Record<string, number>;
      byScope: Record<string, number>;
    };
    services: {
      total: number;
      active: number;
    };
    team: {
      total: number;
      active: number;
    };
    clients: {
      total: number;
      active: number;
    };
    testimonials: {
      total: number;
      active: number;
    };
    socials: {
      total: number;
      active: number;
    };
    navigation: {
      total: number;
      active: number;
    };
  };

  // Interactions
  interactions: {
    contacts: {
      total: number;
      new: number;
      read: number;
      replied: number;
      archived: number;
      spam: number;
      last7Days: number;
    };
    quotes: {
      total: number;
      new: number;
      read: number;
      replied: number;
      archived: number;
      spam: number;
      last7Days: number;
    };
  };

  // Activité
  activity: {
    lastContacts: RecentContact[];
    lastQuotes: RecentQuote[];
  };

  // Meta
  generatedAt: string;
}

export interface RecentContact {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  createdAt: string;
}

export interface RecentQuote {
  id: string;
  name: string;
  email: string;
  projectType: string;
  status: string;
  createdAt: string;
}