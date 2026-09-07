export function Spinner({ label }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 text-neutral-300">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-accent-light motion-reduce:animate-none" />
      {label ? <span className="text-sm">{label}</span> : <span className="sr-only">Cargando…</span>}
    </div>
  );
}
