import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Upload() {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [requesting, setRequesting] = useState(false);
    const [title, setTitle] = useState('');
    const [albumId, setAlbumId] = useState('');
    const [albums, setAlbums] = useState([]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Fetch albums on mount
    useEffect(() => {
        client.get('/gallery/albums/')
            .then(res => setAlbums(res.data))
            .catch(err => console.error(err));

        const urlAlbumId = searchParams.get('albumId');
        if (urlAlbumId) setAlbumId(urlAlbumId);
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (files.length === 0) return;
        setRequesting(true);

        try {
            await Promise.all(Array.from(files).map(file => {
                const formData = new FormData();
                formData.append('image', file);
                formData.append('title', title || file.name); // Use file name if title is empty, or same title for all
                if (albumId) formData.append('album', albumId);

                return client.post('/gallery/photos/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }));
            if (albumId) {
                navigate(`/album/${albumId}`);
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setRequesting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Upload Photo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Album (Optional)</label>
                    <select value={albumId} onChange={e => setAlbumId(e.target.value)} className="mt-1 block w-full border p-2 rounded">
                        <option value="">No Album</option>
                        {albums.map(album => (
                            <option key={album.id} value={album.id}>{album.title}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Photos (Select Multiple)</label>
                    <input type="file" onChange={e => setFiles(e.target.files)} className="mt-1 block w-full border p-2" accept="image/*" multiple required />
                    {files.length > 0 && <p className="text-sm text-gray-500 mt-1">{files.length} files selected</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full border p-2 rounded" />
                </div>
                <button type="submit" disabled={requesting} className={`w-full text-white py-2 rounded ${requesting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                    {requesting ? 'Uploading...' : 'Upload'}
                </button>
            </form>
        </div>
    );
}
