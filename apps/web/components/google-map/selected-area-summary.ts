export const getSelectedAreaDetailText = ({
  address,
  precisionLabel,
}: {
  address?: string | null;
  precisionLabel: string;
}) => {
  const normalizedAddress = stripLeadingPlusCode(address?.trim() ?? "");
  return normalizedAddress ? normalizedAddress : precisionLabel;
};

const stripLeadingPlusCode = (address: string) =>
  address.replace(/^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3},?\s+/i, "").trim();
