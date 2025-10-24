// scripts/set-account-balance-vault.ts
import { ethers } from "hardhat";

async function main() {
  // 配置参数 - 需要替换为实际地址
  const ACCOUNT_BALANCE_ADDRESS = "YOUR_ACCOUNT_BALANCE_ADDRESS";
  const VAULT_ADDRESS = "YOUR_VAULT_ADDRESS";

  console.log("设置 AccountBalance 的 Vault 地址...");
  console.log("AccountBalance 地址:", ACCOUNT_BALANCE_ADDRESS);
  console.log("Vault 地址:", VAULT_ADDRESS);

  const [deployer] = await ethers.getSigners();
  console.log("执行者地址:", deployer.address);

  const accountBalance = await ethers.getContractAt("AccountBalance", ACCOUNT_BALANCE_ADDRESS);

  // 检查当前所有者
  const owner = await accountBalance.owner();
  console.log("AccountBalance 所有者:", owner);

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("⚠️  警告: 当前账户不是合约所有者，可能无法执行设置");
    return;
  }

  // 获取当前 Vault 地址
  const currentVault = await accountBalance.getVault();
  console.log("当前 Vault 地址:", currentVault);

  if (currentVault === VAULT_ADDRESS) {
    console.log("✓ Vault 地址已经设置，无需重复设置");
    return;
  }

  // 设置 Vault 地址
  console.log("\n正在设置 Vault 地址...");
  const tx = await accountBalance.setVault(VAULT_ADDRESS);
  const receipt = await tx.wait();

  console.log("✓ Vault 地址设置成功");
  console.log("交易哈希:", tx.hash);
  console.log("Gas 消耗:", receipt.gasUsed.toString());

  // 验证设置
  const newVault = await accountBalance.getVault();
  console.log("新的 Vault 地址:", newVault);

  if (newVault === VAULT_ADDRESS) {
    console.log("✓ 验证成功: Vault 地址已正确设置");
  } else {
    console.log("✗ 验证失败: Vault 地址设置不正确");
  }
}

main().catch(console.error);