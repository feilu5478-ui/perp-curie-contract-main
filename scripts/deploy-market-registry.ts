// scripts/deploy-market-registry.ts
import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("开始部署 MarketRegistry 合约...");

  // 配置参数
  const UNISWAP_V3_FACTORY = "0xCbaec1555707dFAff3303ed6123Db16Eb67F1791";
  const QUOTE_TOKEN = "0x945EC0dDA06834dD592Ad246e07B47f025B8611E";

  console.log("使用参数:");
  console.log("UniswapV3 Factory:", UNISWAP_V3_FACTORY);
  console.log("Quote Token:", QUOTE_TOKEN);

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("部署者余额:", (await deployer.getBalance()).toString());

  // 部署 MarketRegistry 合约
  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  
  console.log("正在部署 MarketRegistry...");
  const marketRegistry = await upgrades.deployProxy(
    MarketRegistry,
    [UNISWAP_V3_FACTORY, QUOTE_TOKEN],
    { 
      initializer: "initialize",
      kind: "transparent"
    }
  );

  await marketRegistry.deployed();
  console.log("MarketRegistry 已部署到:", marketRegistry.address);

  // 验证合约信息
  console.log("\n验证合约配置...");
  
  const uniswapV3Factory = await marketRegistry.getUniswapV3Factory();
  const quoteToken = await marketRegistry.getQuoteToken();
  const maxOrdersPerMarket = await marketRegistry.getMaxOrdersPerMarket();

  console.log("验证 UniswapV3 Factory:", uniswapV3Factory);
  console.log("验证 Quote Token:", quoteToken);
  console.log("验证 Max Orders Per Market:", maxOrdersPerMarket.toString());

  // 验证实现合约地址
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(marketRegistry.address);
  console.log("实现合约地址:", implementationAddress);

  // 验证代理管理员地址
  const adminAddress = await upgrades.erc1967.getAdminAddress(marketRegistry.address);
  console.log("代理管理员地址:", adminAddress);

  console.log("\n部署完成!");
  console.log("MarketRegistry 代理地址:", marketRegistry.address);
  console.log("MarketRegistry 实现地址:", implementationAddress);

  return {
    marketRegistry,
    implementationAddress,
    adminAddress
  };
}

// 错误处理
main().catch((error) => {
  console.error("部署失败:", error);
  process.exit(1);
});

export { main };

