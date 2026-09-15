import { ObjectId } from "mongodb";
import { privateImageUrl } from "@/lib/document-storage";
import { documentSides } from "@/lib/document-rules";
import { collections } from "@/lib/mongo";
import { getCurrentUser, isAdmin } from "@/lib/session";

const notFound = () => new Response("Not found", { status: 404 });

const contentTypes = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", pdf: "application/pdf" };

export const GET = async (request, { params }) => {
  const user = await getCurrentUser().catch(() => null);
  if (!isAdmin(user)) return notFound();
  const { id, side } = await params;
  if (!ObjectId.isValid(id) || !documentSides.some((item) => item.value === side)) return notFound();
  const verification = await collections.verifications().findOne({ _id: new ObjectId(id) }, { projection: { documents: 1 } });
  const document = verification?.documents?.[side];
  if (!document) return notFound();
  const upstream = await fetch(privateImageUrl(document.publicId, document.format), { cache: "no-store" });
  if (!upstream.ok) return new Response("Document unavailable", { status: 502 });
  return new Response(upstream.body, {
    headers: {
      "Content-Type": contentTypes[document.format] ?? "application/octet-stream",
      ...(document.format === "pdf" ? { "Content-Disposition": `attachment; filename="kyc-${id}-${side}.pdf"` } : {}),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
