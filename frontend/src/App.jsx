import React, { useState } from "react";
import { Web3Provider, useWeb3 } from "./context/Web3Context";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { RegisterMaterial } from "./components/RegisterMaterial";
import { MaterialLookup } from "./components/MaterialLookup";
import { QualityInspection } from "./components/QualityInspection";
import { CustodyTransfer } from "./components/CustodyTransfer";
import { CertificateVerifier } from "./components/CertificateVerifier";
import { RoleManager } from "./components/RoleManager";
import { Layers, ShieldCheck, Github, ExternalLink } from "lucide-react";

function MainContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const handleSelectBatch = (batchId) => {
    setSelectedBatchId(batchId);
    setActiveTab("lookup");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <Dashboard
            setActiveTab={setActiveTab}
            onSelectBatch={handleSelectBatch}
          />
        )}
        {activeTab === "lookup" && (
          <MaterialLookup initialBatchId={selectedBatchId} />
        )}
        {activeTab === "register" && (
          <RegisterMaterial
            onBatchCreated={(id) => {
              setSelectedBatchId(id);
              setActiveTab("lookup");
            }}
          />
        )}
        {activeTab === "inspect" && (
          <QualityInspection
            onInspectionRecorded={(id) => {
              setSelectedBatchId(id);
              setActiveTab("lookup");
            }}
          />
        )}
        {activeTab === "custody" && (
          <CustodyTransfer
            onCustodyUpdated={(id) => {
              setSelectedBatchId(id);
              setActiveTab("lookup");
            }}
          />
        )}
        {activeTab === "verify" && (
          <CertificateVerifier initialBatchId={selectedBatchId} />
        )}
        {activeTab === "admin" && <RoleManager />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-500" />
            <span className="font-semibold text-slate-300">BuildChain</span>
            <span>—</span>
            <span>Blockchain-Based Construction Material Authentication & Traceability</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Solidity ^0.8.24</span>
            <span>•</span>
            <span>Ethers.js v6</span>
            <span>•</span>
            <span>Hardhat</span>
            <span>•</span>
            <span>React (Vite)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <MainContent />
    </Web3Provider>
  );
}
