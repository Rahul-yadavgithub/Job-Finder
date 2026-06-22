'use client';

import { useState, useRef, useEffect } from 'react';
import { useCommunicationAuth } from '../hooks/useCommunicationAuth';
import { commApi } from '../services/api';
import { X, Upload, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

interface ManageProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

export function ManageProfileModal({ isOpen, onClose }: ManageProfileModalProps) {
  const { user, refreshUser } = useCommunicationAuth();
  
  // State for form fields
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [name, setName] = useState(user?.name || '');
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobileNo, setMobileNo] = useState(user?.mobileNo || '');
  const [branchId, setBranchId] = useState(user?.branchId || '');
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize state when modal opens or user changes
  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.displayName || user.name || '');
      setName(user.name || '');
      setRollNumber(user.rollNumber || '');
      setEmail(user.email || '');
      setMobileNo(user.mobileNo || '');
      setBranchId(user.branchId || '');
    }
  }, [user, isOpen]);

  // Fetch branches
  useEffect(() => {
    if (isOpen) {
      commApi.get('/auth/branches')
        .then(res => {
          if (res.data.success) {
            setBranches(res.data.data);
          }
        })
        .catch(err => console.error('Failed to fetch branches', err));
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast.error('Cloudinary environment variables are missing');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Save the URL to backend
        await commApi.patch('/auth/profile', { profilePhotoUrl: data.secure_url });
        if (refreshUser) await refreshUser();
        toast.success('Profile photo updated successfully');
      } else {
        throw new Error(data.error?.message || 'Failed to upload image');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error uploading photo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsUploading(true);
      await commApi.patch('/auth/profile', { profilePhotoUrl: null });
      if (refreshUser) await refreshUser();
      toast.success('Profile photo removed');
    } catch (error: any) {
      toast.error(error.message || 'Error removing photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await commApi.patch('/auth/profile', {
        displayName,
        name,
        rollNumber,
        email,
        mobileNo,
        branchId
      });
      if (refreshUser) await refreshUser();
      toast.success('Profile updated successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Manage Profile</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col items-center justify-center space-y-4 mb-8">
            <div className="relative group cursor-pointer" onClick={handleUploadClick}>
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center">
                {user.profilePhotoUrl ? (
                  <img src={user.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-white" />
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm text-gray-500 font-medium">Click to upload photo</p>
              {user.profilePhotoUrl && (
                <button 
                  onClick={handleRemovePhoto}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Enter roll number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="Enter mobile number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
              >
                <option value="" disabled>Select Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSaving || isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isUploading || !name.trim() || !email.trim() || !rollNumber.trim() || !branchId}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1b4376] hover:bg-[#15335b] rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
