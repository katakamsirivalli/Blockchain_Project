import { ethers } from "ethers";

/**
 * Computes the SHA-256 hash of a file or string in standard bytes32 format (0x...).
 * Uses the Web Crypto API built into modern browsers.
 * 
 * @param {File|Blob|string} input - The file or string to hash
 * @returns {Promise<string>} Hex-encoded 32-byte hash prefixed with '0x'
 */
export async function computeFileHashSHA256(input) {
  let arrayBuffer;

  if (typeof input === "string") {
    const encoder = new TextEncoder();
    arrayBuffer = encoder.encode(input).buffer;
  } else if (input instanceof Blob || input instanceof File) {
    arrayBuffer = await input.arrayBuffer();
  } else {
    throw new Error("Invalid input for hashing. Expected string, Blob, or File.");
  }

  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexString = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hexString}`;
}

/**
 * Computes Keccak-256 hash (Ethereum native) from a string or bytes.
 * 
 * @param {string} text - UTF-8 string
 * @returns {string} 0x-prefixed 32-byte hash
 */
export function computeKeccak256(text) {
  return ethers.keccak256(ethers.toUtf8Bytes(text));
}

/**
 * Formats a bytes32 hash to truncated representation for clean UI display.
 * 
 * @param {string} hash - 0x-prefixed 64-char string
 * @param {number} start - chars to keep at start
 * @param {number} end - chars to keep at end
 */
export function truncateHash(hash, start = 8, end = 6) {
  if (!hash || hash.length < start + end + 2) return hash || "N/A";
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}
