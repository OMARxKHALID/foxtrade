import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { MoreGrid } from "@/features/home/components/more-grid";

export const metadata = {
  title: "More",
};

const MorePage = () => (
  <Container className="flex flex-col gap-4 lg:gap-6">
    <PageHeader title="All Services" description="Every tool in one place." />
    <MoreGrid />
  </Container>
);

export default MorePage;
