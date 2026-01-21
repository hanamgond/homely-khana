'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  CookingPot,
  Package,
  Users,
  Star,
  Home,
  Building2,
  LogOut,
  UserCog,
  Settings,
  Utensils // <--- Imported Icon for Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the structure for navigation groups
const navGroups = [
  {
    title: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Operations',
    items: [
      { href: '/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/menu', label: 'Weekly Menu', icon: Utensils }, // <--- ADDED HERE
      { href: '/kitchen', label: 'Kitchen & Dispatch', icon: CookingPot },
      { href: '/products', label: 'Products', icon: Package },
    ]
  },
  {
    title: 'Management',
    items: [
      { href: '/customers', label: 'Customers', icon: Users },
      { href: '/team', label: 'Team Management', icon: UserCog },
      { href: '/corporate', label: 'Corporate Leads', icon: Building2 },
      { href: '/reviews', label: 'Reviews', icon: Star },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Hydrate user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="hidden border-r bg-muted/40 md:block w-[280px]">
      <div className="flex h-full max-h-screen flex-col gap-2">
        
        {/* Header */}
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 bg-white/50 backdrop-blur">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Home className="h-6 w-6" />
            <span>HomelyKhana</span>
          </Link>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-6">
            
            {navGroups.map((group, index) => (
              <div key={index} className="space-y-1">
                {/* Section Title */}
                <h4 className="px-3 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  {group.title}
                </h4>
                
                {/* Links */}
                {group.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                      pathname === item.href 
                        ? 'bg-primary/10 text-primary font-semibold' 
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}

            {/* Separate Settings Link */}
            <div className="space-y-1 mt-4">
               <h4 className="px-3 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  System
                </h4>
              <Link
                href="/settings"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                  pathname === '/settings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>

          </nav>
        </div>

        {/* User Profile & Logout Footer */}
        <div className="mt-auto border-t bg-muted/20 p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.name || 'Admin'}</span>
              <span className="text-xs text-muted-foreground">{user?.role || 'Manager'}</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}