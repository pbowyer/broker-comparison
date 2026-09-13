const DATABASE_NAME = 'broker-costs';
const KEY_STORE = 'encryption-keys';
const KEY_ID = 'portfolio-v1';
export const PORTFOLIO_STORAGE_KEY = 'broker-costs.portfolio.v1';
export const PERSISTENCE_PREFERENCE_KEY = 'broker-costs.persistence';

const toBase64 = (bytes) => {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 32768) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
  }
  return btoa(binary);
};
const fromBase64 = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

export async function encryptPortfolio(value, key, webCrypto = crypto) {
  const iv = webCrypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await webCrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return { version: 1, iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

export async function decryptPortfolio(payload, key, webCrypto = crypto) {
  if (payload?.version !== 1 || !payload.iv || !payload.ciphertext) throw new Error('Unsupported saved portfolio');
  const plaintext = await webCrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv) },
    key,
    fromBase64(payload.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

function openDatabase(databaseFactory) {
  return new Promise((resolve, reject) => {
    const request = databaseFactory.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(KEY_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function keyOperation(databaseFactory, mode, operation) {
  const database = await openDatabase(databaseFactory);
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(KEY_STORE, mode);
      const request = operation(transaction.objectStore(KEY_STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

const readKey = (databaseFactory) => keyOperation(databaseFactory, 'readonly', (store) => store.get(KEY_ID));

async function createKey(databaseFactory, webCrypto) {
  const key = await webCrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await keyOperation(databaseFactory, 'readwrite', (store) => store.put(key, KEY_ID));
  return key;
}

export function createPortfolioStorage({ localStorage: storage, indexedDB: databaseFactory, crypto: webCrypto }) {
  return {
    isEnabled() {
      return storage.getItem(PERSISTENCE_PREFERENCE_KEY) !== 'off';
    },
    setEnabled(enabled) {
      storage.setItem(PERSISTENCE_PREFERENCE_KEY, enabled ? 'on' : 'off');
    },
    hasSavedPortfolio() {
      return storage.getItem(PORTFOLIO_STORAGE_KEY) !== null;
    },
    async load() {
      const serialized = storage.getItem(PORTFOLIO_STORAGE_KEY);
      if (!serialized) return null;
      const key = await readKey(databaseFactory);
      if (!key) throw new Error('Encryption key unavailable');
      return decryptPortfolio(JSON.parse(serialized), key, webCrypto);
    },
    async save(value, shouldCommit = () => true) {
      const key = await readKey(databaseFactory) || await createKey(databaseFactory, webCrypto);
      const payload = await encryptPortfolio(value, key, webCrypto);
      if (shouldCommit()) storage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(payload));
    },
    async clear() {
      storage.removeItem(PORTFOLIO_STORAGE_KEY);
      await keyOperation(databaseFactory, 'readwrite', (store) => store.delete(KEY_ID));
    },
  };
}
