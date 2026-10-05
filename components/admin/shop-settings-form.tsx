"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ShopSettings } from "@/app/(admin)/admin/(protected)/settings/actions";
import { updateShopSettings } from "@/app/(admin)/admin/(protected)/settings/actions";
import { ShopPhoneFields, shopPhoneDrafts } from "@/components/admin/shop-phone-fields";
import { parseShopSettings } from "@/lib/shop-input";
import { appendShopPhones, parseShopPhones } from "@/lib/shop-phones";
import { acceptedImageTypes, imageFileMessage } from "@/lib/product-input";

const fieldClassName =
  "h-11 w-full rounded-full border border-line bg-background px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60";

export function ShopSettingsForm({ settings }: { settings: ShopSettings }) {
  const router = useRouter();
  const canEdit = settings.canEdit;
  const [name, setName] = useState(settings.name);
  const [description, setDescription] = useState(settings.description);
  const [phones, setPhones] = useState(() => shopPhoneDrafts(settings.phones));
  const [address, setAddress] = useState(settings.address);
  const [email, setEmail] = useState(settings.email);
  const [businessHours, setBusinessHours] = useState(settings.businessHours);
  const [mapsUrl, setMapsUrl] = useState(settings.mapsUrl);
  const [latitude, setLatitude] = useState(settings.latitude);
  const [longitude, setLongitude] = useState(settings.longitude);
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const previewUrl = useRef<string | null>(null);
  const preview = objectUrl ?? settings.logoUrl;

  useEffect(() => {
    return () => {
      if (previewUrl.current) {
        URL.revokeObjectURL(previewUrl.current);
      }
    };
  }, []);

  function onLogoChange(next: File | null) {
    if (!canEdit) {
      return;
    }

    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }

    setFile(next);

    if (!next) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(next);
    previewUrl.current = url;
    setObjectUrl(url);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit || pending) {
      return;
    }

    setError("");
    setNotice("");

    const parsed = parseShopSettings({
      name,
      description,
      address,
      email,
      businessHours,
      mapsUrl,
      latitude,
      longitude,
    });

    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }

    const parsedPhones = parseShopPhones(phones);

    if (!parsedPhones.ok) {
      setError(parsedPhones.message);
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
    formData.set("address", address);
    formData.set("email", email);
    formData.set("businessHours", businessHours);
    formData.set("mapsUrl", mapsUrl);
    formData.set("latitude", latitude);
    formData.set("longitude", longitude);

    appendShopPhones(formData, parsedPhones.value);

    if (file) {
      formData.set("logo", file);
    }

    setPending(true);
    const result = await updateShopSettings(formData);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }

    setFile(null);
    setObjectUrl(null);
    setNotice("Shop settings saved.");
    router.refresh();
  }

  return (
    <form className="mt-8 max-w-2xl space-y-5" onSubmit={onSubmit}>
      {canEdit ? null : (
        <p className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-6 text-muted">
          Only the shop owner can change these settings.
        </p>
      )}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Shop name</span>
        <input
          name="name"
          required
          value={name}
          disabled={!canEdit || pending}
          onChange={(event) => setName(event.target.value)}
          className={fieldClassName}
        />
      </label>
      <p className="text-sm leading-6 text-muted">
        Public address slug: {settings.slug}. It cannot be changed here.
      </p>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Description <span className="font-normal text-muted">(optional)</span>
        </span>
        <textarea
          name="description"
          rows={4}
          value={description}
          disabled={!canEdit || pending}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full rounded-2xl border border-line bg-background px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Logo <span className="font-normal text-muted">(optional)</span>
        </span>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- shop logos use the stored public image URL
          <img src={preview} alt="" className="mb-3 size-16 rounded-full object-cover" />
        ) : (
          <p className="mb-3 text-sm text-muted">No logo yet. The mark in the header stays in place.</p>
        )}
        {canEdit ? (
          <input
            type="file"
            accept={acceptedImageTypes.join(",")}
            disabled={pending}
            onChange={(event) => onLogoChange(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink"
          />
        ) : null}
      </label>
      <ShopPhoneFields phones={phones} disabled={!canEdit || pending} onChange={setPhones} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Email <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          type="email"
          name="email"
          value={email}
          disabled={!canEdit || pending}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClassName}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Address <span className="font-normal text-muted">(optional)</span>
        </span>
        <textarea
          name="address"
          rows={3}
          value={address}
          disabled={!canEdit || pending}
          onChange={(event) => setAddress(event.target.value)}
          className="w-full rounded-2xl border border-line bg-background px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Google Maps link <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          name="mapsUrl"
          value={mapsUrl}
          disabled={!canEdit || pending}
          onChange={(event) => setMapsUrl(event.target.value)}
          placeholder="https://maps.google.com/..."
          className={fieldClassName}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Latitude <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            name="latitude"
            inputMode="decimal"
            value={latitude}
            disabled={!canEdit || pending}
            onChange={(event) => setLatitude(event.target.value)}
            className={fieldClassName}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Longitude <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            name="longitude"
            inputMode="decimal"
            value={longitude}
            disabled={!canEdit || pending}
            onChange={(event) => setLongitude(event.target.value)}
            className={fieldClassName}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Business hours <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          name="businessHours"
          value={businessHours}
          disabled={!canEdit || pending}
          onChange={(event) => setBusinessHours(event.target.value)}
          className={fieldClassName}
        />
      </label>
      {notice ? (
        <p role="status" className="text-sm leading-6 text-ink">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm leading-6 text-accent-deep">
          {error}
        </p>
      ) : null}
      {canEdit ? (
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-accent-strong px-5 text-sm font-medium text-accent-foreground transition hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
      ) : null}
    </form>
  );
}
