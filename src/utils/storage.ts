import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Listing } from '../types';

const TOKEN_KEY = 'nest_auth_token';
const USER_KEY = 'nest_user_data';
const LISTINGS_KEY = 'nest_listings_data';
const SAVED_IDS_KEY = 'nest_saved_ids';

export const storage = {
  // Auth
  async saveToken(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async getToken() {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },
  async removeToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
  async saveUser(user: any) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
  async getUser() {
    const user = await SecureStore.getItemAsync(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // First Launch & Onboarding
  async isFirstLaunch() {
    const value = await SecureStore.getItemAsync('nest_first_launch');
    return value === null;
  },
  async setLaunched() {
    await SecureStore.setItemAsync('nest_first_launch', 'false');
  },
  async getOnboardingCompleted() {
    const value = await AsyncStorage.getItem('nest_onboarding_completed');
    return value === 'true';
  },
  async setOnboardingCompleted() {
    await AsyncStorage.setItem('nest_onboarding_completed', 'true');
  },
  
  // User Role
  async getRole() {
    return await AsyncStorage.getItem('nest_user_role') as 'tenant' | 'landlord' | null;
  },
  async setRole(role: 'tenant' | 'landlord') {
    await AsyncStorage.setItem('nest_user_role', role);
  },

  // Listings (Local Database)
  async saveListings(listings: Listing[]) {
    await AsyncStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
  },
  async getListings(): Promise<Listing[]> {
    const data = await AsyncStorage.getItem(LISTINGS_KEY);
    return data ? JSON.parse(data) : [];
  },
  async addListing(listing: Listing) {
    const listings = await this.getListings();
    const updated = [listing, ...listings];
    await this.saveListings(updated);
    return updated;
  },

  // Saved Listings (IDs)
  async getSavedIds(): Promise<string[]> {
    const data = await AsyncStorage.getItem(SAVED_IDS_KEY);
    return data ? JSON.parse(data) : [];
  },
  async toggleSaveId(id: string) {
    const ids = await this.getSavedIds();
    const updated = ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id];
    await AsyncStorage.setItem(SAVED_IDS_KEY, JSON.stringify(updated));
    return updated;
  },

  // Image Handling
  async saveImageLocally(uri: string): Promise<string> {
    if (uri.startsWith('file://')) {
      const fileName = uri.split('/').pop();
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: uri, to: newPath });
      return newPath;
    }
    return uri; // Return original if not a local file (e.g. remote URL)
  },

  async clear() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    // Keep listings but clear saved if needed
    // await AsyncStorage.removeItem(SAVED_IDS_KEY);
  },

  async clearAllData() {
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync('nest_first_launch');
  }
};
