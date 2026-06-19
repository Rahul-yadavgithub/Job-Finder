'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminGet } from '@/lib/admin/api';
import { LayoutDashboard, Compass, Briefcase, MapPin, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function WorkerDashboard() {
  const { user } = useAdminAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user?.isSuperAdmin) {
      router.replace('/dashboard');
      return;
    }
    
    if (user) {
      fetchProfile();
    }
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      // We can fetch from auth/me which returns user details including created_at and branch
      const response = await adminGet<{ success: boolean; data: any }>('/auth/me');
      if (response.success) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.isSuperAdmin) return null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-32 mb-8"></div>
        <div className="h-48 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  const roleColor = user.role === 'coordinator' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome, {user.name}</h1>
        <div className="mt-3 flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${roleColor}`}>
            {user.role}
          </span>
          <span className="text-sm font-medium text-gray-500 capitalize">
            {user.designation?.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Compass size={200} />
        </div>
        <div className="p-8 md:p-12 relative z-10">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
            <LayoutDashboard size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Your workspace is being set up.</h2>
          <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
            More features for your specific role will appear here soon. The engineering team is currently expanding the co-worker tools.
          </p>
        </div>
        <div className="bg-gray-50 border-t border-gray-100 px-8 py-5 flex flex-wrap gap-6 md:gap-12 relative z-10">
          <div className="flex items-center gap-2 text-gray-600">
            <Briefcase size={18} className="text-gray-400" />
            <span className="text-sm font-medium capitalize">{user.designation?.replace('_', ' ')}</span>
          </div>
          {profile?.branches?.name && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={18} className="text-gray-400" />
              <span className="text-sm font-medium">{profile.branches.name} Branch</span>
            </div>
          )}
          {profile?.created_at && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={18} className="text-gray-400" />
              <span className="text-sm font-medium">Active since {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
