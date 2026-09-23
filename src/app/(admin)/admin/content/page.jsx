import { PageHeader } from "@/components/ui/page-header";
import { contentDocuments } from "@/lib/content/content-registry";
import { readContent } from "@/lib/content/page-content";
import { requireAdmin } from "@/lib/session";
import { ContentManager } from "@/features/admin/components/content-manager";

export const metadata = {
  title: "Content",
};

export const instant = false;

const ContentPage = async () => {
  await requireAdmin();
  const contents = await Promise.all(contentDocuments.map((doc) => readContent(doc.key)));
  const documents = contentDocuments.map(({ key, group, labels, hasSummary }, index) => ({ key, group, labels, hasSummary, content: contents[index] }));

  return (
    <>
      <PageHeader title="Content" description="Edit legal pages, the Help Center, trading rules and the About page. Placeholders: {siteName}, {takerFee} and {practiceAmount} are filled from Settings." />
      <ContentManager documents={documents} />
    </>
  );
};

export default ContentPage;
