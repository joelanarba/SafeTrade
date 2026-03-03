const hre = require("hardhat");

async function main() {
  console.log("[START] Deploying contracts to", hre.network.name, "...\n");

  // 1. Deploy Mock USDT
  console.log("[1/2] Deploying MockUSDT...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("MockUSDT deployed to:", usdtAddress);

  // 2. Deploy EscrowFactory with USDT address
  console.log("\n[2/2] Deploying EscrowFactory...");
  const EscrowFactory = await hre.ethers.getContractFactory("EscrowFactory");
  const escrow = await EscrowFactory.deploy(usdtAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  const owner = await escrow.owner();

  console.log("\n[SUCCESS] Deployment completed successfully!");
  console.log("--------------------------------------------------");
  console.log("MockUSDT Address:     ", usdtAddress);
  console.log("EscrowFactory Address:", escrowAddress);
  console.log("Owner Address:        ", owner);
  console.log("--------------------------------------------------");

  console.log("\n[TODO] Next Steps:");
  console.log(`   1. Add to .env.local:`);
  console.log(`      MOCK_USDT_ADDRESS=${usdtAddress}`);
  console.log(`      ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[ERROR] Deployment failed:", error);
    process.exit(1);
  });
