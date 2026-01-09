import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FavoriteStopEntry {
  stopId: string;
  addedAt: number;
}

export interface RecentStopEntry {
  stopId: string;
  searchedAt: number;
}

const FAVORITE_STOPS_KEY = 'FAVORITE_STOPS_V1';
const RECENT_STOPS_KEY = 'RECENT_STOPS_V1';
const MAX_FAVORITES = 50;
const MAX_RECENTS = 30;

async function readEntries<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as T[];
  } catch (error) {
    if (__DEV__) {
      console.warn(`${key} okunamadı`, error);
    }
    return [];
  }
}

async function writeEntries<T>(key: string, entries: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(entries));
  } catch (error) {
    if (__DEV__) {
      console.warn(`${key} kaydedilemedi`, error);
    }
  }
}

export async function getFavoriteStopIds(): Promise<string[]> {
  const entries = await readEntries<FavoriteStopEntry>(FAVORITE_STOPS_KEY);
  return entries.sort((a, b) => b.addedAt - a.addedAt).map((entry) => entry.stopId);
}

export async function toggleFavoriteStop(stopId: string): Promise<string[]> {
  const entries = await readEntries<FavoriteStopEntry>(FAVORITE_STOPS_KEY);
  const exists = entries.findIndex((entry) => entry.stopId === stopId);
  let nextEntries: FavoriteStopEntry[];
  if (exists >= 0) {
    nextEntries = [...entries.slice(0, exists), ...entries.slice(exists + 1)];
  } else {
    nextEntries = [{ stopId, addedAt: Date.now() }, ...entries].slice(0, MAX_FAVORITES);
  }
  await writeEntries(FAVORITE_STOPS_KEY, nextEntries);
  return nextEntries.map((entry) => entry.stopId);
}

export async function getRecentStopIds(): Promise<string[]> {
  const entries = await readEntries<RecentStopEntry>(RECENT_STOPS_KEY);
  return entries.sort((a, b) => b.searchedAt - a.searchedAt).map((entry) => entry.stopId);
}

export async function addRecentStop(stopId: string): Promise<string[]> {
  const entries = await readEntries<RecentStopEntry>(RECENT_STOPS_KEY);
  const filtered = entries.filter((entry) => entry.stopId !== stopId);
  const nextEntries = [{ stopId, searchedAt: Date.now() }, ...filtered].slice(0, MAX_RECENTS);
  await writeEntries(RECENT_STOPS_KEY, nextEntries);
  return nextEntries.map((entry) => entry.stopId);
}


