import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UtensilsCrossed, ShoppingBag, Settings } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useAuth } from '@/lib/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { count } = useCart();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const tabs = [
    { to: '/', label: 'Menu', icon: UtensilsCrossed },
    { to: '/cart', label: 'Cart', icon: ShoppingBag, badge: count },
  ];
  if (isAdmin) tabs.push({ to: '/manager', label: 'Manage', icon: Settings });

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-lg border-t border-border">
      <div className={`max-w-md mx-auto grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {tabs.map(({ to, label, icon: Icon, badge }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center gap-1 py-3 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
                {badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}