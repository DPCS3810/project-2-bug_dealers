import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Camera, Trash2 } from 'lucide-react';
import client from '../api/client';

export default function ProfileMenu() {
    const { user, logout, setUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const menuRef = useRef(null);

    const toggleMenu = () => setIsOpen(!isOpen);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_picture', file);

        setUploading(true);
        try {
            await client.patch('/auth/profile/', formData);
            // Fetch updated profile to ensure UI reflects server state
            const profileRes = await client.get('/auth/profile/');
            setUser(profileRes.data);
            setIsOpen(false);
        } catch (err) {
            console.error('Failed to upload profile picture', err);
            alert('Failed to upload profile picture');
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePicture = async () => {
        if (!confirm('Are you sure you want to remove your profile picture?')) return;

        try {
            await client.patch('/auth/profile/', { profile_picture: null });
            // Fetch updated profile to ensure UI reflects server state
            const profileRes = await client.get('/auth/profile/');
            setUser(profileRes.data);
            setIsOpen(false);
        } catch (err) {
            console.error('Failed to remove profile picture', err);
            alert('Failed to remove profile picture');
        }
    };

    if (!user) return null;

    return (
        <div className="relative z-50" ref={menuRef}>
            <button
                onClick={toggleMenu}
                className="flex items-center space-x-2 focus:outline-none"
            >
                {user.profile_picture ? (
                    <img
                        src={user.profile_picture}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover border border-gray-200"
                    />
                ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                        <User className="h-5 w-5" />
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm text-gray-500">Signed in as</p>
                        <p className="text-sm font-medium text-gray-900 truncate" title={user.username}>{user.username}</p>
                        <p className="text-xs text-gray-400 truncate" title={user.id}>ID: {user.id}</p>
                    </div>

                    <div className="py-1">
                        <div className="px-4 py-2 flex items-center justify-center">
                            {user.profile_picture ? (
                                <div className="relative">
                                    <img
                                        src={user.profile_picture}
                                        alt="Profile Large"
                                        className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-md"
                                    />
                                </div>
                            ) : (
                                <div className="h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-300">
                                    <User className="h-10 w-10" />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => fileInputRef.current.click()}
                            disabled={uploading}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                            <Camera className="mr-3 h-4 w-4 text-gray-500" />
                            {uploading ? 'Uploading...' : 'Change Profile Picture'}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />

                        {user.profile_picture && (
                            <button
                                onClick={handleRemovePicture}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                            >
                                <Trash2 className="mr-3 h-4 w-4" />
                                Remove Profile Picture
                            </button>
                        )}
                    </div>

                    <div className="border-t border-gray-100 py-1">
                        <button
                            onClick={logout}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                            <LogOut className="mr-3 h-4 w-4 text-gray-500" />
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
