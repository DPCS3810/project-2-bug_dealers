import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';

export default function Share() {
    const { token } = useParams();
    const [album, setAlbum] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        client.get(`/gallery/shares/view/${token}/`)
            .then(res => setAlbum(res.data.album))
            .catch(err => setError('Invalid link'));
    }, [token]);

    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;
    if (!album) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-4">{album.title}</h1>
            <p className="mb-6 text-gray-600">{album.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {album.photos.map(photo => (
                    <div key={photo.id} className="bg-white p-4 rounded shadow">
                        <img src={photo.image} alt={photo.title} className="w-full h-48 object-cover rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
