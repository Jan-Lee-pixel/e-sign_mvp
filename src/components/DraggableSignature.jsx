import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { X, Pencil } from 'lucide-react';

const DraggableSignature = ({ imageSrc, onPositionChange, onDelete, onEdit, initialPosition = { x: 0, y: 0 }, containerDimensions }) => {
    // ... existing hook code ...
    const nodeRef = React.useRef(null);
    const [visualSize, setVisualSize] = useState({ width: 0, height: 0 });

    const handleImageLoad = (e) => {
        setVisualSize({
            width: e.target.offsetWidth,
            height: e.target.offsetHeight
        });
    };

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
            <div ref={nodeRef} className="absolute cursor-move group inline-block hover:outline hover:outline-2 hover:outline-primary hover:outline-dashed pointer-events-auto" style={{ zIndex: 50 }}>
                <img
                    src={imageSrc}
                    alt="Signature"
                    className="h-16 pointer-events-none select-none"
                    onLoad={handleImageLoad}
                />
                <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onEdit) onEdit();
                        }}
                        className="bg-primary text-primary-foreground rounded-full p-1 shadow-sm hover:bg-primary/90"
                        title="Edit signature"
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
                        className="bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90"
                        title="Remove signature"
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
