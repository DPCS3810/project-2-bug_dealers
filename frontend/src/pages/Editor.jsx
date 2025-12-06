import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import client from '../api/client';
import { Trash2, Save, RotateCw, Undo, Crop as CropIcon, Sliders, Check, X } from 'lucide-react';
import { getCroppedImg, applyFilters } from '../utils/canvasUtils';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export default function Editor() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [editingTitle, setEditingTitle] = useState(false);

    // Original metadata
    const [photo, setPhoto] = useState(null);

    // Image State
    const [imageSrc, setImageSrc] = useState(null);
    const [history, setHistory] = useState([]);

    // Tools
    const [activeTab, setActiveTab] = useState('adjust');

    // Adjustments
    const [adjustments, setAdjustments] = useState({
        brightness: 100,
        contrast: 100,
        saturation: 100,
    });

    // Crop & Rotate
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(undefined);
    const imgRef = useRef(null);

    // UI Message State
    const [notification, setNotification] = useState({ msg: null, isError: false });

    useEffect(() => {
        client.get(`/gallery/photos/${id}/`)
            .then(res => {
                setPhoto(res.data);
                setTitle(res.data.title);
                setImageSrc(res.data.image);
                setHistory([res.data.image]);
            })
            .catch(err => {
                console.error(err);
                if (err.response && err.response.status === 404) {
                    alert("Photo not found");
                    navigate(-1);
                }
            });
    }, [id, navigate]);

    const showNotification = (msg, isError = false) => {
        setNotification({ msg, isError });
        setTimeout(() => setNotification({ msg: null, isError: false }), 4000);
    };

    const addToHistory = (newImageSrc) => {
        setHistory(prev => [...prev, newImageSrc]);
        setImageSrc(newImageSrc);
    };

    const handleUndo = () => {
        if (history.length > 1) {
            const newHistory = history.slice(0, -1);
            setHistory(newHistory);
            setImageSrc(newHistory[newHistory.length - 1]);
            setAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
            setCrop(undefined);
            setRotation(0);
        }
    };

    const handleAdjustmentChange = (type, value) => {
        setAdjustments(prev => ({ ...prev, [type]: value }));
    };

    const applyAdjustments = async () => {
        try {
            const blob = await applyFilters(imageSrc, adjustments);
            const newUrl = URL.createObjectURL(blob);
            addToHistory(newUrl);
            setAdjustments({ brightness: 100, contrast: 100, saturation: 100 });
            setActiveTab('adjust');
        } catch (e) {
            console.error('Filter apply error', e);
            showNotification("Failed to apply adjustments", true);
        }
    };

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        if (aspect) {
            setCrop(centerAspectCrop(width, height, aspect));
        }
    }

    const handleAspectChange = (val) => {
        setAspect(val);
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            if (val) {
                setCrop(centerAspectCrop(width, height, val));
            } else {
                setCrop(undefined);
            }
        }
    };

    const handleRotation = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const applyCrop = async () => {
        try {
            const blob = await getCroppedImg(
                imageSrc,
                completedCrop,
                rotation
            );
            const newUrl = URL.createObjectURL(blob);
            addToHistory(newUrl);

            setCrop(undefined);
            setCompletedCrop(null);
            setRotation(0);
            setActiveTab('adjust');
        } catch (e) {
            console.error(e);
            showNotification("Failed to apply crop: " + e.message, true);
        }
    };

    const handleSave = async (asCopy = false) => {
        if (!window.confirm(asCopy ? 'Save as a new copy?' : 'Overwrite original?')) return;
        setNotification({ msg: null, isError: false });

        try {
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            const file = new File([blob], "edited_image.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append('image', file);

            let targetUrl = `/gallery/photos/${id}/`;
            let method = 'patch';

            if (asCopy) {
                targetUrl = '/gallery/photos/';
                method = 'post';
                formData.append('title', `${title} (Copy)`);
                if (photo.album) {
                    formData.append('album', photo.album);
                }
                formData.append('description', photo.description || '');
            } else {
                formData.append('title', title);
            }

            // Explicitly set Content-Type to multipart/form-data to override client default
            // Axios will set the boundary automatically when it detects FormData, 
            // but we need to ensure the client default 'application/json' doesn't override it incorrectly.
            // Passing 'multipart/form-data' explicitly is the safest bet here given the user's previous error.
            await client[method](targetUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (asCopy) {
                // Navigate immediately
                navigate(-1);
            } else {
                setHistory([imageSrc]);
                showNotification('Saved successfully!');
            }

        } catch (error) {
            console.error('Save failed', error);
            const msg = error.response ? `${error.response.status} ${JSON.stringify(error.response.data)}` : error.message;
            showNotification(`SAVE FAILED: ${msg}`, true);
        }
    };

    const handleSaveTitle = () => {
        client.patch(`/gallery/photos/${id}/`, { title })
            .then(res => {
                setPhoto(res.data);
                setEditingTitle(false);
            })
            .catch(err => showNotification('Failed to update title', true));
    };

    const handleDelete = () => {
        if (!window.confirm('Are you sure you want to delete this photo?')) return;
        client.delete(`/gallery/photos/${id}/`)
            .then(() => navigate(-1))
            .catch(err => showNotification('Failed to delete photo', true));
    };

    if (!photo) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="flex flex-col h-screen max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-white shadow-sm z-10">
                <div className="flex items-center space-x-2">
                    <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                        <X className="h-6 w-6" />
                    </button>
                    {editingTitle ? (
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="border p-1 rounded"
                            />
                            <button onClick={handleSaveTitle} className="text-green-600"><Check className="h-4 w-4" /></button>
                        </div>
                    ) : (
                        <h2 className="text-xl font-bold cursor-pointer hover:bg-gray-100 px-2 rounded" onClick={() => setEditingTitle(true)}>
                            {title}
                        </h2>
                    )}
                </div>
                <div className="flex space-x-3">
                    <button onClick={handleUndo} disabled={history.length <= 1} className="p-2 text-gray-600 disabled:opacity-30 hover:bg-gray-100 rounded">
                        <Undo className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleSave(true)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Save Copy</button>
                    <button onClick={() => handleSave(false)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center">
                        <Save className="h-4 w-4 mr-2" /> Save
                    </button>
                    <button onClick={handleDelete} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Notification Area */}
            {notification.msg && (
                <div className={`px-4 py-2 relative text-center font-bold ${notification.isError ? 'bg-red-100 text-red-700 border-red-400' : 'bg-green-100 text-green-700 border-green-400'} border`}>
                    {notification.msg}
                </div>
            )}

            {/* Main Editor Area */}
            <div className="flex-1 relative bg-gray-100 overflow-hidden flex items-center justify-center p-4">
                {activeTab === 'crop' ? (
                    <div className="max-h-full overflow-auto flex items-center justify-center">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            style={{ maxHeight: '80vh' }}
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt="Crop Me"
                                onLoad={onImageLoad}
                                style={{ transform: `rotate(${rotation}deg)`, maxHeight: '70vh', maxWidth: '100%' }}
                            />
                        </ReactCrop>
                    </div>
                ) : (
                    <div className="relative max-w-full max-h-full flex items-center justify-center h-full">
                        <img
                            src={imageSrc}
                            alt="Editing"
                            className="max-w-full max-h-full object-contain shadow-lg"
                            style={{
                                filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Controls Toolbar */}
            <div className="bg-white border-t p-4 z-20">
                {/* Mode Selector */}
                <div className="flex justify-center space-x-6 mb-4">
                    <button
                        onClick={() => setActiveTab('adjust')}
                        className={`flex flex-col items-center space-y-1 ${activeTab === 'adjust' ? 'text-indigo-600' : 'text-gray-500'}`}
                    >
                        <Sliders className="h-6 w-6" />
                        <span className="text-xs">Adjust</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('crop')}
                        className={`flex flex-col items-center space-y-1 ${activeTab === 'crop' ? 'text-indigo-600' : 'text-gray-500'}`}
                    >
                        <CropIcon className="h-6 w-6" />
                        <span className="text-xs">Crop & Rotate</span>
                    </button>
                </div>

                {/* Contextual Controls */}
                <div className="h-24">
                    {activeTab === 'adjust' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 flex justify-between">Brightness <span>{adjustments.brightness}%</span></label>
                                <input
                                    type="range" min="0" max="200"
                                    value={adjustments.brightness}
                                    onChange={(e) => handleAdjustmentChange('brightness', e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 flex justify-between">Contrast <span>{adjustments.contrast}%</span></label>
                                <input
                                    type="range" min="0" max="200"
                                    value={adjustments.contrast}
                                    onChange={(e) => handleAdjustmentChange('contrast', e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 flex justify-between">Saturation <span>{adjustments.saturation}%</span></label>
                                <input
                                    type="range" min="0" max="200"
                                    value={adjustments.saturation}
                                    onChange={(e) => handleAdjustmentChange('saturation', e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="col-span-full flex justify-center mt-2">
                                <button onClick={applyAdjustments} className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200">
                                    Apply Adjustments
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'crop' && (
                        <div className="flex flex-col items-center space-y-3">
                            <div className="flex space-x-2 overflow-x-auto pb-2 w-full justify-center">
                                {[
                                    { label: 'Free', val: undefined },
                                    { label: '1:1', val: 1 },
                                    { label: '3:2', val: 3 / 2 },
                                    { label: '4:3', val: 4 / 3 },
                                    { label: '16:9', val: 16 / 9 },
                                    { label: '2:3', val: 2 / 3 },
                                    { label: '3:4', val: 3 / 4 },
                                    { label: '9:16', val: 9 / 16 },
                                ].map(r => (
                                    <button
                                        key={r.label}
                                        onClick={() => handleAspectChange(r.val)}
                                        className={`px-3 py-1 rounded text-sm whitespace-nowrap ${aspect === r.val ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center space-x-4">
                                <button onClick={handleRotation} className="flex items-center px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200">
                                    <RotateCw className="h-4 w-4 mr-1" /> Rotate 90°
                                </button>
                                <button onClick={applyCrop} className="px-4 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
