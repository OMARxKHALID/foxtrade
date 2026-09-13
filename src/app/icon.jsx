import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

export const size = { width: 32, height: 32 };

export const contentType = "image/png";

const Icon = () => new ImageResponse(<BrandIcon size={32} />, size);

export default Icon;
