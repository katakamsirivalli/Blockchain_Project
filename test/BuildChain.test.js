const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BuildChain Smart Contract Test Suite", function () {
  let BuildChain;
  let buildChain;
  let admin, manufacturer1, manufacturer2, inspector1, transporter, siteEngineer, unauthorizedUser;

  // Sample batch data
  const sampleBatchId = "BATCH-TMT-2026-001";
  const sampleName = "Fe 500D TMT Reinforcement Steel Rebars";
  const sampleType = "Steel";
  const sampleQuantity = 100;
  const sampleUnit = "Metric Tons";
  const sampleLocation = "Tata Steel Plant, Jamshedpur";
  // Sample SHA-256 hash (32 bytes hex) of a lab test report
  const sampleCertHash = ethers.keccak256(ethers.toUtf8Bytes("MTR-TEST-REPORT-GRADE-500D-APPROVED"));
  const sampleCertUri = "ipfs://QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

  beforeEach(async function () {
    [admin, manufacturer1, manufacturer2, inspector1, transporter, siteEngineer, unauthorizedUser] =
      await ethers.getSigners();

    BuildChain = await ethers.getContractFactory("BuildChain");
    buildChain = await BuildChain.deploy();
    await buildChain.waitForDeployment();
  });

  describe("1. Deployment and Initial State", function () {
    it("Should set the deployer as the admin", async function () {
      expect(await buildChain.admin()).to.equal(admin.address);
    });

    it("Should auto-authorize the deployer as manufacturer and inspector", async function () {
      const role = await buildChain.checkRole(admin.address);
      expect(role.isAdmin).to.be.true;
      expect(role.isManufacturer).to.be.true;
      expect(role.isInspector).to.be.true;
    });

    it("Should initialize with zero batches", async function () {
      expect(await buildChain.getTotalBatchesCount()).to.equal(0);
      const allIds = await buildChain.getAllBatchIds();
      expect(allIds.length).to.equal(0);
    });
  });

  describe("2. Role Management & Access Control", function () {
    it("Admin can authorize a manufacturer", async function () {
      await expect(buildChain.connect(admin).authorizeManufacturer(manufacturer1.address))
        .to.emit(buildChain, "ManufacturerAuthorized")
        .withArgs(manufacturer1.address, admin.address);

      expect(await buildChain.authorizedManufacturers(manufacturer1.address)).to.be.true;
    });

    it("Non-admin cannot authorize a manufacturer", async function () {
      await expect(
        buildChain.connect(unauthorizedUser).authorizeManufacturer(manufacturer1.address)
      ).to.be.revertedWith("BuildChain: Caller is not the admin");
    });

    it("Admin can revoke an authorized manufacturer", async function () {
      await buildChain.connect(admin).authorizeManufacturer(manufacturer1.address);
      await expect(buildChain.connect(admin).revokeManufacturer(manufacturer1.address))
        .to.emit(buildChain, "ManufacturerRevoked")
        .withArgs(manufacturer1.address, admin.address);

      expect(await buildChain.authorizedManufacturers(manufacturer1.address)).to.be.false;
    });

    it("Admin can authorize and revoke an inspector", async function () {
      await expect(buildChain.connect(admin).authorizeInspector(inspector1.address))
        .to.emit(buildChain, "InspectorAuthorized")
        .withArgs(inspector1.address, admin.address);

      expect(await buildChain.authorizedInspectors(inspector1.address)).to.be.true;

      await expect(buildChain.connect(admin).revokeInspector(inspector1.address))
        .to.emit(buildChain, "InspectorRevoked")
        .withArgs(inspector1.address, admin.address);

      expect(await buildChain.authorizedInspectors(inspector1.address)).to.be.false;
    });

    it("Admin can transfer admin role to another address", async function () {
      await expect(buildChain.connect(admin).transferAdmin(siteEngineer.address))
        .to.emit(buildChain, "AdminTransferred")
        .withArgs(admin.address, siteEngineer.address);

      expect(await buildChain.admin()).to.equal(siteEngineer.address);
    });
  });

  describe("3. Material Registration", function () {
    beforeEach(async function () {
      await buildChain.connect(admin).authorizeManufacturer(manufacturer1.address);
    });

    it("Authorized manufacturer can successfully register a batch", async function () {
      await expect(
        buildChain
          .connect(manufacturer1)
          .registerMaterial(
            sampleBatchId,
            sampleName,
            sampleType,
            sampleQuantity,
            sampleUnit,
            sampleLocation,
            sampleCertHash,
            sampleCertUri
          )
      )
        .to.emit(buildChain, "MaterialRegistered")
        .withArgs(
          sampleBatchId,
          sampleName,
          sampleType,
          sampleQuantity,
          sampleUnit,
          sampleCertHash,
          manufacturer1.address,
          await ethers.provider.getBlock("latest").then((b) => b.timestamp + 1)
        );

      expect(await buildChain.getTotalBatchesCount()).to.equal(1);

      const batch = await buildChain.getMaterialBatch(sampleBatchId);
      expect(batch.batchId).to.equal(sampleBatchId);
      expect(batch.materialName).to.equal(sampleName);
      expect(batch.materialType).to.equal(sampleType);
      expect(batch.quantity).to.equal(sampleQuantity);
      expect(batch.unit).to.equal(sampleUnit);
      expect(batch.currentCustodian).to.equal(manufacturer1.address);
      expect(batch.status).to.equal(0); // MaterialStatus.Registered
      expect(batch.isDelivered).to.be.false;

      // Verify initial custody record
      const custodyHistory = await buildChain.getCustodyHistory(sampleBatchId);
      expect(custodyHistory.length).to.equal(1);
      expect(custodyHistory[0].from).to.equal(ethers.ZeroAddress);
      expect(custodyHistory[0].to).to.equal(manufacturer1.address);
      expect(custodyHistory[0].location).to.equal(sampleLocation);
    });

    it("Unauthorized account cannot register a material batch", async function () {
      await expect(
        buildChain
          .connect(unauthorizedUser)
          .registerMaterial(
            sampleBatchId,
            sampleName,
            sampleType,
            sampleQuantity,
            sampleUnit,
            sampleLocation,
            sampleCertHash,
            sampleCertUri
          )
      ).to.be.revertedWith("BuildChain: Caller is not an authorized manufacturer");
    });

    it("Reverts if attempting to register a duplicate batch ID", async function () {
      await buildChain
        .connect(manufacturer1)
        .registerMaterial(
          sampleBatchId,
          sampleName,
          sampleType,
          sampleQuantity,
          sampleUnit,
          sampleLocation,
          sampleCertHash,
          sampleCertUri
        );

      await expect(
        buildChain
          .connect(manufacturer1)
          .registerMaterial(
            sampleBatchId,
            "Different Steel",
            sampleType,
            50,
            sampleUnit,
            sampleLocation,
            sampleCertHash,
            sampleCertUri
          )
      ).to.be.revertedWith("BuildChain: Batch ID already registered");
    });

    it("Reverts if batch ID or required fields are empty", async function () {
      await expect(
        buildChain
          .connect(manufacturer1)
          .registerMaterial(
            "",
            sampleName,
            sampleType,
            sampleQuantity,
            sampleUnit,
            sampleLocation,
            sampleCertHash,
            sampleCertUri
          )
      ).to.be.revertedWith("BuildChain: Batch ID cannot be empty");

      await expect(
        buildChain
          .connect(manufacturer1)
          .registerMaterial(
            "BATCH-02",
            sampleName,
            sampleType,
            0, // zero quantity
            sampleUnit,
            sampleLocation,
            sampleCertHash,
            sampleCertUri
          )
      ).to.be.revertedWith("BuildChain: Quantity must be greater than zero");

      await expect(
        buildChain
          .connect(manufacturer1)
          .registerMaterial(
            "BATCH-03",
            sampleName,
            sampleType,
            sampleQuantity,
            sampleUnit,
            sampleLocation,
            ethers.ZeroHash, // empty hash
            sampleCertUri
          )
      ).to.be.revertedWith("BuildChain: Certificate hash is required");
    });
  });

  describe("4. Quality Inspection", function () {
    beforeEach(async function () {
      await buildChain.connect(admin).authorizeManufacturer(manufacturer1.address);
      await buildChain.connect(admin).authorizeInspector(inspector1.address);

      await buildChain
        .connect(manufacturer1)
        .registerMaterial(
          sampleBatchId,
          sampleName,
          sampleType,
          sampleQuantity,
          sampleUnit,
          sampleLocation,
          sampleCertHash,
          sampleCertUri
        );
    });

    it("Authorized inspector can record a PASSED quality inspection", async function () {
      await expect(
        buildChain
          .connect(inspector1)
          .recordInspection(
            sampleBatchId,
            true,
            "Tensile strength 585 MPa, elongation 16%, meets BIS standards",
            "IS 1786:2008 Grade Fe 500D"
          )
      )
        .to.emit(buildChain, "MaterialInspected")
        .withArgs(
          sampleBatchId,
          inspector1.address,
          true,
          "Tensile strength 585 MPa, elongation 16%, meets BIS standards",
          "IS 1786:2008 Grade Fe 500D",
          2, // MaterialStatus.InspectedPassed
          await ethers.provider.getBlock("latest").then((b) => b.timestamp + 1)
        );

      const batch = await buildChain.getMaterialBatch(sampleBatchId);
      expect(batch.status).to.equal(2); // InspectedPassed

      const inspections = await buildChain.getInspectionHistory(sampleBatchId);
      expect(inspections.length).to.equal(1);
      expect(inspections[0].passed).to.be.true;
      expect(inspections[0].inspector).to.equal(inspector1.address);
    });

    it("Authorized inspector can record a FAILED quality inspection", async function () {
      await buildChain
        .connect(inspector1)
        .recordInspection(
          sampleBatchId,
          false,
          "Tensile strength below threshold (440 MPa), surface cracks detected",
          "IS 1786:2008"
        );

      const batch = await buildChain.getMaterialBatch(sampleBatchId);
      expect(batch.status).to.equal(3); // InspectedFailed
    });

    it("Unauthorized account cannot record an inspection", async function () {
      await expect(
        buildChain
          .connect(unauthorizedUser)
          .recordInspection(sampleBatchId, true, "Looks good", "Standard")
      ).to.be.revertedWith("BuildChain: Caller is not an authorized inspector");
    });

    it("Reverts inspection on non-existent batch", async function () {
      await expect(
        buildChain
          .connect(inspector1)
          .recordInspection("NON-EXISTENT-BATCH", true, "Looks good", "Standard")
      ).to.be.revertedWith("BuildChain: Batch does not exist");
    });
  });

  describe("5. Custody Transfers & Tracking", function () {
    beforeEach(async function () {
      await buildChain.connect(admin).authorizeManufacturer(manufacturer1.address);
      await buildChain.connect(admin).authorizeInspector(inspector1.address);

      await buildChain
        .connect(manufacturer1)
        .registerMaterial(
          sampleBatchId,
          sampleName,
          sampleType,
          sampleQuantity,
          sampleUnit,
          sampleLocation,
          sampleCertHash,
          sampleCertUri
        );
    });

    it("Current custodian can transfer custody to logistics transporter", async function () {
      await expect(
        buildChain
          .connect(manufacturer1)
          .transferCustody(
            sampleBatchId,
            transporter.address,
            "Transit Hub - Western Corridor Hub",
            "Dispatched via Truck #MH-04-AB-1234, Dispatch Note #DN-994"
          )
      )
        .to.emit(buildChain, "CustodyTransferred")
        .withArgs(
          sampleBatchId,
          manufacturer1.address,
          transporter.address,
          "Transit Hub - Western Corridor Hub",
          "Dispatched via Truck #MH-04-AB-1234, Dispatch Note #DN-994",
          await ethers.provider.getBlock("latest").then((b) => b.timestamp + 1)
        );

      const batch = await buildChain.getMaterialBatch(sampleBatchId);
      expect(batch.currentCustodian).to.equal(transporter.address);
      expect(batch.currentLocation).to.equal("Transit Hub - Western Corridor Hub");
      expect(batch.status).to.equal(1); // InTransit

      const custodyLogs = await buildChain.getCustodyHistory(sampleBatchId);
      expect(custodyLogs.length).to.equal(2);
      expect(custodyLogs[1].from).to.equal(manufacturer1.address);
      expect(custodyLogs[1].to).to.equal(transporter.address);
    });

    it("Non-custodian cannot transfer custody", async function () {
      await expect(
        buildChain
          .connect(unauthorizedUser)
          .transferCustody(
            sampleBatchId,
            siteEngineer.address,
            "Site C",
            "Illegal handover attempt"
          )
      ).to.be.revertedWith("BuildChain: Only current custodian can transfer custody");
    });

    it("Cannot transfer custody to zero address or self", async function () {
      await expect(
        buildChain
          .connect(manufacturer1)
          .transferCustody(sampleBatchId, ethers.ZeroAddress, "Site", "Invalid")
      ).to.be.revertedWith("BuildChain: Invalid new custodian address");

      await expect(
        buildChain
          .connect(manufacturer1)
          .transferCustody(sampleBatchId, manufacturer1.address, "Site", "Invalid")
      ).to.be.revertedWith("BuildChain: Cannot transfer custody to self");
    });

    it("Cannot transfer custody of a failed/rejected material batch", async function () {
      // Mark as failed
      await buildChain
        .connect(inspector1)
        .recordInspection(sampleBatchId, false, "Failed chemical test", "Standard");

      await expect(
        buildChain
          .connect(manufacturer1)
          .transferCustody(sampleBatchId, transporter.address, "Hub", "Dispatch")
      ).to.be.revertedWith("BuildChain: Cannot transfer custody of a failed/rejected batch");
    });
  });

  describe("6. Site Delivery Confirmation", function () {
    beforeEach(async function () {
      await buildChain.connect(admin).authorizeManufacturer(manufacturer1.address);
      await buildChain
        .connect(manufacturer1)
        .registerMaterial(
          sampleBatchId,
          sampleName,
          sampleType,
          sampleQuantity,
          sampleUnit,
          sampleLocation,
          sampleCertHash,
          sampleCertUri
        );

      // Transfer to site engineer
      await buildChain
        .connect(manufacturer1)
        .transferCustody(
          sampleBatchId,
          siteEngineer.address,
          "Metro Station Pier 14 Site",
          "Dispatched directly to job site"
        );
    });

    it("Current custodian at site can confirm final delivery", async function () {
      await expect(
        buildChain
          .connect(siteEngineer)
          .confirmDelivery(
            sampleBatchId,
            "Metro Station Construction Yard Pier 14",
            "Gate Pass #GP-8831 verified, visual count 100 tons confirmed"
          )
      )
        .to.emit(buildChain, "MaterialDelivered")
        .withArgs(
          sampleBatchId,
          siteEngineer.address,
          "Metro Station Construction Yard Pier 14",
          "Gate Pass #GP-8831 verified, visual count 100 tons confirmed",
          await ethers.provider.getBlock("latest").then((b) => b.timestamp + 1)
        );

      const batch = await buildChain.getMaterialBatch(sampleBatchId);
      expect(batch.status).to.equal(4); // MaterialStatus.Delivered
      expect(batch.isDelivered).to.be.true;
      expect(batch.currentLocation).to.equal("Metro Station Construction Yard Pier 14");
    });

    it("Cannot transfer custody or inspect after batch is delivered", async function () {
      await buildChain
        .connect(siteEngineer)
        .confirmDelivery(sampleBatchId, "Job Site Yard", "Accepted");

      await expect(
        buildChain
          .connect(siteEngineer)
          .transferCustody(sampleBatchId, transporter.address, "Hub", "Attempt")
      ).to.be.revertedWith("BuildChain: Batch is already delivered");

      await expect(
        buildChain
          .connect(admin)
          .recordInspection(sampleBatchId, true, "Late inspection", "Standard")
      ).to.be.revertedWith("BuildChain: Batch is already delivered");
    });
  });

  describe("7. Certificate Hash Verification (Cryptographic Check)", function () {
    beforeEach(async function () {
      await buildChain.connect(admin).authorizeManufacturer(manufacturer1.address);
      await buildChain
        .connect(manufacturer1)
        .registerMaterial(
          sampleBatchId,
          sampleName,
          sampleType,
          sampleQuantity,
          sampleUnit,
          sampleLocation,
          sampleCertHash,
          sampleCertUri
        );
    });

    it("Returns true when provided hash matches the registered certificate hash", async function () {
      const result = await buildChain.verifyCertificateHash(sampleBatchId, sampleCertHash);
      expect(result.isMatch).to.be.true;
      expect(result.storedHash).to.equal(sampleCertHash);
      expect(result.manufacturer).to.equal(manufacturer1.address);
    });

    it("Returns false when provided hash does not match (tampered certificate)", async function () {
      const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("TAMPERED-OR-FORGED-REPORT"));
      const result = await buildChain.verifyCertificateHash(sampleBatchId, tamperedHash);
      expect(result.isMatch).to.be.false;
      expect(result.storedHash).to.equal(sampleCertHash);
    });

    it("Reverts verification for non-existent batch", async function () {
      await expect(
        buildChain.verifyCertificateHash("UNKNOWN-BATCH", sampleCertHash)
      ).to.be.revertedWith("BuildChain: Batch does not exist");
    });
  });
});
