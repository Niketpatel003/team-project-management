const AUTH_TOKEN_KEY = "syncsphere_auth_token";

function getLocalStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

export function readAuthToken() {
  const storage = getLocalStorage();
  return storage ? storage.getItem(AUTH_TOKEN_KEY) : null;
}

export function writeAuthToken(token) {
  const storage = getLocalStorage();

  if (storage) {
    storage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function clearAuthToken() {
  const storage = getLocalStorage();

  if (storage) {
    storage.removeItem(AUTH_TOKEN_KEY);
  }
}
