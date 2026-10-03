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
  const base = {
    httpOnly: true as const,
    secure: isProd,
    sameSite: 'lax' as const,
  };

  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    path: '/',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    sameSite: 'strict',
    path: REFRESH_PATH,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie(USER_COOKIE, JSON.stringify(user), {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
  res.clearCookie(USER_COOKIE, { path: '/' });
}