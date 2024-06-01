/**
 * Pinia Persist Plugin
 * Pinia 持久化插件
 * @link https://prazdevs.github.io/pinia-plugin-persistedstate/zh/guide/
 *
 */
import type { Pinia } from 'pinia';
import { createPersistedState, Serializer } from 'pinia-plugin-persistedstate';
//import type { PersistedStateFactoryOptions } from 'pinia-plugin-persistedstate';
//import { getCommonStoragePrefix } from '@/utils/env';
import { Encryption, EncryptionFactory } from '@/utils/cipher';
import { cacheCipher, SHOULD_ENABLE_STORAGE_ENCRYPTION } from '@/settings/encryptionSetting';

//export const PERSIST_KEY_PREFIX = getCommonStoragePrefix();

const persistEncryption: Encryption = EncryptionFactory.createAesEncryption({
  key: cacheCipher.key,
  iv: cacheCipher.iv,
});

/**
 * Custom serializer for serialization and deserialization of storage data
 * 自定义序列化器，用于序列化和反序列化存储数据
 *
 * @param shouldEnableEncryption whether to enable encryption for storage data 是否启用存储数据加密
 * @returns serializer
 */
export function customSerializer(): Serializer {
  if (SHOULD_ENABLE_STORAGE_ENCRYPTION) {
    return {
      deserialize: (value) => {
        const decrypted = persistEncryption.decrypt(value);
        return JSON.parse(decrypted);
      },
      serialize: (value) => {
        const serialized = JSON.stringify(value);
        return persistEncryption.encrypt(serialized);
      },
    };
  } else {
    return {
      deserialize: JSON.parse,
      serialize: JSON.stringify,
    };
  }
}

/**
 * Register Pinia Persist Plugin
 * 注册 Pinia 持久化插件
 *
 * @param pinia Pinia instance Pinia 实例
 */
export function registerPiniaPersistPlugin(pinia: Pinia) {
  pinia.use(createPersistedState({ storage: localStorage, serializer: customSerializer() }));
}

/**
 * Create Persisted State Options
 * 创建持久化状态选项
 *
 * @param keyPrefix prefix for storage key 储存键前缀
 * @returns persisted state factory options
 */
/*export function createPersistedStateOptions(keyPrefix: string): PersistedStateFactoryOptions {
  return {
    storage: localStorage,
    key: (id) => `${keyPrefix}__${id}`,
    serializer: customSerializer(),
  };
}*/
