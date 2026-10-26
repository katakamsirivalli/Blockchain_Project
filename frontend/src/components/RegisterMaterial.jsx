import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { computeFileHashSHA256, truncateHash } from "../utils/cryptoUtils";
import {
  PackagePlus,
  Upload,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
} from "lucide-react";

export function RegisterMaterial({ onBatchCreated }) {
  const { contract, signer, roles, isContractConfigured, account } = useWeb3();

  const [formData, setFormData] = useState({
    batchId: "",
    materialName: "",
    materialType: "Steel",
    quantity: "",
    unit: "Metric Tons",
    manufacturingLocation: "",
    certificateHash: "",
    certificateUri: "",
  });

  const [fileSelected, setFileSelected] = useState(null);
  const [isHashing, setIsHashing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Material type options common in civil engineering
  const materialTypes = [
    "Steel",
    "Cement",
    "Concrete",
    "Aggregates",
    "Bricks & Blocks",
    "Bitumen",
    "Glass & Glazing",
    "Structural Timber",
  ];

  // Auto-generate a structured batch ID
  const generateBatchId = () => {
    const prefix = formData.materialType.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `BATCH-${prefix}-${year}-${randomNum}`;
    setFormData((prev) => ({ ...prev, batchId: newId }));
  };

  // Handle client-side file upload & automatic cryptographic SHA-256 calculation
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileSelected(file);
    setIsHashing(true);
    setErrorMessage("");

    try {
      const hash = await computeFileHashSHA256(file);
      setFormData((prev) => ({
        ...prev,
        certificateHash: hash,
        certificateUri: prev.certificateUri || `ipfs://Qm${file.name.replace(/\s+/g, "_")}`,
      }));
    } catch (err) {
      console.error("Hashing error:", err);
      setErrorMessage("Failed to calculate SHA-256 certificate hash.");
    } finally {
      setIsHashing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setTxHash("");

    if (!contract || !signer) {
      setErrorMessage("Please connect an authorized manufacturer wallet first.");
      return;
    }

    if (!formData.batchId.trim()) {
      setErrorMessage("Batch ID is required.");
      return;
    }

    if (!formData.materialName.trim()) {
      setErrorMessage("Material name is required.");
      return;
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setErrorMessage("Quantity must be greater than zero.");
      return;
    }

    if (!formData.certificateHash.trim() || formData.certificateHash.length !== 66) {
      setErrorMessage("Valid 32-byte hexadecimal certificate hash (0x + 64 hex characters) is required.");
      return;
    }

    setSubmitting(true);
    try {
      const tx = await contract.registerMaterial(
        formData.batchId.trim(),
        formData.materialName.trim(),
        formData.materialType,
        BigInt(Math.floor(Number(formData.quantity))),
        formData.unit.trim(),
        formData.manufacturingLocation.trim(),
        formData.certificateHash.trim(),
        formData.certificateUri.trim() || "ipfs://placeholder-cert"
      );

      setTxHash(tx.hash);
      await tx.wait();

      setSuccessMessage(`Batch ${formData.batchId} successfully registered on the blockchain!`);

      if (onBatchCreated) {
        onBatchCreated(formData.batchId);
      }

      // Reset form
      setFormData({
        batchId: "",
        materialName: "",
        materialType: "Steel",
        quantity: "",
        unit: "Metric Tons",
        manufacturingLocation: "",
        certificateHash: "",
        certificateUri: "",
      });
      setFileSelected(null);
    } catch (err) {
      console.error("Registration error:", err);
      const reason = err.reason || err.message || "Transaction failed";
      setErrorMessage(reason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <PackagePlus className="h-6 w-6 text-sky-400" />
          Register Construction Material Batch
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Authorized manufacturers record origin specifications and cryptographic test certificate hashes on-chain.
        </p>
      </div>

      {/* Role Notice */}
      {!roles.isManufacturer && !roles.isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-300">Manufacturer Authorization Required:</strong>{" "}
            Your connected wallet ({account ? truncateHash(account) : "None"}) is not yet authorized as a Manufacturer in the smart contract. You can authorize it using the Admin Roles tab or contract deployer account.
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Batch ID */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Batch ID <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateBatchId}
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Auto Generate
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                placeholder="e.g. BATCH-STEEL-2026-101"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Material Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Material Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.materialType}
                onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                {materialTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Material Trade Name & Grade <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.materialName}
                onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                placeholder="e.g. Fe 500D High Ductility Thermo-Mechanically Treated Rebars"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Quantity <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g. 100"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Unit of Measurement <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. Metric Tons, Bags (50kg), Cubic Meters"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Manufacturing Location */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Origin Mill / Manufacturing Plant Location <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.manufacturingLocation}
                onChange={(e) => setFormData({ ...formData, manufacturingLocation: e.target.value })}
                placeholder="e.g. Tata Steel Plant Mill 2, Jamshedpur, Jharkhand"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Certificate Hashing Section */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-sky-400" />
                Laboratory Test Certificate Cryptographic Hash
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload the official Mill Test Report (MTR) or ISO lab certificate to compute its immutable SHA-256 hash.
              </p>
            </div>

            {/* File Drag/Drop or Select */}
            <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-2xl p-5 text-center bg-slate-950/40 transition-colors">
              <input
                type="file"
                id="cert-file-input"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              />
              <label
                htmlFor="cert-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="p-3 rounded-full bg-sky-500/10 text-sky-400">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {fileSelected ? (
                    <span className="text-emerald-400 font-semibold">
                      Selected: {fileSelected.name} ({(fileSelected.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    <span>Click to select or drag test certificate PDF / document</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  SHA-256 hash is computed in your browser locally using Web Crypto API.
                </p>
              </label>

              {isHashing && (
                <div className="flex items-center justify-center gap-2 text-xs text-sky-400 mt-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Computing SHA-256 digest...
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Computed Hash Value */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Certificate Hash (bytes32 Hex) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.certificateHash}
                  onChange={(e) => setFormData({ ...formData, certificateHash: e.target.value })}
                  placeholder="0x..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-sky-300 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Certificate URI / IPFS */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Document Link / IPFS CID / Reference
                </label>
                <input
                  type="text"
                  value={formData.certificateUri}
                  onChange={(e) => setFormData({ ...formData, certificateUri: e.target.value })}
                  placeholder="e.g. ipfs://bafybeig... or https://..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
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
              disabled={submitting || isHashing}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recording on Blockchain...
                </>
              ) : (
                <>
                  <PackagePlus className="h-4 w-4" />
                  Register Material Batch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
