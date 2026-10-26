import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress } from "../utils/formatters";
import {
  ShieldCheck,
  Wallet,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Layers,
  Settings,
  HelpCircle,
} from "lucide-react";

export function Navbar({ activeTab, setActiveTab }) {
  const {
    account,
    connectWallet,
    disconnectWallet,
    roles,
    isConnecting,
    isContractConfigured,
    contractAddress,
    updateContractAddress,
  } = useWeb3();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputAddress, setInputAddress] = useState(contractAddress || "");

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (updateContractAddress(inputAddress.trim())) {
      setShowConfigModal(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Branding */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-sky-500/20">
                <Layers className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent">
                  BuildChain
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  v1.0 (Solidity 0.8.24)
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "dashboard"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("lookup")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "lookup"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                Track Material
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "register"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                Register Batch
              </button>
              <button
                onClick={() => setActiveTab("inspect")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "inspect"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                Quality Inspection
              </button>
              <button
                onClick={() => setActiveTab("custody")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "custody"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                Custody & Delivery
              </button>
              <button
                onClick={() => setActiveTab("verify")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "verify"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                Cert Verifier
              </button>
              {roles.isAdmin && (
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "admin"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40"
                  }`}
                >
                  Admin Roles
                </button>
              )}
            </nav>

            {/* Wallet & Status Area */}
            <div className="flex items-center gap-3">
              {/* Contract Status Indicator */}
              <button
                onClick={() => setShowConfigModal(true)}
                title={isContractConfigured ? `Connected to: ${contractAddress}` : "Contract not connected. Click to configure."}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                  isContractConfigured
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                }`}
              >
                {isContractConfigured ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Contract Linked</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Deploy Required</span>
                  </>
                )}
                <Settings className="h-3 w-3 ml-1 opacity-70" />
              </button>

              {/* Wallet Button */}
              {account ? (
                <div className="flex items-center gap-2">
                  {/* Role Tags */}
                  <div className="hidden lg:flex items-center gap-1">
                    {roles.isAdmin && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Admin
                      </span>
                    )}
                    {roles.isManufacturer && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Manufacturer
                      </span>
                    )}
                    {roles.isInspector && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Inspector
                      </span>
                    )}
                    {!roles.isAdmin && !roles.isManufacturer && !roles.isInspector && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                        Custodian
                      </span>
                    )}
                  </div>

                  <button
                    onClick={disconnectWallet}
                    title="Click to disconnect"
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {formatAddress(account)}
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-medium px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                >
                  <Wallet className="h-4 w-4" />
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation bar */}
          <div className="flex md:hidden overflow-x-auto py-2 gap-2 border-t border-slate-800/80">
            {["dashboard", "lookup", "register", "inspect", "custody", "verify"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium capitalize ${
                  activeTab === tab
                    ? "bg-sky-600 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                {tab === "verify" ? "Cert Verifier" : tab}
              </button>
            ))}
            {roles.isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium ${
                  activeTab === "admin" ? "bg-indigo-600 text-white" : "text-indigo-400"
                }`}
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contract Address Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-sky-400" />
              Smart Contract Bridge Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              When you run <code className="text-sky-300 font-mono">npm run deploy:local</code>, the contract address is automatically synchronized into <code className="text-sky-300 font-mono">frontend/src/contractConfig.json</code>. You can also manually paste a deployed address below.
            </p>

            <form onSubmit={handleSaveAddress} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contract Address (0x...)
                </label>
                <input
                  type="text"
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  placeholder="0x5FbDB2315678afecb367f032d93F642f64180aa3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Current Link Status:</span>
                  <span className={isContractConfigured ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                    {isContractConfigured ? "Connected" : "Not Deployed / Unlinked"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Target Chain ID:</span>
                  <span className="font-mono text-slate-300">31337 (Hardhat Localhost)</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
