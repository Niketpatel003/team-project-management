export const STATUS_OPTIONS = ["todo", "in-progress", "done"];
export const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

export function formatStatus(status) {
  return status
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function formatPriority(priority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatShortDate(dateString) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateString));
}

export function isOverdue(dateString, status) {
  const dueDate = new Date(dateString);
  const today = new Date();

  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return dueDate < today && status !== "done";
}

export function getInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
