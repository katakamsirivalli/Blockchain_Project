/**
 * Formats an Ethereum address into 0x1234...abcd format
 * @param {string} address 
 */
export function formatAddress(address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "Origin / System";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Formats a UNIX timestamp (in seconds) to a human-readable localized string
 * @param {number|string|bigint} timestamp 
 */
export function formatTimestamp(timestamp) {
  if (!timestamp || Number(timestamp) === 0) return "N/A";
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Returns UI metadata for each MaterialStatus enum value
 * 0: Registered, 1: InTransit, 2: InspectedPassed, 3: InspectedFailed, 4: Delivered
 * @param {number} status 
 */
export function getStatusBadge(status) {
  const statusNum = Number(status);
  switch (statusNum) {
    case 0:
      return {
        label: "Registered",
        color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        indicator: "bg-blue-400",
        description: "Registered by Manufacturer. Awaiting inspection or dispatch.",
      };
    case 1:
      return {
        label: "In Transit",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        indicator: "bg-amber-400",
        description: "Currently moving in supply chain via logistics carrier.",
      };
    case 2:
      return {
        label: "Inspection Passed",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        indicator: "bg-emerald-400",
        description: "Tested and certified compliant with relevant engineering codes.",
      };
    case 3:
      return {
        label: "Inspection Failed",
        color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        indicator: "bg-rose-400",
        description: "QUARANTINED. Substandard quality. Prohibited from site usage.",
      };
    case 4:
      return {
        label: "Delivered & Accepted",
        color: "bg-teal-500/10 text-teal-400 border-teal-500/30",
        indicator: "bg-teal-400",
        description: "Received at construction job site and signed off by engineer.",
      };
    default:
      return {
        label: "Unknown",
        color: "bg-slate-500/10 text-slate-400 border-slate-500/30",
        indicator: "bg-slate-400",
        description: "Status unrecognized.",
      };
  }
}
