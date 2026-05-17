import GoogleMap from "@/components/google-map";

export const runtime = "edge";

export default function SharedCodePage() {
  return (
    <div className="absolute min-h-screen-safe bg-black w-full h-full select-none overflow-hidden">
      <GoogleMap />
    </div>
  );
}
