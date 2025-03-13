import React from "react";

interface CoordinatesDisplayProps {
  encodedCoordinatesEN: string;
  encodedCoordinatesKR: string;
  isEncodingEN: boolean;
  isEncodingKR: boolean;
}

const CoordinatesDisplay: React.FC<CoordinatesDisplayProps> = ({
  encodedCoordinatesEN,
  encodedCoordinatesKR,
  isEncodingEN,
  isEncodingKR,
}) => {
  return (
    <div className="absolute bottom-[260px] right-[10px] bg-white p-2 rounded shadow-md z-10 text-sm">
      <p className="m-0">
        EN: <b>{isEncodingEN ? "로딩 중..." : encodedCoordinatesEN}</b>
      </p>
      <p className="m-0 mt-1">
        KR: <b>{isEncodingKR ? "로딩 중..." : encodedCoordinatesKR}</b>
      </p>
    </div>
  );
};

export default CoordinatesDisplay;
