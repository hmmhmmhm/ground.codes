/**
 * Encodes a set of coordinates into a ground code.
 */
export const encode = async ({
  lat,
  lng,
  language = "english",
  precisionMeters = 3,
}: {
  lat: number;
  lng: number;
  language?: string;
  precisionMeters?: number;
}) => {
  const response = await fetch("https://api.ground.codes/encode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lat,
      lng,
      regionLevel: 2,
      language,
      precisionMeters,
    }),
  });

  if (!response.ok) throw new Error("Failed to encode coordinates");
  return await response.text();
};
