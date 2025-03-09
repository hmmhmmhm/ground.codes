"use client";
import { useEffect, useRef } from "react";

export interface GridCanvasProps {
  gridSize?: number;
  canvasSize?: number;
  padding?: number;
  gridRange?: number;
  highlightCoordinates?: Array<{
    coord: { x: number; y: number };
    color: string;
  }>;
}

export default function GridCanvas({
  gridRange = 7,
  padding = 40,
  highlightCoordinates,
}: GridCanvasProps) {
  // 그리드 범위에 따라 동적으로 크기 조절
  const baseGridSize = 50;
  const baseCanvasSize = 800;

  // 그리드 범위가 커질수록 각 셀의 크기를 줄임 (정수값 보장)
  const gridSize = Math.floor(
    Math.max(30, Math.floor(baseGridSize * (7 / gridRange)))
  );

  // 캔버스 크기를 그리드 범위에 맞게 조절 (정수값 보장)
  const canvasSize = Math.floor(
    Math.max(baseCanvasSize, (gridRange * 2 + 1) * gridSize + padding * 2)
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 색상 팔레트
  const COLORS = {
    background: "#000000",
    label: "#FFFFFF",
    gridLine: "#FFFFFF",
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // 화살표 몸체
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 화살표 머리
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const drawStartPoint = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false }); // alpha: false로 설정하여 투명도 관련 문제 방지
    if (!ctx) return;

    // 캔버스 크기 설정 (패딩 제거)
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // 중앙점 계산 (정수값 보장)
    const centerX = Math.floor(canvasSize / 2);
    const centerY = Math.floor(canvasSize / 2);

    // 배경색 단색 검정으로 변경 - clearRect로 먼저 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 패딩 영역 검정색 유지
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, padding, canvas.height);
    ctx.fillRect(canvas.width - padding, 0, padding, canvas.height);
    ctx.fillRect(0, 0, canvas.width, padding);
    ctx.fillRect(0, canvas.height - padding, canvas.width, padding);

    // 패딩을 고려한 실제 드로잉 영역 계산
    const maxVisibleCoordinate = gridRange;

    // 그리드 라인 렌더링
    ctx.strokeStyle = COLORS.gridLine;

    for (let i = -maxVisibleCoordinate; i <= maxVisibleCoordinate; i++) {
      if (i === 0) continue; // 중앙선 제외

      // 세로선
      ctx.beginPath();
      ctx.moveTo(centerX + i * gridSize, padding);
      ctx.lineTo(centerX + i * gridSize, canvasSize - padding);
      ctx.stroke();

      // 가로선
      ctx.beginPath();
      ctx.moveTo(padding, centerY + i * gridSize);
      ctx.lineTo(canvasSize - padding, centerY + i * gridSize);
      ctx.stroke();
    }

    // 3D 입체 효과 - 더 선명하게 조정
    ctx.shadowColor = "rgba(255,255,255,0.3)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // 그리드 블록 렌더링
    ctx.fillStyle = COLORS.background;
    for (let i = -maxVisibleCoordinate; i <= maxVisibleCoordinate; i++) {
      for (let j = -maxVisibleCoordinate; j <= maxVisibleCoordinate; j++) {
        const x = Math.floor(centerX + i * gridSize - gridSize / 2);
        const y = Math.floor(centerY + j * gridSize - gridSize / 2);
        ctx.fillRect(x, y, gridSize - 1, gridSize - 1);
      }
    }

    // 좌표 레이블 렌더링 함수
    const renderCoordinateLabel = (
      x: number,
      y: number,
      text: string,
      isXAxis: boolean
    ) => {
      if (isXAxis) {
        const xPos = Math.floor(centerX + x * gridSize);
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(text, xPos, padding + 10);
      } else {
        const yPos = Math.floor(centerY + y * gridSize);
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(text, padding + 10, yPos);
      }
    };

    // 1. 먼저 하이라이트되지 않은 좌표들을 그립니다
    ctx.font = 'bold 16px "Segment7Standard", monospace';
    ctx.fillStyle = COLORS.label;

    // 하이라이트된 좌표 Set 생성 (빠른 검색을 위해)
    const highlightedXSet = new Set(
      highlightCoordinates?.map((h) => h.coord.x) || []
    );
    const highlightedYSet = new Set(
      highlightCoordinates?.map((h) => h.coord.y) || []
    );

    // X축 일반 좌표
    for (let x = -maxVisibleCoordinate; x <= maxVisibleCoordinate; x++) {
      if (x === -maxVisibleCoordinate) continue; // 겹치는 지점 제외
      if (highlightedXSet.has(x)) continue;
      renderCoordinateLabel(x, 0, x.toString(), true);
    }

    // Y축 일반 좌표
    for (let y = -maxVisibleCoordinate; y <= maxVisibleCoordinate; y++) {
      if (-y === maxVisibleCoordinate) continue; // 겹치는 지점 제외
      // 화면에 표시되는 y값은 -y이므로, 실제 하이라이트된 y값과 비교할 때는 부호를 맞춰줍니다
      if (highlightedYSet.has(-y)) continue;
      renderCoordinateLabel(0, y, (-y).toString(), false);
    }

    // 2. 하이라이트된 좌표들의 격자 패턴을 그립니다
    if (highlightCoordinates) {
      for (let i = 0; i < highlightCoordinates.length; i++) {
        const { coord, color } = highlightCoordinates[i]!;
        const x = Math.floor(centerX + coord.x * gridSize - gridSize / 2);
        const y = Math.floor(centerY - coord.y * gridSize - gridSize / 2);

        // 클리핑 영역 설정 (격자 크기)
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, gridSize, gridSize);
        ctx.clip();

        // 빗금 패턴 그리기
        ctx.strokeStyle = color;
        ctx.shadowColor = "transparent"; // 패턴에는 그림자 효과 제거
        const spacing = gridSize / 8;

        // 대각선 패턴
        for (let i = -gridSize; i <= gridSize * 2; i += spacing) {
          ctx.beginPath();
          ctx.moveTo(x + i, y);
          ctx.lineTo(x + i - gridSize, y + gridSize);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x + i, y);
          ctx.lineTo(x + i + gridSize, y + gridSize);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // 3. 마지막으로 하이라이트된 좌표 레이블을 그립니다
    if (highlightCoordinates) {
      highlightCoordinates.forEach(({ coord, color }) => {
        ctx.fillStyle = color;

        // X 좌표 하이라이트
        if (
          coord.x >= -maxVisibleCoordinate &&
          coord.x <= maxVisibleCoordinate
        ) {
          renderCoordinateLabel(coord.x, 0, coord.x.toString(), true);
        }

        // Y 좌표 하이라이트
        if (
          coord.y >= -maxVisibleCoordinate &&
          coord.y <= maxVisibleCoordinate
        ) {
          renderCoordinateLabel(0, -coord.y, coord.y.toString(), false);
        }
      });
    }

    // 하이라이트된 좌표들 렌더링
    if (highlightCoordinates && highlightCoordinates.length > 0) {
      // 시작점 그리기 (첫 번째 좌표가 0,0이 아닐 때만)
      if (highlightCoordinates.length > 1) {
        const firstCoord = highlightCoordinates[0]?.coord;
        const startX = centerX + firstCoord!.x * gridSize;
        const startY = centerY - firstCoord!.y * gridSize;
        drawStartPoint(ctx, startX, startY);
      }

      for (let i = 0; i < highlightCoordinates.length; i++) {
        const { coord } = highlightCoordinates[i]!;

        // 이전 좌표와 현재 좌표 사이에 화살표 그리기
        if (i > 0) {
          const prevCoord = highlightCoordinates[i - 1]?.coord;
          const prevX = centerX + prevCoord!.x * gridSize;
          const prevY = centerY - prevCoord!.y * gridSize;
          const currX = centerX + coord.x * gridSize;
          const currY = centerY - coord.y * gridSize;

          drawArrow(ctx, prevX, prevY, currX, currY);
        }
      }
    }
  }, [canvasSize, gridSize, padding, gridRange, highlightCoordinates]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto">
      <div
        style={{
          width: canvasSize,
          height: canvasSize,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}
