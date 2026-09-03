import React, {
  createContext,
  useState,
  useContext,
  useEffect
} from 'react';

import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // We keep these names so the rest of your existing app continues working
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkUserAuth();

    // Listen for Supabase login/logout changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;

      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
    // Base44 used this for app-level authentication.
    // Our public QuickOrder menu does not need Base44 app authentication.
    setIsLoadingPublicSettings(false);
    setAuthError(null);
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);

      const {
        data: { session },
        error
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Supabase auth check failed:', error);
      }

      const currentUser = session?.user || null;

      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setAuthError(null);
    } catch (error) {
      console.error('User auth check failed:', error);

      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = async (shouldRedirect = true) => {
    await supabase.auth.signOut();

    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    // We will create the Supabase admin login flow later.
    // For now, keep public customers on the website.
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};