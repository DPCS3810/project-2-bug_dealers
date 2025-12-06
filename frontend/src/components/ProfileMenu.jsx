import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Trash2 } from 'lucide-react';
import client from '../api/client';

export default function ProfileMenu() {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
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

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your albums, photos, and data.'
        );

        if (!confirmed) return;

        const doubleConfirm = window.prompt(
            'Type "DELETE" to confirm account deletion:'
        );

        if (doubleConfirm !== 'DELETE') {
            alert('Account deletion cancelled');
            return;
        }

        try {
            await client.delete('/auth/profile/');
            alert('Account deleted successfully');
            logout();
        } catch (err) {
            console.error('Failed to delete account:', err);
            alert('Failed to delete account. Please try again.');
        }
    };

    if (!user) return null;

    return (
        <div className="relative z-50" ref={menuRef}>
            <button
                onClick={toggleMenu}
                className="flex items-center space-x-2 focus:outline-none"
            >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                    <User className="h-5 w-5" />
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm text-gray-500">Signed in as</p>
                        <p className="text-sm font-medium text-gray-900 truncate" title={user.username}>{user.username}</p>
                        <p className="text-xs text-gray-400 truncate" title={user.id}>ID: {user.id}</p>
                    </div>

                    <div className="py-1 flex items-center justify-center">
                        <div className="h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-300 my-3">
                            <User className="h-10 w-10" />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 py-1">
                        <button
                            onClick={logout}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                            <LogOut className="mr-3 h-4 w-4 text-gray-500" />
                            Sign out
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                            <Trash2 className="mr-3 h-4 w-4" />
                            Delete Account
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
