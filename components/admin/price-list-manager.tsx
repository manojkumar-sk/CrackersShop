"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  deleteOfficialPriceList,
  saveOfficialPriceList,
} from "@/app/(admin)/admin/(protected)/price-list/actions";
import { priceListDownloadUrl, priceListFileMessage, type OfficialPriceList } from "@/lib/price-list";

const fieldClassName =
  "block w-full text-sm text-ink file:mr-3 file:h-10 file:rounded-full file:border-0 file:bg-accent-strong file:px-4 file:text-sm file:font-medium file:text-accent-foreground";

export function PriceListManager({
  priceList,
  uploadedLabel,
}: {
  priceList: OfficialPriceList | null;
  uploadedLabel: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("pdf");

    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a PDF to upload.");
      return;
    }

    const message = priceListFileMessage(file);

    if (message) {
      setError(message);
      return;
    }

    setPending(true);
    setError("");
    const result = await saveOfficialPriceList(new FormData(form));
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    form.reset();
    router.refresh();
  }

  async function onDelete() {
    setPending(true);
    setError("");
    const result = await deleteOfficialPriceList();
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-8 grid max-w-2xl gap-6">
      <section className="rounded-[1.5rem] border border-line bg-white p-5 sm:p-6">
        <h2 className="font-display text-2xl text-ink">Current PDF</h2>
        {priceList ? (
          <div className="mt-4">
            <p className="text-sm text-muted">A price list is uploaded.</p>
            <p className="mt-2 font-medium break-all text-ink">{priceList.fileName}</p>
            {uploadedLabel ? (
              <p className="mt-1 text-sm text-muted">Uploaded {uploadedLabel}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={priceList.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Open PDF
              </a>
              <a
                href={priceListDownloadUrl(priceList.fileUrl, priceList.fileName)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-surface px-5 text-sm font-medium text-ink ring-1 ring-line hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Download PDF
              </a>
              <button
                type="button"
                disabled={pending}
                onClick={onDelete}
                className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-accent-deep hover:bg-[#fffaf3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
              >
                Remove PDF
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-muted">
            No official price list is uploaded yet. Customers will not see a download link until one is added.
          </p>
        )}
      </section>
      <form onSubmit={onUpload} className="rounded-[1.5rem] border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-display text-2xl text-ink">
          {priceList ? "Replace PDF" : "Upload PDF"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          PDF files only, up to 10 MB. This file is separate from the product prices on the shop.
        </p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Price list PDF</span>
          <input
            name="pdf"
            type="file"
            accept="application/pdf,.pdf"
            required
            className={fieldClassName}
          />
        </label>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-accent-deep">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        >
          {pending ? "Saving…" : priceList ? "Replace PDF" : "Upload PDF"}
        </button>
      </form>
    </div>
  );
}
