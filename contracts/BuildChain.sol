// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BuildChain: Blockchain-Based Construction Material Authentication and Traceability System
 * @author B.Tech CSE Final Year Project
 * @notice Manages lifecycle tracking, role authorization, quality inspection records,
 *         custody transfers, and cryptographic certificate hash verification for construction materials.
 *
 * NOTE ON PHYSICAL-DIGITAL BOUNDARY:
 * Blockchain guarantees data immutability, auditability, and cryptographic proof that a quality
 * certificate hash matches the registered original. However, on-chain verification verifies the integrity
 * of the digital record/document and does not independently guarantee the physical identity of the material
 * unless paired with tamper-evident physical tags (e.g., RFID, physical seals, or certified site testing).
 */
contract BuildChain {
    // --- State Enums ---

    enum MaterialStatus {
        Registered,       // Batch registered by authorized manufacturer
        InTransit,        // Batch currently transferring between custodians
        InspectedPassed,  // Certified and passed quality inspection
        InspectedFailed,  // Rejected by quality inspector due to standards failure
        Delivered         // Received and accepted at construction site
    }

    // --- Struct Definitions ---

    struct CustodyRecord {
        address from;
        address to;
        string location;
        string transportNotes;
        uint256 timestamp;
    }

    struct InspectionRecord {
        address inspector;
        bool passed;
        string testNotes;
        string standardsReferenced; // e.g. "IS 1786:2008 Grade Fe 500D"
        uint256 timestamp;
    }

    struct MaterialBatch {
        string batchId;             // Unique identifier e.g. "BATCH-STEEL-2026-001"
        string materialName;        // e.g. "TMT Thermo-Mechanically Treated Rebars"
        string materialType;        // e.g. "Steel", "Cement", "Concrete", "Aggregate"
        uint256 quantity;           // Amount in specified unit
        string unit;                // e.g. "Metric Tons", "Bags (50kg)", "Cubic Meters"
        string manufacturingLocation;
        string currentLocation;
        bytes32 certificateHash;    // SHA-256 hash of manufacturer test certificate / lab report
        string certificateUri;      // URI/IPFS link or reference to the test report
        address manufacturer;       // Address that registered the batch
        address currentCustodian;   // Current holder responsible for the batch
        MaterialStatus status;      // Current lifecycle status
        uint256 registeredTimestamp;// Block timestamp when registered
        bool isDelivered;           // Terminal flag indicating completed delivery
        bool exists;                // Existence check flag
    }

    // --- State Variables ---

    address public admin;

    // Role mappings
    mapping(address => bool) public authorizedManufacturers;
    mapping(address => bool) public authorizedInspectors;

    // Storage mappings
    mapping(string => MaterialBatch) private batches;
    mapping(string => CustodyRecord[]) private batchCustodyHistory;
    mapping(string => InspectionRecord[]) private batchInspectionHistory;

    // Index tracking
    string[] public allBatchIds;

    // --- Events ---

    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event ManufacturerAuthorized(address indexed manufacturer, address indexed admin);
    event ManufacturerRevoked(address indexed manufacturer, address indexed admin);
    event InspectorAuthorized(address indexed inspector, address indexed admin);
    event InspectorRevoked(address indexed inspector, address indexed admin);

    event MaterialRegistered(
        string indexed batchId,
        string materialName,
        string materialType,
        uint256 quantity,
        string unit,
        bytes32 certificateHash,
        address indexed manufacturer,
        uint256 timestamp
    );

    event MaterialInspected(
        string indexed batchId,
        address indexed inspector,
        bool passed,
        string testNotes,
        string standardsReferenced,
        MaterialStatus newStatus,
        uint256 timestamp
    );

    event CustodyTransferred(
        string indexed batchId,
        address indexed from,
        address indexed to,
        string newLocation,
        string transportNotes,
        uint256 timestamp
    );

    event MaterialDelivered(
        string indexed batchId,
        address indexed receiver,
        string finalLocation,
        string deliveryNotes,
        uint256 timestamp
    );

    // --- Modifiers ---

    modifier onlyAdmin() {
        require(msg.sender == admin, "BuildChain: Caller is not the admin");
        _;
    }

    modifier onlyAuthorizedManufacturer() {
        require(
            authorizedManufacturers[msg.sender] || msg.sender == admin,
            "BuildChain: Caller is not an authorized manufacturer"
        );
        _;
    }

    modifier onlyAuthorizedInspector() {
        require(
            authorizedInspectors[msg.sender] || msg.sender == admin,
            "BuildChain: Caller is not an authorized inspector"
        );
        _;
    }

    modifier batchExists(string memory batchId) {
        require(batches[batchId].exists, "BuildChain: Batch does not exist");
        _;
    }

    modifier notDelivered(string memory batchId) {
        require(!batches[batchId].isDelivered, "BuildChain: Batch is already delivered");
        _;
    }

    // --- Constructor ---

    constructor() {
        admin = msg.sender;
        // The deployer is automatically authorized for quick testing & demonstration
        authorizedManufacturers[msg.sender] = true;
        authorizedInspectors[msg.sender] = true;
    }

    // --- Role Management Functions ---

    /**
     * @notice Authorizes a manufacturer address to register material batches.
     * @param manufacturer Address of the manufacturer to authorize.
     */
    function authorizeManufacturer(address manufacturer) external onlyAdmin {
        require(manufacturer != address(0), "BuildChain: Invalid manufacturer address");
        require(!authorizedManufacturers[manufacturer], "BuildChain: Already authorized");
        authorizedManufacturers[manufacturer] = true;
        emit ManufacturerAuthorized(manufacturer, msg.sender);
    }

    /**
     * @notice Revokes manufacturer authorization.
     * @param manufacturer Address of the manufacturer to revoke.
     */
    function revokeManufacturer(address manufacturer) external onlyAdmin {
        require(authorizedManufacturers[manufacturer], "BuildChain: Not an authorized manufacturer");
        authorizedManufacturers[manufacturer] = false;
        emit ManufacturerRevoked(manufacturer, msg.sender);
    }

    /**
     * @notice Authorizes a quality testing inspector.
     * @param inspector Address of the inspector to authorize.
     */
    function authorizeInspector(address inspector) external onlyAdmin {
        require(inspector != address(0), "BuildChain: Invalid inspector address");
        require(!authorizedInspectors[inspector], "BuildChain: Already authorized");
        authorizedInspectors[inspector] = true;
        emit InspectorAuthorized(inspector, msg.sender);
    }

    /**
     * @notice Revokes quality inspector authorization.
     * @param inspector Address of the inspector to revoke.
     */
    function revokeInspector(address inspector) external onlyAdmin {
        require(authorizedInspectors[inspector], "BuildChain: Not an authorized inspector");
        authorizedInspectors[inspector] = false;
        emit InspectorRevoked(inspector, msg.sender);
    }

    /**
     * @notice Transfers admin rights to a new address.
     * @param newAdmin Address of the new admin.
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "BuildChain: Invalid new admin address");
        require(newAdmin != admin, "BuildChain: Cannot transfer to current admin");
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminTransferred(oldAdmin, newAdmin);
    }

    // --- Material Lifecycle Operations ---

    /**
     * @notice Registers a new construction material batch with cryptographic certificate hash.
     * @param batchId Unique identifier for the batch (e.g. "BATCH-STEEL-2026-001").
     * @param materialName Common or commercial trade name.
     * @param materialType Category of material (Steel, Cement, Concrete, etc.).
     * @param quantity Number of units manufactured.
     * @param unit Unit of measurement (Metric Tons, Bags, etc.).
     * @param manufacturingLocation Origin plant or mill location.
     * @param certificateHash SHA-256 hash of laboratory test report / Mill Test Certificate.
     * @param certificateUri IPFS CID or reference URL to view the certificate document.
     */
    function registerMaterial(
        string memory batchId,
        string memory materialName,
        string memory materialType,
        uint256 quantity,
        string memory unit,
        string memory manufacturingLocation,
        bytes32 certificateHash,
        string memory certificateUri
    ) external onlyAuthorizedManufacturer {
        require(bytes(batchId).length > 0, "BuildChain: Batch ID cannot be empty");
        require(!batches[batchId].exists, "BuildChain: Batch ID already registered");
        require(bytes(materialName).length > 0, "BuildChain: Material name cannot be empty");
        require(bytes(materialType).length > 0, "BuildChain: Material type cannot be empty");
        require(quantity > 0, "BuildChain: Quantity must be greater than zero");
        require(bytes(unit).length > 0, "BuildChain: Unit cannot be empty");
        require(bytes(manufacturingLocation).length > 0, "BuildChain: Location cannot be empty");
        require(certificateHash != bytes32(0), "BuildChain: Certificate hash is required");

        MaterialBatch storage newBatch = batches[batchId];
        newBatch.batchId = batchId;
        newBatch.materialName = materialName;
        newBatch.materialType = materialType;
        newBatch.quantity = quantity;
        newBatch.unit = unit;
        newBatch.manufacturingLocation = manufacturingLocation;
        newBatch.currentLocation = manufacturingLocation;
        newBatch.certificateHash = certificateHash;
        newBatch.certificateUri = certificateUri;
        newBatch.manufacturer = msg.sender;
        newBatch.currentCustodian = msg.sender;
        newBatch.status = MaterialStatus.Registered;
        newBatch.registeredTimestamp = block.timestamp;
        newBatch.isDelivered = false;
        newBatch.exists = true;

        allBatchIds.push(batchId);

        // Record initial custody creation
        batchCustodyHistory[batchId].push(
            CustodyRecord({
                from: address(0),
                to: msg.sender,
                location: manufacturingLocation,
                transportNotes: "Initial batch creation at manufacturing facility",
                timestamp: block.timestamp
            })
        );

        emit MaterialRegistered(
            batchId,
            materialName,
            materialType,
            quantity,
            unit,
            certificateHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Records quality inspection results performed by an authorized inspector.
     * @param batchId Unique identifier of the batch.
     * @param passed True if batch meets specifications, false if rejected.
     * @param testNotes Inspector notes regarding tensile strength, composition, slump, etc.
     * @param standardsReferenced Code standards applied (e.g., "IS 456 / ASTM A615").
     */
    function recordInspection(
        string memory batchId,
        bool passed,
        string memory testNotes,
        string memory standardsReferenced
    ) external onlyAuthorizedInspector batchExists(batchId) notDelivered(batchId) {
        require(bytes(testNotes).length > 0, "BuildChain: Test notes cannot be empty");

        MaterialBatch storage batch = batches[batchId];
        batch.status = passed ? MaterialStatus.InspectedPassed : MaterialStatus.InspectedFailed;

        batchInspectionHistory[batchId].push(
            InspectionRecord({
                inspector: msg.sender,
                passed: passed,
                testNotes: testNotes,
                standardsReferenced: standardsReferenced,
                timestamp: block.timestamp
            })
        );

        emit MaterialInspected(
            batchId,
            msg.sender,
            passed,
            testNotes,
            standardsReferenced,
            batch.status,
            block.timestamp
        );
    }

    /**
     * @notice Transfers physical custody of a batch to a logistics carrier, distributor, or site contractor.
     * @param batchId Unique identifier of the batch.
     * @param newCustodian Address of the entity receiving custody.
     * @param newLocation Physical destination or warehouse where material is being transferred.
     * @param transportNotes Vehicle number, bill of lading, or dispatch notes.
     */
    function transferCustody(
        string memory batchId,
        address newCustodian,
        string memory newLocation,
        string memory transportNotes
    ) external batchExists(batchId) notDelivered(batchId) {
        MaterialBatch storage batch = batches[batchId];

        require(
            msg.sender == batch.currentCustodian,
            "BuildChain: Only current custodian can transfer custody"
        );
        require(newCustodian != address(0), "BuildChain: Invalid new custodian address");
        require(newCustodian != msg.sender, "BuildChain: Cannot transfer custody to self");
        require(bytes(newLocation).length > 0, "BuildChain: Destination location required");
        require(
            batch.status != MaterialStatus.InspectedFailed,
            "BuildChain: Cannot transfer custody of a failed/rejected batch"
        );

        address previousCustodian = batch.currentCustodian;
        batch.currentCustodian = newCustodian;
        batch.currentLocation = newLocation;
        batch.status = MaterialStatus.InTransit;

        batchCustodyHistory[batchId].push(
            CustodyRecord({
                from: previousCustodian,
                to: newCustodian,
                location: newLocation,
                transportNotes: transportNotes,
                timestamp: block.timestamp
            })
        );

        emit CustodyTransferred(
            batchId,
            previousCustodian,
            newCustodian,
            newLocation,
            transportNotes,
            block.timestamp
        );
    }

    /**
     * @notice Confirms final delivery and acceptance of material at the construction site.
     * @param batchId Unique identifier of the batch.
     * @param finalLocation Verified construction site location.
     * @param deliveryNotes Receipt verification notes (e.g., Gate Pass #, Site Engineer Sign-off).
     */
    function confirmDelivery(
        string memory batchId,
        string memory finalLocation,
        string memory deliveryNotes
    ) external batchExists(batchId) notDelivered(batchId) {
        MaterialBatch storage batch = batches[batchId];

        require(
            msg.sender == batch.currentCustodian,
            "BuildChain: Only current custodian can confirm delivery"
        );
        require(
            batch.status != MaterialStatus.InspectedFailed,
            "BuildChain: Cannot deliver a failed/rejected material batch"
        );
        require(bytes(finalLocation).length > 0, "BuildChain: Final site location required");

        batch.status = MaterialStatus.Delivered;
        batch.isDelivered = true;
        batch.currentLocation = finalLocation;

        batchCustodyHistory[batchId].push(
            CustodyRecord({
                from: msg.sender,
                to: msg.sender,
                location: finalLocation,
                transportNotes: string.concat("Final Delivery Accepted: ", deliveryNotes),
                timestamp: block.timestamp
            })
        );

        emit MaterialDelivered(
            batchId,
            msg.sender,
            finalLocation,
            deliveryNotes,
            block.timestamp
        );
    }

    // --- Query & Verification Functions ---

    /**
     * @notice Verifies whether a given certificate hash matches the immutable on-chain record.
     * @dev Used by frontend / auditors to check if a digital or printed test certificate is authentic.
     * @param batchId Unique identifier of the batch.
     * @param computedHash The SHA-256 hash computed from the certificate in question.
     * @return isMatch True if computed hash matches on-chain hash, false otherwise.
     * @return storedHash The actual hash stored on-chain.
     * @return manufacturer The registered manufacturer address.
     * @return registeredTimestamp Registration timestamp.
     */
    function verifyCertificateHash(
        string memory batchId,
        bytes32 computedHash
    ) external view batchExists(batchId) returns (
        bool isMatch,
        bytes32 storedHash,
        address manufacturer,
        uint256 registeredTimestamp
    ) {
        MaterialBatch storage batch = batches[batchId];
        isMatch = (batch.certificateHash == computedHash);
        storedHash = batch.certificateHash;
        manufacturer = batch.manufacturer;
        registeredTimestamp = batch.registeredTimestamp;
    }

    /**
     * @notice Returns complete metadata for a material batch.
     * @param batchId Unique identifier of the batch.
     */
    function getMaterialBatch(
        string memory batchId
    ) external view batchExists(batchId) returns (MaterialBatch memory) {
        return batches[batchId];
    }

    /**
     * @notice Returns the full custody handover history for a batch.
     * @param batchId Unique identifier of the batch.
     */
    function getCustodyHistory(
        string memory batchId
    ) external view batchExists(batchId) returns (CustodyRecord[] memory) {
        return batchCustodyHistory[batchId];
    }

    /**
     * @notice Returns the full quality inspection history for a batch.
     * @param batchId Unique identifier of the batch.
     */
    function getInspectionHistory(
        string memory batchId
    ) external view batchExists(batchId) returns (InspectionRecord[] memory) {
        return batchInspectionHistory[batchId];
    }

    /**
     * @notice Returns the total count of registered material batches.
     */
    function getTotalBatchesCount() external view returns (uint256) {
        return allBatchIds.length;
    }

    /**
     * @notice Returns the complete list of all registered batch IDs.
     */
    function getAllBatchIds() external view returns (string[] memory) {
        return allBatchIds;
    }

    /**
     * @notice Checks the role of an address.
     * @param account Address to check.
     * @return isAdmin True if account is admin.
     * @return isManufacturer True if authorized manufacturer.
     * @return isInspector True if authorized inspector.
     */
    function checkRole(
        address account
    ) external view returns (bool isAdmin, bool isManufacturer, bool isInspector) {
        isAdmin = (account == admin);
        isManufacturer = authorizedManufacturers[account];
        isInspector = authorizedInspectors[account];
    }
}
