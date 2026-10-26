import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getStatusBadge, formatTimestamp, formatAddress } from "../utils/formatters";
import { truncateHash } from "../utils/cryptoUtils";
import {
  Search,
  Package,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Truck,
  Building,
  User,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  FileCheck,
} from "lucide-react";

export function MaterialLookup({ initialBatchId }) {
  const { contract, isContractConfigured } = useWeb3();

  const [searchId, setSearchId] = useState(initialBatchId || "");
  const [batchData, setBatchData] = useState(null);
  const [custodyHistory, setCustodyHistory] = useState([]);
  const [inspectionHistory, setInspectionHistory] = useState([]);
  const [allBatchIds, setAllBatchIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedHash, setCopiedHash] = useState(false);

  // Load batch IDs list for easy dropdown selection
  useEffect(() => {
    if (contract && isContractConfigured) {
      contract.getAllBatchIds().then((ids) => {
        setAllBatchIds(ids);
        if (ids.length > 0 && !searchId) {
          setSearchId(ids[ids.length - 1]);
        }
      }).catch(console.warn);
    }
  }, [contract, isContractConfigured]);

  // Trigger search if initialBatchId changes
  useEffect(() => {
    if (initialBatchId) {
      setSearchId(initialBatchId);
      lookupBatch(initialBatchId);
    }
  }, [initialBatchId]);

  const lookupBatch = async (idToSearch) => {
    const id = (idToSearch || searchId).trim();
    if (!id) {
      setError("Please enter or select a Batch ID.");
      return;
    }

    if (!contract || !isContractConfigured) {
      setError("Smart contract is not linked or deployed. Please check connection.");
      return;
    }

    setLoading(true);
    setError("");
    setBatchData(null);
    setCustodyHistory([]);
    setInspectionHistory([]);

    try {
      // 1. Fetch batch metadata
      const batch = await contract.getMaterialBatch(id);
      if (!batch || !batch.exists) {
        throw new Error(`Batch "${id}" not found on the blockchain.`);
      }

      setBatchData({
        batchId: batch.batchId,
        materialName: batch.materialName,
        materialType: batch.materialType,
        quantity: batch.quantity.toString(),
        unit: batch.unit,
        manufacturingLocation: batch.manufacturingLocation,
        currentLocation: batch.currentLocation,
        certificateHash: batch.certificateHash,
        certificateUri: batch.certificateUri,
        manufacturer: batch.manufacturer,
        currentCustodian: batch.currentCustodian,
        status: Number(batch.status),
        registeredTimestamp: batch.registeredTimestamp,
        isDelivered: batch.isDelivered,
      });

      // 2. Fetch custody logs
      const custodyLogs = await contract.getCustodyHistory(id);
      setCustodyHistory(custodyLogs);

      // 3. Fetch inspection logs
      const inspectionLogs = await contract.getInspectionHistory(id);
      setInspectionHistory(inspectionLogs);
    } catch (err) {
      console.error("Lookup error:", err);
      setError(err.reason || err.message || "Failed to find batch record.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const badge = batchData ? getStatusBadge(batchData.status) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Search Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
          <Search className="h-5 w-5 text-sky-400" />
          Material Lifecycle & Traceability Explorer
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Query the immutable blockchain ledger to view complete provenance, custody handoffs, and QA inspections.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookupBatch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Batch ID (e.g. BATCH-STEEL-2026-001)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            {allBatchIds.length > 0 && (
              <div className="absolute right-2 top-2.5">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setSearchId(e.target.value);
                      lookupBatch(e.target.value);
                    }
                  }}
                  className="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Batch...
                  </option>
                  {allBatchIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-xl shadow-lg shadow-sky-600/20 transition-all disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {loading ? "Tracing..." : "Track Batch"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Batch Details Card */}
      {batchData && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            {/* Top row: Name & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {batchData.batchId}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                  {batchData.materialName}
                </h3>
                <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 mt-2">
                  Category: {batchData.materialType}
                </span>
              </div>

              <div className="sm:text-right">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}
                >
                  <span className={`w-2 h-2 rounded-full ${badge.indicator}`}></span>
                  {badge.label}
                </span>
                <p className="text-[11px] text-slate-400 mt-1.5 max-w-xs sm:ml-auto">
                  {badge.description}
                </p>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 text-sky-400" /> Quantity
                </span>
                <div className="text-sm font-bold text-white font-mono">
                  {batchData.quantity} {batchData.unit}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-sky-400" /> Registered On
                </span>
                <div className="text-sm font-semibold text-white">
                  {formatTimestamp(batchData.registeredTimestamp)}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-sky-400" /> Origin Facility
                </span>
                <div className="text-sm font-medium text-slate-200 truncate">
                  {batchData.manufacturingLocation}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-sky-400" /> Current Location
                </span>
                <div className="text-sm font-medium text-slate-200 truncate">
                  {batchData.currentLocation}
                </div>
              </div>
            </div>

            {/* Custodian & Certificate Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <User className="h-4 w-4 text-sky-400" />
                  Supply Chain Stakeholders
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1">
                  <span className="text-slate-500">Manufacturer:</span>
                  <span className="font-mono text-slate-300">
                    {formatAddress(batchData.manufacturer)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Current Custodian:</span>
                  <span className="font-mono text-sky-400 font-semibold">
                    {formatAddress(batchData.currentCustodian)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-slate-400 flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-sky-400" />
                    On-Chain Certificate Hash
                  </span>
                  <button
                    onClick={() => handleCopyHash(batchData.certificateHash)}
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    {copiedHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedHash ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-emerald-400 break-all bg-slate-900 p-2 rounded-lg border border-slate-800">
                  {batchData.certificateHash}
                </div>
                {batchData.certificateUri && (
                  <div className="text-[11px] text-slate-500 truncate">
                    Ref: <span className="text-slate-400">{batchData.certificateUri}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Traceability Lifecycle Timeline */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-sky-400" />
              Provenance & Custody Timeline
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {/* 1. Custody History Items */}
              {custodyHistory.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-6 mt-1 h-5 w-5 rounded-full border-2 border-slate-900 bg-sky-500 flex items-center justify-center text-slate-950 shadow-md">
                    <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>

                  <div className="flex-1 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white">
                        {idx === 0
                          ? "Batch Origin & Initial Custody"
                          : `Custody Transfer #${idx}`}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatTimestamp(step.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      {step.transportNotes}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-sky-400" />
                        {step.location}
                      </span>
                      <span className="font-mono text-slate-400">
                        Holder: {formatAddress(step.to)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 2. Inspection Records */}
              {inspectionHistory.map((insp, idx) => (
                <div key={`insp-${idx}`} className="relative flex items-start gap-4">
                  <div
                    className={`absolute -left-6 mt-1 h-5 w-5 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-md ${
                      insp.passed ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>

                  <div
                    className={`flex-1 p-4 rounded-2xl border space-y-1.5 ${
                      insp.passed
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-rose-950/20 border-rose-500/30"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span
                        className={`text-xs font-bold flex items-center gap-1.5 ${
                          insp.passed ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {insp.passed ? (
                          <>
                            <ShieldCheck className="h-4 w-4" /> QA Inspection Passed
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-4 w-4" /> QA Inspection Failed (Rejected)
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatTimestamp(insp.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200">
                      <strong>Observations:</strong> {insp.testNotes}
                    </p>

                    {insp.standardsReferenced && (
                      <p className="text-[11px] text-slate-400">
                        <strong>Code / Standard:</strong> {insp.standardsReferenced}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400 font-mono pt-1">
                      Inspector: {formatAddress(insp.inspector)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
