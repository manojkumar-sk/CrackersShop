"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import type { AdminCategory } from "@/lib/admin";
import { parseCategoryFields } from "@/lib/category-input";
import { acceptedImageTypes, imageFileMessage } from "@/lib/product-input";

const fieldClassName =
  "h-11 w-full rounded-full border border-line bg-background px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60";

export function CategoryForm({
  category,
  action,
}: {
  category?: AdminCategory;
  action: (formData: FormData) => Promise<{ ok: false; message: string }>;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [active, setActive] = useState(category?.active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(category?.imageUrl ?? null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const previewUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl.current) {
        URL.revokeObjectURL(previewUrl.current);
      }
    };
  }, []);

  function onImageChange(next: File | null) {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }

    setFile(next);

    if (!next) {
      setPreview(category?.imageUrl ?? null);
      return;
    }

    const url = URL.createObjectURL(next);
    previewUrl.current = url;
    setPreview(url);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsed = parseCategoryFields({ name, description, active });

    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }

    if (file) {
      const imageError = imageFileMessage(file);
      if (imageError) {
        setError(imageError);
        return;
      }
    }

    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    if (active) {
      formData.set("active", "on");
    }
    if (file) {
      formData.set("image", file);
    }

    setPending(true);
    const result = await action(formData);
    setError(result.message);
    setPending(false);
  }

  return (
    <form className="mt-8 max-w-2xl space-y-5" onSubmit={onSubmit}>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Category name
        </span>
        <input
          name="name"
          required
          value={name}
          disabled={pending}
          onChange={(event) => setName(event.target.value)}
          className={fieldClassName}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Description
        </span>
        <textarea
          name="description"
          value={description}
          disabled={pending}
          rows={5}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full rounded-2xl border border-line bg-background px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
      </label>
      <label className="flex items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          name="active"
          checked={active}
          disabled={pending}
          onChange={(event) => setActive(event.target.checked)}
          className="size-5 accent-accent-strong"
        />
        Active on the storefront
      </label>
      <div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Category image
          </span>
          <input
            type="file"
            name="image"
            accept={acceptedImageTypes.join(",")}
            disabled={pending}
            onChange={(event) => onImageChange(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:h-11 file:rounded-full file:border-0 file:bg-accent-strong file:px-4 file:text-sm file:font-medium file:text-accent-foreground"
          />
        </label>
        <p className="mt-2 text-sm text-muted">JPG, PNG, or WEBP. Up to 5 MB.</p>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview can be a local file URL before upload
          <img
            src={preview}
            alt={
              category ? `Current image for ${category.name}` : "Selected category image"
            }
            className="mt-4 aspect-[4/3] w-full max-w-sm rounded-2xl border border-line object-cover"
          />
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm leading-6 text-accent-deep">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        >
          {pending
            ? file
              ? "Uploading…"
              : "Saving…"
            : category
              ? "Save changes"
              : "Add category"}
        </button>
        <ButtonLink href="/admin/categories" variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
