import { formatPriority, formatStatus } from "../../services/utils";

export default function StatusBadge({ value, kind = "status" }) {
  const label = kind === "priority" ? formatPriority(value) : formatStatus(value);

  return (
    <span className={`status-badge ${kind}-badge ${kind}-${value}`}>
      {label}
    </span>
  );
}
