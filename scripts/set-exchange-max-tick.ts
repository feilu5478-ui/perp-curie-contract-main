// scripts/set-exchange-max-tick.ts
import { ethers } from "hardhat";

async function main() {
  // 配置参数 - 需要替换为实际地址
  const EXCHANGE_ADDRESS = "0x4EEe99beA14d52515A94463ca4D1d739Ad2a0F5F";
  const BASE_TOKEN = "0x14aA73eB98C623C8712c445847873AD0D29BD834"; // 例如 Quote Token 地址
  const MAX_TICK_CROSSED = 1000; // 设置合适的值

  console.log("设置 Exchange 的最大 Tick 跨度...");
  console.log("Exchange 地址:", EXCHANGE_ADDRESS);
  console.log("BaseToken 地址:", BASE_TOKEN);
  console.log("最大 Tick 跨度:", MAX_TICK_CROSSED);

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

  // 获取当前最大 Tick 跨度
  const currentMaxTick = await exchange.getMaxTickCrossedWithinBlock(BASE_TOKEN);
  console.log("当前最大 Tick 跨度:", currentMaxTick.toString());

  // if (currentMaxTick.eq(MAX_TICK_CROSSED)) {
  //   console.log("✓ 最大 Tick 跨度已经设置，无需重复设置");
  //   return;
  // }

  // 设置最大 Tick 跨度
  console.log("\n正在设置最大 Tick 跨度...");
  const tx = await exchange.setMaxTickCrossedWithinBlock(BASE_TOKEN, MAX_TICK_CROSSED, { gasLimit: 500000 });
  const receipt = await tx.wait();

  console.log("✓ 最大 Tick 跨度设置成功");
  console.log("交易哈希:", tx.hash);
  console.log("Gas 消耗:", receipt.gasUsed.toString());

  // 验证设置
  const newMaxTick = await exchange.getMaxTickCrossedWithinBlock(BASE_TOKEN);
  console.log("新的最大 Tick 跨度:", newMaxTick.toString());

  if (newMaxTick.eq(MAX_TICK_CROSSED)) {
    console.log("✓ 验证成功: 最大 Tick 跨度已正确设置");
  } else {
    console.log("✗ 验证失败: 最大 Tick 跨度设置不正确");
  }
}

main().catch(console.error);