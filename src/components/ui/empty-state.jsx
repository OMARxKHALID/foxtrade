import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export const EmptyState = ({ icon: Icon = Inbox, title, text, action, className }) => (
  <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
    <span className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
      <Icon className="size-5 text-neutral-400" strokeWidth={1.5} />
    </span>
    <p className="text-sm font-medium text-white">{title}</p>
    {text && <p className="max-w-sm text-xs leading-5 text-neutral-500">{text}</p>}
    {action}
  </div>
);
