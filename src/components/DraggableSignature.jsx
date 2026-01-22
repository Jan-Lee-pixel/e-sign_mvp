import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { X } from 'lucide-react';

const DraggableSignature = ({ imageSrc, onPositionChange, onDelete, initialPosition = { x: 0, y: 0 } }) => {
    // We use local state for immediate feedback, but the parent should ideally hold the truth
    // react-draggable manages its own position visually if we don't control it fully, 
    // but to extract final coordinates we need the onStop callback.

    return (
        <Draggable
            defaultPosition={initialPosition}
            bounds="parent"
            onStop={(e, data) => {
                onPositionChange({ x: data.x, y: data.y });
            }}
        >
            <div className="absolute cursor-move group inline-block hover:outline hover:outline-2 hover:outline-blue-400 hover:outline-dashed pointer-events-auto">
                <img
                    src={imageSrc}
                    alt="Signature"
                    className="h-16 pointer-events-none select-none" // Adjust height as needed
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
