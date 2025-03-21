import React from 'react';

interface CompassProps {
  mapHeading: number;
  resetMapHeading: () => void;
  className?: string;
  title: string;
  ariaLabel: string;
}

const Compass: React.FC<CompassProps> = ({
  mapHeading,
  resetMapHeading,
  className = "absolute bottom-[100px] right-[10px]",
  title,
  ariaLabel
}) => {
  return (
    <button
      onClick={resetMapHeading}
      className={`${className} bg-black/50 backdrop-blur-md border border-white/20 rounded-full w-[40px] h-[40px] cursor-pointer flex justify-center items-center z-10 overflow-hidden`}
      title={title}
      aria-label={ariaLabel}
      style={{
        transform: `rotate(-${mapHeading}deg)`,
        transition: "transform 0.3s ease-in-out",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 나침반 외부 원 */}
        <circle
          cx="12"
          cy="12"
          r="11"
          fill="#222222"
          stroke="#444444"
          strokeWidth="1"
        />

        {/* 눈금 표시 - 정적으로 구현 */}
        {/* 12시 방향 (북) */}
        <line
          x1="12"
          y1="1"
          x2="12"
          y2="3.5"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 1시 방향 */}
        <line
          x1="15.5"
          y1="2.2"
          x2="14.6"
          y2="4.3"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        {/* 2시 방향 */}
        <line
          x1="18.5"
          y1="4.5"
          x2="16.7"
          y2="6"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 3시 방향 (동) */}
        <line
          x1="20.8"
          y1="7.5"
          x2="18.7"
          y2="8.4"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        <line
          x1="22"
          y1="12"
          x2="19.5"
          y2="12"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 5시 방향 */}
        <line
          x1="20.8"
          y1="16.5"
          x2="18.7"
          y2="15.6"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        {/* 6시 방향 (남) */}
        <line
          x1="18.5"
          y1="19.5"
          x2="16.7"
          y2="18"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 7시 방향 */}
        <line
          x1="15.5"
          y1="21.8"
          x2="14.6"
          y2="19.7"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        {/* 8시 방향 */}
        <line
          x1="12"
          y1="23"
          x2="12"
          y2="20.5"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 9시 방향 */}
        <line
          x1="8.5"
          y1="21.8"
          x2="9.4"
          y2="19.7"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        {/* 10시 방향 (서) */}
        <line
          x1="5.5"
          y1="19.5"
          x2="7.3"
          y2="18"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 11시 방향 */}
        <line
          x1="3.2"
          y1="16.5"
          x2="5.3"
          y2="15.6"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        <line
          x1="2"
          y1="12"
          x2="4.5"
          y2="12"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 1시 방향 */}
        <line
          x1="3.2"
          y1="7.5"
          x2="5.3"
          y2="8.4"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        {/* 2시 방향 */}
        <line
          x1="5.5"
          y1="4.5"
          x2="7.3"
          y2="6"
          stroke="#FFFFFF"
          strokeWidth="1"
        />
        {/* 3시 방향 */}
        <line
          x1="8.5"
          y1="2.2"
          x2="9.4"
          y2="4.3"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />

        {/* 북쪽 방향 표시 - 빨간색 삼각형 */}
        <path
          d="M12 1L14.5 4L9.5 4L12 1Z"
          fill="#FF4444"
          stroke="#FF4444"
          strokeWidth="0.5"
        />

        {/* 중앙 십자선 */}
        <circle
          cx="12"
          cy="12"
          r="5"
          fill="#333333"
          stroke="#444444"
          strokeWidth="0.5"
        />
        <line
          x1="12"
          y1="7"
          x2="12"
          y2="17"
          stroke="#777777"
          strokeWidth="0.5"
        />
        <line
          x1="7"
          y1="12"
          x2="17"
          y2="12"
          stroke="#777777"
          strokeWidth="0.5"
        />
      </svg>
    </button>
  );
};

export default Compass;
