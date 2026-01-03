
import React, { useState, useRef, useEffect } from 'react';
import { GuideAnnotation, AnnotationType } from '../../types/guides';
import { MousePointer2, Circle, ArrowUp, X, Type, Image as ImageIcon, Droplet } from 'lucide-react';

interface ImageAnnotatorProps {
    imageUrl: string;
    annotations?: GuideAnnotation[];
    onChange: (annotations: GuideAnnotation[]) => void;
    onImageUpload?: (file: File) => void;
    onImageUrlChange?: (url: string) => void;
}

const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ffffff', '#000000'];

export const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({ imageUrl, annotations = [], onChange, onImageUpload }) => {

    // Tools: 'select' allows moving objects. Others allow creating.
    const [selectedTool, setSelectedTool] = useState<AnnotationType | 'text' | 'select'>('select');

    // Styling State (Applying to New or Selected)
    const [selectedColor, setSelectedColor] = useState('#ef4444');
    const [selectedSize, setSelectedSize] = useState(1);

    // Selection State
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Interaction State
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragActive, setDragActive] = useState(false); // For file drop

    type DragMode = 'move' | 'resize' | 'create';
    const [interaction, setInteraction] = useState<{
        mode: DragMode;
        startX: number; // ClientX
        startY: number; // ClientY
        initialX: number; // For move: initial position %
        initialY: number; // For move: initial position %
        initialSize: number; // For resize
        initialWidth?: number; // For blur rect resize
        initialHeight?: number; // For blur rect resize
        handle?: 'nw' | 'ne' | 'sw' | 'se'; // For resize
    } | null>(null);


    // Update local style state when selection changes
    useEffect(() => {
        if (selectedId !== null && annotations[selectedId]) {
            const anno = annotations[selectedId];
            if (anno.color) setSelectedColor(anno.color);
            if (anno.size) setSelectedSize(anno.size);
        }
    }, [selectedId, annotations]);

    // Helpers
    const getCoords = (clientX: number, clientY: number) => {
        if (!imageRef.current) return { x: 0, y: 0 };
        const rect = imageRef.current.getBoundingClientRect();
        // Constrain to image bounds
        const rawX = clientX - rect.left;
        const rawY = clientY - rect.top;

        return {
            x: (rawX / rect.width) * 100,
            y: (rawY / rect.height) * 100,
            rect
        };
    };

    const updateAnnotation = (index: number, updates: Partial<GuideAnnotation>) => {
        const newAnnos = [...annotations];
        newAnnos[index] = { ...newAnnos[index], ...updates };
        onChange(newAnnos);
    };

    // --- MOUSE HANDLERS ---

    const handleMouseDownCanvas = (e: React.MouseEvent) => {
        if (!imageUrl || !imageRef.current) return;

        // If clicking blank space in 'select' mode, deselect
        if (selectedTool === 'select') {
            // Only deselect if we didn't click an annotation (handled by stopPropagation on annotation)
            setSelectedId(null);
            return;
        }

        // CREATE MODE
        const { x, y } = getCoords(e.clientX, e.clientY);

        if (selectedTool === 'text') {
            const text = prompt("Enter text label:");
            if (text) {
                const newAnno: GuideAnnotation = {
                    type: 'circle', // Using circle type as base for text in schema if needed, or mapped
                    x, y,
                    label: text,
                    color: selectedColor,
                    size: selectedSize
                };
                onChange([...annotations, newAnno]);
                setSelectedId(annotations.length);
                setSelectedTool('select');
            }
        } else if (selectedTool === 'blur') {
            // Start creating blur rect
            const newAnno: GuideAnnotation = {
                type: 'blur',
                x, y,
                width: 1, // Start small
                height: 1,
                color: 'transparent',
            };
            const newIndex = annotations.length;
            onChange([...annotations, newAnno]);
            setSelectedId(newIndex);

            // Immediately start resizing this new blur rect
            setInteraction({
                mode: 'resize',
                startX: e.clientX,
                startY: e.clientY,
                initialX: x,
                initialY: y,
                initialSize: 1,
                initialWidth: 0,
                initialHeight: 0,
                handle: 'se' // Simulate dragging bottom-right to expand
            });

        } else {
            // Create Shape (Click to place)
            const newAnno: GuideAnnotation = {
                type: selectedTool as AnnotationType,
                x, y,
                color: selectedColor,
                size: selectedSize,
                direction: selectedTool === 'arrow' ? 'up' : undefined
            };
            onChange([...annotations, newAnno]);
            setSelectedId(annotations.length);
            setSelectedTool('select');
        }
    };

    const handleMouseDownAnnotation = (e: React.MouseEvent, index: number) => {
        if (selectedTool !== 'select') return;
        e.stopPropagation(); // Stop canvas click
        setSelectedId(index);

        const anno = annotations[index];

        setInteraction({
            mode: 'move',
            startX: e.clientX,
            startY: e.clientY,
            initialX: anno.x,
            initialY: anno.y,
            initialSize: anno.size || 1,
            initialWidth: anno.width || 10,
            initialHeight: anno.height || 10
        });
    };

    const handleMouseDownHandle = (e: React.MouseEvent, handle: 'nw' | 'ne' | 'sw' | 'se') => {
        if (selectedId === null) return;
        e.stopPropagation();
        const anno = annotations[selectedId];

        setInteraction({
            mode: 'resize',
            startX: e.clientX,
            startY: e.clientY,
            initialX: anno.x,
            initialY: anno.y,
            initialSize: anno.size || 1,
            initialWidth: anno.width || 10,
            initialHeight: anno.height || 10,
            handle
        });
    };

    // Global Mouse Move / Up
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!interaction || selectedId === null || !imageRef.current) return;

            const rect = imageRef.current.getBoundingClientRect();
            const deltaXPixels = e.clientX - interaction.startX;
            const deltaYPixels = e.clientY - interaction.startY;

            // Convert pixel delta to percentage delta
            const deltaXPercent = (deltaXPixels / rect.width) * 100;
            const deltaYPercent = (deltaYPixels / rect.height) * 100;

            if (interaction.mode === 'move') {
                updateAnnotation(selectedId, {
                    x: Math.max(0, Math.min(100, interaction.initialX + deltaXPercent)),
                    y: Math.max(0, Math.min(100, interaction.initialY + deltaYPercent))
                });
            } else if (interaction.mode === 'resize') {
                const anno = annotations[selectedId];

                // Check type to determine resize behavior
                if (anno.type === 'blur') {
                    // For blur, we resize width/height directly based on percent delta
                    // Using handle logic for sophisticated resizing
                    const newWidth = Math.max(2, (interaction.initialWidth || 0) + deltaXPercent);
                    const newHeight = Math.max(2, (interaction.initialHeight || 0) + deltaYPercent);

                    updateAnnotation(selectedId, { width: newWidth, height: newHeight });

                } else {
                    // Standard Size Scaling for Shapes/Text
                    const dragFactor = deltaXPixels / 100;
                    let scaleDelta = 0;

                    // Adjust direction based on handle
                    if (interaction.handle === 'se' || interaction.handle === 'ne') {
                        scaleDelta = dragFactor;
                    } else {
                        scaleDelta = -dragFactor;
                    }

                    const newSize = Math.max(0.5, Math.min(5, interaction.initialSize + scaleDelta));
                    updateAnnotation(selectedId, { size: newSize });
                }
            }
        };

        const handleMouseUp = () => {
            setInteraction(null);
        };

        if (interaction) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [interaction, selectedId, annotations]);


    // --- RENDER HELPERS ---

    const renderAnnotation = (anno: GuideAnnotation, idx: number) => {
        const isSelected = selectedId === idx;
        const size = anno.size || 1;

        // Base Unit size (e.g., 3rem for size 1)
        const baseSizeRem = 3 * size;

        return (
            <div
                key={idx}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 group/anno pointer-events-auto ${selectedTool === 'select' ? 'cursor-move' : ''}`}
                style={{ left: `${anno.x}%`, top: `${anno.y}%`, zIndex: isSelected ? 20 : 10 }}
                onMouseDown={(e) => handleMouseDownAnnotation(e, idx)}
            >
                {anno.label ? (
                    <div
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all select-none whitespace-nowrap
                        ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-600' : 'bg-slate-900/80 border border-white/10 hover:bg-slate-800'}`}
                        style={{ transform: `scale(${size})`, color: 'white' }}
                    >
                        {anno.label}
                    </div>
                ) : anno.type === 'blur' ? (
                    <div
                        className={`absolute border border-indigo-500/30 shadow-sm backdrop-blur-[8px] rounded-md ${isSelected ? 'ring-1 ring-indigo-400' : ''}`}
                        style={{
                            width: `${anno.width || 15}%`,
                            height: `${anno.height || 10}%`,
                            // Center point logic: For blur, x/y is top-left usually, but our system uses center. 
                            // Let's keep using center-based positioning for consistency.
                            // Container handles translation.
                            left: '50%', top: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                    />
                ) : (
                    <div className="relative">
                        {anno.type === 'circle' ? (
                            <div
                                className="rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                                style={{
                                    width: `${baseSizeRem}rem`,
                                    height: `${baseSizeRem}rem`,
                                    border: `4px solid ${anno.color || '#ef4444'}`,
                                    boxShadow: `0 0 0 ${isSelected ? '2px' : '0px'} white, 0 0 20px ${anno.color}40`
                                }}
                            />
                        ) : (
                            <ArrowUp
                                className="drop-shadow-lg"
                                style={{
                                    width: `${baseSizeRem}rem`,
                                    height: `${baseSizeRem}rem`,
                                    color: anno.color || '#ef4444',
                                    strokeWidth: 3,
                                    transform: `rotate(${anno.direction === 'down' ? 180 : anno.direction === 'left' ? -90 : anno.direction === 'right' ? 90 : 0}deg)`
                                }}
                            />
                        )}
                    </div>
                )}

                {/* SELECTION BOX OVERLAY */}
                {isSelected && (
                    <div className={`absolute -m-4 border border-blue-500 pointer-events-none rounded-lg z-50
                        ${anno.type === 'blur' ? 'inset-0 m-0 border-dashed border-2' : 'inset-0'}`}
                        style={{
                            transform: anno.type === 'blur'
                                ? `translate(-50%, -50%)` // Align with the blur center logic
                                : `scale(${anno.label ? size : 1})`,
                            width: anno.type === 'blur' ? `${anno.width}%` : undefined,
                            height: anno.type === 'blur' ? `${anno.height}%` : undefined,
                            left: anno.type === 'blur' ? '50%' : undefined,
                            top: anno.type === 'blur' ? '50%' : undefined
                        }}
                    >
                        {/* Handles */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-blue-500 rounded-full pointer-events-auto cursor-nw-resize shadow-sm"
                            onMouseDown={(e) => handleMouseDownHandle(e, 'nw')} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-blue-500 rounded-full pointer-events-auto cursor-ne-resize shadow-sm"
                            onMouseDown={(e) => handleMouseDownHandle(e, 'ne')} />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-blue-500 rounded-full pointer-events-auto cursor-sw-resize shadow-sm"
                            onMouseDown={(e) => handleMouseDownHandle(e, 'sw')} />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-blue-500 rounded-full pointer-events-auto cursor-se-resize shadow-sm"
                            onMouseDown={(e) => handleMouseDownHandle(e, 'se')} />
                    </div>
                )}
            </div>
        );
    };

    // --- MAIN RENDER ---

    return (
        <div className="space-y-3 select-none h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-4 items-center bg-slate-800 p-2 rounded-lg border border-white/10 shadow-sm shrink-0 z-20">

                {/* Tools Group */}
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setSelectedTool('select')}
                        className={`p-2 rounded-md transition-all ${selectedTool === 'select' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Select & Move (V)"
                    >
                        <MousePointer2 size={18} />
                    </button>
                    <div className="h-4 w-px bg-white/10 mx-1" />

                    <button
                        onClick={() => setSelectedTool('circle')}
                        className={`p-2 rounded-md transition-all ${selectedTool === 'circle' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Circle (C)"
                    >
                        <Circle size={18} />
                    </button>
                    <button
                        onClick={() => setSelectedTool('arrow')}
                        className={`p-2 rounded-md transition-all ${selectedTool === 'arrow' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Arrow (A)"
                    >
                        <ArrowUp size={18} />
                    </button>
                    <button
                        onClick={() => setSelectedTool('text')}
                        className={`p-2 rounded-md transition-all ${selectedTool === 'text' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Text Label (T)"
                    >
                        <Type size={18} />
                    </button>
                    <button
                        onClick={() => setSelectedTool('blur')}
                        className={`p-2 rounded-md transition-all ${selectedTool === 'blur' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
                        title="Blur Sensitive Info (B)"
                    >
                        <Droplet size={18} />
                    </button>
                </div>

                <div className="h-4 w-px bg-white/10" />

                {/* Styling Group */}
                <div className="flex gap-4 items-center">
                    <div className="flex gap-1 items-center">
                        <span className="text-[10px] uppercase text-gray-500 font-bold px-1">Color</span>
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => {
                                    setSelectedColor(c);
                                    if (selectedId !== null) updateAnnotation(selectedId, { color: c });
                                }}
                                className={`w-5 h-5 rounded-full border border-white/10 transition-transform hover:scale-110 ${selectedColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                {selectedId !== null && (
                    <button
                        onClick={() => {
                            const newAnnos = annotations.filter((_, i) => i !== selectedId);
                            onChange(newAnnos);
                            setSelectedId(null);
                        }}
                        className="p-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 ml-auto flex items-center gap-2 px-3 transition-colors"
                    >
                        <X size={14} />
                        <span className="text-xs font-medium">Delete</span>
                    </button>
                )}
            </div>

            {/* Canvas Area */}
            <div
                ref={containerRef}
                className={`flex-1 relative rounded-xl overflow-hidden border-2 border-dashed transition-all group min-h-[400px] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm
                    ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10'}
                    ${selectedTool !== 'select' ? 'cursor-crosshair' : ''}`}
                onMouseDown={handleMouseDownCanvas}
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files?.[0] && onImageUpload) onImageUpload(e.dataTransfer.files[0]);
                }}
                onDragOver={e => e.preventDefault()}
            >
                {imageUrl ? (
                    <div className="relative inline-block shadow-2xl">
                        <img
                            ref={imageRef}
                            src={imageUrl}
                            alt="Editing"
                            draggable={false}
                            className="max-w-full max-h-[70vh] object-contain select-none pointer-events-none"
                            style={{ pointerEvents: 'auto' }}
                        />

                        {/* Render Annotations Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                            {annotations.map((anno, idx) => renderAnnotation(anno, idx))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-12 pointer-events-none opacity-50">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIcon size={40} className="text-gray-500" />
                        </div>
                        <p className="text-gray-300 font-medium text-lg">Drag & Drop Image</p>
                    </div>
                )}
            </div>

            <input
                id="file-upload-hidden"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    if (e.target.files?.[0] && onImageUpload) onImageUpload(e.target.files[0]);
                }}
            />
        </div>
    );
};
