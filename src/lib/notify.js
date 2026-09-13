import { toast } from "sonner";

export const notifyResult = (result, successMessage) => {
  if (result.ok) {
    if (successMessage) toast.success(successMessage);
    return;
  }
  if (result.formError) toast.error(result.formError);
};
