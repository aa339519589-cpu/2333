export const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
export const formatNumber = (value: number, maximumFractionDigits = 0): string => new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
export const formatSimulationTime = (timestamp: number): string => new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(timestamp));
export const titleCase = (value: string): string => value.split("-").map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(" ");
export const downloadText = (filename: string, content: string): void => { const blob = new Blob([content], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); };
