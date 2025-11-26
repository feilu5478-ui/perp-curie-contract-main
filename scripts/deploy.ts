import * as fs from "fs";
import { ethers, upgrades } from "hardhat";
import * as path from "path";

async function main() {
  console.log("Starting Perpetual Protocol V2 deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 1. 部署 ClearingHouseConfig
  console.log("\n1. Deploying ClearingHouseConfig...");
  const ClearingHouseConfig = await ethers.getContractFactory("ClearingHouseConfig");
  const clearingHouseConfig = await upgrades.deployProxy(ClearingHouseConfig, [], {
    initializer: "initialize",
  });
  await clearingHouseConfig.deployed();
  console.log("ClearingHouseConfig deployed to:", clearingHouseConfig.address);

  // 保存部署地址
  saveDeploymentAddress("ClearingHouseConfig", clearingHouseConfig.address);

  console.log("\n=== Deployment Completed ===");
  console.log("ClearingHouseConfig:", clearingHouseConfig.address);
}

function saveDeploymentAddress(contractName: string, address: string) {
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const network = process.env.HARDHAT_NETWORK || "sepolia";
  const deploymentFile = path.join(deploymentsDir, `${network}.json`);

  let deployments: any = {};
  if (fs.existsSync(deploymentFile)) {
    deployments = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  }

  deployments[contractName] = address;
  fs.writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });