export function CatalogLoading({ label }: { label: string }) {
  return (
    <p role="status" className="mt-8 text-sm text-muted">
      {label}
    </p>
  );
}

export function CatalogNotice({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {message}
      </p>
    </div>
  );
}
