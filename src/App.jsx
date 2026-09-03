import { useEffect } from 'react';

import { testSupabase } from './lib/testSupabase';

import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';

import { CartProvider } from '@/lib/cartContext';
import { LanguageProvider } from '@/lib/languageContext';
import { TypographyProvider } from '@/lib/typographyContext';

import Menu from '@/pages/Menu';
import Cart from '@/pages/Cart';
import Admin from '@/pages/Admin';
import ThankYou from '@/pages/ThankYou';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin,
  } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }

    if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <LanguageProvider>
      <TypographyProvider>
        <CartProvider>
          <Routes>
            {/* Customer pages */}
            <Route path="/" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/thank-you" element={<ThankYou />} />

            {/* Authentication pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Manager */}
            <Route path="/manager" element={<Admin />} />

            {/* 404 */}
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </CartProvider>
      </TypographyProvider>
    </LanguageProvider>
  );
};

function App() {
  useEffect(() => {
    testSupabase();
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>

        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
