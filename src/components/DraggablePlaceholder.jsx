import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { PenTool } from 'lucide-react';

const DraggablePlaceholder = ({ onPositionChange, initialPosition = { x: 0, y: 0 }, containerDimensions }) => {
    const nodeRef = useRef(null);

    // Calculate bounds if dimensions are known
    const bounds = containerDimensions ? {
        left: 0,
        top: 0,
        right: containerDimensions.width - 120, // 120 is width of box
        bottom: containerDimensions.height - 50 // 50 is height of box
    } : "parent"; // Fallback

    return (
        <Draggable
            nodeRef={nodeRef}
            defaultPosition={initialPosition}
            bounds={bounds}
            onStop={(e, data) => {
                onPositionChange({ x: data.x, y: data.y });
            }}
        >
            <div
                ref={nodeRef}
                className="absolute cursor-move group flex items-center justify-center bg-yellow-300 border-2 border-yellow-500 shadow-sm opacity-90 hover:opacity-100 transition-opacity pointer-events-auto"
                style={{
                    width: 120,
                    height: 50,
                    zIndex: 50
                }}
            >
                <div className="flex items-center gap-2 text-yellow-900 font-semibold select-none pointer-events-none">
                    <PenTool size={16} />
                    <span>Sign Here</span>
                </div>
            </div>
        </Draggable>
    );
};

export default DraggablePlaceholder;
