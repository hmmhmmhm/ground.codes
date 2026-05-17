export const getSelectedAreaDetailText = ({
  address,
  precisionLabel,
}: {
  address?: string | null;
  precisionLabel: string;
}) => {
  const normalizedAddress = address?.trim();
  return normalizedAddress ? normalizedAddress : precisionLabel;
};
