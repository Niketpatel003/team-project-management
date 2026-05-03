import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, loginUser, signupUser } from "../services/api";
import { clearAuthToken, readAuthToken, writeAuthToken } from "../services/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => readAuthToken());
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function hydrateSession() {
      if (!authToken) {
        if (!ignore) {
          setCurrentUser(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const user = await fetchCurrentUser(authToken);
        if (!ignore) {
          setCurrentUser(user);
        }
      } catch (error) {
        clearAuthToken();
        if (!ignore) {
          setAuthToken(null);
          setCurrentUser(null);
        }
      } finally {
        if (!ignore) {
          setAuthLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      ignore = true;
    };
  }, [authToken]);

  const login = async ({ email, password }) => {
    const session = await loginUser({
      email: email.trim().toLowerCase(),
      password,
    });

    writeAuthToken(session.token);
    setAuthToken(session.token);
    setCurrentUser(session.user);
    return session.user;
  };

  const signup = async ({ name, email, password }) => {
    const session = await signupUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    writeAuthToken(session.token);
    setAuthToken(session.token);
    setCurrentUser(session.user);
    return session.user;
  };

  const logout = () => {
    clearAuthToken();
    setAuthToken(null);
    setCurrentUser(null);
  };

  const value = useMemo(
    () => ({
      authToken,
      authLoading,
      currentUser,
      isAuthenticated: Boolean(currentUser),
      login,
      signup,
      logout,
    }),
    [authLoading, authToken, currentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
