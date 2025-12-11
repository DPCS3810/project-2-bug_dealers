import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import client from '../api/client';
import { Trash2, Save, RotateCw, Undo, Crop as CropIcon, Sliders, Check, X, Share2, Download, Pen, Type } from 'lucide-react';
import { getCroppedImg, applyFilters } from '../utils/canvasUtils';
import ShareModal from '../components/ShareModal';

const cacheBust = (url) =>
    url.startsWith("blob:")
        ? url
        : `${url}?cb=${Date.now()}`;


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

    // Tags
    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState('');


    // Original metadata
    const [photo, setPhoto] = useState(null);

    // Image State
    const [imageSrc, setImageSrc] = useState(null);
    const [history, setHistory] = useState([]);
    const [imageBlob, setImageBlob] = useState(null); // added new


    // Tools
    const [activeTab, setActiveTab] = useState('adjust');

    // Adjustments
    const [adjustments, setAdjustments] = useState({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
    });

    // Crop & Rotate
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(undefined);
    const imgRef = useRef(null);

    // Doodle
    const [doodleColor, setDoodleColor] = useState('#000000');
    const [doodleSize, setDoodleSize] = useState(3);
    const [isDrawing, setIsDrawing] = useState(false);
    const [doodles, setDoodles] = useState([]);
    const canvasRef = useRef(null);

    // Text
    const [textBoxes, setTextBoxes] = useState([]);
    const [selectedTextBox, setSelectedTextBox] = useState(null);
    const [textColor, setTextColor] = useState('#000000');
    const [fontSize, setFontSize] = useState(24);

    // UI Message State
    const [notification, setNotification] = useState({ msg: null, isError: false });
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    useEffect(() => {
        client.get(`/gallery/photos/${id}/`)
            .then(res => {
                setPhoto(res.data);
                setTitle(res.data.title);
                setTags(res.data.tags || []);
                const freshUrl = res.data.image + "?cb=" + Date.now();
                setImageSrc(freshUrl);
                setHistory([freshUrl]);
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
            setImageSrc(cacheBust(newHistory[newHistory.length - 1]));
            setAdjustments({ brightness: 100, contrast: 100, saturation: 100, blur: 0 });
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
            setImageBlob(blob);
            addToHistory(newUrl);
            setAdjustments({ brightness: 100, contrast: 100, saturation: 100, blur: 0 });
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
            if (!completedCrop || !imgRef.current) {
                showNotification("Please select a crop area first", true);
                return;
            }

            // Get the actual image dimensions
            const image = imgRef.current;
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            // Convert percentage crop to pixel crop based on natural image size
            const pixelCrop = {
                x: completedCrop.x * scaleX,
                y: completedCrop.y * scaleY,
                width: completedCrop.width * scaleX,
                height: completedCrop.height * scaleY,
            };

            console.log('Crop info:', {
                completedCrop,
                pixelCrop,
                imageDisplaySize: { width: image.width, height: image.height },
                imageNaturalSize: { width: image.naturalWidth, height: image.naturalHeight },
                scale: { scaleX, scaleY }
            });

            const blob = await getCroppedImg(
                imageSrc,
                pixelCrop,
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

    // Doodle handlers
    const startDrawing = (e) => {
        if (activeTab !== 'doodle') return;
        setIsDrawing(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setDoodles(prev => [...prev, { points: [{ x, y }], color: doodleColor, size: doodleSize }]);
    };

    const draw = (e) => {
        if (!isDrawing || activeTab !== 'doodle') return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setDoodles(prev => {
            const newDoodles = [...prev];
            const lastDoodle = newDoodles[newDoodles.length - 1];
            lastDoodle.points.push({ x, y });
            return newDoodles;
        });
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const applyDoodle = async () => {
        if (doodles.length === 0) {
            showNotification("No doodles to apply", true);
            return;
        }
        try {
            const img = await createImage(imageSrc);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, 0, 0);

            // Get scale factors
            const scaleX = img.width / imgRef.current.width;
            const scaleY = img.height / imgRef.current.height;

            // Draw doodles
            doodles.forEach(doodle => {
                ctx.strokeStyle = doodle.color;
                ctx.lineWidth = doodle.size * scaleX;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                doodle.points.forEach((point, i) => {
                    const scaledX = point.x * scaleX;
                    const scaledY = point.y * scaleY;
                    if (i === 0) ctx.moveTo(scaledX, scaledY);
                    else ctx.lineTo(scaledX, scaledY);
                });
                ctx.stroke();
            });

            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            const newUrl = URL.createObjectURL(blob);
            setImageBlob(blob); //added new
            addToHistory(newUrl);
            setDoodles([]);
            setActiveTab('adjust');
        } catch (e) {
            console.error('Doodle apply error', e);
            showNotification("Failed to apply doodle", true);
        }
    };

    // Text handlers
    const addTextBox = () => {
        const newBox = {
            id: Date.now(),
            text: 'Double click to edit',
            x: 100,
            y: 100,
            color: textColor,
            size: fontSize
        };
        setTextBoxes(prev => [...prev, newBox]);
        setSelectedTextBox(newBox.id);
    };

    const updateTextBox = (id, updates) => {
        setTextBoxes(prev => prev.map(box => box.id === id ? { ...box, ...updates } : box));
    };

    const deleteTextBox = (id) => {
        setTextBoxes(prev => prev.filter(box => box.id !== id));
        if (selectedTextBox === id) setSelectedTextBox(null);
    };

    const applyText = async () => {
        if (textBoxes.length === 0) {
            showNotification("No text to apply", true);
            return;
        }
        try {
            const img = await createImage(imageSrc);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, 0, 0);

            // Get scale factors
            const scaleX = img.width / imgRef.current.width;
            const scaleY = img.height / imgRef.current.height;

            // Draw text
            textBoxes.forEach(box => {
                ctx.fillStyle = box.color;
                ctx.font = `${box.size * scaleX}px Arial`;
                ctx.fillText(box.text, box.x * scaleX, box.y * scaleY);
            });

            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            const newUrl = URL.createObjectURL(blob);
            addToHistory(newUrl);
            setTextBoxes([]);
            setSelectedTextBox(null);
            setActiveTab('adjust');
        } catch (e) {
            console.error('Text apply error', e);
            showNotification("Failed to apply text", true);
        }
    };

    // Helper function
    const createImage = (url) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;

        // Only set CORS for external URLs, NEVER for blob: URLs
        if (!url.startsWith("blob:")) {
            img.crossOrigin = "anonymous";
        }

        img.src = url;
    });

    const createTag = async (tagName) => {
        try {
            const res = await client.post('/gallery/tags/', { name: tagName });
            return res.data; // {id, name}
        } catch (err) {
            if (err.response?.status === 400) {
                // Tag already exists → fetch it
                const r = await client.get(`/gallery/tags/?search=${tagName}`);
                return r.data[0];
            }
            throw err;
        }
    };


    const handleSave = async (asCopy = false) => {
        if (!window.confirm(asCopy ? 'Save as a new copy?' : 'Overwrite original?')) return;
        setNotification({ msg: null, isError: false });

        try {
            //const response = await fetch(imageSrc);
            //const blob = await response.blob();
            //const file = new File([blob], "edited_image.jpg", { type: "image/jpeg" });

            if (!imageBlob) {
                showNotification("No edited image to save", true);
                return;
            }

            // Real MIME type from the generated blob
            let mimeType = imageBlob.type;

            // Extract correct extension
            let ext = 'jpg'; // fallback

            if (mimeType === 'image/png') ext = 'png';
            if (mimeType === 'image/webp') ext = 'webp';
            if (mimeType === 'image/jpeg') ext = 'jpg';

            // Build filename
            const filename = `edited_image.${ext}`;

            // Create File with correct type
            const file = new File([imageBlob], filename, { type: mimeType });



            const formData = new FormData();

            // Always attach image
            formData.append('image', file);

            // Always attach title
            formData.append('title', asCopy ? `${title} (Copy)` : title);

            // Always attach tags
            tags.forEach(t => formData.append('tag_ids', t.id));

            let targetUrl = `/gallery/photos/${id}/`;
            let method = 'patch';

            if (asCopy) {
                targetUrl = '/gallery/photos/';
                method = 'post';

                // Include optional fields only for new copies
                if (photo.album) {
                    formData.append('album', photo.album);
                }
                formData.append('description', photo.description || '');
            }


            // Explicitly set Content-Type to multipart/form-data to override client default
            // Axios will set the boundary automatically when it detects FormData, 
            // but we need to ensure the client default 'application/json' doesn't override it incorrectly.
            // Passing 'multipart/form-data' explicitly is the safest bet here given the user's previous error.
            const response = await client[method](targetUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            // backend sends updated photo record
            setPhoto(response.data);

            const freshUrl = cacheBust(response.data.image);
            setHistory([freshUrl]);
            setImageSrc(freshUrl);

            if (asCopy) {
                navigate(-1);
            } else {
                showNotification('Saved successfully!');
            }


        } catch (error) {
            console.error('Save failed', error);
            const msg = error.response ? `${error.response.status} ${JSON.stringify(error.response.data)}` : error.message;
            showNotification(`SAVE FAILED: ${msg}`, true);
        }
    };

    const handleSaveTitle = () => {
        client.patch(`/gallery/photos/${id}/`, {
            title,
            tag_ids: tags.map(t => t.id)
        })

            .then(res => {
                setPhoto(res.data);
                setEditingTitle(false);
            })
            .catch(err => showNotification('Failed to update title', true));
    };

    const handleDelete = () => {
        if (!window.confirm('Are you sure you want to delete this photo?')) return;
        client.delete(`/gallery/photos/${id}/`)
            .catch(err => showNotification('Failed to delete photo', true));
    };

    const downloadPhoto = async () => {
        try {
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = title || `photo-${id}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download photo:', err);
            showNotification('Failed to download photo', true);
        }
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
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Share"
                    >
                        <Share2 className="h-5 w-5" />
                    </button>
                    <button
                        onClick={downloadPhoto}
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded"
                        title="Download"
                    >
                        <Download className="h-5 w-5" />
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
                                /*crossOrigin="anonymous"*/
                                alt="Crop Me"
                                onLoad={onImageLoad}
                                style={{ transform: `rotate(${rotation}deg)`, maxHeight: '70vh', maxWidth: '100%' }}
                            />
                        </ReactCrop>
                    </div>
                ) : (
                    <div className="relative max-w-full max-h-full flex items-center justify-center h-full">
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            /*crossOrigin="anonymous"*/
                            alt="Editing"
                            className="max-w-full max-h-full object-contain shadow-lg"
                            style={{
                                filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${adjustments.blur}px)`
                            }}
                        />

                        {/* Doodle Canvas Overlay */}
                        {activeTab === 'doodle' && (
                            <svg
                                className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                                style={{ pointerEvents: 'all' }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                            >
                                {doodles.map((doodle, i) => (
                                    <polyline
                                        key={i}
                                        points={doodle.points.map(p => `${p.x},${p.y}`).join(' ')}
                                        stroke={doodle.color}
                                        strokeWidth={doodle.size}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                ))}
                            </svg>
                        )}

                        {/* Text Boxes */}
                        {activeTab === 'text' && textBoxes.map(box => (
                            <div
                                key={box.id}
                                className={`absolute cursor-move ${selectedTextBox === box.id ? 'ring-2 ring-indigo-600' : ''}`}
                                style={{
                                    left: box.x,
                                    top: box.y,
                                    color: box.color,
                                    fontSize: `${box.size}px`,
                                    fontFamily: 'Arial',
                                    whiteSpace: 'nowrap'
                                }}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.effectAllowed = 'move';
                                    e.dataTransfer.setData('text/plain', box.id);
                                }}
                                onDragEnd={(e) => {
                                    const rect = e.currentTarget.parentElement.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;
                                    updateTextBox(box.id, { x, y });
                                }}
                                onClick={() => setSelectedTextBox(box.id)}
                                onDoubleClick={() => {
                                    const newText = prompt('Edit text:', box.text);
                                    if (newText !== null) updateTextBox(box.id, { text: newText });
                                }}
                            >
                                {box.text}
                                {selectedTextBox === box.id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteTextBox(box.id);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Controls Toolbar */}
            <div className="bg-white border-t p-4 z-20">
                {/* Tag Editor */}
                <div className="mb-4">
                    <label className="text-xs text-gray-500 mb-1 block">Tags</label>

                    {/* Existing tags */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map(tag => (
                            <span
                                key={tag.id}
                                className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center"
                            >
                                #{tag.name}
                                <button
                                    className="ml-1 text-red-600 text-xs"
                                    onClick={() => setTags(tags.filter(t => t.id !== tag.id))}
                                >
                                    ✕
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* Add tag input */}
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newTag}
                            onChange={e => setNewTag(e.target.value)}
                            placeholder="Add tag (e.g., beach)"
                            className="border p-2 rounded w-full text-sm"
                        />
                        <button
                            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                            onClick={async () => {
                                if (!newTag.trim()) return;
                                const created = await createTag(newTag.trim().replace('#', ''));
                                setTags([...tags, created]);
                                setNewTag('');
                            }}
                        >
                            Add
                        </button>
                    </div>
                </div>

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
                    <button
                        onClick={() => setActiveTab('doodle')}
                        className={`flex flex-col items-center space-y-1 ${activeTab === 'doodle' ? 'text-indigo-600' : 'text-gray-500'}`}
                    >
                        <Pen className="h-6 w-6" />
                        <span className="text-xs">Doodle</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('text')}
                        className={`flex flex-col items-center space-y-1 ${activeTab === 'text' ? 'text-indigo-600' : 'text-gray-500'}`}
                    >
                        <Type className="h-6 w-6" />
                        <span className="text-xs">Text</span>
                    </button>
                </div>

                {/* Contextual Controls */}
                <div className="h-24">
                    {activeTab === 'adjust' && (
                        <div className="space-y-3 max-w-6xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 flex justify-between">Blur <span>{adjustments.blur}px</span></label>
                                    <input
                                        type="range" min="0" max="20"
                                        value={adjustments.blur}
                                        onChange={(e) => handleAdjustmentChange('blur', e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-center mt-2">
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

                    {activeTab === 'doodle' && (
                        <div className="flex flex-col items-center space-y-3">
                            <div className="flex items-center space-x-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Brush Size: {doodleSize}px</label>
                                    <input
                                        type="range" min="1" max="20"
                                        value={doodleSize}
                                        onChange={(e) => setDoodleSize(Number(e.target.value))}
                                        className="w-32 h-2 bg-gray-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Color</label>
                                    <div className="flex items-center space-x-2">
                                        {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setDoodleColor(color)}
                                                className={`w-6 h-6 rounded-full border-2 ${doodleColor === color ? 'border-indigo-600' : 'border-gray-300'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={doodleColor}
                                            onChange={(e) => setDoodleColor(e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={doodleColor}
                                            onChange={(e) => setDoodleColor(e.target.value)}
                                            placeholder="#000000"
                                            className="w-24 px-2 py-1 text-xs border rounded"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">Draw on the image above. Click "Apply" when done.</div>
                            <div className="flex space-x-2">
                                <button onClick={() => setDoodles([])} className="px-4 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                                    Clear
                                </button>
                                <button onClick={applyDoodle} className="px-4 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                                    Apply Doodle
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'text' && (
                        <div className="flex flex-col items-center space-y-3">
                            <div className="flex items-center space-x-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Font Size: {fontSize}px</label>
                                    <input
                                        type="range" min="12" max="72"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(Number(e.target.value))}
                                        className="w-32 h-2 bg-gray-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Color</label>
                                    <input
                                        type="color"
                                        value={textColor}
                                        onChange={(e) => setTextColor(e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">Click "Add Text" to add a text box. Double-click to edit. Drag to move.</div>
                            <div className="flex space-x-2">
                                <button onClick={addTextBox} className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200">
                                    Add Text Box
                                </button>
                                {textBoxes.length > 0 && (
                                    <button onClick={applyText} className="px-4 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                                        Apply Text
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                type="photo"
                id={photo.id}
                title={photo.title}
            />
        </div>
    );
}


