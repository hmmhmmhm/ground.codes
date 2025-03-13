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
    <div className="absolute bottom-[10px] left-[10px] bg-white p-[10px] rounded-md shadow-md z-10 max-w-[300px] overflow-hidden">
      <div className="mb-[5px]">
        <span className="font-bold">English: </span>
        {isEncodingEN ? (
          <span className="text-gray-500">Encoding...</span>
        ) : (
          <span>{encodedCoordinatesEN}</span>
        )}
      </div>
      <div>
        <span className="font-bold">한국어: </span>
        {isEncodingKR ? (
          <span className="text-gray-500">인코딩 중...</span>
        ) : (
          <span>{encodedCoordinatesKR}</span>
        )}
      </div>
    </div>
  );
};

export default CoordinatesDisplay;
