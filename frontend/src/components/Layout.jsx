import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, ArrowLeft, Search, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import ProfileMenu from './ProfileMenu';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            {location.pathname !== '/' && (
                                <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:text-gray-900" title="Back">
                                    <ArrowLeft className="h-6 w-6" />
                                </button>
                            )}
                            <Link to={user ? "/dashboard" : "/"} className="flex items-center text-xl font-bold" style={{ color: '#399CB8' }}>
                                <Home className="h-6 w-6 mr-2" />
                                BugEdits
                            </Link>
                        </div>

                        {user && (
                            <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Search albums or photos..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </form>
                        )}

                        <div className="flex items-center">
                            {user ? (
                                <ProfileMenu />
                            ) : (
                                <>
                                    <Link to="/login" className="px-3 py-2 hover:opacity-80" style={{ color: '#399CB8' }}>Login</Link>
                                    <Link to="/register" className="text-white px-4 py-2 rounded-md hover:opacity-90 ml-2" style={{ backgroundColor: '#399CB8' }}>Register</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Outlet />
            </main>
        </div>
    );
}
