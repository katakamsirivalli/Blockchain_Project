import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { computeFileHashSHA256 } from "../utils/cryptoUtils";
import { formatTimestamp, formatAddress } from "../utils/formatters";
import {
  FileCheck,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldAlert,
  Loader2,
  FileText,
  Search,
} from "lucide-react";

export function CertificateVerifier({ initialBatchId }) {
  const { contract, isContractConfigured } = useWeb3();

  const [batchId, setBatchId] = useState(initialBatchId || "");
  const [file, setFile] = useState(null);
  const [computedHash, setComputedHash] = useState("");
  const [allBatchIds, setAllBatchIds] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [hashing, setHashing] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (contract && isContractConfigured) {
      contract.getAllBatchIds().then((ids) => {
        setAllBatchIds(ids);
        if (ids.length > 0 && !batchId) {
          setBatchId(ids[ids.length - 1]);
        }
      }).catch(console.warn);
    }
  }, [contract, isContractConfigured]);

  const handleFileSelect = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setHashing(true);
    setError("");
    setVerificationResult(null);

    try {
      const hash = await computeFileHashSHA256(selected);
      setComputedHash(hash);
    } catch (err) {
      console.error("Hashing failed:", err);
      setError("Failed to calculate SHA-256 hash of selected file.");
    } finally {
      setHashing(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setVerificationResult(null);

    if (!contract || !isContractConfigured) {
      setError("Smart contract is not linked or deployed. Please check connection.");
      return;
    }

    if (!batchId.trim()) {
      setError("Batch ID is required.");
      return;
    }

    if (!computedHash.trim()) {
      setError("Please upload a certificate file or enter a hash to verify.");
      return;
    }

    setVerifying(true);
    try {
      const result = await contract.verifyCertificateHash(batchId.trim(), computedHash.trim());
      setVerificationResult({
        isMatch: result.isMatch || result[0],
        storedHash: result.storedHash || result[1],
        manufacturer: result.manufacturer || result[2],
        registeredTimestamp: result.registeredTimestamp || result[3],
      });
    } catch (err) {
      console.error("Verification error:", err);
      setError(err.reason || err.message || "Certificate verification query failed.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <FileCheck className="h-6 w-6 text-sky-400" />
          Cryptographic Certificate Hash Verifier
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Verify digital lab test reports (Mill Test Reports, ISO test sheets) against immutable blockchain hashes.
        </p>
      </div>

      {/* Boundary / Academic Disclaimer Box */}
      <div className="rounded-2xl bg-amber-950/20 border border-amber-500/30 p-4 sm:p-5 flex items-start gap-4">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <strong className="text-amber-300 font-semibold block mb-0.5">
            Verification Scope & Limitations:
          </strong>
          Cryptographic hash matching proves <strong>digital document integrity</strong> (confirming that the electronic test report provided is bit-for-bit identical to the report filed at the time of manufacturing). <em>It does not independently prove that the physical material matches this certificate</em> unless verified in person with anti-tamper tags and on-site testing.
        </div>
      </div>

      {/* Main Verifier Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleVerify} className="space-y-6">
          {/* Batch Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Material Batch ID <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="e.g. BATCH-STEEL-2026-001"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              {allBatchIds.length > 0 && (
                <div className="absolute right-2 top-2">
                  <select
                    onChange={(e) => setBatchId(e.target.value)}
                    value={batchId}
                    className="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
                  >
                    {allBatchIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Certificate File Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Upload Certificate Document (PDF / Image / Text)
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-2xl p-6 text-center bg-slate-950/40 transition-colors">
              <input
                type="file"
                id="verify-file-input"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
              />
              <label
                htmlFor="verify-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="p-3 rounded-full bg-sky-500/10 text-sky-400">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {file ? (
                    <span className="text-emerald-400 font-semibold">
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    <span>Click to browse or drag test certificate file to hash & verify</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  The file is hashed locally on your computer via SHA-256 Web Crypto API.
                </p>
              </label>

              {hashing && (
                <div className="flex items-center justify-center gap-2 text-xs text-sky-400 mt-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Calculating SHA-256 digest...
                </div>
              )}
            </div>
          </div>

          {/* Computed or Manual Hash Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Certificate Hash (Computed or Pasted Hex) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={computedHash}
              onChange={(e) => setComputedHash(e.target.value)}
              placeholder="0x..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-sky-300 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={verifying || hashing}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-xl shadow-lg shadow-sky-600/25 transition-all disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying against Ledger...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  Verify Certificate Hash
                </>
              )}
            </button>
          </div>
        </form>

        {/* Verification Result Card */}
        {verificationResult && (
          <div className="mt-8 pt-6 border-t border-slate-800 animate-fadeIn">
            {verificationResult.isMatch ? (
              <div className="rounded-2xl bg-emerald-950/30 border border-emerald-500/40 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-emerald-300">
                      Cryptographic Hash Match Verified!
                    </h4>
                    <p className="text-xs text-emerald-200/80 mt-0.5">
                      The document hash matches the immutable on-chain record. Zero digital tampering detected.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/20 space-y-2 text-xs font-mono">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-400">Provided Hash:</span>
                    <span className="text-emerald-400 break-all">{computedHash}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-400">On-Chain Hash:</span>
                    <span className="text-emerald-400 break-all">{verificationResult.storedHash}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Registered By:</span>
                    <span className="text-slate-200">{formatAddress(verificationResult.manufacturer)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="text-slate-200">{formatTimestamp(verificationResult.registeredTimestamp)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-rose-950/30 border border-rose-500/40 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                    <XCircle className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-rose-300">
                      Cryptographic Hash Mismatch! (Document Tampered or Altered)
                    </h4>
                    <p className="text-xs text-rose-200/80 mt-0.5">
                      The certificate provided does not match the official record stored on the blockchain for this batch.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-rose-500/20 space-y-2 text-xs font-mono">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-400">Provided Hash:</span>
                    <span className="text-rose-400 break-all">{computedHash}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-400">On-Chain Hash:</span>
                    <span className="text-slate-200 break-all">{verificationResult.storedHash}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
