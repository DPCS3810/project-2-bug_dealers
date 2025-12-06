import { useState, useEffect } from 'react';
import { X, Users, Edit, Trash2 } from 'lucide-react';
import client from '../api/client';

export default function AccessManagement({ isOpen, onClose, resourceType, resourceId }) {
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && resourceId) {
            fetchShares();
        }
    }, [isOpen, resourceId]);

    const fetchShares = async () => {
        setLoading(true);
        try {
            const endpoint = resourceType === 'album'
                ? `/gallery/albums/${resourceId}/shares/`
                : `/gallery/photos/${resourceId}/shares/`;
            const res = await client.get(endpoint);
            setShares(res.data);
        } catch (err) {
            console.error('Failed to fetch shares', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleEditAccess = async (shareId, currentCanEdit) => {
        try {
            await client.patch(`/gallery/shares/${shareId}/`, {
                can_edit: !currentCanEdit
            });
            fetchShares();
        } catch (err) {
            console.error('Failed to update access', err);
            alert('Failed to update access');
        }
    };

    const revokeAccess = async (shareId) => {
        if (!confirm('Are you sure you want to revoke this user\'s access?')) return;

        try {
            await client.delete(`/gallery/shares/${shareId}/`);
            fetchShares();
        } catch (err) {
            console.error('Failed to revoke access', err);
            alert('Failed to revoke access');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Manage Access
                    </h2>
                    <button onClick={onClose}>
                        <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : shares.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No users have access to this {resourceType}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {shares.map(share => (
                            <div key={share.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{share.shared_with_username}</p>
                                    <p className="text-sm text-gray-500">{share.shared_with_email}</p>
                                    <span className={`inline-block mt-1 text-xs px-2 py-1 rounded ${share.can_edit ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {share.can_edit ? 'Can Edit' : 'View Only'}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => toggleEditAccess(share.id, share.can_edit)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                        title={share.can_edit ? 'Change to View Only' : 'Grant Edit Access'}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => revokeAccess(share.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                        title="Revoke Access"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
