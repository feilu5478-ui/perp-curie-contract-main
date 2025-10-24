import * as fs from "fs";
import { ethers } from "hardhat";
import * as path from "path";

// Uniswap V3 配置
const UNISWAP_CONFIG = {
  FACTORY: "0xCbaec1555707dFAff3303ed6123Db16Eb67F1791",
  FEE_TIER: 500, // 0.05%
  INITIAL_SQRT_PRICE: "79228162514264337593543950336" // 对应价格 1.0 (2^96)
};

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // 读取代币部署信息
  const tokensPath = path.join(__dirname, "../deployments/sepolia/perp-tokens-non-upgradeable.json");
  if (!fs.existsSync(tokensPath)) {
    console.error("❌ Perp tokens not deployed. Please deploy them first.");
    return;
  }

  const tokensDeployment = JSON.parse(fs.readFileSync(tokensPath, "utf8"));
  const baseToken = tokensDeployment.tokens.baseToken;
  const quoteToken = tokensDeployment.tokens.quoteToken;

  console.log("🏊 Creating Uniswap V3 pool...");
  console.log(`   BaseToken: ${baseToken.address} (${baseToken.symbol})`);
  console.log(`   QuoteToken: ${quoteToken.address} (${quoteToken.symbol})`);
  console.log(`   Fee Tier: ${UNISWAP_CONFIG.FEE_TIER} (0.05%)`);

  try {
    // 1. 获取 Uniswap V3 Factory 合约
    const factoryABI = [
      "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
      "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)"
    ];
    
    const factory = await ethers.getContractAt(factoryABI, UNISWAP_CONFIG.FACTORY);

    // 2. 检查池子是否已存在
    console.log("\n🔍 Checking if pool already exists...");
    const existingPool = await factory.getPool(baseToken.address, quoteToken.address, UNISWAP_CONFIG.FEE_TIER);
    
    if (existingPool !== ethers.constants.AddressZero) {
      console.log(`✅ Pool already exists: ${existingPool}`);
      
      // 更新部署信息
      await updateDeploymentWithPool(existingPool);
      return;
    }

    // 3. 创建新池子
    console.log("\n🆕 Creating new pool...");
    const createTx = await factory.createPool(baseToken.address, quoteToken.address, UNISWAP_CONFIG.FEE_TIER);
    const receipt = await createTx.wait();
    
    // 从事件中获取池子地址
    const poolCreatedEvent = receipt.events?.find((e: any) => e.event === "PoolCreated");
    const poolAddress = poolCreatedEvent?.args?.pool;
    
    console.log(`✅ Pool created: ${poolAddress}`);

    // 4. 初始化池子价格
    console.log("\n💰 Initializing pool price...");
    const poolABI = [
      "function initialize(uint160 sqrtPriceX96) external"
    ];
    const pool = await ethers.getContractAt(poolABI, poolAddress);
    
    const initializeTx = await pool.initialize(UNISWAP_CONFIG.INITIAL_SQRT_PRICE);
    await initializeTx.wait();
    console.log("✅ Pool initialized with price 1.0");

    // 5. 验证池子
    console.log("\n🔍 Verifying pool...");
    const slot0ABI = [
      "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
    ];
    const poolWithSlot0 = await ethers.getContractAt(slot0ABI, poolAddress);
    const slot0 = await poolWithSlot0.slot0();
    
    console.log(`✅ Pool sqrtPriceX96: ${slot0.sqrtPriceX96}`);
    console.log(`✅ Pool tick: ${slot0.tick}`);
    console.log(`✅ Pool initialized: ${slot0.sqrtPriceX96 !== "0"}`);

    // 6. 更新部署信息
    await updateDeploymentWithPool(poolAddress);

  } catch (error) {
    console.error("💥 Failed to create pool:", error);
  }
}

async function updateDeploymentWithPool(poolAddress: string) {
  const deploymentDir = path.join(__dirname, "../deployments/sepolia");
  const tokensPath = path.join(deploymentDir, "perp-tokens.json");
  
  const deployment = JSON.parse(fs.readFileSync(tokensPath, "utf8"));
  
  deployment.uniswapPool = {
    address: poolAddress,
    baseToken: deployment.tokens.baseToken.address,
    quoteToken: deployment.tokens.quoteToken.address,
    feeTier: 500,
    createdAt: new Date().toISOString()
  };
  
  deployment.notes.push("Uniswap V3 pool created successfully");
  
  fs.writeFileSync(tokensPath, JSON.stringify(deployment, null, 2));
  console.log("\n💾 Deployment information updated with pool address");
}

main().catch(console.error);