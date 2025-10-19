// src/components/classroom_tools/ClassroomTimer.jsx (The "Scalable Timer" Version)
import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../icons/Icon';

const ClassroomTimer = ({ isMaximized }) => { // รับ prop 'isMaximized'
    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);
    const [duration, setDuration] = useState(300);
    const [timeLeft, setTimeLeft] = useState(300);
    const [isActive, setIsActive] = useState(false);
    
    const intervalRef = useRef(null);
    const alarmAudioRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'));

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            if(alarmAudioRef.current) {
                alarmAudioRef.current.play().catch(e => console.error("Audio play failed:", e));
            }
            setIsActive(false);
        }
        
        return () => clearInterval(intervalRef.current);
    }, [isActive, timeLeft]);

    const handleStartPause = () => {
        if (timeLeft > 0) {
            setIsActive(!isActive);
        }
    };
    
    const handleReset = () => {
        clearInterval(intervalRef.current);
        setIsActive(false);
        const newDuration = (minutes * 60) + seconds;
        setDuration(newDuration);
        setTimeLeft(newDuration);
    };

    const handleMinuteChange = (e) => {
        const val = parseInt(e.target.value, 10);
        setMinutes(isNaN(val) ? 0 : val);
    };

    const handleSecondChange = (e) => {
        const val = parseInt(e.target.value, 10);
        setSeconds(isNaN(val) ? 0 : val);
    };
    
    const handleSetTime = () => {
        handleReset();
    }

    const formatTime = (time) => {
        const mins = Math.floor(time / 60);
        const secs = time % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const radius = 90;
    const strokeWidth = 16;
    const circumference = 2 * Math.PI * radius;
    const progress = duration > 0 ? (timeLeft / duration) : 0;
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <div className="flex flex-col items-center justify-around h-full text-white">
            <div className={`relative flex items-center justify-center transition-transform duration-300 ${isMaximized ? 'scale-125' : 'scale-100'}`}>
                <svg className="w-72 h-72" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r={radius} stroke="#374151" strokeWidth={strokeWidth} fill="transparent" />
                    <circle 
                        cx="100" cy="100" r={radius} 
                        stroke="#f59e0b" 
                        strokeWidth={strokeWidth} 
                        fill="transparent"
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>
                <div className="absolute z-10 text-center">
                    <p className={`font-mono font-bold transition-all duration-300 ${isMaximized ? 'text-7xl' : 'text-6xl'}`}>{formatTime(timeLeft)}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button onClick={handleStartPause} className="p-4 bg-gray-700/50 rounded-full hover:bg-gray-700 transition-colors">
                    <Icon name={isActive ? "Pause" : "Play"} size={32} />
                </button>
                 <button onClick={handleReset} className="p-4 bg-gray-700/50 rounded-full hover:bg-gray-700 transition-colors">
                    <Icon name="TimerReset" size={32} />
                </button>
            </div>
            
            <div className="p-4 bg-gray-900/50 rounded-lg flex items-end gap-4">
                 <div>
                    <label className="text-sm text-gray-400">นาที</label>
                    <input type="number" value={minutes} onChange={handleMinuteChange} min="0" max="99" className="w-24 p-2 bg-gray-700 rounded-md text-center text-xl"/>
                </div>
                <div>
                    <label className="text-sm text-gray-400">วินาที</label>
                    <input type="number" value={seconds} onChange={handleSecondChange} min="0" max="59" className="w-24 p-2 bg-gray-700 rounded-md text-center text-xl"/>
                </div>
                <button onClick={handleSetTime} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-md h-[48px] font-bold transition-colors">ตั้งเวลา</button>
            </div>
        </div>
    );
};

export default ClassroomTimer;