"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ShopPhoneFields, shopPhoneDrafts } from "@/components/admin/shop-phone-fields";
import { ButtonLink } from "@/components/ui/button-link";
import type { ShopDraft } from "@/app/(admin)/admin/(protected)/shops/actions";
import { parseShopFields } from "@/lib/shop-input";
import { appendShopPhones, parseShopPhones } from "@/lib/shop-phones";
import { acceptedImageTypes, imageFileMessage, slugFromName } from "@/lib/product-input";

const fieldClassName =
  "h-11 w-full rounded-full border border-line bg-background px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60";

export function ShopForm({
  shop,
  action,
  hostSuffix,
}: {
  shop?: ShopDraft;
  action: (formData: FormData) => Promise<{ ok: false; message: string }>;
  hostSuffix: string | null;
}) {
  const [name, setName] = useState(shop?.name ?? "");
  const [slug, setSlug] = useState(shop?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(shop));
  const [description, setDescription] = useState(shop?.description ?? "");
  const [phones, setPhones] = useState(() => shopPhoneDrafts(shop?.phones ?? []));
  const [address, setAddress] = useState(shop?.address ?? "");
  const [email, setEmail] = useState(shop?.email ?? "");
  const [businessHours, setBusinessHours] = useState(shop?.businessHours ?? "");
  const [active, setActive] = useState(shop?.active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(shop?.logoUrl ?? null);
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

  function onLogoChange(next: File | null) {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }

    setFile(next);

    if (!next) {
      setPreview(shop?.logoUrl ?? null);
      return;
    }

    const url = URL.createObjectURL(next);
    previewUrl.current = url;
    setPreview(url);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsed = parseShopFields({
      name,
      slug,
      description,
      address,
      email,
      businessHours,
      active: shop ? active : true,
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
    formData.set("slug", slug);
    formData.set("description", description);
    formData.set("address", address);
    appendShopPhones(formData, parsedPhones.value);
    formData.set("email", email);
    formData.set("businessHours", businessHours);

    if (shop && active) {
      formData.set("active", "on");
    }

    if (file) {
      formData.set("logo", file);
    }

    setPending(true);
    const result = await action(formData);
    setError(result.message);
    setPending(false);
  }

  return (
    <form className="mt-8 max-w-2xl space-y-5" onSubmit={onSubmit}>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Shop name</span>
        <input
          name="name"
          required
          value={name}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.value;
            setName(next);

            if (!slugTouched) {
              setSlug(slugFromName(next));
            }
          }}
          className={fieldClassName}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Slug</span>
        <input
          name="slug"
          required
          value={slug}
          disabled={pending}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value.toLowerCase());
          }}
          className={fieldClassName}
        />
        <span className="mt-1.5 block text-xs leading-5 text-muted">
          {hostSuffix
            ? `This becomes the shop address, such as ${slug || "shop-name"}${hostSuffix}.`
            : "This slug is the shop address. The platform domain is not configured."}
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Description <span className="font-normal text-muted">(optional)</span>
        </span>
        <textarea
          name="description"
          rows={4}
          value={description}
          disabled={pending}
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
        ) : null}
        <input
          type="file"
          accept={acceptedImageTypes.join(",")}
          disabled={pending}
          onChange={(event) => onLogoChange(event.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink"
        />
      </label>
      <ShopPhoneFields phones={phones} disabled={pending} onChange={setPhones} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Email <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          type="email"
          name="email"
          value={email}
          disabled={pending}
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
          disabled={pending}
          onChange={(event) => setAddress(event.target.value)}
          className="w-full rounded-2xl border border-line bg-background px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Business hours <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          name="businessHours"
          value={businessHours}
          disabled={pending}
          onChange={(event) => setBusinessHours(event.target.value)}
          className={fieldClassName}
        />
      </label>
      {shop ? (
        <label className="flex items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={active}
            disabled={pending}
            onChange={(event) => setActive(event.target.checked)}
            className="size-4 accent-accent-strong"
          />
          Active on the public storefront
        </label>
      ) : null}
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
          {pending ? "Saving…" : shop ? "Save shop" : "Create shop"}
        </button>
        <ButtonLink href="/admin/shops" variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
