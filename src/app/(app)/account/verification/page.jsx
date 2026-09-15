import { Container } from "@/components/ui/container";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { collections } from "@/lib/mongo";
import { kycStatus } from "@/lib/status";
import { getCurrentUser } from "@/lib/session";
import { BasicVerificationForm, DocumentUploads } from "@/features/account/components/verification-forms";

export const metadata = {
  title: "Identity Verification",
};

export const instant = false;

const VerificationPage = async () => {
  const user = await getCurrentUser();
  const record = user ? await collections.verifications().findOne({ userId: user.id }) : null;
  const status = record?.status ?? "none";
  const badge = kycStatus[status];
  const locked = status === "pending" || status === "approved";

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Identity Verification" description="Verify your identity to appear on the copy trading leaderboard." backHref="/account" />
      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
        <GlowCard as="section" aria-labelledby="basic-title">
          <CardHeader id="basic-title" title="Basic verification" actions={<StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>} />
          <CardBody className="flex flex-col gap-5">
            {status === "rejected" && record?.reason && (
              <p className="rounded-lg border border-down/30 bg-down/10 px-3 py-2.5 text-xs text-down">Reason: {record.reason}. Update your details and submit again.</p>
            )}
            {locked ? (
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Country / Region", record.country],
                  ["Full legal name", record.fullName],
                  ["ID number", `•••• ${record.idNumber.slice(-4)}`],
                  ["City", record.city],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/5 bg-field px-4 py-3">
                    <dt className="text-xs text-neutral-500">{label}</dt>
                    <dd className="mt-1 text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <BasicVerificationForm />
            )}
          </CardBody>
        </GlowCard>
        <GlowCard as="section" aria-labelledby="advanced-title">
          <CardHeader
            id="advanced-title"
            title="Advanced verification"
            description="Document upload opens once file storage is configured and basic verification is approved."
            actions={<StatusBadge>Locked</StatusBadge>}
          />
          <CardBody>
            <DocumentUploads />
          </CardBody>
        </GlowCard>
      </div>
    </Container>
  );
};

export default VerificationPage;
