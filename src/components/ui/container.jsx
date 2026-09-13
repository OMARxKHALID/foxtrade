import { cn } from "@/lib/utils";

export const Container = ({ as: Tag = "div", className, children, ...props }) => (
  <Tag className={cn("mx-auto w-full max-w-[1920px] px-4 md:px-8 xl:px-12 2xl:px-16", className)} {...props}>
    {children}
  </Tag>
);
