// src/components/modals/ClassroomToolkitModal.jsx (The "Flawless Animation & Props" Final Version)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../../icons/Icon';
import StudentPicker from '../classroom_tools/StudentPicker';
import GroupGenerator from '../classroom_tools/GroupGenerator';
import ClassroomTimer from '../classroom_tools/ClassroomTimer';

const ClassroomToolkitModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('picker');
    const [isMaximized, setIsMaximized] = useState(false);
    const nodeRef = useRef(null);

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 500, height: 550 });
    const [prevTransform, setPrevTransform] = useState({ x: 0, y: 0, width: 500, height: 550 });
    
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [rel, setRel] = useState(null);
    
    // --- 🚀 UPGRADE: State สำหรับจัดการ Animation ---
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const initialWidth = 500;
        const initialHeight = 550;
        const initialX = window.innerWidth - initialWidth - 30;
        const initialY = window.innerHeight - initialHeight - 30;
        setPosition({ x: initialX, y: initialY });
        setSize({ width: initialWidth, height: initialHeight });
        setPrevTransform({ x: initialX, y: initialY, width: initialWidth, height: initialHeight });
    }, []);

    const onMouseDownDrag = (e) => {
        if (e.target.closest('button') || isMaximized) return;
        if (e.button !== 0) return;
        const node = nodeRef.current;
        const pos = node.getBoundingClientRect();
        setIsDragging(true);
        setRel({ x: e.pageX - pos.left, y: e.pageY - pos.top });
        e.stopPropagation();
        e.preventDefault();
    };

    const onMouseDownResize = (e) => {
        if (e.button !== 0 || isMaximized) return;
        setIsResizing(true);
        e.stopPropagation();
        e.preventDefault();
    };

    const onMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    const onMouseMove = useCallback((e) => {
        if (isDragging) {
            setPosition({ x: e.pageX - rel.x, y: e.pageY - rel.y });
        }
        if (isResizing) {
            setSize(currentSize => ({
                width: Math.max(420, currentSize.width + e.movementX),
                height: Math.max(350, currentSize.height + e.movementY),
            }));
        }
    }, [isDragging, isResizing, rel]);

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp, { once: true });
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, isResizing, onMouseMove]);

    const handleToggleMaximize = () => {
        setIsAnimating(true); // --- 🚀 UPGRADE: เริ่ม Animation ---
        if (isMaximized) {
            setSize({ width: prevTransform.width, height: prevTransform.height });
            setPosition({ x: prevTransform.x, y: prevTransform.y });
        } else {
            setPrevTransform({ ...position, ...size });
            const padding = 40;
            setSize({ width: window.innerWidth - padding, height: window.innerHeight - padding });
            setPosition({ x: padding / 2, y: padding / 2 });
        }
        setIsMaximized(!isMaximized);
        setTimeout(() => setIsAnimating(false), 300); // --- 🚀 UPGRADE: สิ้นสุด Animation ---
    };

    const tabs = [
        { id: 'picker', label: 'สุ่มชื่อ', icon: 'Shuffle' },
        { id: 'grouper', label: 'จัดกลุ่ม', icon: 'UsersRound' },
        { id: 'timer', label: 'จับเวลา', icon: 'Timer' },
    ];
    
    // --- 🚀 UPGRADE: ส่ง Props ที่จำเป็นลงไปให้ Component ลูก ---
    const renderActiveTab = () => {
        const props = { size, isMaximized };
        switch (activeTab) {
            case 'picker': return <StudentPicker {...props} />;
            case 'grouper': return <GroupGenerator {...props} />;
            case 'timer': return <ClassroomTimer {...props} />;
            default: return null;
        }
    };

    return (
        <div
            ref={nodeRef}
            style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
            className={`fixed bg-gray-800/80 backdrop-blur-xl border border-amber-500/50 rounded-2xl shadow-2xl z-[100] flex flex-col ${isAnimating ? 'transition-[width,height,top,left] duration-300 ease-in-out' : ''}`}
        >
            <header onMouseDown={onMouseDownDrag} className={`flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0 ${isMaximized ? 'cursor-default' : 'cursor-move'}`}>
                <div className="flex items-center gap-2">
                    <Icon name="BrainCircuit" className="text-amber-300" size={20} />
                    <h2 className="text-lg font-bold text-white">Toolkit</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleToggleMaximize} className="text-gray-400 hover:text-white cursor-pointer p-1"><Icon name={isMaximized ? 'Shrink' : 'Expand'} size={18} /></button>
                    <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer p-1"><Icon name="X" size={20} /></button>
                </div>
            </header>
            
            <div className="p-2 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-lg">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-1 text-xs font-bold rounded-md transition-colors ${activeTab === tab.id ? 'bg-amber-500 text-white' : 'text-gray-300 hover:bg-white/10'}`}>
                            <Icon name={tab.icon} size={14}/>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow p-4 overflow-auto">
                {renderActiveTab()}
            </div>

            {!isMaximized && (
                <div onMouseDown={onMouseDownResize} className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 text-gray-600">
                   <Icon name="ChevronsDown" size={12} style={{transform: 'rotate(-45deg)'}}/>
                </div>
            )}
        </div>
    );
};

export default ClassroomToolkitModal;