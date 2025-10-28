// scripts/set-order-book-exchange.ts
import { ethers } from "hardhat";

async function main() {
  // 配置参数 - 需要替换为实际地址
  const ORDER_BOOK_ADDRESS = "0x269D854FF25dA67Cbe409820c742EB4600f0Cc43";
  const EXCHANGE_ADDRESS = "0x891b4cb8743E3Ae419226068408dD00b225Cb46A";

  console.log("设置 OrderBook 的 Exchange 地址...");
  console.log("OrderBook 地址:", ORDER_BOOK_ADDRESS);
  console.log("Exchange 地址:", EXCHANGE_ADDRESS);

  const [deployer] = await ethers.getSigners();
  console.log("执行者地址:", deployer.address);

  const orderBook = await ethers.getContractAt("OrderBook", ORDER_BOOK_ADDRESS);

  // 检查当前所有者
  const owner = await orderBook.owner();
  console.log("OrderBook 所有者:", owner);

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("⚠️  警告: 当前账户不是合约所有者，可能无法执行设置");
  }

  // 设置 Exchange 地址
  console.log("\n正在设置 Exchange 地址...");
  const tx = await orderBook.setExchange(EXCHANGE_ADDRESS);
  await tx.wait();

  console.log("✓ Exchange 地址设置成功");
  console.log("交易哈希:", tx.hash);

  // 验证设置
  const currentExchange = await orderBook.getExchange();
  console.log("当前 Exchange 地址:", currentExchange);

  if (currentExchange.toLowerCase() === EXCHANGE_ADDRESS.toLowerCase()) {
    console.log("✓ 验证成功: Exchange 地址已正确设置");
  } else {
    console.log("✗ 验证失败: Exchange 地址设置不正确");
  }
}

main().catch(console.error);