export const kycStatus = {
  none: { tone: "neutral", label: "Unverified" },
  pending: { tone: "warning", label: "Under review" },
  approved: { tone: "success", label: "Verified" },
  rejected: { tone: "danger", label: "Rejected" },
};

export const documentStatus = {
  none: { tone: "neutral", label: "Not submitted" },
  draft: { tone: "neutral", label: "Not submitted" },
  pending: { tone: "warning", label: "Under review" },
  approved: { tone: "success", label: "Verified" },
  rejected: { tone: "danger", label: "Rejected" },
};

export const ticketStatus = {
  open: { tone: "brand", label: "Open" },
  answered: { tone: "success", label: "Answered" },
  closed: { tone: "neutral", label: "Closed" },
};
