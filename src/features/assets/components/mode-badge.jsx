import { StatusBadge } from "@/components/ui/status-badge";

export const ModeBadge = ({ mode }) =>
  mode === "live" ? <StatusBadge tone="success">Real funds</StatusBadge> : <StatusBadge tone="warning">Practice funds</StatusBadge>;
