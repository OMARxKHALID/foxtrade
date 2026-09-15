"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, controlClass } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { cn } from "@/lib/utils";
import { restoreDefaultContent, saveContent } from "@/features/admin/actions/platform-actions";
import { contentSchema } from "@/features/admin/schemas/admin-schema";

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

const ContentForm = ({ entry, onDone }) => {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contentSchema),
    defaultValues: { key: entry.key, title: entry.content.title, summary: entry.content.summary, sections: entry.content.sections },
  });
  const sections = useFieldArray({ control, name: "sections" });
  const { pending, submit } = useActionSubmit({ action: saveContent, setError, successMessage: "Content saved.", onSuccess: onDone });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <Field id="content-title" label="Title" error={errors.title?.message}>
        <input id="content-title" aria-invalid={Boolean(errors.title)} className={controlClass} {...register("title")} />
      </Field>
      {entry.hasSummary && (
        <Field id="content-summary" label="Summary" error={errors.summary?.message}>
          <textarea id="content-summary" rows={3} className={cn(controlClass, "h-auto py-3")} {...register("summary")} />
        </Field>
      )}
      <div className="flex flex-col gap-4">
        {sections.fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-3 rounded-xl border border-white/5 bg-field p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-neutral-500">Section {index + 1}</span>
              <span className="inline-flex gap-1.5">
                <IconButton label="Move up" disabled={index === 0} onClick={() => sections.move(index, index - 1)}>
                  <ArrowUp className="size-4" />
                </IconButton>
                <IconButton label="Move down" disabled={index === sections.fields.length - 1} onClick={() => sections.move(index, index + 1)}>
                  <ArrowDown className="size-4" />
                </IconButton>
                <IconButton label="Remove section" disabled={sections.fields.length === 1} onClick={() => sections.remove(index)}>
                  <Trash2 className="size-4 text-down" />
                </IconButton>
              </span>
            </div>
            <Field id={`section-${index}-heading`} label={entry.labels.heading} error={errors.sections?.[index]?.heading?.message}>
              <input id={`section-${index}-heading`} className={controlClass} {...register(`sections.${index}.heading`)} />
            </Field>
            <Field id={`section-${index}-body`} label={entry.labels.body} error={errors.sections?.[index]?.body?.message}>
              <textarea id={`section-${index}-body`} rows={4} className={cn(controlClass, "h-auto py-3")} {...register(`sections.${index}.body`)} />
            </Field>
          </div>
        ))}
        {errors.sections?.message && <p className="text-xs text-down">{errors.sections.message}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <GradientButton variant="dark" size="sm" onClick={() => sections.append({ heading: "", body: "" })} disabled={sections.fields.length >= 30}>
          <Plus className="size-3.5" />
          Add Section
        </GradientButton>
        <GradientButton type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save Content"}
        </GradientButton>
      </div>
    </form>
  );
};

export const ContentManager = ({ documents }) => {
  const [editing, setEditing] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const restore = useActionSubmit({ action: restoreDefaultContent, successMessage: "Default content restored.", onSuccess: () => setRestoring(null) });
  const groups = [...new Set(documents.map((doc) => doc.group))];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
        {groups.map((group) => (
          <GlowCard key={group} as="section" aria-labelledby={`content-${group}`} className="overflow-hidden">
            <CardHeader id={`content-${group}`} title={group} />
            <ul className="divide-y divide-white/5">
              {documents
                .filter((doc) => doc.group === group)
                .map((doc) => (
                  <li key={doc.key} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white">{doc.content.title}</span>
                      <span className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                        {doc.content.updatedAt ? <StatusBadge tone="brand">Edited {dateFormat.format(new Date(doc.content.updatedAt))}</StatusBadge> : <StatusBadge>Default</StatusBadge>}
                        {doc.content.sections.length} section(s)
                      </span>
                    </span>
                    <span className="inline-flex gap-2">
                      <IconButton label={`Edit ${doc.content.title}`} onClick={() => setEditing(doc)}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label={`Restore default ${doc.content.title}`} disabled={!doc.content.updatedAt} onClick={() => setRestoring(doc)}>
                        <RotateCcw className="size-4" />
                      </IconButton>
                    </span>
                  </li>
                ))}
            </ul>
          </GlowCard>
        ))}
      </div>
      <FormDialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} title={editing ? `Edit ${editing.content.title}` : ""} description={editing?.group}>
        {editing && <ContentForm key={editing.key} entry={editing} onDone={() => setEditing(null)} />}
      </FormDialog>
      <ConfirmDialog
        open={Boolean(restoring)}
        onOpenChange={(open) => !open && setRestoring(null)}
        title="Restore default content"
        description={`"${restoring?.content.title}" will go back to the original text. Your edits will be lost.`}
        confirmLabel="Restore"
        tone="down"
        pending={restore.pending}
        onConfirm={() => restore.submit(restoring.key)}
      />
    </>
  );
};
