import React, { useState, useEffect } from 'react';

export default function ExamTimer({ startedAt, durationMinutes, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!startedAt || !durationMinutes) return;

    const startTime = new Date(startedAt).getTime();
    const endTime = startTime + durationMinutes * 60000;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft('00:00:00');
        if (onTimeUp) onTimeUp();
      } else {
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, onTimeUp]);

  if (!timeLeft) return null;

  const isLowTime = timeLeft.startsWith('00:0'); // Highlights red if under 10 mins

  return (
    <div className="exam-timer" style={{ color: isLowTime ? 'red' : 'inherit', fontWeight: 'bold' }}>
      Time Remaining: {timeLeft}
    </div>
  );
}