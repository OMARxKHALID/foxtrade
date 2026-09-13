"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, controlClass } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { GradientButton } from "@/components/ui/gradient-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { removeBanner, upsertBanner } from "@/features/admin/actions/content-actions";
import { bannerSchema } from "@/features/admin/schemas/admin-schema";

const columns = [
  { key: "order", header: "#", sortable: true },
  { key: "title", header: "Banner", sortable: true },
  { key: "cta", header: "Button", hideBelow: "md" },
  { key: "status", header: "Status" },
  { key: "actions", header: <span className="sr-only">Actions</span>, align: "right" },
];

const iconButton = "inline-flex size-8 items-center justify-center rounded-lg border border-white/10 text-neutral-300";

const BannerForm = ({ banner, nextOrder, onDone }) => {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bannerSchema),
    defaultValues: banner
      ? { id: banner.id, eyebrow: banner.eyebrow, title: banner.title, text: banner.text, ctaLabel: banner.cta.label, ctaHref: banner.cta.href, active: banner.active, order: banner.order }
      : { eyebrow: "", title: "", text: "", ctaLabel: "", ctaHref: "/", active: true, order: nextOrder },
  });
  const { pending, submit } = useActionSubmit({ action: upsertBanner, setError, successMessage: banner ? "Banner updated." : "Banner created.", onSuccess: onDone });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_6rem]">
        <Field id="banner-eyebrow" label="Label" error={errors.eyebrow?.message}>
          <input id="banner-eyebrow" aria-invalid={Boolean(errors.eyebrow)} className={controlClass} {...register("eyebrow")} />
        </Field>
        <Field id="banner-order" label="Order" error={errors.order?.message}>
          <input id="banner-order" type="number" min="0" aria-invalid={Boolean(errors.order)} className={controlClass} {...register("order")} />
        </Field>
      </div>
      <Field id="banner-title" label="Title" error={errors.title?.message}>
        <input id="banner-title" aria-invalid={Boolean(errors.title)} className={controlClass} {...register("title")} />
      </Field>
      <Field id="banner-text" label="Description" error={errors.text?.message}>
        <input id="banner-text" aria-invalid={Boolean(errors.text)} className={controlClass} {...register("text")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="banner-cta-label" label="Button label" error={errors.ctaLabel?.message}>
          <input id="banner-cta-label" aria-invalid={Boolean(errors.ctaLabel)} className={controlClass} {...register("ctaLabel")} />
        </Field>
        <Field id="banner-cta-href" label="Button link" hint="Internal path, e.g. /markets" error={errors.ctaHref?.message}>
          <input id="banner-cta-href" aria-invalid={Boolean(errors.ctaHref)} className={controlClass} {...register("ctaHref")} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <Controller name="active" control={control} render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} onBlur={field.onBlur} />} />
        Show on the home page
      </label>
      <GradientButton type="submit" disabled={pending} className="self-end">
        {pending ? "Saving…" : banner ? "Save Changes" : "Create Banner"}
      </GradientButton>
    </form>
  );
};

export const BannersManager = ({ banners }) => {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const handleClose = () => setEditing(null);
  const remove = useActionSubmit({ action: removeBanner, successMessage: "Banner deleted.", onSuccess: () => setDeleting(null) });
  const nextOrder = banners.reduce((max, banner) => Math.max(max, banner.order + 1), 0);

  const rows = banners.map((banner) => ({
    id: banner.id,
    searchText: `${banner.title} ${banner.eyebrow}`,
    sortValues: { order: banner.order, title: banner.title },
    cells: {
      order: <span className="text-neutral-400 tabular-nums">{banner.order}</span>,
      title: (
        <span className="block min-w-0">
          <span className="block text-xs text-brand">{banner.eyebrow}</span>
          <span className="block max-w-xs truncate text-white">{banner.title}</span>
        </span>
      ),
      cta: (
        <span className="text-neutral-400">
          {banner.cta.label} → <span className="font-mono text-xs">{banner.cta.href}</span>
        </span>
      ),
      status: <StatusBadge tone={banner.active ? "success" : "neutral"}>{banner.active ? "Active" : "Hidden"}</StatusBadge>,
      actions: (
        <span className="inline-flex gap-2">
          <button type="button" aria-label={`Edit ${banner.title}`} className={iconButton} onClick={() => setEditing(banner)}>
            <Pencil className="size-4" />
          </button>
          <button type="button" aria-label={`Delete ${banner.title}`} className={iconButton} onClick={() => setDeleting(banner)}>
            <Trash2 className="size-4 text-down" />
          </button>
        </span>
      ),
    },
  }));

  return (
    <>
      <DataTable
        title={`Banners (${banners.length})`}
        titleId="banners-title"
        filters={
          <GradientButton size="xs" onClick={() => setEditing("new")}>
            <Plus className="size-3.5" />
            New Banner
          </GradientButton>
        }
        searchPlaceholder="Search banners"
        columns={columns}
        rows={rows}
        initialSort={{ key: "order", direction: "asc" }}
        emptyState={<EmptyState icon={ImageIcon} title="No banners" text="Active banners rotate in the home page carousel." />}
      />
      <FormDialog open={Boolean(editing)} onOpenChange={(open) => !open && handleClose()} title={editing === "new" ? "New banner" : "Edit banner"} description="Active banners rotate on the home page in order.">
        {editing && <BannerForm key={editing === "new" ? "new" : editing.id} banner={editing === "new" ? null : editing} nextOrder={nextOrder} onDone={handleClose} />}
      </FormDialog>
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete banner"
        description={`"${deleting?.title}" will be removed from the home page.`}
        confirmLabel="Delete"
        tone="down"
        pending={remove.pending}
        onConfirm={() => remove.submit(deleting.id)}
      />
    </>
  );
};
