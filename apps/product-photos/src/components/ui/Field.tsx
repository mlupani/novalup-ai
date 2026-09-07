export function Field({
  label, htmlFor, error, children,
}: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-neutral-300">{label}</label>
      {children}
      {error ? <p className="text-sm text-accent-light">{error}</p> : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-night-soft px-4 py-3 text-white placeholder:text-neutral-500 focus:border-accent-light focus:outline-none min-h-[44px]";
