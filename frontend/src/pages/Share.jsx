
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import { Layout } from 'lucide-react';

const Share = () => {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await client.get(`/gallery/shares/view/${token}/`);
                setData(response.data);
                if (response.data.can_edit) {
                    localStorage.setItem('shareToken', token);
                } else {
                    localStorage.removeItem('shareToken');
                }
            } catch (err) {
                if (err.response && err.response.status === 401) {
                    // Redirect to login, preserving current location to return after login
                    navigate('/login', { state: { from: location } });
                    return;
                }
                setError('Invalid or expired link.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, navigate, location]);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Oops!</h1>
                <p className="text-white/60">{error}</p>
            </div>
        </div>
    );

    const { type, data: content, can_edit } = data;

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Shared {type === 'album' ? 'Album' : 'Photo'}
                    </h1>
                    {can_edit && <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20 mt-2 inline-block">EDIT MODE ENABLED</span>}
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {type === 'album' ? (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold">{content.title}</h2>
                            <p className="text-white/60">{content.description}</p>
                        </div>

                        {content.photos && content.photos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {content.photos.map(photo => (
                                    <div key={photo.id} className="group relative aspect-square bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/10">
                                        <img
                                            src={`${import.meta.env.VITE_MEDIA_URL}${photo.image}`}
                                            alt={photo.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                            <p className="font-medium text-white truncate">{photo.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-[#1e1e1e] rounded-xl border border-dashed border-white/10">
                                <p className="text-white/40">This album is empty.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                            <img
                                src={`${import.meta.env.VITE_MEDIA_URL}${content.image}`}
                                alt={content.title}
                                className="w-full h-auto max-h-[80vh] object-contain bg-black/50"
                            />
                            <div className="p-6">
                                <h2 className="text-xl font-bold">{content.title || 'Untitled Photo'}</h2>
                                <p className="text-white/40 text-sm mt-1">Uploaded on {new Date(content.uploaded_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Share;
