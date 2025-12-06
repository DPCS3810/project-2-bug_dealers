
import React, { useState } from 'react';
import client from '../api/client';
import { X, Copy, Check, Lock, Globe } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, type, id, title }) => {
    const [username, setUsername] = useState('');
    const [canEdit, setCanEdit] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const generateLink = async () => {
        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const payload = {
                username: username,
                can_edit: canEdit,
                [type]: id // 'album': id or 'photo': id
            };

            const response = await client.post('/gallery/shares/', payload);

            const shareToken = response.data.token;
            const link = `${window.location.origin}/share/${shareToken}`;
            setGeneratedLink(link);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.username) {
                setError(err.response.data.username);
            } else {
                setError('Failed to generate link. Please check the username and try again.');
            }

        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] rounded-xl border border-white/10 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Globe size={18} className="text-blue-400" />
                        Share {type === 'album' ? 'Album' : 'Photo'}
                    </h3>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-white/70 text-sm">
                        Share <strong className="text-white">{title}</strong> with a specific user. They will need to redeem the link to view the content.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">Recipient Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
                                placeholder="Enter username"
                            />
                        </div>

                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${canEdit ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                    {canEdit ? <Lock size={18} /> : <Globe size={18} />}
                                </div>
                                <div>
                                    <p className="text-white font-medium">Allow Editing</p>
                                    <p className="text-xs text-white/50">Recipients can add/delete photos</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={canEdit}
                                    onChange={(e) => setCanEdit(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {generatedLink ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Share Link</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={generatedLink}
                                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors border border-white/5 active:scale-95"
                                    >
                                        {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={generateLink}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                            >
                                {loading ? 'Generating...' : 'Create Share Link'}
                            </button>
                        )}

                        {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
