import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { PenTool, Type, Calendar, User, Mail, Briefcase, CheckSquare, Stamp } from 'lucide-react';

const DraggablePlaceholder = ({
    type = 'signature',
    label,
    onPositionChange,
    initialPosition = { x: 0, y: 0 },
    containerDimensions
}) => {
    const nodeRef = useRef(null);

    // Calculate bounds
    const boxWidth = type === 'checkbox' ? 40 : 120;
    const boxHeight = type === 'checkbox' ? 40 : 50;

    const bounds = containerDimensions ? {
        left: 0,
        top: 0,
        right: containerDimensions.width - boxWidth,
        bottom: containerDimensions.height - boxHeight
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
                className={`absolute cursor-move group flex items-center justify-center ${styles.bg} border-2 ${styles.border} ${styles.borderStyle || 'border-solid'} shadow-sm opacity-90 hover:opacity-100 transition-opacity pointer-events-auto`}
                style={{
                    width: boxWidth,
                    height: boxHeight,
                    zIndex: 50,
                    borderRadius: type === 'checkbox' ? '4px' : '4px'
                }}
            >
                <div className={`flex items-center gap-2 ${styles.text} font-semibold select-none pointer-events-none text-xs`}>
                    {type !== 'checkbox' && <Icon size={14} />}
                    {type !== 'checkbox' && <span className="truncate max-w-[80px]">{label || type}</span>}
                    {type === 'checkbox' && <Icon size={20} />}
                </div>
            </div>
        </Draggable>
    );
};

export default DraggablePlaceholder;

