// scripts/set-vault-addresses.ts
import { ethers } from "hardhat";

async function main() {
  // 配置参数 - 需要替换为实际地址
  const VAULT_ADDRESS = "0xf12285fF19c58bD751dA4f604ebefc0C9Df00A10";
  const CLEARING_HOUSE = "0xC6dAc2934c24789CB0a1bDa7118a0Bc8367d8Daf";
  const COLLATERAL_MANAGER = "0x1FFb2980d81C4EACD3C8a52Be59829AdFE7F8Dee";
  // const WETH9 = "YOUR_WETH9_ADDRESS";
  // const TRUSTED_FORWARDER = "YOUR_TRUSTED_FORWARDER_ADDRESS";

  console.log("设置 Vault 相关地址...");
  console.log("Vault 地址:", VAULT_ADDRESS);
  console.log("ClearingHouse 地址:", CLEARING_HOUSE);
  console.log("CollateralManager 地址:", COLLATERAL_MANAGER);
  // console.log("WETH9 地址:", WETH9);
  // console.log("TrustedForwarder 地址:", TRUSTED_FORWARDER);

  const [deployer] = await ethers.getSigners();
  console.log("执行者地址:", deployer.address);

  const vault = await ethers.getContractAt("Vault", VAULT_ADDRESS);

  // 检查当前所有者
  const owner = await vault.owner();
  console.log("Vault 所有者:", owner);

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("⚠️  警告: 当前账户不是合约所有者，可能无法执行设置");
    return;
  }

  // 设置 ClearingHouse 地址
    console.log("\n设置 ClearingHouse 地址...");
    const currentClearingHouse = await vault.getClearingHouse();
    if (currentClearingHouse !== CLEARING_HOUSE) {
      const tx1 = await vault.setClearingHouse(CLEARING_HOUSE);
      await tx1.wait();
      console.log("✓ ClearingHouse 地址设置成功");
    } else {
      console.log("✓ ClearingHouse 地址已经设置");
    }
  

  // 设置 CollateralManager 地址
    console.log("设置 CollateralManager 地址...");
    const currentCollateralManager = await vault.getCollateralManager();
    if (currentCollateralManager !== COLLATERAL_MANAGER) {
      const tx2 = await vault.setCollateralManager(COLLATERAL_MANAGER);
      await tx2.wait();
      console.log("✓ CollateralManager 地址设置成功");
    } else {
      console.log("✓ CollateralManager 地址已经设置");
    }
  

  // 设置 WETH9 地址
  // if (WETH9 !== "YOUR_WETH9_ADDRESS") {
  //   console.log("设置 WETH9 地址...");
  //   const currentWETH9 = await vault.getWETH9();
  //   if (currentWETH9 !== WETH9) {
  //     const tx3 = await vault.setWETH9(WETH9);
  //     await tx3.wait();
  //     console.log("✓ WETH9 地址设置成功");
  //   } else {
  //     console.log("✓ WETH9 地址已经设置");
  //   }
  // }

  // 设置 TrustedForwarder 地址
  // if (TRUSTED_FORWARDER !== "YOUR_TRUSTED_FORWARDER_ADDRESS") {
  //   console.log("设置 TrustedForwarder 地址...");
  //   const tx4 = await vault.setTrustedForwarder(TRUSTED_FORWARDER);
  //   await tx4.wait();
  //   console.log("✓ TrustedForwarder 地址设置成功");
  // }

  console.log("\n✅ 所有地址设置完成!");
}

main().catch(console.error);