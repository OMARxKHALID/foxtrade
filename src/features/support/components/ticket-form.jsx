"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, controlClass } from "@/components/ui/field";
import { GradientButton } from "@/components/ui/gradient-button";
import { SelectMenu } from "@/components/ui/select-menu";
import { applyFieldErrors } from "@/lib/action-result";
import { notifyResult } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { createTicket } from "@/features/support/actions/create-ticket";
import { ticketCategories, ticketSchema } from "@/features/support/schemas/ticket-schema";

const categoryOptions = ticketCategories.map((category) => ({ value: category, label: category }));

export const TicketForm = () => {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(ticketSchema), defaultValues: { category: "", subject: "", message: "" } });

  const handleCreate = (values) =>
    startTransition(async () => {
      const result = await createTicket(values);
      if (result.ok) return;
      applyFieldErrors(result, setError);
      notifyResult(result);
    });

  return (
    <form onSubmit={handleSubmit(handleCreate)} noValidate className="flex flex-col gap-5">
      <Field id="ticket-category" label="Category" error={errors.category?.message}>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <SelectMenu id="ticket-category" placeholder="Select a category" options={categoryOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(errors.category)} />
          )}
        />
      </Field>
      <Field id="ticket-subject" label="Subject" error={errors.subject?.message}>
        <input id="ticket-subject" aria-invalid={Boolean(errors.subject)} className={controlClass} {...register("subject")} />
      </Field>
      <Field id="ticket-message" label="Message" error={errors.message?.message}>
        <textarea id="ticket-message" rows={6} aria-invalid={Boolean(errors.message)} className={cn(controlClass, "h-auto py-3")} {...register("message")} />
      </Field>
      <GradientButton type="submit" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Submit Ticket"}
      </GradientButton>
    </form>
  );
};
