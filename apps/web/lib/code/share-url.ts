type CelestialBody = "earth" | "moon" | "mars";

const bodyPrefixes = new Set(["moon", "mars"]);
const reservedRootSegments = new Set([
  "api",
  "_next",
  "docs",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export interface GroundCodeSharePath {
  body: CelestialBody;
  code: string;
}

export const buildGroundCodeSharePath = ({
  code,
  body,
}: GroundCodeSharePath) => {
  const encodedCode = encodeURIComponent(code);
  return body === "earth" ? `/${encodedCode}` : `/${body}/${encodedCode}`;
};

const isCodeLikeShareSegment = (code: string) => {
  const wordCount = code.split("-").filter(Boolean).length;
  return wordCount >= 2 && wordCount <= 3;
};

export const parseGroundCodeSharePath = (
  pathname: string,
): GroundCodeSharePath | null => {
  const segments = pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 1) {
    const [rawCode] = segments;
    if (!rawCode) return null;
    if (reservedRootSegments.has(rawCode) || bodyPrefixes.has(rawCode)) {
      return null;
    }
    const code = decodeURIComponent(rawCode);
    if (!isCodeLikeShareSegment(code)) return null;
    return {
      body: "earth",
      code,
    };
  }

  const [rawBody, rawCode] = segments;
  if (segments.length === 2 && rawBody && rawCode && bodyPrefixes.has(rawBody)) {
    const code = decodeURIComponent(rawCode);
    if (!isCodeLikeShareSegment(code)) return null;
    return {
      body: rawBody as CelestialBody,
      code,
    };
  }

  return null;
};
