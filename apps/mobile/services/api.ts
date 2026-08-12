import * as SecureStore from 'expo-secure-store';

const tokenKey = 'campuslife.auth_token';
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';
export const authToken = { get: () => SecureStore.getItemAsync(tokenKey), set: (token: string) => SecureStore.setItemAsync(tokenKey, token), clear: () => SecureStore.deleteItemAsync(tokenKey) };
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await authToken.get();
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string } | null; throw new Error(body?.message ?? 'Something went wrong. Please try again.'); }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
