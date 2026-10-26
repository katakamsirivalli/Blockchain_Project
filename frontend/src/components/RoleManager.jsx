import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress } from "../utils/formatters";
import { truncateHash } from "../utils/cryptoUtils";
import {
  UserCheck,
  UserX,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Info,
} from "lucide-react";

export function RoleManager() {
  const { contract, signer, roles, isContractConfigured, account, refreshRoles } = useWeb3();

  const [targetAddress, setTargetAddress] = useState("");
  const [roleType, setRoleType] = useState("manufacturer"); // "manufacturer" or "inspector"
  const [actionType, setActionType] = useState("authorize"); // "authorize" or "revoke"

  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Hardhat's well-known local test accounts for beginner convenience
  const localSampleAccounts = [
    { label: "Account #0 (Deployer / Admin)", address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" },
    { label: "Account #1 (Sample Manufacturer)", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
    { label: "Account #2 (Sample Inspector)", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
    { label: "Account #3 (Sample Transporter)", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
    { label: "Account #4 (Sample Site Engineer)", address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" },
  ];

  const handleRoleAction = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setTxHash("");

    if (!contract || !signer) {
      setErrorMessage("Please connect the Admin wallet first.");
      return;
    }

    if (!roles.isAdmin) {
      setErrorMessage("Only the contract Admin can authorize or revoke roles.");
      return;
    }

    if (!targetAddress.trim() || !targetAddress.startsWith("0x") || targetAddress.length !== 42) {
      setErrorMessage("Please enter a valid 42-character Ethereum address (0x...).");
      return;
    }

    setSubmitting(true);
    try {
      let tx;
      if (roleType === "manufacturer") {
        if (actionType === "authorize") {
          tx = await contract.authorizeManufacturer(targetAddress.trim());
        } else {
          tx = await contract.revokeManufacturer(targetAddress.trim());
        }
      } else {
        if (actionType === "authorize") {
          tx = await contract.authorizeInspector(targetAddress.trim());
        } else {
          tx = await contract.revokeInspector(targetAddress.trim());
        }
      }

      setTxHash(tx.hash);
      await tx.wait();

      setSuccessMessage(
        `Successfully ${actionType}d ${formatAddress(targetAddress)} as ${roleType}!`
      );
      await refreshRoles();
      setTargetAddress("");
    } catch (err) {
      console.error("Role update error:", err);
      setErrorMessage(err.reason || err.message || "Role transaction failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-indigo-400" />
          Access Control & Stakeholder Role Management
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          The Admin authorizes certified manufacturers to register batches and accredited QA inspectors to submit audit results.
        </p>
      </div>

      {/* Admin Status Warning if non-admin connected */}
      {!roles.isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-300">Admin Privileges Required:</strong>{" "}
            Your connected wallet ({account ? formatAddress(account) : "None"}) is not the contract Admin. To modify roles, connect the wallet used to deploy the contract.
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleRoleAction} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Role Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Role
              </label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="manufacturer">Authorized Manufacturer</option>
                <option value="inspector">Authorized Quality Inspector</option>
              </select>
            </div>

            {/* Action Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Action
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="authorize">Authorize (Grant Access)</option>
                <option value="revoke">Revoke (Remove Access)</option>
              </select>
            </div>

            {/* Target Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Ethereum Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="0x... (e.g. 0x70997970C51812dc3A010C7d01b50e0d17dc79C8)"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

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
              className={`inline-flex items-center gap-2 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 ${
                actionType === "authorize"
                  ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25"
                  : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/25"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating On-Chain Role...
                </>
              ) : actionType === "authorize" ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  Authorize Stakeholder
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4" />
                  Revoke Authorization
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick-Pick Hardhat Local Accounts Helper */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-sky-400" />
            <h4 className="text-xs font-bold text-slate-300">
              Hardhat Local Accounts Reference (Click to copy address into input):
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {localSampleAccounts.map((acc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTargetAddress(acc.address)}
                className="text-left p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 text-xs transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-[11px] text-slate-300 font-semibold">{acc.label}</div>
                  <div className="font-mono text-[11px] text-slate-500 truncate max-w-[240px]">
                    {acc.address}
                  </div>
                </div>
                <Copy className="h-3 w-3 text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
