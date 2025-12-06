import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-7xl font-bold text-gray-800 mb-8 tracking-tight">
                    BugEdits
                </h1>
                <p className="text-xl text-gray-600 mb-12 max-w-md mx-auto">
                    Your powerful photo editing and management platform
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/login"
                        className="px-8 py-3 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        style={{ backgroundColor: '#399CB8' }}
                    >
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="px-8 py-3 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        style={{ backgroundColor: '#399CB8' }}
                    >
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}
