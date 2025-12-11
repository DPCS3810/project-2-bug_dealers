import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { Plus, Trash2, CheckCircle, Share2, Users } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import AccessManagement from '../components/AccessManagement';
import { useAuth } from '../context/AuthContext';

export default function AlbumDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [album, setAlbum] = useState(null);
    const [selectedPhotos, setSelectedPhotos] = useState(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

    useEffect(() => {
        fetchAlbum();
    }, [id]);

    const fetchAlbum = () => {
        client.get(`/gallery/albums/${id}/`)
            .then(res => setAlbum(res.data))
            .catch(err => console.error(err));
    };

    const toggleSelect = (photoId) => {
        const newSelected = new Set(selectedPhotos);
        if (newSelected.has(photoId)) {
            newSelected.delete(photoId);
        } else {
            newSelected.add(photoId);
        }
        setSelectedPhotos(newSelected);
    };

    const deleteSelected = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedPhotos.size} photos?`)) return;
        try {
            await Promise.all(Array.from(selectedPhotos).map(pid => client.delete(`/gallery/photos/${pid}/`)));
            setSelectedPhotos(new Set());
            setIsSelectMode(false);
            fetchAlbum();
        } catch (error) {
            alert('Failed to delete photos');
        }
    };



    if (!album) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{album.title}</h1>
                    <p className="text-gray-600">{album.description}</p>
                </div>
                <div className="flex space-x-2">
                    {album.owner === user?.id && (
                        <>
                            <button
                                onClick={() => setIsAccessModalOpen(true)}
                                className="text-white px-4 py-2 rounded shadow hover:opacity-90 flex items-center"
                                style={{ backgroundColor: '#399CB8' }}
                            >
                                <Users className="h-4 w-4 mr-2" /> Manage Access
                            </button>
                            <button
                                onClick={() => setIsShareModalOpen(true)}
                                className="text-white px-4 py-2 rounded shadow hover:opacity-90 flex items-center"
                                style={{ backgroundColor: '#399CB8' }}
                            >
                                <Share2 className="h-4 w-4 mr-2" /> Share
                            </button>
                        </>
                    )}
                    {album.photos && album.photos.length > 0 && (
                        <button
                            onClick={() => { setIsSelectMode(!isSelectMode); setSelectedPhotos(new Set()); }}
                            className={`px-4 py-2 rounded shadow flex items-center ${isSelectMode ? 'bg-gray-200 text-gray-800' : 'text-white hover:opacity-90'}`}
                            style={!isSelectMode ? { backgroundColor: '#399CB8' } : {}}
                        >
                            {isSelectMode ? 'Cancel Selection' : 'Select Photos'}
                        </button>
                    )}
                    {isSelectMode && selectedPhotos.size > 0 && (
                        <button onClick={deleteSelected} className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 flex items-center">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete ({selectedPhotos.size})
                        </button>
                    )}
                    <Link to={`/upload?albumId=${album.id}`} className="text-white px-4 py-2 rounded shadow hover:opacity-90 flex items-center" style={{ backgroundColor: '#399CB8' }}>
                        <Plus className="h-4 w-4 mr-2" /> Add Photo
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {album.photos && album.photos.map(photo => (
                    <div key={photo.id} className="relative group block">
                        {isSelectMode && (
                            <div className="absolute inset-0 z-20 cursor-pointer" onClick={() => toggleSelect(photo.id)}></div>
                        )}
                        {isSelectMode && (
                            <div className="absolute top-2 right-2 z-30 p-1 bg-white rounded-full shadow pointer-events-none">
                                <CheckCircle className={`h-6 w-6 ${selectedPhotos.has(photo.id) ? 'text-indigo-600 fill-indigo-100' : 'text-gray-300'}`} />
                            </div>
                        )}
                        {isSelectMode ? (
                            <div className={`cursor-pointer ${selectedPhotos.has(photo.id) ? 'ring-4 ring-indigo-500 rounded' : ''}`}>
                                <img
                                    src={photo.image}
                                    alt={photo.title}
                                    className={`w-full h-48 object-cover rounded shadow transition-opacity ${selectedPhotos.has(photo.id) ? 'opacity-75' : 'group-hover:opacity-75'}`}
                                />
                            </div>
                        ) : (
                            <Link to={`/editor/${photo.id}`}>
                                <img
                                    src={photo.image}
                                    alt={photo.title}
                                    className="w-full h-48 object-cover rounded shadow group-hover:opacity-75 transition-opacity"
                                />
                            </Link>
                        )}
                        <div className="mt-2 px-1">
                            {/* Tags */}
                            {photo.tags && photo.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mb-1">
                                    {photo.tags.map(tag => (
                                        <span
                                            key={tag.id}
                                            className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full"
                                        >
                                            #{tag.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic">No tags</p>
                            )}

                            {/* Metadata */}
                            <p className="text-xs text-gray-500">
                                {new Date(photo.uploaded_at).toLocaleString()}
                            </p>
                        </div>

                    </div>
                ))}
                {(!album.photos || album.photos.length === 0) && (
                    <p className="col-span-full text-center text-gray-500 py-10">No photos yet. Click "Add Photo" to upload.</p>
                )}
            </div>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                type="album"
                id={album.id}
                title={album.title}
            />

            <AccessManagement
                isOpen={isAccessModalOpen}
                onClose={() => setIsAccessModalOpen(false)}
                resourceType="album"
                resourceId={album.id}
            />
        </div>
    );
}
