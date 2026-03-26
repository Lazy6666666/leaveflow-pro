import * as SecureStore from "expo-secure-store";
import type { TokenCache } from "@clerk/expo";

export const tokenCache: TokenCache = {
  async getToken(key) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key, value) {
    await SecureStore.setItemAsync(key, value);
  },
  clearToken(key) {
    void SecureStore.deleteItemAsync(key);
  },
};
