import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { truncateHash } from "../utils/cryptoUtils";
import {
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  Building2,
  Info,
} from "lucide-react";

export function QualityInspection({ onInspectionRecorded }) {
  const { contract, signer, roles, isContractConfigured, account } = useWeb3();

  const [batchId, setBatchId] = useState("");
  const [passed, setPassed] = useState(true);
  const [testNotes, setTestNotes] = useState("");
  const [standardsReferenced, setStandardsReferenced] = useState("IS 1786:2008 Grade Fe 500D");
  const [allBatchIds, setAllBatchIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setTxHash("");

    if (!contract || !signer) {
      setErrorMessage("Please connect an authorized quality inspector wallet first.");
      return;
    }

    if (!batchId.trim()) {
      setErrorMessage("Batch ID is required.");
      return;
    }

    if (!testNotes.trim()) {
      setErrorMessage("Detailed test notes and lab observations are required.");
      return;
    }

    setSubmitting(true);
    try {
      const tx = await contract.recordInspection(
        batchId.trim(),
        passed,
        testNotes.trim(),
        standardsReferenced.trim()
      );

      setTxHash(tx.hash);
      await tx.wait();

      setSuccessMessage(
        `Inspection recorded! Batch ${batchId} marked as ${
          passed ? "Passed (Certified)" : "Failed (Quarantined)"
        }.`
      );

      if (onInspectionRecorded) {
        onInspectionRecorded(batchId);
      }

      setTestNotes("");
    } catch (err) {
      console.error("Inspection recording error:", err);
      setErrorMessage(err.reason || err.message || "Failed to record inspection");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-sky-400" />
          Quality Assurance & Laboratory Inspection Portal
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Authorized independent testing agencies and materials engineers record physical lab audit results on-chain.
        </p>
      </div>

      {/* Role Notice */}
      {!roles.isInspector && !roles.isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-300">Inspector Authorization Required:</strong>{" "}
            Your connected wallet ({account ? truncateHash(account) : "None"}) is not an authorized Inspector. You can authorize it using the Admin Roles tab or contract deployer account.
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Batch Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Material Batch ID <span className="text-rose-400">*</span>
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

          {/* Test Verdict Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Laboratory Audit Verdict <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPassed(true)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  passed
                    ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${passed ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-900"}`}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold">Passed / Compliant</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Material satisfies structural codes & strength thresholds.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPassed(false)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  !passed
                    ? "bg-rose-950/40 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${!passed ? "bg-rose-500/20 text-rose-400" : "bg-slate-900"}`}>
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold">Failed / Substandard</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Quarantines batch. Permanently locks custody transfers.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Standards Referenced */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Code Standard Applied / Reference Specification
            </label>
            <input
              type="text"
              value={standardsReferenced}
              onChange={(e) => setStandardsReferenced(e.target.value)}
              placeholder="e.g. IS 1786:2008 Fe 500D / ASTM A615 / IS 12269:2013"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Test Notes / Lab Observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Laboratory Observations & Test Values <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={testNotes}
              onChange={(e) => setTestNotes(e.target.value)}
              placeholder="e.g. Universal Testing Machine result: 0.2% Proof Stress = 535 MPa, Tensile Strength = 612 MPa, Elongation = 16.5%. Chemical spectrometry: Carbon = 0.21%, Sulphur = 0.038%, Phosphorus = 0.039%. Samples passed cold bend test."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successMessage}</p>
                {txHash && (
                  <p className="mt-1 font-mono text-[11px] text-slate-400">
                    Tx: {truncateHash(txHash, 14, 10)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 ${
                passed
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recording Inspection on-chain...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Submit Official Inspection Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
