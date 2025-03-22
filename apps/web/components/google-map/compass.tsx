import React, { useCallback, useRef, useState, useEffect } from "react";

interface CompassProps {
  mapHeading: number;
  resetMapHeading: () => void;
  setMapHeading?: (heading: number) => void;
  className?: string;
  title: string;
  ariaLabel: string;
}

const Compass: React.FC<CompassProps> = ({
  mapHeading,
  resetMapHeading,
  setMapHeading,
  className = "absolute bottom-[100px] right-[10px]",
  title,
  ariaLabel,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const compassRef = useRef<HTMLButtonElement>(null);
  const startAngleRef = useRef<number>(0);
  const startHeadingRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false); // 드래그가 실제로 발생했는지 추적
  const startPosRef = useRef<{ x: number; y: number } | null>(null); // 드래그 시작 위치
  const lastDragTimeRef = useRef<number>(0); // 마지막 드래그 시간을 저장

  // 마우스 위치 계산 함수
  const calculateAngle = useCallback(
    (centerX: number, centerY: number, pointX: number, pointY: number) => {
      return Math.atan2(pointY - centerY, pointX - centerX) * (180 / Math.PI);
    },
    []
  );

  // 드래그 중 마우스 이동 처리
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!compassRef.current || !setMapHeading) return;

      // 드래그 시작 위치와 현재 위치의 차이를 계산하여 실제 드래그 여부 판단
      if (startPosRef.current) {
        const dx = Math.abs(e.clientX - startPosRef.current.x);
        const dy = Math.abs(e.clientY - startPosRef.current.y);

        // 일정 거리 이상 움직였을 때만 드래그로 간주
        if (dx > 3 || dy > 3) {
          hasDraggedRef.current = true;
          lastDragTimeRef.current = Date.now(); // 마지막 드래그 시간 업데이트
        }
      }

      const rect = compassRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const currentAngle = calculateAngle(
        centerX,
        centerY,
        e.clientX,
        e.clientY
      );

      // 시작 각도와 현재 각도의 차이 계산
      let angleDiff = currentAngle - startAngleRef.current;

      // 각도 차이가 180도를 넘어가면 반대 방향으로 계산 (최단 경로 회전)
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;

      // 회전 각도 계산 (시계 방향으로 회전하면 각도가 감소)
      let newHeading = (startHeadingRef.current - angleDiff) % 360;
      if (newHeading < 0) newHeading += 360;
      setMapHeading(newHeading);
    },
    [calculateAngle, setMapHeading]
  );

  // 터치 이동 처리
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!compassRef.current || !setMapHeading || !e.touches[0]) return;

      // 드래그 시작 위치와 현재 위치의 차이를 계산하여 실제 드래그 여부 판단
      if (startPosRef.current) {
        const dx = Math.abs(e.touches[0].clientX - startPosRef.current.x);
        const dy = Math.abs(e.touches[0].clientY - startPosRef.current.y);

        // 일정 거리 이상 움직였을 때만 드래그로 간주
        if (dx > 3 || dy > 3) {
          hasDraggedRef.current = true;
          lastDragTimeRef.current = Date.now(); // 마지막 드래그 시간 업데이트
        }
      }

      const rect = compassRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const currentAngle = calculateAngle(
        centerX,
        centerY,
        e.touches[0].clientX,
        e.touches[0].clientY
      );

      // 시작 각도와 현재 각도의 차이 계산
      let angleDiff = currentAngle - startAngleRef.current;

      // 각도 차이가 180도를 넘어가면 반대 방향으로 계산 (최단 경로 회전)
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;

      // 회전 각도 계산 (시계 방향으로 회전하면 각도가 감소)
      let newHeading = (startHeadingRef.current - angleDiff) % 360;
      if (newHeading < 0) newHeading += 360;
      setMapHeading(newHeading);

      // 기본 동작 방지
      e.preventDefault();
    },
    [calculateAngle, setMapHeading]
  );

  // 드래그 종료 처리
  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    setIsDragging(false);

    // 드래그 상태 초기화 (다음 상호작용을 위해)
    const wasDragging = hasDraggedRef.current;
    hasDraggedRef.current = false;
    startPosRef.current = null;

    // 드래그가 발생했다면 클릭 이벤트 방지를 위해 마지막 드래그 시간 기록
    if (wasDragging) {
      lastDragTimeRef.current = Date.now();

      // 드래그 후 컴포넌트 내에서 마우스를 떼었을 때 클릭 이벤트가 발생하지 않도록 함
      if (e instanceof MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, []);

  // 이벤트 리스너 등록 및 제거
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleDragEnd);
      document.addEventListener("touchend", handleDragEnd);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchend", handleDragEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleDragEnd]);

  // 마우스 드래그 시작
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!compassRef.current || !setMapHeading) return;

      // 기본 동작 및 버블링 방지
      e.preventDefault();
      e.stopPropagation();

      // 드래그 시작 위치 저장
      startPosRef.current = { x: e.clientX, y: e.clientY };
      hasDraggedRef.current = false;

      const rect = compassRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      startAngleRef.current = calculateAngle(
        centerX,
        centerY,
        e.clientX,
        e.clientY
      );
      startHeadingRef.current = mapHeading;
      setIsDragging(true);
    },
    [calculateAngle, mapHeading, setMapHeading]
  );

  // 터치 드래그 시작
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      if (!compassRef.current || !setMapHeading || !e.touches[0]) return;

      // 기본 동작 및 버블링 방지
      e.preventDefault();
      e.stopPropagation();

      // 드래그 시작 위치 저장
      startPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      hasDraggedRef.current = false;

      const rect = compassRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      startAngleRef.current = calculateAngle(
        centerX,
        centerY,
        e.touches[0].clientX,
        e.touches[0].clientY
      );
      startHeadingRef.current = mapHeading;
      setIsDragging(true);
    },
    [calculateAngle, mapHeading, setMapHeading]
  );

  // 클릭 처리 (드래그가 아닌 경우에만 리셋)
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // 최근에 드래그가 있었는지 확인 (300ms 이내)
      const timeSinceLastDrag = Date.now() - lastDragTimeRef.current;

      // 드래그가 발생했거나 최근에 드래그가 끝난 경우 클릭 이벤트 무시
      if (hasDraggedRef.current || timeSinceLastDrag < 300) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 드래그가 발생하지 않은 순수한 클릭인 경우에만 리셋 함수 호출
      resetMapHeading();
    },
    [resetMapHeading]
  );

  return (
    <button
      ref={compassRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`${className} ${isDragging ? "cursor-grabbing" : "cursor-grab"} bg-black/50 backdrop-blur-md border border-white/20 rounded-full w-[40px] h-[40px] flex justify-center items-center z-10 overflow-hidden`}
      title={isDragging ? "드래그하여 지도 회전" : title}
      aria-label={ariaLabel}
      style={{
        transform: `rotate(-${mapHeading}deg)`,
        transition: isDragging ? "none" : "transform 0.3s ease-in-out",
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
          r="1"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        <line
          x1="12"
          y1="9"
          x2="12"
          y2="15"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
        <line
          x1="9"
          y1="12"
          x2="15"
          y2="12"
          stroke="#FFFFFF"
          strokeWidth="0.5"
        />
      </svg>
    </button>
  );
};

export default Compass;
