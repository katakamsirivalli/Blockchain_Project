const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("🌱 Seeding Demo Data for BuildChain Project...");
  console.log("=================================================");

  const configPath = path.join(__dirname, "../frontend/src/contractConfig.json");
  if (!fs.existsSync(configPath)) {
    throw new Error("contractConfig.json not found! Run 'npm run deploy:local' first.");
  }

  const { contractAddress } = JSON.parse(fs.readFileSync(configPath, "utf8"));
  console.log(`📍 Using deployed contract at: ${contractAddress}`);

  const [admin, manufacturer, inspector, transporter, siteEngineer] = await hre.ethers.getSigners();
  const buildChain = await hre.ethers.getContractAt("BuildChain", contractAddress);

  console.log("\n1️⃣ Authorizing Stakeholders...");
  // Authorize manufacturer (account #1)
  const isMfg = await buildChain.authorizedManufacturers(manufacturer.address);
  if (!isMfg) {
    const tx1 = await buildChain.connect(admin).authorizeManufacturer(manufacturer.address);
    await tx1.wait();
    console.log(`   ✅ Manufacturer Authorized: ${manufacturer.address}`);
  } else {
    console.log(`   ℹ️ Manufacturer already authorized.`);
  }

  // Authorize inspector (account #2)
  const isInsp = await buildChain.authorizedInspectors(inspector.address);
  if (!isInsp) {
    const tx2 = await buildChain.connect(admin).authorizeInspector(inspector.address);
    await tx2.wait();
    console.log(`   ✅ Quality Inspector Authorized: ${inspector.address}`);
  } else {
    console.log(`   ℹ️ Quality Inspector already authorized.`);
  }

  console.log("\n2️⃣ Registering Sample Material Batches...");

  // Batch 1: High Strength TMT Steel Rebars (Passed -> In Transit)
  const batch1Id = "BATCH-STEEL-2026-001";
  const cert1Hash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("CERT-STEEL-TATA-FE500D-APPROVED-2026"));
  try {
    const tx = await buildChain.connect(manufacturer).registerMaterial(
      batch1Id,
      "Fe 500D Thermo-Mechanically Treated Rebars",
      "Steel",
      75,
      "Metric Tons",
      "Tata Steel Jamshedpur Mill No. 4",
      cert1Hash,
      "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/tmt500d-cert.pdf"
    );
    await tx.wait();
    console.log(`   ✅ Batch 1 Registered: ${batch1Id}`);

    // Inspect Batch 1 (Passed)
    const txInsp = await buildChain.connect(inspector).recordInspection(
      batch1Id,
      true,
      "Tensile strength 575 MPa, elongation 17.5%, chemical composition verified according to IS 1786:2008.",
      "IS 1786:2008 Grade Fe 500D"
    );
    await txInsp.wait();
    console.log(`   🔬 Batch 1 Inspected (PASSED)`);

    // Transfer Custody to Transporter
    const txTransfer = await buildChain.connect(manufacturer).transferCustody(
      batch1Id,
      transporter.address,
      "Central Freight Corridor Logistics Hub, Nagpur",
      "Loaded onto Flatbed Transport Trailer #KA-01-E-7890. GPS tracking active."
    );
    await txTransfer.wait();
    console.log(`   🚚 Batch 1 In Transit (Custody -> Transporter)`);
  } catch (err) {
    console.log(`   ⚠️ Batch 1 might already exist: ${err.message}`);
  }

  // Batch 2: Grade 53 OPC Cement (Passed -> Delivered)
  const batch2Id = "BATCH-CEMENT-2026-002";
  const cert2Hash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("CERT-ULTRA-OPC53-LAB-PASSED-2026"));
  try {
    const tx = await buildChain.connect(manufacturer).registerMaterial(
      batch2Id,
      "UltraTech 53 Grade Ordinary Portland Cement",
      "Cement",
      1200,
      "Bags (50kg)",
      "UltraTech Cement Plant, Gujarat",
      cert2Hash,
      "ipfs://bafybeihkoviema7g3gx4223f2i34923f7y26nf3efuylqabf3oclgtqy55/opc53-lab-cert.pdf"
    );
    await tx.wait();
    console.log(`   ✅ Batch 2 Registered: ${batch2Id}`);

    // Inspect Batch 2 (Passed)
    const txInsp = await buildChain.connect(inspector).recordInspection(
      batch2Id,
      true,
      "Compressive strength at 28 days = 58.2 N/mm2 (Standard >= 53 N/mm2). Initial setting time 110 mins.",
      "IS 12269:2013 Grade 53 OPC"
    );
    await txInsp.wait();
    console.log(`   🔬 Batch 2 Inspected (PASSED)`);

    // Transfer to Transporter then to Site
    const txT1 = await buildChain.connect(manufacturer).transferCustody(
      batch2Id,
      transporter.address,
      "South Zone Transit Warehouse, Hyderabad",
      "Covered moisture-proof logistics truck #TS-09-UB-4421"
    );
    await txT1.wait();

    const txT2 = await buildChain.connect(transporter).transferCustody(
      batch2Id,
      siteEngineer.address,
      "Metro Elevated Viaduct Pier 42 Worksite",
      "Delivered on schedule to site receiving engineer"
    );
    await txT2.wait();

    // Confirm Delivery
    const txDelivered = await buildChain.connect(siteEngineer).confirmDelivery(
      batch2Id,
      "Metro Elevated Viaduct Pier 42 Worksite - Storage Shed B",
      "Physical count 1,200 bags verified without water damage. Gate pass #GP-55102 signed."
    );
    await txDelivered.wait();
    console.log(`   🏗️ Batch 2 Delivered & Accepted at Construction Site!`);
  } catch (err) {
    console.log(`   ⚠️ Batch 2 might already exist: ${err.message}`);
  }

  // Batch 3: Ready-Mix Concrete Batch (Failed Inspection - Quarantined)
  const batch3Id = "BATCH-RMC-2026-003";
  const cert3Hash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("CERT-RMC-M40-LAB-REPORT-2026"));
  try {
    const tx = await buildChain.connect(manufacturer).registerMaterial(
      batch3Id,
      "M40 Grade Ready-Mix Structural Concrete",
      "Concrete",
      35,
      "Cubic Meters",
      "Prism RMC Batching Plant, Bengaluru",
      cert3Hash,
      "ipfs://bafybeia2v2qwh77k26fudm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/rmc-cube-test.pdf"
    );
    await tx.wait();
    console.log(`   ✅ Batch 3 Registered: ${batch3Id}`);

    // Inspect Batch 3 (FAILED)
    const txInsp = await buildChain.connect(inspector).recordInspection(
      batch3Id,
      false,
      "7-day compressive strength test reached only 22 N/mm2 (expected minimum 26 N/mm2). Slump loss exceeded allowable limit. REJECTED.",
      "IS 456:2000 & IS 4926:2003"
    );
    await txInsp.wait();
    console.log(`   ❌ Batch 3 Inspected (FAILED / QUARANTINED - Cannot be transferred)`);
  } catch (err) {
    console.log(`   ⚠️ Batch 3 might already exist: ${err.message}`);
  }

  console.log("\n=================================================");
  console.log("🎉 Seeding complete! Hardhat node has live mock batches.");
  console.log("=================================================\n");
}

main().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exitCode = 1;
});
