"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  deleteSponsor,
  moveSponsor,
  saveSponsor,
} from "@/app/(admin)/admin/(protected)/sponsors/actions";
import type { ShopSponsor } from "@/lib/sponsors";
import { acceptedImageTypes } from "@/lib/product-input";

const fieldClassName =
  "h-11 w-full rounded-full border border-line bg-background px-4 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function SponsorForm({
  sponsor,
  onDone,
}: {
  sponsor?: ShopSponsor;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await saveSponsor(new FormData(event.currentTarget));
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    event.currentTarget.reset();
    onDone?.();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-[1.5rem] border border-line bg-surface p-4 sm:p-5">
      {sponsor ? <input type="hidden" name="id" value={sponsor.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Name</span>
          <input name="name" required defaultValue={sponsor?.name} className={fieldClassName} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Display order</span>
          <input
            name="displayOrder"
            type="number"
            min={0}
            max={9999}
            defaultValue={sponsor?.displayOrder ?? 0}
            className={fieldClassName}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Website <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          name="websiteUrl"
          defaultValue={sponsor?.websiteUrl ?? ""}
          placeholder="https://"
          className={fieldClassName}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Short description <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          name="description"
          defaultValue={sponsor?.description ?? ""}
          className={fieldClassName}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Logo {sponsor ? <span className="font-normal text-muted">(optional replacement)</span> : null}
        </span>
        <input name="image" type="file" accept={acceptedImageTypes.join(",")} required={!sponsor} className="text-sm" />
      </label>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input name="active" type="checkbox" defaultChecked={sponsor?.active ?? true} />
        Show on the homepage
      </label>
      {error ? (
        <p role="alert" className="text-sm text-accent-deep">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? "Saving…" : sponsor ? "Save sponsor" : "Add sponsor"}
        </button>
        {onDone ? (
          <button type="button" onClick={onDone} className="inline-flex h-11 items-center rounded-full px-4 text-sm">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function SponsorManager({ sponsors }: { sponsors: ShopSponsor[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setError("");
    const result = await action();

    if (!result.ok) {
      setError(result.message ?? "Please try again.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-8 grid gap-6">
      <SponsorForm />
      {error ? (
        <p role="alert" className="text-sm text-accent-deep">
          {error}
        </p>
      ) : null}
      <ul className="grid gap-3">
        {sponsors.map((sponsor, index) => (
          <li key={sponsor.id} className="rounded-[1.5rem] border border-line bg-surface p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- sponsor logos are stored public images */}
              <img src={sponsor.logoUrl} alt="" className="size-16 rounded-2xl bg-background object-contain" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl text-ink">{sponsor.name}</p>
                <p className="text-sm text-muted">
                  {sponsor.active ? "Visible" : "Hidden"} · order {sponsor.displayOrder}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="h-10 rounded-full px-3 text-sm" onClick={() => run(() => moveSponsor(sponsor.id, "up"))} disabled={index === 0}>
                  Up
                </button>
                <button type="button" className="h-10 rounded-full px-3 text-sm" onClick={() => run(() => moveSponsor(sponsor.id, "down"))} disabled={index === sponsors.length - 1}>
                  Down
                </button>
                <button type="button" className="h-10 rounded-full px-3 text-sm" onClick={() => setEditing(editing === sponsor.id ? null : sponsor.id)}>
                  Edit
                </button>
                <button type="button" className="h-10 rounded-full px-3 text-sm text-accent-deep" onClick={() => run(() => deleteSponsor(sponsor.id))}>
                  Delete
                </button>
              </div>
            </div>
            {editing === sponsor.id ? (
              <div className="mt-4">
                <SponsorForm sponsor={sponsor} onDone={() => setEditing(null)} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
