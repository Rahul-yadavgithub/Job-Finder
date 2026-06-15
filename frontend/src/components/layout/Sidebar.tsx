'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ListPlus, 
  Database, 
  History, 
  Settings, 
  Briefcase,
  CloudUpload,
  Users,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sources', label: 'Sources', icon: ListPlus },
  { href: '/scan', label: 'Scan Center', icon: Briefcase },
  { href: '/companies', label: 'Companies', icon: Database },
  { href: '/sync', label: 'Sync Center', icon: CloudUpload },
  { href: '/branch-portal', label: 'Branch Portal', icon: Users },
  { href: '/history', label: 'Scan History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden fixed top-4 right-4 z-50 p-2.5 bg-white rounded-xl shadow-md border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-colors"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex flex-col bg-white text-slate-800 border-r border-slate-200 h-screen sticky top-0 transition-all duration-300 z-50",
        isCollapsed ? "w-20" : "w-64",
        isMobileOpen ? "fixed inset-y-0 left-0 shadow-2xl" : "hidden md:flex"
      )}>
        <div 
          className={cn(
            "flex items-center border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors",
            isCollapsed && !isMobileOpen ? "p-6 justify-center" : "p-6 gap-3"
          )}
          onClick={() => {
            if (!isMobileOpen) setIsCollapsed(!isCollapsed);
          }}
          title={isCollapsed && !isMobileOpen ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <div className="w-8 h-8 flex-shrink-0 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
            J
          </div>
          {(!isCollapsed || isMobileOpen) && <span className="font-bold text-lg text-slate-900 whitespace-nowrap overflow-hidden">JobFinder</span>}
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-blue-50 text-blue-600" 
                    : "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
                  isCollapsed && !isMobileOpen ? "justify-center p-3" : "gap-3 px-3 py-2.5"
                )}
                title={isCollapsed && !isMobileOpen ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
