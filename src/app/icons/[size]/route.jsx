import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

const sizes = [192, 512];

export const generateStaticParams = () => sizes.map((size) => ({ size: String(size) }));

export const GET = async (request, { params }) => {
  const { size } = await params;
  const pixels = Number(size);
  if (!sizes.includes(pixels)) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    <BrandIcon size={pixels} />,
    { width: pixels, height: pixels, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
};
