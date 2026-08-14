import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const tokenKey = 'campuslife.auth_token';
const baseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return AsyncStorage.getItem(key); } catch { return null; }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return AsyncStorage.getItem(key);
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { await AsyncStorage.setItem(key, value); } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function deleteStorageItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { await AsyncStorage.removeItem(key); } catch {}
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
}

export const authToken = {
  get: () => getStorageItem(tokenKey),
  set: (token: string) => setStorageItem(tokenKey, token),
  clear: () => deleteStorageItem(tokenKey),
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await authToken.get();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${baseUrl}${normalizedPath}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'Something went wrong. Please try again.');
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}
