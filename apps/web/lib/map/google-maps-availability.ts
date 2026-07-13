export const canConstructGoogleMapsClass = (candidate: unknown) =>
  typeof candidate === "function";
