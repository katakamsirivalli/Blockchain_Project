import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getStatusBadge, formatTimestamp, formatAddress } from "../utils/formatters";
import {
  Package,
  CheckCircle,
  Truck,
  Building,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Search,
  ExternalLink,
  PlusCircle,
  FileCheck,
  RefreshCw,
} from "lucide-react";

export function Dashboard({ setActiveTab, onSelectBatch }) {
  const { contract, isContractConfigured, account } = useWeb3();

  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    inTransit: 0,
    delivered: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (!contract || !isContractConfigured) return;
    setLoading(true);
    try {
      const batchIds = await contract.getAllBatchIds();
      const loadedBatches = [];

      let passedCount = 0;
      let inTransitCount = 0;
      let deliveredCount = 0;
      let failedCount = 0;

      // Fetch batch data for each registered batch
      for (let i = batchIds.length - 1; i >= 0; i--) {
        const id = batchIds[i];
        try {
          const batch = await contract.getMaterialBatch(id);
          const statusNum = Number(batch.status);

          if (statusNum === 2) passedCount++;
          else if (statusNum === 1) inTransitCount++;
          else if (statusNum === 4) deliveredCount++;
          else if (statusNum === 3) failedCount++;

          loadedBatches.push({
            batchId: batch.batchId,
            materialName: batch.materialName,
            materialType: batch.materialType,
            quantity: batch.quantity.toString(),
            unit: batch.unit,
            currentLocation: batch.currentLocation,
            status: statusNum,
            registeredTimestamp: batch.registeredTimestamp,
            currentCustodian: batch.currentCustodian,
            certificateHash: batch.certificateHash,
          });
        } catch (e) {
          console.warn(`Error loading batch ${id}:`, e);
        }
      }

      setBatches(loadedBatches);
      setStats({
        total: batchIds.length,
        passed: passedCount,
        inTransit: inTransitCount,
        delivered: deliveredCount,
        failed: failedCount,
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [contract, isContractConfigured]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 sm:p-8 border border-slate-700/60 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            Decentralized Construction Supply Chain
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            BuildChain Traceability Network
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            Authenticating construction materials, laboratory quality certificates, and unbroken chain of custody from mill manufacturing to job site placement.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab("register")}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/25 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Register New Batch
            </button>
            <button
              onClick={() => setActiveTab("lookup")}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition-all"
            >
              <Search className="h-4 w-4" />
              Trace Batch ID
            </button>
            <button
              onClick={() => setActiveTab("verify")}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition-all"
            >
              <FileCheck className="h-4 w-4" />
              Verify Test Certificate
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Academic Safety & Physical-Digital Boundary Disclaimer */}
      <div className="rounded-2xl bg-amber-950/20 border border-amber-500/30 p-4 sm:p-5 flex items-start gap-4">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-300">
            Academic & Real-World Notice: Physical-Digital Twin Boundary
          </h4>
          <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
            In blockchain-based supply chains, cryptographic hash verification proves the <strong>integrity of the digital document/record</strong> (guaranteeing that the Mill Test Certificate has not been forged or altered after registration). However, software and smart contracts cannot independently prove that physical rebar or cement bags at a job site correspond to the genuine batch without complementary physical anti-tamper security (e.g., RFID seals, tamper-evident QR tags, and on-site lab audits).
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Materials */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Batches</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-white font-mono">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Registered on ledger</p>
        </div>

        {/* Quality Passed */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Quality Certified</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
            {stats.passed}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Inspection Passed</p>
        </div>

        {/* In-Transit */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">In Transit</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-amber-400 font-mono">
            {stats.inTransit}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active transit leg</p>
        </div>

        {/* Delivered */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Site Delivered</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-teal-400 font-mono">
            {stats.delivered}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Accepted on site</p>
        </div>

        {/* Quarantined / Failed */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Quarantined</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-rose-400 font-mono">
            {stats.failed}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Inspection Failed</p>
        </div>
      </div>

      {/* Contract Connection Guidance (if unlinked) */}
      {!isContractConfigured && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-slate-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Smart Contract Not Deployed or Linked Yet
            </h3>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            To link the smart contract and display real-time blockchain batches:
          </p>
          <div className="mt-4 bg-slate-950 p-4 rounded-xl font-mono text-xs text-sky-300 space-y-2 border border-slate-800">
            <p className="text-slate-400"># 1. In terminal 1, start local Hardhat blockchain node:</p>
            <p className="text-white font-semibold">npx hardhat node</p>
            <p className="text-slate-400 pt-1"># 2. In terminal 2, deploy the smart contract:</p>
            <p className="text-white font-semibold">npm run deploy:local</p>
            <p className="text-slate-400 pt-1"># 3. (Optional) Populate sample test batches for viva:</p>
            <p className="text-white font-semibold">npm run seed:local</p>
          </div>
        </div>
      )}

      {/* Recent Material Batches Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Live Material Register</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified construction material batches stored on the blockchain
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {batches.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No material batches found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {isContractConfigured
                ? "Register a new material batch or run the seed script to populate sample batches."
                : "Please deploy the smart contract to view live registered batches."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Batch ID</th>
                  <th className="px-5 py-3.5">Material & Type</th>
                  <th className="px-5 py-3.5">Quantity</th>
                  <th className="px-5 py-3.5">Current Location</th>
                  <th className="px-5 py-3.5">Custodian</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {batches.map((item) => {
                  const badge = getStatusBadge(item.status);
                  return (
                    <tr
                      key={item.batchId}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-sky-400">
                        {item.batchId}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-200">
                          {item.materialName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.materialType}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-300 font-mono">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-5 py-4 text-slate-400 max-w-xs truncate">
                        {item.currentLocation}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-400">
                        {formatAddress(item.currentCustodian)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${badge.indicator}`}
                          ></span>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            if (onSelectBatch) onSelectBatch(item.batchId);
                            setActiveTab("lookup");
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline"
                        >
                          Trace
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
