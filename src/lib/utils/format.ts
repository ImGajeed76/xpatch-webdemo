/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return `${size} ${sizes[i]}`;
}

/**
 * Format time in milliseconds to human-readable string
 * Always shows the specified number of decimal places
 */
export function formatTime(ms: number, decimals = 2): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return `0.${"0".repeat(decimals)} μs`;
  }
  if (ms < 1) {
    const us = ms * 1000;
    return `${us.toFixed(decimals)} μs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(decimals)} ms`;
  }
  return `${(ms / 1000).toFixed(decimals)} s`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format compression ratio as percentage savings
 */
export function formatSavings(ratio: number): string {
  const savings = (1 - ratio) * 100;
  if (savings < 0) {
    return `+${Math.abs(savings).toFixed(1)}%`; // Size increased
  }
  return `${savings.toFixed(1)}%`;
}

/**
 * Format a timestamp to locale string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format a timestamp to relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}
