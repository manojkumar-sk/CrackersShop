"use client";

import { useState, type FormEvent } from "react";
import {
  deleteSlide,
  moveSlide,
  saveSlide,
  setSlideActive,
} from "@/app/(admin)/admin/(protected)/slideshow/actions";
import type { ShopSlide } from "@/lib/slides";

const fieldClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const emptyForm = {
  slideId: "",
  heading: "",
  description: "",
  primaryLabel: "",
  primaryHref: "/products",
  secondaryLabel: "",
  secondaryHref: "",
  active: true,
  displayOrder: "1",
  imageUrl: "",
};

export function SlideshowManager({ slides }: { slides: ShopSlide[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [deleteId, setDeleteId] = useState("");

  function startAdd() {
    const nextOrder =
      slides.reduce((highest, slide) => Math.max(highest, slide.displayOrder), -1) + 1;

    setForm({ ...emptyForm, displayOrder: String(Math.max(nextOrder, 1)) });
    setPreview("");
    setError("");
    setMessage("");
    setOpen(true);
  }

  function startEdit(slide: ShopSlide) {
    setForm({
      slideId: slide.id,
      heading: slide.heading,
      description: slide.description,
      primaryLabel: slide.primaryLabel,
      primaryHref: slide.primaryHref,
      secondaryLabel: slide.secondaryLabel ?? "",
      secondaryHref: slide.secondaryHref ?? "",
      active: slide.active,
      displayOrder: String(slide.displayOrder),
      imageUrl: slide.imageUrl,
    });
    setPreview(slide.imageUrl);
    setError("");
    setMessage("");
    setOpen(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const result = await saveSlide(new FormData(event.currentTarget));
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setOpen(false);
    setMessage(form.slideId ? "Slide updated." : "Slide saved.");
  }

  async function run(id: string, action: () => Promise<{ ok: boolean; message?: string }>) {
    setPendingId(id);
    setError("");
    setMessage("");
    const result = await action();
    setPendingId("");

    if (!result.ok) {
      setError(result.message ?? "We could not update that slide.");
    }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted">
          {slides.length} {slides.length === 1 ? "slide" : "slides"}. Only active
          slides appear on the homepage, in this order.
        </p>
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Add Slide
        </button>
      </div>
      {message ? (
        <p role="status" className="mt-4 text-sm text-ink">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm text-accent-deep">
          {error}
        </p>
      ) : null}
      {open ? (
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="mt-6 grid gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
        >
          <div>
            <h2 className="font-display text-2xl text-ink">
              {form.slideId ? "Edit slide" : "Add slide"}
            </h2>
            <label className="mt-5 block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Banner image</span>
              <input
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setPreview(file ? URL.createObjectURL(file) : form.imageUrl);
                }}
                className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-medium file:text-background"
              />
              <span className="mt-1 block text-xs text-muted">
                Wide banners work best. JPG, PNG, or WEBP, up to 5 MB.
                {form.slideId ? " Leave this empty to keep the current image." : ""}
              </span>
            </label>
            <div className="mt-4 overflow-hidden rounded-2xl bg-ink">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview or stored banner
                <img
                  src={preview}
                  alt=""
                  className="aspect-[16/7] w-full object-cover"
                />
              ) : (
                <div className="grid aspect-[16/7] place-items-center text-sm text-background/70">
                  Banner preview
                </div>
              )}
            </div>
          </div>
          <div className="grid content-start gap-4">
            <input type="hidden" name="slideId" value={form.slideId} />
            <label>
              <span className="mb-1.5 block text-sm font-medium text-ink">Heading</span>
              <input
                required
                name="heading"
                value={form.heading}
                onChange={(event) => setForm({ ...form, heading: event.target.value })}
                className={fieldClassName}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-ink">Description</span>
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Primary button text
              </span>
              <input
                required
                name="primaryLabel"
                value={form.primaryLabel}
                onChange={(event) =>
                  setForm({ ...form, primaryLabel: event.target.value })
                }
                className={fieldClassName}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Primary button link
              </span>
              <input
                required
                name="primaryHref"
                value={form.primaryHref}
                onChange={(event) =>
                  setForm({ ...form, primaryHref: event.target.value })
                }
                className={fieldClassName}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Secondary button text
              </span>
              <input
                name="secondaryLabel"
                value={form.secondaryLabel}
                onChange={(event) =>
                  setForm({ ...form, secondaryLabel: event.target.value })
                }
                className={fieldClassName}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Secondary button link
              </span>
              <input
                name="secondaryHref"
                value={form.secondaryHref}
                onChange={(event) =>
                  setForm({ ...form, secondaryHref: event.target.value })
                }
                className={fieldClassName}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-ink">Display order</span>
              <input
                required
                name="displayOrder"
                inputMode="numeric"
                value={form.displayOrder}
                onChange={(event) =>
                  setForm({ ...form, displayOrder: event.target.value })
                }
                className={fieldClassName}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
                className="size-4"
              />
              Active
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-background disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save slide"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-ink ring-1 ring-line"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : null}
      {slides.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <h2 className="font-display text-2xl text-ink">No slides yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Add a banner to replace the homepage fallback. Inactive slides stay
            here and stay off the public page.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {slides.map((slide, index) => (
            <li
              key={slide.id}
              className="grid gap-4 rounded-3xl border border-line bg-surface p-4 sm:grid-cols-[16rem_minmax(0,1fr)] sm:p-5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- stored banner preview */}
              <img
                src={slide.imageUrl}
                alt=""
                className="aspect-[16/7] w-full rounded-2xl object-cover sm:aspect-[16/9]"
              />
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl text-ink">{slide.heading}</h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      slide.active
                        ? "bg-[#e7f3df] text-[#245214]"
                        : "bg-background text-muted"
                    }`}
                  >
                    {slide.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">Order: {slide.displayOrder}</p>
                {slide.description ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {slide.description}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(slide)}
                    className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-medium text-background"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === slide.id}
                    onClick={() =>
                      void run(slide.id, () => setSlideActive(slide.id, !slide.active))
                    }
                    className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-ink ring-1 ring-line disabled:opacity-60"
                  >
                    {slide.active ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    disabled={index === 0 || pendingId === slide.id}
                    onClick={() => void run(slide.id, () => moveSlide(slide.id, "up"))}
                    className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-ink ring-1 ring-line disabled:opacity-60"
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    disabled={index === slides.length - 1 || pendingId === slide.id}
                    onClick={() => void run(slide.id, () => moveSlide(slide.id, "down"))}
                    className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-ink ring-1 ring-line disabled:opacity-60"
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(slide.id)}
                    className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-accent-deep"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {deleteId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-slide-title"
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-6"
          >
            <h2 id="delete-slide-title" className="font-display text-2xl text-ink">
              Delete this slide?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              The banner leaves the homepage. Its image is removed when no other
              slide still uses it.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const id = deleteId;
                  setPending(true);
                  void deleteSlide(id).then((result) => {
                    setPending(false);
                    setDeleteId("");

                    if (!result.ok) {
                      setError(result.message);
                      return;
                    }

                    setMessage("Slide deleted.");
                  });
                }}
                className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground disabled:opacity-60"
              >
                Delete slide
              </button>
              <button
                type="button"
                onClick={() => setDeleteId("")}
                className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-ink ring-1 ring-line"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
