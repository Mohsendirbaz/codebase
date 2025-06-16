import '../../styles/HomePage.CSS/HCSS.css';

import React, { useEffect, useRef } from 'react';


const PendulumClock = ({ size = 'medium' }) => {
    const secondHandRef = useRef(null);
    const minuteHandRef = useRef(null);
    const hourHandRef = useRef(null);

    // Update clock hands position
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const hours = now.getHours() % 12;
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            const milliseconds = now.getMilliseconds();

            // Calculate angles
            const secondAngle = (seconds * 6) + (milliseconds * 0.006);
            const minuteAngle = (minutes * 6) + (seconds * 0.1);
            const hourAngle = (hours * 30) + (minutes * 0.5);

            // Apply rotations
            if (secondHandRef.current) secondHandRef.current.style.transform = `rotate(${secondAngle}deg)`;
            if (minuteHandRef.current) minuteHandRef.current.style.transform = `rotate(${minuteAngle}deg)`;
            if (hourHandRef.current) hourHandRef.current.style.transform = `rotate(${hourAngle}deg)`;

            // Request the next animation frame
            requestAnimationFrame(updateClock);
        };

        // Start the clock
        const animationFrame = requestAnimationFrame(updateClock);

        // Cleanup function
        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, []);

    // Generate clock numbers
    const clockNumbers = [];
    for (let i = 1; i <= 12; i++) {
        const angle = (i * 30) - 90; // 30 degrees per hour, -90 to start at 12 o'clock
        const radians = angle * (Math.PI / 180);
        const radius = size === 'small' ? 80 : size === 'large' ? 160 : 120; // Adjust based on size

        const x = Math.cos(radians) * radius;
        const y = Math.sin(radians) * radius;

        clockNumbers.push(
            <div
                key={i}
                className="clock-number"
                style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`
                }}
            >
                {i}
            </div>
        );
    }

    return (
        <div className={`clock-container ${size}`}>
            <div className="clock-face">
                {clockNumbers}
                <div
                    className="hour-hand"
                    ref={hourHandRef}
                ></div>
                <div
                    className="minute-hand"
                    ref={minuteHandRef}
                ></div>
                <div
                    className="second-hand"
                    ref={secondHandRef}
                ></div>
                <div className="clock-center"></div>
            </div>
            <div className="pendulum-container">
                <div className="pendulum-rod pendulum-animate">
                    <div className="pendulum-bob"></div>
                </div>
            </div>
        </div>
    );
};

export default PendulumClock;
