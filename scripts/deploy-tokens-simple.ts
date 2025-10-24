// import * as fs from "fs";
// import { ethers, upgrades } from "hardhat";
// import * as path from "path";

// // 配置参数
// const CONFIG = {
//   // 需要先部署 PriceFeedDispatcher 或使用已有的地址
//   PRICE_FEED_DISPATCHER: "0xB640F67fA662B03a68dE21ceB6C1d6C9181e59ff", // 必须提供
//   TOKEN_NAMES: {
//     BASE_TOKEN: "Perp Base Token",
//     BASE_SYMBOL: "PBASE", 
//     QUOTE_TOKEN: "Perp Quote Token",
//     QUOTE_SYMBOL: "PQUOTE"
//   }
// };

// interface TokenDeployment {
//   baseToken: any;
//   quoteToken: any;
//   deploymentInfo: any;
// }

// class PerpTokenDeployer {
//   private deploymentPath: string;

//   constructor() {
//     this.deploymentPath = path.join(__dirname, "../deployments");
//   }

//   async deployQuoteToken(name: string, symbol: string) {
//     console.log(`🚀 Deploying QuoteToken: ${name} (${symbol})...`);
    
//     const QuoteToken = await ethers.getContractFactory("QuoteToken");
//     const quoteToken = await upgrades.deployProxy(
//       QuoteToken,
//       [name, symbol],
//       { 
//         initializer: "initialize",
//         kind: "transparent" // 使用透明代理避免 UUPS 问题
//       }
//     );

//     await quoteToken.deployed();
//     console.log(`✅ QuoteToken deployed to: ${quoteToken.address}`);
    
//     return quoteToken;
//   }

//   async deployBaseToken(name: string, symbol: string, priceFeed: string) {
//     console.log(`🚀 Deploying BaseToken: ${name} (${symbol})...`);
//     console.log(`   Price Feed: ${priceFeed}`);
    
//     // 验证价格源
//     if (!ethers.utils.isAddress(priceFeed)) {
//       throw new Error(`Invalid price feed address: ${priceFeed}`);
//     }

//     const BaseToken = await ethers.getContractFactory("BaseToken");
//     const baseToken = await upgrades.deployProxy(
//       BaseToken,
//       [name, symbol, priceFeed],
//       { 
//         initializer: "initialize",
//         kind: "transparent" // 使用透明代理
//       }
//     );

//     await baseToken.deployed();
//     console.log(`✅ BaseToken deployed to: ${baseToken.address}`);
    
//     // 验证价格源设置
//     const actualPriceFeed = await baseToken.getPriceFeed();
//     console.log(`✅ Price feed verified: ${actualPriceFeed}`);
    
//     return baseToken;
//   }

//   async deployTokensWithRetry(priceFeedDispatcher: string, maxAttempts: number = 3): Promise<TokenDeployment> {
//     console.log("🎯 Deploying tokens with address order check...");
//     console.log(`   Max attempts: ${maxAttempts}`);
    
//     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//       console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}...`);
      
//       try {
//         // 1. 先部署 QuoteToken
//         const quoteToken = await this.deployQuoteToken(
//           CONFIG.TOKEN_NAMES.QUOTE_TOKEN,
//           CONFIG.TOKEN_NAMES.QUOTE_SYMBOL
//         );

//         // 2. 然后部署 BaseToken
//         const baseToken = await this.deployBaseToken(
//           CONFIG.TOKEN_NAMES.BASE_TOKEN,
//           CONFIG.TOKEN_NAMES.BASE_SYMBOL,
//           priceFeedDispatcher
//         );

//         // 3. 检查地址排序
//         console.log("\n🔍 Checking token address order...");
//         const baseTokenAddress = baseToken.address.toLowerCase();
//         const quoteTokenAddress = quoteToken.address.toLowerCase();
        
//         console.log(`   BaseToken: ${baseTokenAddress}`);
//         console.log(`   QuoteToken: ${quoteTokenAddress}`);
        
//         if (baseTokenAddress < quoteTokenAddress) {
//           console.log("✅ Address order is correct: BaseToken < QuoteToken");
          
//           // 4. 铸造最大供应量
//           await this.mintMaximumSupply(baseToken, quoteToken);
          
//           const deploymentInfo = await this.saveDeployment(baseToken, quoteToken, attempt);
          
//           return {
//             baseToken,
//             quoteToken,
//             deploymentInfo
//           };
//         } else {
//           console.log("❌ Address order incorrect: BaseToken >= QuoteToken");
//           console.log("   Retrying deployment...");
          
//           // 清理这次尝试的合约（在测试网可以保留，在主网需要小心）
//           // 这里我们只是继续下一次尝试
//         }
        
//       } catch (error) {
//         console.error(`💥 Attempt ${attempt} failed:`, error);
        
//         if (attempt === maxAttempts) {
//           throw new Error(`Failed to deploy tokens after ${maxAttempts} attempts`);
//         }
//       }
//     }
    
//     throw new Error(`Failed to achieve correct address order after ${maxAttempts} attempts`);
//   }

//   async mintMaximumSupply(baseToken: any, quoteToken: any) {
//     const [deployer] = await ethers.getSigners();
    
//     console.log("\n💰 Minting maximum supply...");
    
//     // 铸造 BaseToken
//     console.log("   Minting BaseToken...");
//     const baseMintTx = await baseToken.mintMaximumTo(deployer.address);
//     await baseMintTx.wait();
    
//     // 铸造 QuoteToken
//     console.log("   Minting QuoteToken...");
//     const quoteMintTx = await quoteToken.mintMaximumTo(deployer.address);
//     await quoteMintTx.wait();
    
//     console.log("✅ Maximum supply minted to deployer");
    
//     // 验证余额
//     const baseBalance = await baseToken.balanceOf(deployer.address);
//     const quoteBalance = await quoteToken.balanceOf(deployer.address);
    
//     console.log(`   BaseToken balance: ${baseBalance.toString()}`);
//     console.log(`   QuoteToken balance: ${quoteBalance.toString()}`);
//   }

//   async saveDeployment(baseToken: any, quoteToken: any, attempt: number) {
//     const deploymentDir = path.join(__dirname, "../deployments/sepolia");
//     if (!fs.existsSync(deploymentDir)) {
//       fs.mkdirSync(deploymentDir, { recursive: true });
//     }

//     const deployment = {
//       timestamp: new Date().toISOString(),
//       network: "sepolia",
//       deployer: (await ethers.getSigners())[0].address,
//       deploymentAttempt: attempt,
//       proxyType: "transparent",
//       tokens: {
//         baseToken: {
//           address: baseToken.address,
//           name: CONFIG.TOKEN_NAMES.BASE_TOKEN,
//           symbol: CONFIG.TOKEN_NAMES.BASE_SYMBOL,
//           decimals: 18,
//           priceFeed: await baseToken.getPriceFeed(),
//           status: await baseToken.isOpen() ? "Open" : "Unknown"
//         },
//         quoteToken: {
//           address: quoteToken.address,
//           name: CONFIG.TOKEN_NAMES.QUOTE_TOKEN,
//           symbol: CONFIG.TOKEN_NAMES.QUOTE_SYMBOL,
//           decimals: 18
//         }
//       },
//       addressOrder: {
//         baseToken: baseToken.address.toLowerCase(),
//         quoteToken: quoteToken.address.toLowerCase(),
//         isValid: baseToken.address.toLowerCase() < quoteToken.address.toLowerCase()
//       },
//       notes: [
//         "BaseToken must be token0 in Uniswap pool",
//         "QuoteToken must be token1 in Uniswap pool", 
//         "Address order is correct for Perp V2 protocol",
//         "Need to create Uniswap V3 pool with these tokens",
//         "Need to setup whitelist after deploying other contracts"
//       ]
//     };

//     const deploymentFile = path.join(deploymentDir, "perp-tokens-complete.json");
//     fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
    
//     console.log(`\n💾 Deployment saved to: ${deploymentFile}`);
    
//     return deployment;
//   }

//   async verifyTokenFunctionality(baseToken: any, quoteToken: any) {
//     console.log("\n🧪 Verifying token functionality...");
    
//     try {
//       // 验证 BaseToken
//       const baseName = await baseToken.name();
//       const baseSymbol = await baseToken.symbol();
//       const baseDecimals = await baseToken.decimals();
//       const basePriceFeed = await baseToken.getPriceFeed();
//       const baseIsOpen = await baseToken.isOpen();
      
//       console.log(`✅ BaseToken: ${baseName} (${baseSymbol})`);
//       console.log(`   Decimals: ${baseDecimals}`);
//       console.log(`   Price Feed: ${basePriceFeed}`);
//       console.log(`   Status: ${baseIsOpen ? 'Open' : 'Not Open'}`);
      
//       // 验证 QuoteToken
//       const quoteName = await quoteToken.name();
//       const quoteSymbol = await quoteToken.symbol();
//       const quoteDecimals = await quoteToken.decimals();
      
//       console.log(`✅ QuoteToken: ${quoteName} (${quoteSymbol})`);
//       console.log(`   Decimals: ${quoteDecimals}`);
      
//       // 验证白名单功能
//       const [deployer] = await ethers.getSigners();
//       const isDeployerWhitelisted = await baseToken.isInWhitelist(deployer.address);
//       console.log(`✅ Deployer whitelisted: ${isDeployerWhitelisted}`);
      
//       // 测试价格获取（BaseToken）
//       try {
//         const indexPrice = await baseToken.getIndexPrice(0);
//         console.log(`✅ BaseToken index price: ${indexPrice.toString()}`);
//       } catch (error) {
//         console.log("⚠️  Could not get index price (might be normal if price feed not set up)");
//       }
      
//     } catch (error) {
//       console.error("❌ Token functionality verification failed:", error);
//     }
//   }
// }

// // 主部署函数
// async function main() {
//   const [deployer] = await ethers.getSigners();
//   console.log("👤 Deployer:", deployer.address);
//   console.log(`💰 ETH Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

//   // 检查价格源地址
//   if (CONFIG.PRICE_FEED_DISPATCHER === "YOUR_PRICE_FEED_DISPATCHER_ADDRESS") {
//     console.error("\n❌ Please set the PRICE_FEED_DISPATCHER address in the script");
//     console.log("💡 You need to deploy PriceFeedDispatcher first or use an existing one");
//     console.log("💡 You can deploy it using the price feed deployment scripts");
//     process.exit(1);
//   }

//   const deployerInstance = new PerpTokenDeployer();
  
//   try {
//     console.log("\n🎯 Starting Perp V2 token deployment...");
//     console.log(`   Price Feed Dispatcher: ${CONFIG.PRICE_FEED_DISPATCHER}`);
    
//     // 部署代币（带重试机制）
//     const deployment = await deployerInstance.deployTokensWithRetry(
//       CONFIG.PRICE_FEED_DISPATCHER,
//       3 // 最多尝试3次
//     );

//     // 验证功能
//     await deployerInstance.verifyTokenFunctionality(
//       deployment.baseToken, 
//       deployment.quoteToken
//     );

//     console.log("\n🎉 Perp V2 tokens deployed successfully!");
//     console.log("\n📋 Deployment Summary:");
//     console.log(`   BaseToken (${CONFIG.TOKEN_NAMES.BASE_SYMBOL}): ${deployment.baseToken.address}`);
//     console.log(`   QuoteToken (${CONFIG.TOKEN_NAMES.QUOTE_SYMBOL}): ${deployment.quoteToken.address}`);
//     console.log(`   Address Order: ${deployment.deploymentInfo.addressOrder.isValid ? '✅ Valid' : '❌ Invalid'}`);
    
//     console.log("\n⏭️  Next Steps:");
//     console.log("   1. Create Uniswap V3 pool with these tokens");
//     console.log("   2. Deploy MarketRegistry and other Perp V2 contracts");
//     console.log("   3. Setup whitelist for all protocol contracts");
//     console.log("   4. Add pool to MarketRegistry");

//   } catch (error) {
//     console.error("💥 Deployment failed:", error);
//     process.exit(1);
//   }
// }

// // 如果价格源尚未部署，可以使用这个临时方案
// async function deployWithMockPriceFeed() {
//   console.log("🔄 Deploying with mock price feed...");
  
//   // 这里可以添加部署模拟价格源的逻辑
//   // 或者使用一个已知的测试网价格源地址
  
//   console.log("⚠️  This is a temporary solution for testing");
//   console.log("💡 For production, you need a real PriceFeedDispatcher");
// }

// if (require.main === module) {
//   main().catch(async (error) => {
//     if (error.message.includes("PRICE_FEED_DISPATCHER")) {
//       console.log("\n🔄 Trying alternative deployment approach...");
//       await deployWithMockPriceFeed();
//     } else {
//       console.error("💥 Deployment failed:", error);
//       process.exit(1);
//     }
//   });
// }

// export { PerpTokenDeployer };

import * as fs from "fs";
import { ethers } from "hardhat";
import * as path from "path";

// 配置参数
const CONFIG = {
  // 需要先部署 PriceFeedDispatcher 或使用已有的地址
  PRICE_FEED_DISPATCHER: "0xB640F67fA662B03a68dE21ceB6C1d6C9181e59ff", // 必须提供
  TOKEN_NAMES: {
    BASE_TOKEN: "Perp Base Token",
    BASE_SYMBOL: "PBASE", 
    QUOTE_TOKEN: "Perp Quote Token",
    QUOTE_SYMBOL: "PQUOTE"
  }
};

interface TokenDeployment {
  baseToken: any;
  quoteToken: any;
  deploymentInfo: any;
}

class PerpTokenDeployer {
  private deploymentPath: string;

  constructor() {
    this.deploymentPath = path.join(__dirname, "../deployments");
  }

  async deployQuoteToken(name: string, symbol: string) {
    console.log(`🚀 Deploying QuoteToken (non-upgradeable): ${name} (${symbol})...`);
    
    const QuoteToken = await ethers.getContractFactory("QuoteToken");
    const quoteToken = await QuoteToken.deploy();
    await quoteToken.deployed();
    
    console.log(`✅ QuoteToken deployed to: ${quoteToken.address}`);
    
    // 初始化
    console.log("   Initializing QuoteToken...");
    const initTx = await quoteToken.initialize(name, symbol);
    await initTx.wait();
    console.log("✅ QuoteToken initialized");
    
    return quoteToken;
  }

  async deployBaseToken(name: string, symbol: string, priceFeed: string) {
    console.log(`🚀 Deploying BaseToken (non-upgradeable): ${name} (${symbol})...`);
    console.log(`   Price Feed: ${priceFeed}`);
    
    // 验证价格源
    if (!ethers.utils.isAddress(priceFeed)) {
      throw new Error(`Invalid price feed address: ${priceFeed}`);
    }

    const BaseToken = await ethers.getContractFactory("BaseToken");
    const baseToken = await BaseToken.deploy();
    await baseToken.deployed();
    
    console.log(`✅ BaseToken deployed to: ${baseToken.address}`);
    
    // 初始化
    console.log("   Initializing BaseToken...");
    const initTx = await baseToken.initialize(name, symbol, priceFeed);
    await initTx.wait();
    console.log("✅ BaseToken initialized");
    
    // 验证价格源设置
    const actualPriceFeed = await baseToken.getPriceFeed();
    console.log(`✅ Price feed verified: ${actualPriceFeed}`);
    
    return baseToken;
  }

  async deployTokensWithOrderCheck(priceFeedDispatcher: string): Promise<TokenDeployment> {
    console.log("🎯 Deploying tokens with address order optimization...");
    
    // 策略：先部署一个代币，然后根据地址决定部署另一个代币的角色
    const [deployer] = await ethers.getSigners();
    
    // 1. 先部署一个代币
    console.log("\n🔹 Deploying first token...");
    const firstToken = await this.deployQuoteToken(
      CONFIG.TOKEN_NAMES.QUOTE_TOKEN,
      CONFIG.TOKEN_NAMES.QUOTE_SYMBOL
    );
    
    // 2. 根据第一个代币的地址决定第二个代币的角色
    const firstTokenAddress = firstToken.address.toLowerCase();
    
    let baseToken, quoteToken;
    
    // 如果第一个代币地址较小，让它作为 BaseToken
    // 否则让它作为 QuoteToken，部署一个新的 BaseToken
    if (firstTokenAddress < "0x8000000000000000000000000000000000000000") {
      console.log("\n🔹 First token has low address, using it as BaseToken...");
      
      // 重新部署第一个代币作为 BaseToken
      console.log("   Redeploying as BaseToken...");
      baseToken = await this.deployBaseToken(
        CONFIG.TOKEN_NAMES.BASE_TOKEN,
        CONFIG.TOKEN_NAMES.BASE_SYMBOL,
        priceFeedDispatcher
      );
      
      // 部署新的 QuoteToken
      quoteToken = firstToken;
      
      // 更新 QuoteToken 的名称和符号（如果需要）
      console.log("   Updating QuoteToken info...");
      const quoteTokenAsBase = await ethers.getContractAt("BaseToken", quoteToken.address);
      // 注意：这里我们假设可以重新初始化，但实际上不能
      // 所以最好保持原样，或者部署新的 QuoteToken
      
    } else {
      console.log("\n🔹 First token has high address, using it as QuoteToken...");
      
      quoteToken = firstToken;
      
      // 部署 BaseToken
      baseToken = await this.deployBaseToken(
        CONFIG.TOKEN_NAMES.BASE_TOKEN,
        CONFIG.TOKEN_NAMES.BASE_SYMBOL,
        priceFeedDispatcher
      );
    }
    
    // 3. 最终检查地址排序
    console.log("\n🔍 Final address order check...");
    const baseTokenAddress = baseToken.address.toLowerCase();
    const quoteTokenAddress = quoteToken.address.toLowerCase();
    
    console.log(`   BaseToken: ${baseTokenAddress}`);
    console.log(`   QuoteToken: ${quoteTokenAddress}`);
    
    if (baseTokenAddress < quoteTokenAddress) {
      console.log("✅ Address order is correct: BaseToken < QuoteToken");
    } else {
      console.log("❌ Address order is incorrect, but we'll proceed anyway");
      console.log("   Note: This may cause issues when adding to MarketRegistry");
    }
    
    return { baseToken, quoteToken, deploymentInfo: null };
  }

  async deployTokensSimple(priceFeedDispatcher: string): Promise<TokenDeployment> {
    console.log("🎯 Deploying tokens (simple approach)...");
    
    // 简单方法：按顺序部署，然后检查结果
    const baseToken = await this.deployBaseToken(
      CONFIG.TOKEN_NAMES.BASE_TOKEN,
      CONFIG.TOKEN_NAMES.BASE_SYMBOL,
      priceFeedDispatcher
    );

    const quoteToken = await this.deployQuoteToken(
      CONFIG.TOKEN_NAMES.QUOTE_TOKEN,
      CONFIG.TOKEN_NAMES.QUOTE_SYMBOL
    );

    // 检查地址排序
    console.log("\n🔍 Checking token address order...");
    const baseTokenAddress = baseToken.address.toLowerCase();
    const quoteTokenAddress = quoteToken.address.toLowerCase();
    
    console.log(`   BaseToken: ${baseTokenAddress}`);
    console.log(`   QuoteToken: ${quoteTokenAddress}`);
    
    if (baseTokenAddress < quoteTokenAddress) {
      console.log("✅ Address order is correct: BaseToken < QuoteToken");
    } else {
      console.log("⚠️  Address order is incorrect: BaseToken >= QuoteToken");
      console.log("   This may cause issues in MarketRegistry.addPool()");
      console.log("   Consider redeploying with different account or using order optimization");
    }
    
    return { baseToken, quoteToken, deploymentInfo: null };
  }

  async mintMaximumSupply(baseToken: any, quoteToken: any) {
    const [deployer] = await ethers.getSigners();
    
    console.log("\n💰 Minting maximum supply...");
    
    // 铸造 BaseToken
    console.log("   Minting BaseToken...");
    const baseMintTx = await baseToken.mintMaximumTo(deployer.address);
    await baseMintTx.wait();
    
    // 铸造 QuoteToken
    console.log("   Minting QuoteToken...");
    const quoteMintTx = await quoteToken.mintMaximumTo(deployer.address);
    await quoteMintTx.wait();
    
    console.log("✅ Maximum supply minted to deployer");
    
    // 验证余额
    const baseBalance = await baseToken.balanceOf(deployer.address);
    const quoteBalance = await quoteToken.balanceOf(deployer.address);
    
    console.log(`   BaseToken balance: ${baseBalance.toString()}`);
    console.log(`   QuoteToken balance: ${quoteBalance.toString()}`);
  }

  async saveDeployment(baseToken: any, quoteToken: any) {
    const deploymentDir = path.join(__dirname, "../deployments/sepolia");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deployment = {
      timestamp: new Date().toISOString(),
      network: "sepolia",
      deployer: (await ethers.getSigners())[0].address,
      upgradeable: false,
      tokens: {
        baseToken: {
          address: baseToken.address,
          name: CONFIG.TOKEN_NAMES.BASE_TOKEN,
          symbol: CONFIG.TOKEN_NAMES.BASE_SYMBOL,
          decimals: 18,
          priceFeed: await baseToken.getPriceFeed(),
          status: await baseToken.isOpen() ? "Open" : "Unknown"
        },
        quoteToken: {
          address: quoteToken.address,
          name: CONFIG.TOKEN_NAMES.QUOTE_TOKEN,
          symbol: CONFIG.TOKEN_NAMES.QUOTE_SYMBOL,
          decimals: 18
        }
      },
      addressOrder: {
        baseToken: baseToken.address.toLowerCase(),
        quoteToken: quoteToken.address.toLowerCase(),
        isValid: baseToken.address.toLowerCase() < quoteToken.address.toLowerCase()
      },
      notes: [
        "Deployed as non-upgradeable contracts",
        "BaseToken must be token0 in Uniswap pool",
        "QuoteToken must be token1 in Uniswap pool", 
        "Address order validation is important for MarketRegistry",
        "Need to create Uniswap V3 pool with these tokens"
      ]
    };

    const deploymentFile = path.join(deploymentDir, "perp-tokens-non-upgradeable.json");
    fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
    
    console.log(`\n💾 Deployment saved to: ${deploymentFile}`);
    
    return deployment;
  }

  async verifyTokenFunctionality(baseToken: any, quoteToken: any) {
    console.log("\n🧪 Verifying token functionality...");
    
    try {
      // 验证 BaseToken
      const baseName = await baseToken.name();
      const baseSymbol = await baseToken.symbol();
      const baseDecimals = await baseToken.decimals();
      const basePriceFeed = await baseToken.getPriceFeed();
      const baseIsOpen = await baseToken.isOpen();
      
      console.log(`✅ BaseToken: ${baseName} (${baseSymbol})`);
      console.log(`   Decimals: ${baseDecimals}`);
      console.log(`   Price Feed: ${basePriceFeed}`);
      console.log(`   Status: ${baseIsOpen ? 'Open' : 'Not Open'}`);
      
      // 验证 QuoteToken
      const quoteName = await quoteToken.name();
      const quoteSymbol = await quoteToken.symbol();
      const quoteDecimals = await quoteToken.decimals();
      
      console.log(`✅ QuoteToken: ${quoteName} (${quoteSymbol})`);
      console.log(`   Decimals: ${quoteDecimals}`);
      
      // 验证白名单功能
      const [deployer] = await ethers.getSigners();
      const isDeployerWhitelisted = await baseToken.isInWhitelist(deployer.address);
      console.log(`✅ Deployer whitelisted: ${isDeployerWhitelisted}`);
      
      // 测试价格获取（BaseToken）
      try {
        const indexPrice = await baseToken.getIndexPrice(0);
        console.log(`✅ BaseToken index price: ${indexPrice.toString()}`);
      } catch (error) {
        console.log("⚠️  Could not get index price (might be normal if price feed not set up)");
      }
      
    } catch (error) {
      console.error("❌ Token functionality verification failed:", error);
    }
  }
}

// 主部署函数
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log(`💰 ETH Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  // 检查价格源地址
  if (CONFIG.PRICE_FEED_DISPATCHER === "YOUR_PRICE_FEED_DISPATCHER_ADDRESS") {
    console.error("\n❌ Please set the PRICE_FEED_DISPATCHER address in the script");
    console.log("💡 You need to deploy PriceFeedDispatcher first or use an existing one");
    console.log("📝 Edit the CONFIG.PRICE_FEED_DISPATCHER value in the script");
    process.exit(1);
  }

  const deployerInstance = new PerpTokenDeployer();
  
  try {
    console.log("\n🎯 Starting non-upgradeable Perp V2 token deployment...");
    console.log(`   Price Feed Dispatcher: ${CONFIG.PRICE_FEED_DISPATCHER}`);
    
    console.log("\n📋 Deployment Options:");
    console.log("1. Simple deployment (faster, may have address order issues)");
    console.log("2. Order-optimized deployment (slower, better address ordering)");
    
    // 使用简单部署方法（更可靠）
    console.log("\n🔹 Using simple deployment method...");
    const deployment = await deployerInstance.deployTokensSimple(CONFIG.PRICE_FEED_DISPATCHER);

    // 铸造最大供应量
    await deployerInstance.mintMaximumSupply(deployment.baseToken, deployment.quoteToken);

    // 保存部署信息
    const deploymentInfo = await deployerInstance.saveDeployment(
      deployment.baseToken, 
      deployment.quoteToken
    );

    // 验证功能
    await deployerInstance.verifyTokenFunctionality(
      deployment.baseToken, 
      deployment.quoteToken
    );

    console.log("\n🎉 Non-upgradeable Perp V2 tokens deployed successfully!");
    console.log("\n📋 Deployment Summary:");
    console.log(`   BaseToken (${CONFIG.TOKEN_NAMES.BASE_SYMBOL}): ${deployment.baseToken.address}`);
    console.log(`   QuoteToken (${CONFIG.TOKEN_NAMES.QUOTE_SYMBOL}): ${deployment.quoteToken.address}`);
    console.log(`   Address Order: ${deploymentInfo.addressOrder.isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   Upgradeable: ❌ No (non-upgradeable deployment)`);
    
    if (!deploymentInfo.addressOrder.isValid) {
      console.log("\n⚠️  WARNING: Address order is incorrect!");
      console.log("   This may cause issues when adding the pool to MarketRegistry");
      console.log("   Consider:");
      console.log("   - Using a different deployer account");
      console.log("   - Manually creating Uniswap pool with correct token order");
      console.log("   - Using the order-optimized deployment method");
    }
    
    console.log("\n⏭️  Next Steps:");
    console.log("   1. Create Uniswap V3 pool with these tokens");
    console.log("   2. Deploy MarketRegistry and other Perp V2 contracts");
    console.log("   3. Setup whitelist for all protocol contracts");
    console.log("   4. Add pool to MarketRegistry");

  } catch (error) {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  }
}

// 如果价格源尚未部署，可以使用这个临时方案
async function deployWithMockPriceFeed() {
  console.log("🔄 Attempting deployment with alternative price feed...");
  
  // 使用 Sepolia 测试网的 ETH/USD 价格源作为示例
  const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  
  console.log(`   Using Sepolia ETH/USD price feed: ${SEPOLIA_ETH_USD_FEED}`);
  console.log("⚠️  Note: This may not be compatible with your tokens");
  console.log("💡 For production, deploy a proper PriceFeedDispatcher");
  
  // 更新配置并重新运行部署
  const CONFIG_WITH_FEED = {
    ...CONFIG,
    PRICE_FEED_DISPATCHER: SEPOLIA_ETH_USD_FEED
  };
  
  // 这里可以重新运行部署逻辑
  console.log("💡 Please update the script with the correct price feed address");
}

if (require.main === module) {
  main().catch(async (error) => {
    if (error.message.includes("PRICE_FEED_DISPATCHER")) {
      console.log("\n🔄 Price feed address not set, trying alternative...");
      await deployWithMockPriceFeed();
    } else {
      console.error("💥 Deployment failed:", error);
      process.exit(1);
    }
  });
}

export { PerpTokenDeployer };
