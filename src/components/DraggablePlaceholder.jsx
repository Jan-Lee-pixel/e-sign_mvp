import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { PenTool, Type, Calendar, User, Mail, Briefcase, CheckSquare, Stamp } from 'lucide-react';

const DraggablePlaceholder = ({
    type = 'signature',
    label,
    onPositionChange,
    onResize,
    initialPosition = { x: 0, y: 0 },
    initialSize,
    containerDimensions
}) => {
    const nodeRef = useRef(null);
    const [visualSize, setVisualSize] = React.useState(initialSize || { width: 0, height: 0 });
    const [isResizing, setIsResizing] = React.useState(false);

    // Default dimensions based on type
    const defaultWidth = type === 'checkbox' ? 40 : 120;
    const defaultHeight = type === 'checkbox' ? 40 : 50;

    React.useEffect(() => {
        if (!initialSize?.width) {
            setVisualSize({ width: defaultWidth, height: defaultHeight });
        }
    }, [type, initialSize]);

    const bounds = containerDimensions ? {
        left: 0,
        top: 0,
        right: containerDimensions.width - (visualSize.width || defaultWidth),
        bottom: containerDimensions.height - (visualSize.height || defaultHeight)
    } : "parent";

    const getFieldStyles = () => {
        switch (type) {
            case 'signature':
            case 'initial':
            case 'stamp':
                return {
                    bg: 'bg-yellow-300',
                    border: 'border-yellow-500',
                    text: 'text-yellow-900',
                    icon: type === 'stamp' ? Stamp : PenTool
                };
            case 'date':
                return {
                    bg: 'bg-gray-200',
                    border: 'border-gray-400',
                    text: 'text-gray-700',
                    icon: Calendar
                };
            case 'checkbox':
                return {
                    bg: 'bg-white',
                    border: 'border-gray-800',
                    text: 'text-gray-800',
                    icon: CheckSquare
                };
            case 'text':
                return {
                    bg: 'bg-white',
                    border: 'border-blue-400',
                    text: 'text-blue-600',
                    icon: Type,
                    borderStyle: 'border-dashed'
                };
            case 'name':
            case 'email':
            case 'company':
            case 'title':
            default:
                return {
                    bg: 'bg-blue-100',
                    border: 'border-blue-300',
                    text: 'text-blue-800',
                    icon: type === 'email' ? Mail : (type === 'company' || type === 'title') ? Briefcase : User
                };
        }
    };

    const styles = getFieldStyles();
    const Icon = styles.icon;

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

            let newWidth = Math.max(30, startWidth + dx);
            let newHeight = Math.max(30, startHeight + dy);

            if (type === 'checkbox') {
                // Checkboxes should probably stay square? Or maybe not. 
                // Let's keep them square for consistency.
                const maxDim = Math.max(newWidth, newHeight);
                newWidth = maxDim;
                newHeight = maxDim;
            }

            setVisualSize({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            if (nodeRef.current && onResize) {
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
                className={`absolute cursor-move group flex items-center justify-center ${styles.bg} border-2 ${styles.border} ${styles.borderStyle || 'border-solid'} shadow-sm opacity-90 hover:opacity-100 transition-opacity pointer-events-auto`}
                style={{
                    width: visualSize.width,
                    height: visualSize.height,
                    zIndex: 50,
                    borderRadius: type === 'checkbox' ? '4px' : '4px'
                }}
            >
                <div className={`flex items-center gap-2 ${styles.text} font-semibold select-none pointer-events-none text-xs`} style={{ transform: `scale(${Math.min(1, visualSize.height / 30)})` }}>
                    {type !== 'checkbox' && <Icon size={14} />}
                    {type !== 'checkbox' && <span className="truncate max-w-[80px]">{label || type}</span>}
                    {type === 'checkbox' && <Icon size={20} />}
                </div>

                {/* Resize Handle */}
                <div
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-[var(--template-primary)] rounded-full cursor-se-resize z-50 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    onMouseDown={handleResizeStart}
                />
            </div>
        </Draggable>
    );
};

export default DraggablePlaceholder;

