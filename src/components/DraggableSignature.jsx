import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { X } from 'lucide-react';

const DraggableSignature = ({ imageSrc, onPositionChange, onDelete, initialPosition = { x: 0, y: 0 }, containerDimensions }) => {
    // We use local state for immediate feedback, but the parent should ideally hold the truth
    // react-draggable manages its own position visually if we don't control it fully, 
    // but to extract final coordinates we need the onStop callback.
    const nodeRef = React.useRef(null);
    const [visualSize, setVisualSize] = useState({ width: 0, height: 0 });

    const handleImageLoad = (e) => {
        setVisualSize({
            width: e.target.offsetWidth,
            height: e.target.offsetHeight
        });
    };

    // Calculate bounds if dimensions are known. 
    // Note: Use a default estimation for signature size if not loaded yet, or strictly rely on image load?
    // For now, let's use a loose bound or fallback to parent if size unknown.
    // 128 is approx width of signature img (h-16 = 64px, usually aspect ratio 2:1 -> 128px)
    // To be safe, we can use "parent" if visualSize is 0, or just use a safe margin.
    const bounds = containerDimensions ? {
        left: 0,
        top: 0,
        right: containerDimensions.width - (visualSize.width || 64),
        bottom: containerDimensions.height - (visualSize.height || 64)
    } : "parent";

    return (
        <Draggable
            nodeRef={nodeRef}
            defaultPosition={initialPosition}
            bounds={bounds}
            onStop={(e, data) => {
                onPositionChange({ x: data.x, y: data.y });
            }}
        >
            <div ref={nodeRef} className="absolute cursor-move group inline-block hover:outline hover:outline-2 hover:outline-blue-400 hover:outline-dashed pointer-events-auto" style={{ zIndex: 50 }}>
                <img
                    src={imageSrc}
                    alt="Signature"
                    className="h-16 pointer-events-none select-none" // Adjust height as needed
                    onLoad={handleImageLoad}
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent drag start
                        onDelete();
                    }}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove signature"
                    // Add touch/mouse down listeners to prevent drag
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    <X size={12} />
                </button>
            </div>
        </Draggable>
    );
};

export default DraggableSignature;
