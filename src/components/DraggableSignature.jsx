import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { X, Pencil } from 'lucide-react';

const DraggableSignature = ({ imageSrc, text, type = 'signature', onPositionChange, onDelete, onEdit, onResize, initialPosition = { x: 0, y: 0 }, initialSize, containerDimensions }) => {
    // ... existing hook code ...
    const nodeRef = React.useRef(null);
    const [visualSize, setVisualSize] = useState(initialSize || { width: 0, height: 0 });
    const [isResizing, setIsResizing] = useState(false);

    // Use layout effect to measure text/checkbox dimensions after render if no initial size
    React.useLayoutEffect(() => {
        if (nodeRef.current && !initialSize?.width) {
            setVisualSize({
                width: nodeRef.current.offsetWidth,
                height: nodeRef.current.offsetHeight
            });
        }
    }, [imageSrc, text, type, initialSize]);

    const handleImageLoad = (e) => {
        if (!initialSize?.width) {
            setVisualSize({
                width: e.target.offsetWidth,
                height: e.target.offsetHeight
            });
        }
    };

    const bounds = containerDimensions ? {
        left: 0,
        top: 0,
        right: containerDimensions.width - (visualSize.width || 64),
        bottom: containerDimensions.height - (visualSize.height || 64)
    } : "parent";

    const getBorderColor = () => {
        switch (type) {
            case 'date': return 'hover:outline-blue-400';
            case 'text': return 'hover:outline-purple-400';
            case 'checkbox': return 'hover:outline-gray-400';
            default: return 'hover:outline-[var(--template-primary)]';
        }
    };

    // Resizing logic
    const handleResizeStart = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = visualSize.width;
        const startHeight = visualSize.height;

        const handleMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            // Maintain aspect ratio for images
            let newWidth = Math.max(30, startWidth + dx);
            let newHeight = Math.max(30, startHeight + dy);

            if (type === 'signature' || type === 'initial' || type === 'stamp' || type === 'image') {
                const ratio = startWidth / startHeight;
                // Use larger delta to determine size
                if (Math.abs(dx) > Math.abs(dy)) {
                    newHeight = newWidth / ratio;
                } else {
                    newWidth = newHeight * ratio;
                }
            }

            setVisualSize({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            if (onResize) {
                // We need to pass the final size
                // We can't access updated state here immediately, so we rely on the last calculated values
                // Actually, let's just trigger onResize in the mouse move or after. 
                // Better: Pass the REF values? 
                // Simpler: Just rely on the state update which will trigger a re-render, 
                // but we need to notify parent to save.
                // Let's pass the latest values from the event handler scope?
                // Wait, easiest is to just compute it one last time or assume the state will update.
                // But state update is async.
                // Let's just pass reasonable values. 
            }
            // Actually, let's just make onResize take {width, height} 
            // and call it on mouse up with the node's current dimensions?
            if (nodeRef.current) {
                onResize({
                    width: nodeRef.current.offsetWidth,
                    height: nodeRef.current.offsetHeight
                });
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            defaultPosition={initialPosition}
            bounds={bounds}
            disabled={isResizing}
            onStop={(e, data) => {
                onPositionChange({ x: data.x, y: data.y });
            }}
        >
            <div
                ref={nodeRef}
                className={`absolute cursor-move group inline-block hover:outline hover:outline-2 hover:outline-dashed pointer-events-auto ${getBorderColor()}`}
                style={{
                    zIndex: 50,
                    width: visualSize.width ? visualSize.width : 'auto',
                    height: visualSize.height ? visualSize.height : 'auto'
                }}
            >
                {/* Content Rendering */}
                {type === 'image' || type === 'signature' || type === 'initial' || type === 'stamp' ? (
                    <div style={{ width: '100%', height: '100%' }}>
                        <img
                            src={imageSrc}
                            alt="Signature"
                            className="w-full h-full object-contain pointer-events-none select-none"
                            onLoad={handleImageLoad}
                        />
                    </div>
                ) : type === 'checkbox' ? (
                    <div className="w-full h-full border-2 border-black flex items-center justify-center bg-white/50 backdrop-blur-sm">
                        {text === 'X' && <span className="text-xl font-bold leading-none pointer-events-none select-none">✕</span>}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center px-2 bg-white/50 backdrop-blur-sm border border-dashed border-transparent hover:border-gray-300 font-['Courier_Prime'] text-black whitespace-nowrap pointer-events-none select-none overflow-hidden" style={{ fontSize: `${Math.max(10, visualSize.height * 0.5)}px` }}>
                        {text || type}
                    </div>
                )}

                {/* Resize Handle */}
                <div
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-se-resize z-50 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    onMouseDown={handleResizeStart}
                />

                <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onEdit) onEdit();
                        }}
                        className="bg-white border border-gray-200 text-gray-700 rounded-full p-1 shadow-sm hover:bg-gray-50"
                        title="Edit"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <Pencil size={12} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                        title="Remove"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>
        </Draggable>
    );
};

export default DraggableSignature;
