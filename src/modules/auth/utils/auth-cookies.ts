import type { Response } from 'express';

export const ACCESS_COOKIE = 'on.accessToken';
export const REFRESH_COOKIE = 'on.refreshToken';
export const USER_COOKIE = 'on.user';

const REFRESH_PATH = '/api/auth';

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  user: unknown,
  isProd: boolean,
) {
  // 🔑 En prod : sameSite 'none' + secure 'true' (cross-site Vercel)
  // 🔑 En dev  : sameSite 'lax' + secure 'false' (localhost http)
  const crossSite = isProd;

  const httpOnlyBase = {
    httpOnly: true as const,
    secure: crossSite,               // ✅ true en prod
    sameSite: (crossSite ? 'none' : 'lax') as 'none' | 'lax', // ✅ none en prod
  };

  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...httpOnlyBase,
    path: '/',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...httpOnlyBase,
    path: REFRESH_PATH,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie(USER_COOKIE, JSON.stringify(user), {
    httpOnly: false,
    secure: crossSite,
    sameSite: crossSite ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
  res.clearCookie(USER_COOKIE, { path: '/' });
}