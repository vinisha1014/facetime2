import { useState, useRef, useEffect } from 'react';
import './CallScreen.css';

function CallScreen({ onAccept, onReject }) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const dragOffset = useRef(0);
  const sliderRef = useRef(null);
  const containerRef = useRef(null);

  const handleDragStart = (e) => {
    setIsDragging(true);
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    dragOffset.current = clientX - sliderRect.left;
  };

  const handleDragMove = (e) => {
    if (!isDragging || !sliderRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxPosition = containerWidth - sliderWidth;

    const containerRect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;

    const touchX = clientX - containerRect.left - dragOffset.current;
    const newPosition = Math.max(0, Math.min(touchX, maxPosition));
    setPosition(newPosition);

    if (newPosition > maxPosition * 0.75) {
      setIsDragging(false);
      if (onAccept) onAccept();
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setPosition(0); // reset if not accepted
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) handleDragMove(e);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="call-screen">
      <div className="call-notification">
        <h2>Incoming Call</h2>
        <p>Swipe to answer</p>
      </div>

      <div
        className="slider-container"
        ref={containerRef}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
      >
        <div className="slider-track">
          <div
            className="slider-thumb"
            ref={sliderRef}
            style={{ transform: `translateX(${position}px)` }}
            onTouchStart={handleDragStart}
            onMouseDown={handleDragStart}
          >
            <span className="slider-icon">→</span>
          </div>
        </div>
      </div>

      <button className="reject-btn" onClick={onReject}>
        Decline
      </button>
    </div>
  );
}

export default CallScreen;
