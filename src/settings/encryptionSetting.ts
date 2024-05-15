import { isDevMode, getAppEnvConfig } from '@/utils/env';

// System default cache time, in seconds
export const DEFAULT_CACHE_TIME = 60 * 60 * 24 * 7;
const { AES_KEY, AES_IV } = getAppEnvConfig();

// aes encryption key
export const cacheCipher = {
  key: AES_KEY,
  iv: AES_IV,
};

// Whether the system cache is encrypted using aes
export const SHOULD_ENABLE_STORAGE_ENCRYPTION = !isDevMode();
