import { supabase } from './supabaseClient';

export interface AuthProfile {
  id: string;
  nickname: string;
  auth_user_id: string;
}

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function normalizeNickname(nickname: string): string {
  return nickname.trim().replace(/\s+/g, ' ');
}

/** Supabase Auth требует email, поэтому ник необратимо превращается в служебный адрес. */
async function nicknameEmail(nickname: string): Promise<string> {
  const normalized = normalizeNickname(nickname).toLocaleLowerCase('ru');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex}@study-dirt.local`;
}

async function claimProfile(): Promise<AuthProfile> {
  const { data, error } = await client().rpc('claim_profile');
  if (error) throw error;
  const profile = Array.isArray(data) ? data[0] : data;
  if (!profile) throw new Error('Не удалось создать профиль пользователя.');
  return profile as AuthProfile;
}

function friendlyError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return new Error('Неверное имя или пароль.');
  if (lower.includes('already registered') || lower.includes('username is already taken')) {
    return new Error('Пользователь с таким именем уже существует.');
  }
  if (lower.includes('password should be') || lower.includes('password must be')) {
    return new Error('Пароль должен содержать не менее 6 символов.');
  }
  if (lower.includes('email rate limit')) return new Error('Слишком много попыток регистрации. Попробуйте позже.');
  return new Error(message);
}

export async function register(nickname: string, password: string): Promise<AuthProfile> {
  try {
    const cleanNickname = normalizeNickname(nickname);
    const email = await nicknameEmail(cleanNickname);
    const { data, error } = await client().auth.signUp({
      email,
      password,
      options: { data: { nickname: cleanNickname } },
    });
    if (error) throw error;
    if (!data.session) {
      if (data.user?.identities?.length === 0) throw new Error('Username is already taken');
      throw new Error('В Supabase включено подтверждение email. Отключите Confirm email в Authentication → Providers → Email.');
    }
    return await claimProfile();
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function login(nickname: string, password: string): Promise<AuthProfile> {
  try {
    const email = await nicknameEmail(nickname);
    const { error } = await client().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return await claimProfile();
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function restoreProfile(): Promise<AuthProfile | null> {
  const { data, error } = await client().auth.getSession();
  if (error) throw error;
  if (!data.session) return null;
  return claimProfile();
}

export async function logout(): Promise<void> {
  const { error } = await client().auth.signOut();
  if (error) throw error;
}
