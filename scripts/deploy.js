const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("🚀 Deploying BuildChain Smart Contract...");
  console.log("=================================================");

  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer Address: ${deployer.address}`);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Deploy BuildChain
  const BuildChain = await hre.ethers.getContractFactory("BuildChain");
  const buildChain = await BuildChain.deploy();
  await buildChain.waitForDeployment();

  const contractAddress = await buildChain.getAddress();
  console.log(`✅ BuildChain Contract deployed successfully!`);
  console.log(`📍 Contract Address: ${contractAddress}\n`);

  // Extract ABI from compiled artifacts
  const artifactPath = path.join(__dirname, "../artifacts/contracts/BuildChain.sol/BuildChain.json");
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  }

  // Frontend config directory & file
  const frontendDir = path.join(__dirname, "../frontend/src");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  const deploymentData = {
    contractAddress: contractAddress,
    networkName: network.name === "unknown" ? "localhost" : network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: abi,
  };

  const configPath = path.join(frontendDir, "contractConfig.json");
  fs.writeFileSync(configPath, JSON.stringify(deploymentData, null, 2));
  console.log(`💾 Configuration saved to frontend: ${configPath}`);
  console.log("=================================================");
  console.log("🎉 Deployment complete! You can now start the frontend.");
  console.log("=================================================\n");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
