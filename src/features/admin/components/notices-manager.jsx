"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Pencil, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, controlClass } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { GradientButton } from "@/components/ui/gradient-button";
import { SelectMenu } from "@/components/ui/select-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { cn } from "@/lib/utils";
import { removeNotice, upsertNotice } from "@/features/admin/actions/content-actions";
import { noticeCategories, noticeSchema } from "@/features/admin/schemas/admin-schema";

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

const categoryOptions = noticeCategories.map((category) => ({ value: category, label: category }));

const columns = [
  { key: "title", header: "Title", sortable: true },
  { key: "category", header: "Category", hideBelow: "sm" },
  { key: "date", header: "Date", sortable: true, hideBelow: "md" },
  { key: "status", header: "Status" },
  { key: "actions", header: <span className="sr-only">Actions</span>, align: "right" },
];

const emptyNotice = { title: "", category: "Announcement", summary: "", body: "", published: true };

const iconButton = "inline-flex size-8 items-center justify-center rounded-lg border border-white/10 text-neutral-300 disabled:opacity-50";

const NoticeForm = ({ notice, onDone }) => {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(noticeSchema),
    defaultValues: notice ? { id: notice.id, title: notice.title, category: notice.category, summary: notice.summary, body: notice.body.join("\n\n"), published: notice.published } : emptyNotice,
  });
  const { pending, submit } = useActionSubmit({ action: upsertNotice, setError, successMessage: notice ? "Notice updated." : "Notice created.", onSuccess: onDone });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <Field id="notice-title" label="Title" error={errors.title?.message}>
          <input id="notice-title" aria-invalid={Boolean(errors.title)} className={controlClass} {...register("title")} />
        </Field>
        <Field id="notice-category" label="Category" error={errors.category?.message}>
          <Controller name="category" control={control} render={({ field }) => <SelectMenu id="notice-category" options={categoryOptions} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
        </Field>
      </div>
      <Field id="notice-summary" label="Summary" hint="Shown in the scrolling notice bar and the notice list." error={errors.summary?.message}>
        <input id="notice-summary" aria-invalid={Boolean(errors.summary)} className={controlClass} {...register("summary")} />
      </Field>
      <Field id="notice-body" label="Body" hint="Separate paragraphs with an empty line." error={errors.body?.message}>
        <textarea id="notice-body" rows={8} aria-invalid={Boolean(errors.body)} className={cn(controlClass, "h-auto py-3")} {...register("body")} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <Controller name="published" control={control} render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
        Published (visible to everyone)
      </label>
      <GradientButton type="submit" disabled={pending} className="self-end">
        {pending ? "Saving…" : notice ? "Save Changes" : "Create Notice"}
      </GradientButton>
    </form>
  );
};

export const NoticesManager = ({ notices }) => {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const handleClose = () => setEditing(null);
  const remove = useActionSubmit({ action: removeNotice, successMessage: "Notice deleted.", onSuccess: () => setDeleting(null) });

  const rows = notices.map((notice) => ({
    id: notice.id,
    searchText: `${notice.title} ${notice.category} ${notice.summary}`,
    sortValues: { title: notice.title, date: notice.date },
    cells: {
      title: (
        <span className="block min-w-0">
          <span className="block max-w-xs truncate text-white">{notice.title}</span>
          <span className="block max-w-xs truncate text-xs text-neutral-500">{notice.summary}</span>
        </span>
      ),
      category: <StatusBadge tone="brand">{notice.category}</StatusBadge>,
      date: <span className="text-neutral-400">{dateFormat.format(new Date(notice.date))}</span>,
      status: <StatusBadge tone={notice.published ? "success" : "neutral"}>{notice.published ? "Published" : "Draft"}</StatusBadge>,
      actions: (
        <span className="inline-flex gap-2">
          <button type="button" aria-label={`Edit ${notice.title}`} className={iconButton} onClick={() => setEditing(notice)}>
            <Pencil className="size-4" />
          </button>
          <button type="button" aria-label={`Delete ${notice.title}`} className={iconButton} onClick={() => setDeleting(notice)}>
            <Trash2 className="size-4 text-down" />
          </button>
        </span>
      ),
    },
  }));

  return (
    <>
      <DataTable
        title={`Notices (${notices.length})`}
        titleId="notices-title"
        filters={
          <GradientButton size="xs" onClick={() => setEditing("new")}>
            <Plus className="size-3.5" />
            New Notice
          </GradientButton>
        }
        searchPlaceholder="Search notices"
        columns={columns}
        rows={rows}
        initialSort={{ key: "date", direction: "desc" }}
        emptyState={<EmptyState icon={Bell} title="No notices" text="Create a notice to show it in the notice bar and notice center." />}
      />
      <FormDialog open={Boolean(editing)} onOpenChange={(open) => !open && handleClose()} title={editing === "new" ? "New notice" : "Edit notice"} description="Published notices appear on the home page and in Notices immediately.">
        {editing && <NoticeForm key={editing === "new" ? "new" : editing.id} notice={editing === "new" ? null : editing} onDone={handleClose} />}
      </FormDialog>
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete notice"
        description={`"${deleting?.title}" will be removed for everyone. This cannot be undone.`}
        confirmLabel="Delete"
        tone="down"
        pending={remove.pending}
        onConfirm={() => remove.submit(deleting.id)}
      />
    </>
  );
};
