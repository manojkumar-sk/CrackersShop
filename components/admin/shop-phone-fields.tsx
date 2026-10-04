"use client";

import { formatShopPhone } from "@/lib/site";
import {
  normalizeShopPhone,
  withPrimaryWhatsApp,
  type ShopPhone,
} from "@/lib/shop-phones";

export type ShopPhoneDraft = ShopPhone & {
  key: string;
};

const fieldClassName =
  "h-11 w-full min-w-0 rounded-full border border-line bg-background px-4 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60";

export function shopPhoneDrafts(phones: ShopPhone[]): ShopPhoneDraft[] {
  return phones.map((phone) => ({
    ...phone,
    key: crypto.randomUUID(),
  }));
}

export function ShopPhoneFields({
  phones,
  onChange,
  disabled,
}: {
  phones: ShopPhoneDraft[];
  onChange: (phones: ShopPhoneDraft[]) => void;
  disabled: boolean;
}) {
  function commit(next: ShopPhoneDraft[], preferredIndex = 0) {
    onChange(withPrimaryWhatsApp(next, preferredIndex));
  }

  function updateNumber(index: number, phoneNumber: string) {
    commit(
      phones.map((phone, phoneIndex) =>
        phoneIndex === index ? { ...phone, phoneNumber } : phone,
      ),
      index,
    );
  }

  function updateWhatsApp(index: number, isWhatsapp: boolean) {
    commit(
      phones.map((phone, phoneIndex) =>
        phoneIndex === index
          ? { ...phone, isWhatsapp, isPrimary: isWhatsapp ? phone.isPrimary : false }
          : phone,
      ),
      index,
    );
  }

  function selectPrimary(index: number) {
    const selected = phones[index];

    if (!selected?.isWhatsapp) {
      return;
    }

    onChange(
      phones.map((phone, phoneIndex) => ({
        ...phone,
        isPrimary: phoneIndex === index,
      })),
    );
  }

  function removePhone(index: number) {
    commit(
      phones.filter((_, phoneIndex) => phoneIndex !== index),
      index,
    );
  }

  function addPhone() {
    if (phones.length >= 10) {
      return;
    }

    commit([
      ...phones,
      {
        key: crypto.randomUUID(),
        phoneNumber: "",
        isWhatsapp: false,
        isPrimary: false,
      },
    ]);
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-ink">Shop contact numbers</legend>
      <p className="text-sm leading-6 text-muted">
        Add every public number. Mark the WhatsApp numbers, and choose one primary
        number for orders.
      </p>
      {phones.length === 0 ? (
        <p className="text-sm leading-6 text-muted">No phone numbers yet.</p>
      ) : (
        <ul className="space-y-3">
          {phones.map((phone, index) => {
            const digits = normalizeShopPhone(phone.phoneNumber);
            const formatted = /^[0-9]{10,15}$/.test(digits) ? formatShopPhone(digits) : "";

            return (
              <li key={phone.key} className="rounded-2xl border border-line bg-surface p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Phone number {index + 1}</span>
                    <input
                      inputMode="numeric"
                      value={phone.phoneNumber}
                      disabled={disabled}
                      placeholder="919876543210"
                      onChange={(event) => updateNumber(index, event.target.value)}
                      onBlur={() => {
                        if (digits !== phone.phoneNumber) {
                          updateNumber(index, digits);
                        }
                      }}
                      className={fieldClassName}
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex h-11 items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={phone.isWhatsapp}
                        disabled={disabled}
                        onChange={(event) => updateWhatsApp(index, event.target.checked)}
                        className="size-4 accent-accent-strong"
                      />
                      WhatsApp
                    </label>
                    <label className="inline-flex h-11 items-center gap-2 text-sm text-ink">
                      <input
                        type="radio"
                        name="primary-shop-phone"
                        checked={phone.isPrimary}
                        disabled={disabled || !phone.isWhatsapp}
                        onChange={() => selectPrimary(index)}
                        className="size-4 accent-accent-strong"
                      />
                      Primary
                    </label>
                    {disabled ? null : (
                      <button
                        type="button"
                        onClick={() => removePhone(index)}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {formatted ? (
                  <p className="mt-2 text-sm text-muted">{formatted}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {disabled || phones.length >= 10 ? null : (
        <button
          type="button"
          onClick={addPhone}
          className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-background px-4 text-sm font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Add another number
        </button>
      )}
    </fieldset>
  );
}
