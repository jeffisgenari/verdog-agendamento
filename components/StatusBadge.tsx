import { STATUS_LABEL } from "@/lib/periodo";

export default function StatusBadge({ status }: { status: string }) {
  const info = STATUS_LABEL[status] ?? { label: status, className: "bg-neutral-100 text-neutral-500" };
  return (
    <span
      className={`w-20 flex-shrink-0 text-[11px] font-medium rounded-lg px-1.5 py-1 text-center leading-tight ${info.className}`}
    >
      {info.label}
    </span>
  );
}
