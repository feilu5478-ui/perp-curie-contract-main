// scripts/deployTokens.ts
import { ethers } from "hardhat";

async function deployTokens() {
  console.log("=== 部署 BaseToken 和 QuoteToken ===");

  const [deployer] = await ethers.getSigners();
  
  // 价格预言机地址
  const priceFeedAddress = "0x137e565B66D7e1aCb3B08c6a35C16e18F5aa1C22";
  
  console.log("部署者:", deployer.address);
  console.log("价格预言机地址:", priceFeedAddress);

  // 1. 首先部署 QuoteToken
  console.log("\n1. 部署 QuoteToken...");
  
  const QuoteToken = await ethers.getContractFactory("QuoteToken");
  const quoteToken = await QuoteToken.deploy();
  await quoteToken.deployed();
  
  console.log("QuoteToken 部署地址:", quoteToken.address);
  
  // 初始化 QuoteToken
  await quoteToken.initialize("Test Quote Token", "TQT");
  console.log("✅ QuoteToken 初始化完成");
  
  // 铸造最大供应量给部署者
//   await quoteToken.mintMaximumTo("");
//   console.log("✅ QuoteToken 铸造完成");

  // 2. 部署 BaseToken
  console.log("\n2. 部署 BaseToken...");
  
  const BaseToken = await ethers.getContractFactory("BaseToken");
  const baseToken = await BaseToken.deploy();
  await baseToken.deployed();
  
  console.log("BaseToken 部署地址:", baseToken.address);
  
  // 初始化 BaseToken
  await baseToken.initialize("Test Base Token", "TBT", priceFeedAddress);
  console.log("✅ BaseToken 初始化完成");
  
  // 铸造最大供应量给部署者
//   await baseToken.mintMaximumTo(deployer.address);
//   console.log("✅ BaseToken 铸造完成");

  // 3. 验证地址顺序要求
  console.log("\n3. 验证地址顺序...");
  
  const baseTokenAddr = baseToken.address.toLowerCase();
  const quoteTokenAddr = quoteToken.address.toLowerCase();
  
  console.log("BaseToken 地址:", baseTokenAddr);
  console.log("QuoteToken 地址:", quoteTokenAddr);
  console.log("BaseToken < QuoteToken:", baseTokenAddr < quoteTokenAddr);
  
  if (baseTokenAddr >= quoteTokenAddr) {
    console.log("❌ 错误: BaseToken 地址必须小于 QuoteToken 地址");
    console.log("请重新部署以获取不同的地址...");
    return null;
  }
  
  console.log("✅ 地址顺序符合要求");

  // 4. 验证代币配置
  console.log("\n4. 验证代币配置...");
  
  // 验证 BaseToken 配置
  const baseTokenPriceFeed = await baseToken.getPriceFeed();
  console.log("BaseToken 价格预言机:", baseTokenPriceFeed);
  
  const baseTokenStatus = await baseToken.isOpen();
  console.log("BaseToken 状态:", baseTokenStatus ? "Open" : "Not Open");
  
  // 验证价格获取
  try {
    const indexPrice = await baseToken.getIndexPrice(0);
    console.log("BaseToken 指数价格:", indexPrice.toString());
  } catch (error) {
    console.log("获取指数价格失败:", error.message);
  }
  
  // 验证代币余额
  const deployerBaseBalance = await baseToken.balanceOf(deployer.address);
  const deployerQuoteBalance = await quoteToken.balanceOf(deployer.address);
  
  console.log("部署者 BaseToken 余额:", deployerBaseBalance.toString());
  console.log("部署者 QuoteToken 余额:", deployerQuoteBalance.toString());

  // 5. 输出部署摘要
  console.log("\n🎉 代币部署完成!");
  console.log("==========================================");
  console.log("BaseToken 地址:", baseToken.address);
  console.log("QuoteToken 地址:", quoteToken.address);
  console.log("价格预言机:", priceFeedAddress);
  console.log("部署者:", deployer.address);
  console.log("==========================================");

  return {
    baseToken,
    quoteToken,
    priceFeedAddress
  };
}

deployTokens().catch(console.error);