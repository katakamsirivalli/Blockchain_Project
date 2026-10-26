import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { truncateHash } from "../utils/cryptoUtils";
import { formatAddress } from "../utils/formatters";
import {
  Truck,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  MapPin,
  ClipboardCheck,
} from "lucide-react";

export function CustodyTransfer({ onCustodyUpdated }) {
  const { contract, signer, account, isContractConfigured } = useWeb3();

  const [activeSubTab, setActiveSubTab] = useState("transfer"); // "transfer" or "delivery"

  // Transfer Form State
  const [transferData, setTransferData] = useState({
    batchId: "",
    newCustodian: "",
    newLocation: "",
    transportNotes: "",
  });

  // Delivery Form State
  const [deliveryData, setDeliveryData] = useState({
    batchId: "",
    finalLocation: "",
    deliveryNotes: "",
  });

  const [allBatchIds, setAllBatchIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (contract && isContractConfigured) {
      contract.getAllBatchIds().then((ids) => {
        setAllBatchIds(ids);
        if (ids.length > 0) {
          if (!transferData.batchId) {
            setTransferData((p) => ({ ...p, batchId: ids[ids.length - 1] }));
          }
          if (!deliveryData.batchId) {
            setDeliveryData((p) => ({ ...p, batchId: ids[ids.length - 1] }));
          }
        }
      }).catch(console.warn);
    }
  }, [contract, isContractConfigured]);

  // Handle Custody Handover
  const handleTransfer = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setTxHash("");

    if (!contract || !signer) {
      setErrorMessage("Please connect the current custodian wallet first.");
      return;
    }

    if (!transferData.batchId.trim()) {
      setErrorMessage("Batch ID is required.");
      return;
    }

    if (!transferData.newCustodian.trim() || !transferData.newCustodian.startsWith("0x")) {
      setErrorMessage("Valid Ethereum address is required for new custodian.");
      return;
    }

    if (!transferData.newLocation.trim()) {
      setErrorMessage("New location is required.");
      return;
    }

    setSubmitting(true);
    try {
      const tx = await contract.transferCustody(
        transferData.batchId.trim(),
        transferData.newCustodian.trim(),
        transferData.newLocation.trim(),
        transferData.transportNotes.trim() || "Custody transferred via authorized logistics."
      );

      setTxHash(tx.hash);
      await tx.wait();

      setSuccessMessage(
        `Custody of batch ${transferData.batchId} successfully transferred to ${formatAddress(
          transferData.newCustodian
        )}!`
      );

      if (onCustodyUpdated) onCustodyUpdated(transferData.batchId);

      setTransferData({
        batchId: "",
        newCustodian: "",
        newLocation: "",
        transportNotes: "",
      });
    } catch (err) {
      console.error("Custody transfer error:", err);
      setErrorMessage(err.reason || err.message || "Failed to transfer custody");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Final Site Delivery Confirmation
  const handleDelivery = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setTxHash("");

    if (!contract || !signer) {
      setErrorMessage("Please connect the receiving site engineer wallet first.");
      return;
    }

    if (!deliveryData.batchId.trim()) {
      setErrorMessage("Batch ID is required.");
      return;
    }

    if (!deliveryData.finalLocation.trim()) {
      setErrorMessage("Final site location is required.");
      return;
    }

    setSubmitting(true);
    try {
      const tx = await contract.confirmDelivery(
        deliveryData.batchId.trim(),
        deliveryData.finalLocation.trim(),
        deliveryData.deliveryNotes.trim() || "Material received, inspected at site, and accepted."
      );

      setTxHash(tx.hash);
      await tx.wait();

      setSuccessMessage(
        `Delivery confirmed! Batch ${deliveryData.batchId} is now marked as DELIVERED.`
      );

      if (onCustodyUpdated) onCustodyUpdated(deliveryData.batchId);

      setDeliveryData({
        batchId: "",
        finalLocation: "",
        deliveryNotes: "",
      });
    } catch (err) {
      console.error("Delivery confirmation error:", err);
      setErrorMessage(err.reason || err.message || "Failed to confirm delivery");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <Truck className="h-6 w-6 text-sky-400" />
          Custody Transfer & Site Delivery Portal
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Record supply chain transitions, carrier handovers, and final construction site receipt.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("transfer");
            setErrorMessage("");
            setSuccessMessage("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSubTab === "transfer"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Truck className="h-4 w-4" />
          Transfer Custody (In-Transit)
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab("delivery");
            setErrorMessage("");
            setSuccessMessage("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSubTab === "delivery"
              ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Building className="h-4 w-4" />
          Confirm Final Site Delivery
        </button>
      </div>

      {/* Form Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {activeSubTab === "transfer" ? (
          /* CUSTODY TRANSFER FORM */
          <form onSubmit={handleTransfer} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Material Batch ID <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={transferData.batchId}
                  onChange={(e) => setTransferData({ ...transferData, batchId: e.target.value })}
                  placeholder="e.g. BATCH-STEEL-2026-001"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                {allBatchIds.length > 0 && (
                  <div className="absolute right-2 top-2">
                    <select
                      onChange={(e) => setTransferData({ ...transferData, batchId: e.target.value })}
                      value={transferData.batchId}
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Custodian Wallet Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={transferData.newCustodian}
                onChange={(e) => setTransferData({ ...transferData, newCustodian: e.target.value })}
                placeholder="0x... (Carrier, Distributor, or Site Contractor Address)"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-sky-300 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Destination Transit Location / Warehouse <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={transferData.newLocation}
                onChange={(e) => setTransferData({ ...transferData, newLocation: e.target.value })}
                placeholder="e.g. Regional Freight Logistics Hub, Nagpur"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Transport & Dispatch Notes
              </label>
              <textarea
                rows={3}
                value={transferData.transportNotes}
                onChange={(e) => setTransferData({ ...transferData, transportNotes: e.target.value })}
                placeholder="e.g. Dispatch Note #DN-4921, Flatbed Truck #KA-01-AB-1234, Electronic GPS seal locked."
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

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-xl shadow-lg shadow-sky-600/25 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Custody on-chain...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4" />
                    Authorize Custody Transfer
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* FINAL DELIVERY CONFIRMATION FORM */
          <form onSubmit={handleDelivery} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Material Batch ID <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={deliveryData.batchId}
                  onChange={(e) => setDeliveryData({ ...deliveryData, batchId: e.target.value })}
                  placeholder="e.g. BATCH-STEEL-2026-001"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                {allBatchIds.length > 0 && (
                  <div className="absolute right-2 top-2">
                    <select
                      onChange={(e) => setDeliveryData({ ...deliveryData, batchId: e.target.value })}
                      value={deliveryData.batchId}
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Final Job Site Receiving Yard Location <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={deliveryData.finalLocation}
                onChange={(e) => setDeliveryData({ ...deliveryData, finalLocation: e.target.value })}
                placeholder="e.g. Metro Viaduct Pier 42 Construction Site, Storage Shed B"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                On-Site Receiving & Verification Notes
              </label>
              <textarea
                rows={3}
                value={deliveryData.deliveryNotes}
                onChange={(e) => setDeliveryData({ ...deliveryData, deliveryNotes: e.target.value })}
                placeholder="e.g. Physical count verified 100%. Gate Pass #GP-8821 verified by Site Engineer. No visible damage."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
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

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-xl shadow-lg shadow-teal-600/25 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Locking Delivery on-chain...
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="h-4 w-4" />
                    Confirm Site Delivery & Sign-Off
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
