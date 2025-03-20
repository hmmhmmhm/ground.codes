export const encode = async ({
  lat,
  lng,
  language = "english",
}: {
  lat: number;
  lng: number;
  language: string;
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
      precisionMeters: 3,
    }),
  });

  if (!response.ok) throw new Error("Failed to encode coordinates");
  return await response.text();
};
