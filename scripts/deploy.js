const hre = require("hardhat");

async function main() {
  console.log("[START] Deploying EscrowFactory to", hre.network.name, "...\n");

  const EscrowFactory = await hre.ethers.getContractFactory("EscrowFactory");
  const escrow = await EscrowFactory.deploy();

  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  const owner = await escrow.owner();

  console.log("[SUCCESS] EscrowFactory deployed successfully!");
  console.log("[LOC] Contract Address:", address);
  console.log("[USER] Owner:", owner);
  console.log("\n[TODO] Next Steps:");
  console.log(`   1. Add to .env: ESCROW_CONTRACT_ADDRESS=${address}`);
  console.log("   2. Verify on BSCScan (optional):");
  console.log(`      npx hardhat verify --network bnbTestnet ${address}`);
  console.log(
    "\n[LINK] View on BSCScan: https://testnet.bscscan.com/address/" + address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[ERROR] Deployment failed:", error);
    process.exit(1);
  });
