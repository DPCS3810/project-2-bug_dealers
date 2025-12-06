import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import client from '../api/client';
import { Folder } from 'lucide-react';

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [albums, setAlbums] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!query) return;
        setLoading(true);
        Promise.all([
            client.get(`/gallery/albums/?search=${query}`),
            client.get(`/gallery/photos/?search=${query}`)
        ]).then(([albumRes, photoRes]) => {
            setAlbums(albumRes.data);
            setPhotos(photoRes.data);
        }).catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [query]);

    if (loading) return <div className="text-center mt-10">Searching...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Search Results for "{query}"</h1>

            <div>
                <h2 className="text-xl font-semibold mb-4">Albums</h2>
                {albums.length === 0 ? <p className="text-gray-500">No albums found.</p> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {albums.map(album => (
                            <Link to={`/album/${album.id}`} key={album.id} className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="p-3 bg-indigo-100 rounded-full">
                                        <Folder className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{album.title}</h3>
                                        <p className="text-sm text-gray-500">{album.photos ? album.photos.length : 0} photos</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Photos</h2>
                {photos.length === 0 ? <p className="text-gray-500">No photos found.</p> : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map(photo => (
                            <Link to={`/editor/${photo.id}`} key={photo.id} className="block group relative">
                                <img src={photo.image} alt={photo.title} className="w-full h-48 object-cover rounded shadow group-hover:opacity-75 transition-opacity" />
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                    {photo.title}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
