import { toast } from "sonner";

export const notifyResult = (result, successMessage) => {
  if (result.ok) {
    if (successMessage) toast.success(successMessage);
    return;
  }
  if (result.formError) return toast.error(result.formError);
  const [firstFieldError] = Object.values(result.fieldErrors ?? {}).flat();
  if (firstFieldError) toast.error(firstFieldError);
};
