'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ListPlus, 
  Database, 
  History, 
  Settings, 
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sources', label: 'Sources', icon: ListPlus },
  { href: '/scan', label: 'Scan Center', icon: Briefcase },
  { href: '/companies', label: 'Companies', icon: Database },
  { href: '/history', label: 'Scan History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white text-slate-800 border-r border-slate-200 h-screen sticky top-0 hidden md:flex">
      <div className="p-6 flex items-center gap-3 border-b border-slate-200">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
          J
        </div>
        <span className="font-bold text-lg text-slate-900">JobFinder</span>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-blue-50 text-blue-600" 
                  : "hover:bg-slate-100 hover:text-slate-900 text-slate-600"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
