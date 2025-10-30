// // scripts/addWhitelist.ts
// import { ethers } from "hardhat";

// async function main() {
//   const baseToken = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e";
//   const quoteToken = "0x945EC0dDA06834dD592Ad246e07B47f025B8611E";
//   const positionManagerAddress = "0xdbfed06438ea751a6f1e972745257644438c61b8"; // 替换为实际的NonfungiblePositionManager地址

//   const BaseToken = await ethers.getContractFactory("BaseToken");
//   const baseTokenContract = BaseToken.attach(baseToken);
//   const QuoteToken = await ethers.getContractFactory("QuoteToken");
//   const quoteTokenContract = QuoteToken.attach(quoteToken);

//   console.log("将NonfungiblePositionManager加入BaseToken白名单...");
//   let tx = await baseTokenContract.addWhitelist(positionManagerAddress);
//   await tx.wait();

//   console.log("将NonfungiblePositionManager加入QuoteToken白名单...");
//   tx = await quoteTokenContract.addWhitelist(positionManagerAddress);
//   await tx.wait();

//   console.log("白名单设置完成");
// }

// main().catch(console.error);
// scripts/addWhitelist.ts
import { ethers } from "hardhat";

async function main() {
  console.log("添加必要的地址到白名单...");

  const [signer] = await ethers.getSigners();
  
  // 代币地址
  const baseToken = "0x57e6345d14a30A554806b254D161A1694eb3bD83";
  const quoteToken = "0xE3E009ADb11434B3fb9acfb5Cb8a30cc94E52cdE";
  
  // 需要添加到白名单的地址
  const whitelistAddresses = [
    signer.address, // 你的地址
    "0xc01DdaBBA95E9Cb45C1D7919c0B9f2fb6740c9f4", // Uniswap V3 Position Manager (Sepolia)
    "0x3DDB759BF377A352aA12e319a93B17ffA512Dd69", // Uniswap V3 Swap Router (Sepolia)
    "0xCbaec1555707dFAff3303ed6123Db16Eb67F1791", // Uniswap V3 Factory (Sepolia)
    "0xf12285fF19c58bD751dA4f604ebefc0C9Df00A10", // 你的 Vault 合约地址
    "0xC6dAc2934c24789CB0a1bDa7118a0Bc8367d8Daf", // 你的 ClearingHouse 合约地址
    "0xA642F92c7Cdc362e376487D0519d0752Ee6CD183", //MarketRegistry地址
    "0x35907c45f4fcd23d407fdbcf37d54812a56f6534" //uniswap池子地址
  ];

  // 获取代币合约
  const BaseToken = await ethers.getContractFactory("BaseToken");
  const baseTokenContract = BaseToken.attach(baseToken);
  
  const QuoteToken = await ethers.getContractFactory("QuoteToken");
  const quoteTokenContract = QuoteToken.attach(quoteToken);

  // 添加白名单
  for (const address of whitelistAddresses) {
    console.log(`添加地址 ${address} 到白名单...`);
    
    try {
      // 添加到 BaseToken 白名单
      const baseTx = await baseTokenContract.addWhitelist(address);
      await baseTx.wait();
      console.log(`✅ BaseToken 白名单添加成功: ${address}`);
      
      // 添加到 QuoteToken 白名单  
      const quoteTx = await quoteTokenContract.addWhitelist(address);
      await quoteTx.wait();
      console.log(`✅ QuoteToken 白名单添加成功: ${address}`);
    } catch (error) {
      console.log(`⚠️  地址 ${address} 可能已在白名单中或操作失败:`, error.message);
    }
  }

  console.log("白名单设置完成!");
}

main().catch(console.error);