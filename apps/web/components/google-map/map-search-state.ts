export const shouldRequestPlacePredictions = ({
  isPlacePredictionEnabled,
  isGroundSearchLoading,
  trimmedQuery,
  normalizedQuery,
  suppressedPredictionQuery,
}: {
  isPlacePredictionEnabled: boolean;
  isGroundSearchLoading: boolean;
  trimmedQuery: string;
  normalizedQuery: string;
  suppressedPredictionQuery: string | null;
}) =>
  isPlacePredictionEnabled &&
  trimmedQuery.length >= 2 &&
  !isGroundSearchLoading &&
  normalizedQuery !== suppressedPredictionQuery;

export const shouldRequestGroundSuggestions = ({
  isGroundSearchLoading,
  trimmedQuery,
  normalizedQuery,
  suppressedPredictionQuery,
}: {
  isGroundSearchLoading: boolean;
  trimmedQuery: string;
  normalizedQuery: string;
  suppressedPredictionQuery: string | null;
}) =>
  trimmedQuery.length >= 2 &&
  !isGroundSearchLoading &&
  normalizedQuery !== suppressedPredictionQuery;
