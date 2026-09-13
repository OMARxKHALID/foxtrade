"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, controlClass } from "@/components/ui/field";
import { GradientButton } from "@/components/ui/gradient-button";
import { SelectMenu } from "@/components/ui/select-menu";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { cn } from "@/lib/utils";

const renderControl = (field, register, control, invalid) => {
  if (field.type === "select") {
    return (
      <Controller
        name={field.name}
        control={control}
        render={({ field: controller }) => (
          <SelectMenu
            id={field.name}
            placeholder={field.placeholder}
            options={field.options}
            value={controller.value}
            onChange={controller.onChange}
            onBlur={controller.onBlur}
            invalid={invalid}
          />
        )}
      />
    );
  }
  const common = {
    id: field.name,
    "aria-invalid": invalid,
    className: cn(controlClass, field.type === "textarea" && "h-auto py-3"),
    ...register(field.name),
  };
  if (field.type === "textarea") return <textarea rows={field.rows ?? 5} placeholder={field.placeholder} {...common} />;
  return (
    <input
      type={field.type ?? "text"}
      placeholder={field.placeholder}
      autoComplete={field.autoComplete}
      inputMode={field.inputMode}
      maxLength={field.maxLength}
      {...common}
    />
  );
};

export const SchemaForm = ({ schema, action, fields, defaultValues, submitLabel, pendingLabel, columns = 1, successMessage, footer, disabled }) => {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues });

  const { pending, submit } = useActionSubmit({ action, setError, successMessage: successMessage ?? "Saved.", onSuccess: () => reset(defaultValues) });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <div className={cn("grid gap-5", columns === 2 && "sm:grid-cols-2")}>
        {fields.map((field) => (
          <Field
            key={field.name}
            id={field.name}
            label={field.label}
            hint={field.hint}
            error={errors[field.name]?.message}
            className={field.span === "full" ? "sm:col-span-2" : undefined}
          >
            {renderControl(field, register, control, Boolean(errors[field.name]))}
          </Field>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <GradientButton type="submit" disabled={pending || disabled}>
          {pending ? pendingLabel ?? "Saving…" : submitLabel}
        </GradientButton>
        {footer}
      </div>
    </form>
  );
};
