import { useEffect } from 'react';
import { testSupabase } from './lib/testSupabase';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
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
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <LanguageProvider>
    <TypographyProvider>
    <CartProvider>
      <Routes>
        {/* Add your page Route elements here */}
        <Route path="/" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/admin" element={<Admin />} />
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
  )
}

export default App