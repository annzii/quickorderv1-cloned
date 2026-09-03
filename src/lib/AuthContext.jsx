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

  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const loadUserWithProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load user profile:', error);
      }

      const appUser = {
        ...authUser,
        role: profile?.role || null,
      };

      setUser(appUser);
      setIsAuthenticated(true);

      console.log('AUTH USER:', appUser);
    } catch (error) {
      console.error('Failed to load user profile:', error);

      setUser({
        ...authUser,
        role: null,
      });

      setIsAuthenticated(true);
    }
  };

  useEffect(() => {
    checkUserAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;

      await loadUserWithProfile(currentUser);

      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
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

      await loadUserWithProfile(currentUser);

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
    window.location.href = '/login';
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
