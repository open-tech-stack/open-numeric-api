export interface AppConfig {
  app: {
    env: 'development' | 'production' | 'test';
    port: number;
    swaggerEnabled: boolean;
  };
  database: {
    url: string;
    directUrl?: string;
  };
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  cors: {
    origins: string[];
  };
  rateLimit: {
    window: string;
    max: number;
  };
}

export default (): AppConfig => ({
  app: {
    env: (process.env.NODE_ENV as AppConfig['app']['env']) ?? 'development',
    port: parseInt(process.env.PORT ?? '5000', 10),
    swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
  },
  database: {
    url: process.env.DATABASE_URL as string,
    directUrl: process.env.DIRECT_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET as string,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
  rateLimit: {
    window: process.env.RATE_LIMIT_WINDOW ?? '15m',
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  },
});