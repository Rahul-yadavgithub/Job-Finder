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
  X,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sources', label: 'Scan Center', icon: Briefcase },
  { href: '/companies', label: 'Companies', icon: Database },
  { href: '/sync', label: 'Sync Center', icon: CloudUpload },
  { href: '/branch-portal', label: 'Branch Portal', icon: Users },
  { href: '/history', label: 'Scan History', icon: History },
  { href: '/api-config', label: 'API Config', icon: Key },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[40] flex items-center px-4 gap-3 shadow-sm">
        <button 
          className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-white">
            <img 
              src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
              alt="NITH Logo"
              className="w-full h-full object-cover p-0.5"
            />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-extrabold tracking-tight text-slate-900">NITH</span>
            <span className="font-medium tracking-widest text-blue-600">TPR</span>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex flex-col bg-white text-slate-800 border-r border-slate-200 h-screen sticky top-0 transition-all duration-300 ease-in-out z-50",
        isCollapsed ? "w-20" : "w-64",
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:shadow-2xl",
        isMobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
      )}>
        <div 
          className={cn(
            "flex items-center justify-between border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors group",
            isCollapsed && !isMobileOpen ? "p-6 justify-center" : "px-5 py-5"
          )}
          onClick={() => {
            if (!isMobileOpen) setIsCollapsed(!isCollapsed);
          }}
          title={isCollapsed && !isMobileOpen ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <div className={cn("flex items-center gap-3", isCollapsed && !isMobileOpen && "hidden")}>
            <div className="w-10 h-10 flex-shrink-0 rounded-full border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center bg-white relative z-10">
              <img 
                src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
                alt="NITH Logo"
                className="w-full h-full object-cover p-0.5"
              />
            </div>
            
            <AnimatePresence>
              {(!isCollapsed || isMobileOpen) && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0, transition: { duration: 0.2 } }}
                  className="flex items-center gap-3 overflow-hidden whitespace-nowrap"
                >
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 24, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                    className="w-[1px] bg-gradient-to-b from-transparent via-slate-300 to-transparent"
                  />
                  
                  <div className="flex items-baseline gap-1.5">
                    <motion.span 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      className="font-extrabold text-xl tracking-tight text-slate-900"
                    >
                      NITH
                    </motion.span>
                    <motion.span 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.45, ease: [0.23, 1, 0.32, 1] }}
                      className="font-medium text-xl tracking-widest text-blue-600"
                    >
                      TPR
                    </motion.span>
                  </div>
                  {user && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-xs text-slate-500 font-medium truncate mt-1"
                    >
                      {user.name} • <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200">{user.branchName}</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logo when collapsed */}
          {isCollapsed && !isMobileOpen && (
            <div className="w-10 h-10 flex-shrink-0 rounded-full border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center bg-white relative z-10">
              <img 
                src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
                alt="NITH Logo"
                className="w-full h-full object-cover p-0.5"
              />
            </div>
          )}

          {isMobileOpen && (
            <button 
              className="md:hidden p-2 -mr-2 text-slate-500 hover:text-slate-800 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileOpen(false);
              }}
            >
              <X className="w-5 h-5" />
            </button>
          )}
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
        
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={logout}
            className={cn(
              "flex items-center w-full rounded-md transition-colors text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700",
              isCollapsed && !isMobileOpen ? "justify-center p-3" : "gap-3 px-3 py-2.5"
            )}
            title={isCollapsed && !isMobileOpen ? "Logout" : undefined}
          >
            <X className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span className="whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
