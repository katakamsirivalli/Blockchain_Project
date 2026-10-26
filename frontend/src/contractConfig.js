import { ethers } from "ethers";

// Default ABI definition extracted from BuildChain contract
// If deployment has run, the full JSON in ./contractConfig.json will take precedence
export const DEFAULT_BUILDCHAIN_ABI = [
  "event AdminTransferred(address indexed previousAdmin, address indexed newAdmin)",
  "event ManufacturerAuthorized(address indexed manufacturer, address indexed admin)",
  "event ManufacturerRevoked(address indexed manufacturer, address indexed admin)",
  "event InspectorAuthorized(address indexed inspector, address indexed admin)",
  "event InspectorRevoked(address indexed inspector, address indexed admin)",
  "event MaterialRegistered(string indexed batchId, string materialName, string materialType, uint256 quantity, string unit, bytes32 certificateHash, address indexed manufacturer, uint256 timestamp)",
  "event MaterialInspected(string indexed batchId, address indexed inspector, bool passed, string testNotes, string standardsReferenced, uint8 newStatus, uint256 timestamp)",
  "event CustodyTransferred(string indexed batchId, address indexed from, address indexed to, string newLocation, string transportNotes, uint256 timestamp)",
  "event MaterialDelivered(string indexed batchId, address indexed receiver, string finalLocation, string deliveryNotes, uint256 timestamp)",
  
  "function admin() view returns (address)",
  "function authorizedManufacturers(address) view returns (bool)",
  "function authorizedInspectors(address) view returns (bool)",
  "function checkRole(address account) view returns (bool isAdmin, bool isManufacturer, bool isInspector)",
  
  "function authorizeManufacturer(address manufacturer)",
  "function revokeManufacturer(address manufacturer)",
  "function authorizeInspector(address inspector)",
  "function revokeInspector(address inspector)",
  "function transferAdmin(address newAdmin)",
  
  "function registerMaterial(string batchId, string materialName, string materialType, uint256 quantity, string unit, string manufacturingLocation, bytes32 certificateHash, string certificateUri)",
  "function recordInspection(string batchId, bool passed, string testNotes, string standardsReferenced)",
  "function transferCustody(string batchId, address newCustodian, string newLocation, string transportNotes)",
  "function confirmDelivery(string batchId, string finalLocation, string deliveryNotes)",
  
  "function verifyCertificateHash(string batchId, bytes32 computedHash) view returns (bool isMatch, bytes32 storedHash, address manufacturer, uint256 registeredTimestamp)",
  "function getMaterialBatch(string batchId) view returns (string id, string materialName, string materialType, uint256 quantity, string unit, string manufacturingLocation, string currentLocation, bytes32 certificateHash, string certificateUri, address manufacturer, address currentCustodian, uint8 status, uint256 registeredTimestamp, bool isDelivered)",
  "function getCustodyHistory(string batchId) view returns (tuple(address from, address to, string location, string transportNotes, uint256 timestamp)[])",
  "function getInspectionHistory(string batchId) view returns (tuple(address inspector, bool passed, string testNotes, string standardsReferenced, uint256 timestamp)[])",
  "function getTotalBatchesCount() view returns (uint256)",
  "function getAllBatchIds() view returns (string[])"
];

// Dynamically load deployment details if available
let deployedAddress = "";
let deployedAbi = DEFAULT_BUILDCHAIN_ABI;
let networkInfo = { chainId: 31337, name: "Hardhat Localhost (Default)" };
let isConfigured = false;

try {
  // Vite supports glob / dynamic import or direct json import
  const rawConfig = import.meta.glob("./contractConfig.json", { eager: true });
  if (rawConfig["./contractConfig.json"]) {
    const data = rawConfig["./contractConfig.json"].default || rawConfig["./contractConfig.json"];
    if (data.contractAddress && ethers.isAddress(data.contractAddress)) {
      deployedAddress = data.contractAddress;
      if (data.abi && data.abi.length > 0) {
        deployedAbi = data.abi;
      }
      networkInfo = {
        chainId: data.chainId || 31337,
        name: data.networkName || "localhost",
        deployedAt: data.deployedAt,
      };
      isConfigured = true;
    }
  }
} catch (e) {
  console.warn("Could not load contractConfig.json; contract may not yet be deployed.", e);
}

export const CONTRACT_ADDRESS = deployedAddress;
export const CONTRACT_ABI = deployedAbi;
export const NETWORK_INFO = networkInfo;
export const IS_CONFIGURED = isConfigured;

/**
 * Returns an instance of the BuildChain contract
 * @param {ethers.Signer|ethers.Provider} runner 
 * @param {string} [overrideAddress]
 */
export function getBuildChainContract(runner, overrideAddress = null) {
  const targetAddress = overrideAddress || CONTRACT_ADDRESS;
  if (!targetAddress || !ethers.isAddress(targetAddress)) {
    throw new Error(
      "Contract address is not configured. Please run 'npm run deploy:local' to deploy the smart contract first."
    );
  }
  return new ethers.Contract(targetAddress, CONTRACT_ABI, runner);
}
