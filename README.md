# BuildChain: Blockchain-Based Construction Material Authentication and Traceability System

[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20With-Hardhat-yellow?logo=ethereum)](https://hardhat.org/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-blue)](https://docs.ethers.org/v6/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-25%20Passing-brightgreen)]()

A decentralized provenance and quality verification platform designed to combat counterfeit building materials (such as substandard TMT steel rebars, adulterated cement, and forged mill test certificates) throughout the construction supply chain.

---

## 🏗️ Table of Contents
1. [Project Overview & Problem Statement](#-project-overview--problem-statement)
2. [System Architecture & Lifecycle Flow](#-system-architecture--lifecycle-flow)
3. [Key Features](#-key-features)
4. [Technology Stack](#-technology-stack)
5. [Project Structure](#-project-structure)
6. [Prerequisites](#-prerequisites)
7. [Step-by-Step Setup & Running Guide](#-step-by-step-setup--running-guide)
8. [Connecting MetaMask to Localhost](#-connecting-metamask-to-localhost)
9. [Running Automated Smart Contract Tests](#-running-automated-smart-contract-tests)
10. [Academic & Real-World Notice (Physical-Digital Twin Boundary)](#-academic--real-world-notice-physical-digital-twin-boundary)
11. [Project Viva & Presentation Defense Guide](#-project-viva--presentation-defense-guide)

---

## 📌 Project Overview & Problem Statement

In civil infrastructure projects, material quality failures directly jeopardize human lives:
- **Counterfeit Materials**: Unscrupulous suppliers swap certified high-ductility steel (e.g., Fe 500D) with brittle scrap steel.
- **Forged Test Certificates**: Paper-based Mill Test Reports (MTRs) and ISO quality certificates are easily altered using graphic tools.
- **Opaque Chain of Custody**: When concrete or steel fails on-site, assigning accountability between manufacturer, freight transporter, distributor, and contractor is exceedingly difficult.

**BuildChain** solves this through an immutable, decentralized audit trail on an Ethereum-compatible blockchain:
1. **Manufacturer Authorization**: Only authenticated producers can register material batches.
2. **Cryptographic Certificate Hashing**: Lab certificates are hashed via SHA-256 and committed on-chain upon creation.
3. **Independent QA Inspection**: Accredited testing agencies inspect batches against standards (e.g., IS 1786 / ASTM A615). Substandard batches are **quarantined on-chain**, blocking transfer and site delivery.
4. **Verifiable Custody & Delivery**: Every freight handover is recorded chronologically until the site engineer confirms acceptance.

---

## 🔄 System Architecture & Lifecycle Flow

```
                      +---------------------------------------+
                      |       Contract Deployer (Admin)       |
                      +---------------------------------------+
                                     |
               +---------------------+---------------------+
               | Authorizes                                | Authorizes
               v                                           v
    +----------------------+                   +----------------------+
    | Authorized           |                   | Authorized Quality   |
    | Manufacturer         |                   | Inspector            |
    +----------------------+                   +----------------------+
               |                                           |
               | 1. registerMaterial()                     | 2. recordInspection()
               |    (Attaches SHA-256 Cert Hash)           |    (Pass / Fail Verdict)
               v                                           |
    +------------------------------------------------------+--+
    |                     BuildChain Smart Contract           |
    |                   (Solidity ^0.8.24 on EVM)             |
    +------------------------------------------------------+--+
               |                                           |
               | 3. transferCustody()                      | 4. confirmDelivery()
               v                                           v
    +----------------------+                   +----------------------+
    | Logistics Carrier /  |                   | Job Site Engineer /  |
    | Distributor          |                   | General Contractor   |
    +----------------------+                   +----------------------+
               |                                           |
               +---------------------+---------------------+
                                     v
                 [ Anyone Can Verify Certificate Integrity ]
                 - verifyCertificateHash(batchId, testHash)
```

### Batch Lifecycle State Machine

```text
[Registered] ──> [Quality Inspection] ──┬──> (Passed) ──> [In Transit] ──> [Delivered & Accepted]
                                        │
                                        └──> (Failed) ──> [Quarantined - Locked]
```

---

## ✨ Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Admin**: Grants or revokes privileges for certified manufacturers and inspectors.
   - **Manufacturer**: Registers batches with origin mill details, quantity, and certificate hash.
   - **Quality Inspector**: Submits lab test observations and passes or fails batches.
   - **Custodian**: Transporters and distributors can transfer custody to the next stakeholder.
   - **Site Receiver**: Signs off on final physical receipt at the construction job site.

2. **Cryptographic Certificate Verification Tool**:
   - In-browser SHA-256 hash calculation using Web Crypto API.
   - On-chain comparison against the manufacturer's registered hash.
   - Instant visual verdict: **Verified Authentic** vs **Cryptographic Mismatch (Tampered)**.

3. **Complete Provenance & Timeline Explorer**:
   - Search any Batch ID to view full timeline: manufacturing origin, every custody transfer, transport notes, and QA audit results.

4. **Quarantine Enforcement**:
   - If an inspector flags a batch as `Failed`, the smart contract strictly rejects subsequent custody transfers and delivery confirmations.

---

## 💻 Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Smart Contracts** | **Solidity ^0.8.24** | Core business logic, modifiers, access control, events |
| **Development Framework** | **Hardhat 2.22** | Compilation, local node, automated tests, deployment scripts |
| **Client Blockchain Library** | **Ethers.js v6** | Provider and signer abstraction, RPC communication, contract calls |
| **Frontend Framework** | **React.js 18 + Vite** | High-performance, responsive single-page dashboard |
| **Styling** | **Tailwind CSS** | Modern dark-mode civil engineering dashboard design |
| **Iconography** | **Lucide React** | Clean, intuitive icons for supply chain workflows |

---

## 📁 Project Structure

```text
BuildChain/
│
├── .gitignore                      # Git ignore rules for node, cache, artifacts, env
├── README.md                       # Comprehensive project documentation
├── hardhat.config.js               # Hardhat configuration (Solidity 0.8.24, viaIR, networks)
├── package.json                    # Root package.json for Hardhat development & scripts
│
├── contracts/
│   └── BuildChain.sol              # Core smart contract
│
├── scripts/
│   ├── deploy.js                   # Deploys contract & exports address + ABI to frontend
│   └── seedData.js                 # Populates sample batches (Steel, Cement, Concrete)
│
├── test/
│   └── BuildChain.test.js          # 25 automated unit & integration test cases
│
└── frontend/                       # React + Vite web dashboard
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                 # App layout & active view router
        ├── index.css               # Tailwind CSS imports & custom styles
        ├── contractConfig.js       # Dynamic contract bridge (address + ABI)
        ├── context/
        │   └── Web3Context.jsx     # Wallet state, network detection, role resolution
        ├── components/
        │   ├── Navbar.jsx          # Header, wallet status, role badge, contract config modal
        │   ├── Dashboard.jsx       # Metrics cards, disclaimer, live batches register
        │   ├── RegisterMaterial.jsx# Manufacturer batch registration with cert hasher
        │   ├── MaterialLookup.jsx  # Traceability explorer & full provenance timeline
        │   ├── QualityInspection.jsx# QA portal for testing verdicts & engineering standards
        │   ├── CustodyTransfer.jsx # Freight handovers & site delivery confirmation
        │   ├── CertificateVerifier.jsx# Client-side file hasher & blockchain hash matcher
        │   └── RoleManager.jsx     # Admin authorization portal with sample account shortcuts
        └── utils/
            ├── cryptoUtils.js      # SHA-256 Web Crypto hashing & truncate helpers
            └── formatters.js       # Timestamp, address, and status badge helpers
```

---

## ⚙️ Prerequisites

Before running the project, ensure you have:
1. **Node.js**: `v18.0.0` or later (tested on `v24.11.1`).
2. **npm**: `v9.0.0` or later (tested on `11.6.2`).
3. **MetaMask Browser Extension**: Installed in Chrome, Edge, Brave, or Firefox.

Check your installed versions by running:
```bash
node -v
npm -v
```

---

## 🚀 Step-by-Step Setup & Running Guide

Follow these simple steps in your terminal to set up and run the entire project.

### Step 1: Open Terminal in Project Root
Navigate to your project root folder:
```bash
cd BuildChain
```

### Step 2: Compile the Smart Contract
Ensure the Solidity smart contracts compile cleanly:
```bash
npm run compile
```
You should see: `Compiled 1 Solidity file successfully (evm target: paris)`.

---

### Step 3: Start the Local Hardhat Blockchain Node
Open a **new dedicated terminal window** (Terminal 1) and run:
```bash
npx hardhat node
```
This starts an Ethereum test node running at `http://127.0.0.1:8545` with **20 pre-funded test accounts** (each having 10,000 test ETH). Keep this terminal open!

---

### Step 4: Deploy the Smart Contract
In your **main terminal window** (Terminal 2), deploy the contract to your running local node:
```bash
npm run deploy:local
```
This script:
1. Deploys `BuildChain.sol` using Account #0.
2. Extracts the compiled contract ABI.
3. Automatically writes the deployed contract address and ABI into `frontend/src/contractConfig.json`.

---

### Step 5: (Recommended) Seed Realistic Demo Batches
To quickly demonstrate all features during a college viva or evaluation without having to type everything from scratch, run the seed script:
```bash
npm run seed:local
```
This automatically registers and simulates 3 realistic materials:
- **Batch 1 (`BATCH-STEEL-2026-001`)**: Fe 500D TMT Steel Rebars (Passed inspection, currently In-Transit to a logistics hub).
- **Batch 2 (`BATCH-CEMENT-2026-002`)**: Grade 53 Portland Cement (Passed inspection, successfully Delivered & Accepted at metro site).
- **Batch 3 (`BATCH-RMC-2026-003`)**: Ready-Mix Concrete (Failed compressive strength test, Quarantined & locked).

---

### Step 6: Start the React Frontend
In Terminal 2, start the frontend development server:
```bash
cd frontend
npm run dev
```
Open your browser at:
👉 **`http://localhost:5173`**

---

## 🦊 Connecting MetaMask to Localhost

To interact with the smart contract through the web dashboard, connect MetaMask to your Hardhat local node:

### 1. Add Localhost Network to MetaMask
1. Open the MetaMask extension.
2. Click the Network dropdown (top-left) and select **Add Network** -> **Add a network manually**.
3. Enter the following details:
   - **Network Name**: `Hardhat Localhost`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
4. Click **Save** and switch to `Hardhat Localhost`.

### 2. Import a Test Account
Import Hardhat's pre-funded accounts into MetaMask using their private keys (displayed in your `npx hardhat node` terminal):

- **Account #0 (Contract Admin / Deployer)**:
  - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
  - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Account #1 (Sample Manufacturer)**:
  - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
  - Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Account #2 (Sample Quality Inspector)**:
  - Private Key: `0x5de4111afa1a4b94908f83103eb2f954108223c324a491b6430032515b4acc5b`
  - Address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

*(Note: These are well-known Hardhat development keys used exclusively for local sandbox testing. Never use these keys on public mainnets!)*

---

## 🧪 Running Automated Smart Contract Tests

A comprehensive suite of 25 unit and integration tests is located in `test/BuildChain.test.js`.

To run the test suite:
```bash
npm test
```
*(or `npx hardhat test`)*

### Test Coverage Summary:
```text
  BuildChain Smart Contract Test Suite
    1. Deployment and Initial State
      √ Should set the deployer as the admin
      √ Should auto-authorize the deployer as manufacturer and inspector
      √ Should initialize with zero batches
    2. Role Management & Access Control
      √ Admin can authorize a manufacturer
      √ Non-admin cannot authorize a manufacturer (reverts)
      √ Admin can revoke an authorized manufacturer
      √ Admin can authorize and revoke an inspector
      √ Admin can transfer admin role to another address
    3. Material Registration
      √ Authorized manufacturer can successfully register a batch
      √ Unauthorized account cannot register a material batch
      √ Reverts if attempting to register a duplicate batch ID
      √ Reverts if batch ID or required fields are empty
    4. Quality Inspection
      √ Authorized inspector can record a PASSED quality inspection
      √ Authorized inspector can record a FAILED quality inspection
      √ Unauthorized account cannot record an inspection
      √ Reverts inspection on non-existent batch
    5. Custody Transfers & Tracking
      √ Current custodian can transfer custody to logistics transporter
      √ Non-custodian cannot transfer custody
      √ Cannot transfer custody to zero address or self
      √ Cannot transfer custody of a failed/rejected material batch
    6. Site Delivery Confirmation
      √ Current custodian at site can confirm final delivery
      √ Cannot transfer custody or inspect after batch is delivered
    7. Certificate Hash Verification (Cryptographic Check)
      √ Returns true when provided hash matches the registered certificate hash
      √ Returns false when provided hash does not match (tampered certificate)
      √ Reverts verification for non-existent batch

  25 passing
```

---

## 🛡️ Academic & Real-World Notice (Physical-Digital Twin Boundary)

When presenting this project for an academic evaluation or viva, examiners often ask:  
*"Does matching the certificate hash prove that the physical steel rebars on-site are genuine?"*

### Clear Answer & Boundary Distinction:
1. **What Blockchain & Cryptographic Hashing Guarantees**:
   - **Document Integrity**: Proves that the lab test certificate / Mill Test Report has not been altered by even a single bit since the moment the manufacturer registered it.
   - **Non-Repudiation**: The manufacturer cannot deny having issued the certificate.
   - **Immutable Audit Trail**: Proves exactly which entity held custody of the material at every step in the supply chain.

2. **The "Oracle / Physical-Digital Twin Problem"**:
   - A blockchain ledger cannot independently guarantee that a truck driver didn't physically unload genuine steel rebars and replace them with scrap steel along the highway.
   - To bridge the digital ledger with the physical world, **BuildChain must be paired with physical anti-tamper mechanisms**:
     - Tamper-evident RFID tags or NFC seals embedded in material bundles.
     - Geofenced GPS tracking on transit vehicles.
     - On-site testing (rebound hammer, chemical spark spectrometry) at the construction yard gate before confirming final receipt.

---

## 🎓 Project Viva & Presentation Defense Guide

### Commonly Asked Viva Questions:

1. **Why use Solidity 0.8.24 and what does it provide?**
   - Solidity 0.8.24 incorporates built-in overflow and underflow arithmetic protection, optimized EVM target opcodes, and support for the `viaIR` intermediate representation pipeline, preventing stack-too-deep issues during complex struct operations.

2. **How does certificate hash matching work mathematically?**
   - When a manufacturer creates a batch, the PDF test report is passed through the SHA-256 cryptographic hashing algorithm, resulting in a unique 32-byte hexadecimal digest (`bytes32`). Even changing a single character or punctuation mark in the PDF produces a completely different hash (avalanche effect). The smart contract checks `keccak256` or `SHA-256` equality in $O(1)$ constant time.

3. **Why is role authorization decentralized via modifiers?**
   - The contract uses strict modifiers (`onlyAdmin`, `onlyAuthorizedManufacturer`, `onlyAuthorizedInspector`, `batchExists`, `notDelivered`) to ensure that unauthorized entities cannot inject fraudulent batches or fake test passes into the ledger.

4. **What happens if a batch fails inspection?**
   - The contract updates the batch status to `InspectedFailed`. The `transferCustody` and `confirmDelivery` functions contain explicit `require(status != MaterialStatus.InspectedFailed)` checks, permanently locking the substandard batch in a quarantine state.

---

## 📄 License
This project is developed for educational and academic research purposes under the **MIT License**.
