import { getAppEnvConfig, isDevMode } from '@/utils/env';

// System default cache time, in seconds
export const DEFAULT_CACHE_TIME = 60 * 60 * 24 * 7;
const { VITE_GLOB_AES_KEY, VITE_GLOB_AES_IV } = getAppEnvConfig();

// aes encryption key
export const cacheCipher = {
  key: VITE_GLOB_AES_KEY,
  iv: VITE_GLOB_AES_IV,
};

// Whether the system cache is encrypted using aes
export const SHOULD_ENABLE_STORAGE_ENCRYPTION = !isDevMode();
