// scripts/set-exchange-account-balance.ts
import { ethers } from "hardhat";

async function main() {
  // 配置参数 - 需要替换为实际地址
  const EXCHANGE_ADDRESS = "YOUR_EXCHANGE_ADDRESS";
  const ACCOUNT_BALANCE_ADDRESS = "YOUR_ACCOUNT_BALANCE_ADDRESS";

  console.log("设置 Exchange 的 AccountBalance 地址...");
  console.log("Exchange 地址:", EXCHANGE_ADDRESS);
  console.log("AccountBalance 地址:", ACCOUNT_BALANCE_ADDRESS);

  const [deployer] = await ethers.getSigners();
  console.log("执行者地址:", deployer.address);

  const exchange = await ethers.getContractAt("Exchange", EXCHANGE_ADDRESS);

  // 检查当前所有者
  const owner = await exchange.owner();
  console.log("Exchange 所有者:", owner);

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("⚠️  警告: 当前账户不是合约所有者，可能无法执行设置");
    return;
  }

  // 获取当前 AccountBalance 地址
  const currentAccountBalance = await exchange.getAccountBalance();
  console.log("当前 AccountBalance 地址:", currentAccountBalance);

  if (currentAccountBalance === ACCOUNT_BALANCE_ADDRESS) {
    console.log("✓ AccountBalance 地址已经设置，无需重复设置");
    return;
  }

  // 设置 AccountBalance 地址
  console.log("\n正在设置 AccountBalance 地址...");
  const tx = await exchange.setAccountBalance(ACCOUNT_BALANCE_ADDRESS);
  const receipt = await tx.wait();

  console.log("✓ AccountBalance 地址设置成功");
  console.log("交易哈希:", tx.hash);
  console.log("Gas 消耗:", receipt.gasUsed.toString());

  // 验证设置
  const newAccountBalance = await exchange.getAccountBalance();
  console.log("新的 AccountBalance 地址:", newAccountBalance);

  if (newAccountBalance === ACCOUNT_BALANCE_ADDRESS) {
    console.log("✓ 验证成功: AccountBalance 地址已正确设置");
  } else {
    console.log("✗ 验证失败: AccountBalance 地址设置不正确");
  }
}

main().catch(console.error);