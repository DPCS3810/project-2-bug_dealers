import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Folder, Trash2, Edit2, Plus, X, Globe, Gift, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const [albums, setAlbums] = useState([]);
    const [sharedContent, setSharedContent] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isRedeemOpen, setIsRedeemOpen] = useState(false);
    const [redeemToken, setRedeemToken] = useState('');
    const [editingAlbum, setEditingAlbum] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const fetchAlbums = () => {
        client.get('/gallery/albums/')
            .then(res => {
                // Filter to show only owned albums (not shared)
                const ownedAlbums = res.data.filter(album => album.owner === user?.id);
                setAlbums(ownedAlbums);
            })
            .catch(err => console.error(err));
    };

    const fetchSharedContent = () => {
        client.get('/gallery/shares/received/')
            .then(res => setSharedContent(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        if (user) {
            fetchAlbums();
            fetchSharedContent();
        }
    }, [user]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await client.post('/gallery/albums/', { title: newTitle, description: newDesc });
            setIsCreateOpen(false);
            setNewTitle('');
            setNewDesc('');
            fetchAlbums();
        } catch (error) {
            alert('Failed to create album');
        }
    };

    const handleRedeem = async (e) => {
        e.preventDefault();
        try {
            // Extract token from URL if full URL is pasted
            let token = redeemToken;
            if (token.includes('/share/')) {
                const parts = token.split('/share/');
                token = parts[parts.length - 1];
            }

            await client.post('/gallery/shares/redeem/', { token });
            setIsRedeemOpen(false);
            setRedeemToken('');
            fetchSharedContent();
            alert('Share redeemed successfully!');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to redeem share');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this album?')) return;
        try {
            await client.delete(`/gallery/albums/${id}/`);
            fetchAlbums();
        } catch (error) {
            alert('Failed to delete album');
        }
    };

    const startEdit = (album) => {
        setEditingAlbum(album);
        setNewTitle(album.title);
        setNewDesc(album.description || '');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await client.patch(`/gallery/albums/${editingAlbum.id}/`, { title: newTitle, description: newDesc });
            setEditingAlbum(null);
            setNewTitle('');
            setNewDesc('');
            fetchAlbums();
        } catch (error) {
            alert('Failed to update album');
        }
    };

    if (!user) return <div className="text-center mt-10">Please login to view dashboard.</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Albums</h1>
                <div className="space-x-2">
                    <button onClick={() => setIsRedeemOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 inline-flex items-center">
                        <Gift className="h-4 w-4 mr-2" /> Redeem Share
                    </button>
                    <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 flex items-center inline-flex">
                        <Plus className="h-4 w-4 mr-2" /> New Album
                    </button>
                    <Link to="/upload" className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 inline-flex items-center">
                        <Plus className="h-4 w-4 mr-2" /> Upload Photo
                    </Link>
                </div>
            </div>

            {/* Redeem Modal */}
            {isRedeemOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Redeem Shared Content</h2>
                            <button onClick={() => setIsRedeemOpen(false)}><X className="h-6 w-6 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleRedeem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Share Link or Token</label>
                                <input
                                    type="text"
                                    value={redeemToken}
                                    onChange={e => setRedeemToken(e.target.value)}
                                    className="mt-1 block w-full border p-2 rounded"
                                    placeholder="Paste link here..."
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                                Redeem
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {(isCreateOpen || editingAlbum) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{editingAlbum ? 'Edit Album' : 'New Album'}</h2>
                            <button onClick={() => { setIsCreateOpen(false); setEditingAlbum(null); }}><X className="h-6 w-6 text-gray-500" /></button>
                        </div>
                        <form onSubmit={editingAlbum ? handleUpdate : handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="mt-1 block w-full border p-2 rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="mt-1 block w-full border p-2 rounded" />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                                {editingAlbum ? 'Update Album' : 'Create Album'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {albums.map(album => (
                    <div key={album.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow relative group">
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(album)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(album.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <Link to={`/album/${album.id}`} className="block">
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
                        <div className="grid grid-cols-3 gap-2">
                            {album.photos && album.photos.slice(0, 3).map(photo => (
                                <Link to={`/editor/${photo.id}`} key={photo.id}>
                                    <img src={photo.image} className="w-full h-16 object-cover rounded hover:opacity-75 transition-opacity" />
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {sharedContent.length > 0 && (
                <>
                    <h1 className="text-2xl font-bold mb-6">Shared with Me</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sharedContent.map(share => {
                            const isAlbum = share.album !== null;
                            const title = isAlbum ? share.album_title : share.photo_title;
                            const owner = isAlbum ? share.album_owner : share.photo_owner;
                            const linkTo = isAlbum ? `/album/${share.album_id}` : `/editor/${share.photo_id}`;

                            return (
                                <Link key={share.token} to={linkTo} className="block">
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-[1.02] border border-indigo-100">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-3 bg-white rounded-full shadow-sm">
                                                {isAlbum ? (
                                                    <Folder className="h-6 w-6 text-purple-600" />
                                                ) : (
                                                    <ImageIcon className="h-6 w-6 text-purple-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {title || (isAlbum ? 'Untitled Album' : 'Untitled Photo')}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    by {owner}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs px-2 py-1 rounded ${share.can_edit ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {share.can_edit ? 'Can Edit' : 'View Only'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
