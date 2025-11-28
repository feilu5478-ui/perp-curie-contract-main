// deploy-perp-v2.ts
import { parseUnits } from "ethers/lib/utils";
// import { parseUnits, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
// import { encodePriceSqrt } from "../test/shared/utilities";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 部署参数配置
  const USDC_DECIMALS = 6;
  const UNI_FEE_TIER = 10000; // 1%
  const SETTLEMENT_TOKEN_BALANCE_CAP = parseUnits("1000000", USDC_DECIMALS);
  // const CHAINLINK_AGGREGATOR_DECIMALS = 8; // Chainlink 通常使用 8 位小数
  // 1. 首先部署基础代币
  console.log("\n=== 部署基础代币 ===");
  
  // 部署 USDC (结算代币)
  const TestERC20 = await ethers.getContractFactory("TestERC20");
  const usdc = TestERC20.attach("0x727e7D4CaF9F7D89E8425458A2A1FbF06a35F65e");
  // const usdc = await TestERC20.deploy();
  // await usdc.deployed();
  // await usdc.__TestERC20_init("USD Coin", "USDC", USDC_DECIMALS);
  console.log("USDC deployed to:", usdc.address);

  // 部署 WETH (作为抵押品)
  const weth = TestERC20.attach("0x51Fd3eB1325A8d9091Ed32D1412B159e095558b0");
  // const weth = await TestERC20.deploy();
  // await weth.deployed();
  // await weth.__TestERC20_init("Wrapped Ether", "WETH", 18);
  console.log("WETH deployed to:", weth.address);

  // 部署 WBTC (作为抵押品)
  const wbtc = TestERC20.attach("0xda1210833989DbE389CDF71c27E6CADaf757CAB9");
  // const wbtc = await TestERC20.deploy();
  // await wbtc.deployed();
  // await wbtc.__TestERC20_init("Wrapped Bitcoin", "WBTC", 8);
  console.log("WBTC deployed to:", wbtc.address);

  // 2. 部署价格喂价相关合约
  console.log("\n=== 部署价格喂价合约 ===");
  
  // 部署模拟 Chainlink 聚合器
  // const TestAggregatorV3 = await ethers.getContractFactory("TestAggregatorV3");
  // const aggregator = await TestAggregatorV3.deploy();
  // await aggregator.deployed();
  // console.log("TestAggregatorV3 deployed to:", aggregator.address);
  
  // 部署 ChainlinkPriceFeedV3
  // const ChainlinkPriceFeedV3 = await ethers.getContractFactory("ChainlinkPriceFeedV3");
  // const chainlinkPriceFeedV3 = await ChainlinkPriceFeedV3.deploy(
  //   aggregator.address,
  //   3600, // 超时时间
  //   900, // 15分钟TWAP间隔
  //   {gasLimit: 1000000}
  // );
  // await chainlinkPriceFeedV3.deployed();
  // console.log("ChainlinkPriceFeedV3 deployed to:", chainlinkPriceFeedV3.address);

  // 替代方案：完全使用 Mock 合约
  // const UNISWAP_PRICE = "151.373306858723226652";
  // const PRICE_8_DECIMALS = parseUnits("151.37", 8); // 转换为 8 位小数
  // const initialPriceIn8Decimals = Math.round(parseFloat(UNISWAP_INITIAL_PRICE) * 10**8).toString();
  // const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
  // const mockPriceFeed = await MockPriceFeed.deploy(PRICE_8_DECIMALS);
  // await mockPriceFeed.getPrice
  // await mockPriceFeed.deployed();


  // // 部署 PriceFeedDispatcher
  const PriceFeedDispatcher = await ethers.getContractFactory("PriceFeedDispatcher");
  const priceFeedDispatcher = PriceFeedDispatcher.attach("0x3895e6d1d86d7b91D36072368804A5c563597Ea8");
  // const priceFeedDispatcher = await PriceFeedDispatcher.deploy("0x4aB0123054Cc53909818d4bBC356c14A29fcd65B");
  // await priceFeedDispatcher.deployed();
  console.log("PriceFeedDispatcher deployed to:", priceFeedDispatcher.address);

  // 3. 部署 BaseToken 和 QuoteToken
  console.log("\n=== 部署交易对代币 ===");

  // 首先部署 QuoteToken
  const QuoteToken = await ethers.getContractFactory("QuoteToken");
  const quoteToken = QuoteToken.attach("0xb736ce12ee74345600aedfb9c27b6a8822d4c892");
  // const quoteToken = await QuoteToken.deploy();
  // await quoteToken.deployed();
  // await quoteToken.initialize("vUSDC", "vUSDC");
  console.log("QuoteToken deployed to:", quoteToken.address);

  // 然后部署 BaseToken
  const BaseToken = await ethers.getContractFactory("BaseToken");
  const baseToken = BaseToken.attach("0x9efd6d5c81c6e22b822b6877abcf82398269f800");
  // const baseToken = await BaseToken.deploy();
  // await baseToken.deployed();
  // await baseToken.initialize("vBTC", "vBTC", priceFeedDispatcher.address);
  console.log("BaseToken deployed to:", baseToken.address);

  // 检查地址顺序是否符合 Uniswap 要求 (token0 < token1)
  if (baseToken.address.toLowerCase() >= quoteToken.address.toLowerCase()) {
    console.log("WARNING: BaseToken address >= QuoteToken address, this may cause issues with Uniswap V3");
    console.log("BaseToken:", baseToken.address);
    console.log("QuoteToken:", quoteToken.address);
    console.log("Consider redeploying with different addresses to ensure proper ordering");
    return;
  } else {
    console.log("✓ Token addresses are properly ordered for Uniswap V3");
  }

  // 4. 部署 Uniswap V3 工厂
  console.log("\n=== 部署 Uniswap V3 ===");
  const UniswapV3Factory = await ethers.getContractFactory("UniswapV3Factory");
  const uniV3Factory = UniswapV3Factory.attach("0xCbaec1555707dFAff3303ed6123Db16Eb67F1791");
  // const uniV3Factory = await UniswapV3Factory.deploy();
  // await uniV3Factory.deployed();
  console.log("UniswapV3Factory deployed to:", uniV3Factory.address);

  // 5. 部署核心配置合约
  console.log("\n=== 部署核心配置合约 ===");
  
  const ClearingHouseConfig = await ethers.getContractFactory("ClearingHouseConfig");
  const clearingHouseConfig = ClearingHouseConfig.attach("0x9199f6848b189024807987Ee6Ab45EC905856B52");
  // const clearingHouseConfig = await ClearingHouseConfig.deploy({gasLimit: 1000000});
  // await clearingHouseConfig.deployed();
  // await clearingHouseConfig.initialize();
  // await clearingHouseConfig.setSettlementTokenBalanceCap(SETTLEMENT_TOKEN_BALANCE_CAP,{gasLimit: 10000000});
  console.log("ClearingHouseConfig deployed to:", clearingHouseConfig.address);

  // 6. 部署市场注册表
  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = MarketRegistry.attach("0x2911377369fA73F97125eF1816Ac6475cADea3b6");
  // const marketRegistry = await MarketRegistry.deploy();
  // await marketRegistry.deployed();
  // await marketRegistry.initialize(uniV3Factory.address, quoteToken.address);
  console.log("MarketRegistry deployed to:", marketRegistry.address);

  // 7. 部署订单簿
  const OrderBook = await ethers.getContractFactory("OrderBook");
  const orderBook = OrderBook.attach("0xBD7647440788BE523e7B9740D7f23B17b28c36a0");
  // const orderBook = await OrderBook.deploy();
  // await orderBook.deployed();
  // await orderBook.initialize(marketRegistry.address);
  console.log("OrderBook deployed to:", orderBook.address);

  // 8. 部署交易所
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = Exchange.attach("0x4EEe99beA14d52515A94463ca4D1d739Ad2a0F5F");
  // const exchange = await Exchange.deploy();
  // await exchange.deployed();
  // await exchange.initialize(marketRegistry.address, orderBook.address, clearingHouseConfig.address);
  console.log("Exchange deployed to:", exchange.address);

  // 9. 部署账户余额管理
  const AccountBalance = await ethers.getContractFactory("AccountBalance");
  const accountBalance = AccountBalance.attach("0x8Eae24D537b9EC2535EC1F2AB8D1C54F481dC7e1");
  // const accountBalance = await AccountBalance.deploy();
  // await accountBalance.deployed();
  // await accountBalance.initialize(clearingHouseConfig.address, orderBook.address);
  console.log("AccountBalance deployed to:", accountBalance.address);

  // 10. 部署保险基金
  const InsuranceFund = await ethers.getContractFactory("InsuranceFund");
  const insuranceFund = InsuranceFund.attach("0xc37F218018F024CdDa1A5d97a4EeEd7c062D7D0a");
  // const insuranceFund = await InsuranceFund.deploy();
  // await insuranceFund.deployed();
  // await insuranceFund.initialize(usdc.address);
  console.log("InsuranceFund deployed to:", insuranceFund.address);

  // 11. 部署金库
  const Vault = await ethers.getContractFactory("Vault");
  const vault = Vault.attach("0x42F2202120Af3217868fdB356F98d87c3ED0c123");
  // const vault = await Vault.deploy();
  // await vault.deployed();
  // await vault.initialize(
  //   insuranceFund.address,
  //   clearingHouseConfig.address,
  //   accountBalance.address,
  //   exchange.address
  // );
  console.log("Vault deployed to:", vault.address);

  // 12. 部署抵押品管理器
  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = CollateralManager.attach("0x4f6300619e0a0c2e7af6cb67F024f28955B844d9");
  // const collateralManager = await CollateralManager.deploy();
  // await collateralManager.deployed();
  // await collateralManager.initialize(
  //   clearingHouseConfig.address,
  //   vault.address,
  //   5, // maxCollateralTokensPerAccount
  //   "750000", // debtNonSettlementTokenValueRatio (75%)
  //   "500000", // liquidationRatio (50%)
  //   "2000", // mmRatioBuffer (0.2%)
  //   "30000", // clInsuranceFundFeeRatio (3%)
  //   parseUnits("10000", USDC_DECIMALS), // debtThreshold
  //   parseUnits("500", USDC_DECIMALS) // collateralValueDust
  // );
  console.log("CollateralManager deployed to:", collateralManager.address);

  // 13. 部署委托批准
  const DelegateApproval = await ethers.getContractFactory("DelegateApproval");
  const delegateApproval = DelegateApproval.attach("0xd5B7D8C4a14875E619c23CcE1f2990aF1467F444");
  // const delegateApproval = await DelegateApproval.deploy();
  // await delegateApproval.deployed();
  // await delegateApproval.initialize();
  console.log("DelegateApproval deployed to:", delegateApproval.address);

  // 14. 部署清算所主合约
  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach("0xcdEa7bEF2E550eC317E4FEc80Fc59B00AE271fa3");
  // const clearingHouse = await ClearingHouse.deploy();
  // await clearingHouse.deployed();
  // await clearingHouse.initialize(
  //   clearingHouseConfig.address,
  //   vault.address,
  //   quoteToken.address,
  //   "0xCbaec1555707dFAff3303ed6123Db16Eb67F1791",
  //   exchange.address,
  //   accountBalance.address,
  //   insuranceFund.address
  // );
  console.log("ClearingHouse deployed to:", clearingHouse.address);
  const uniV3FactoryAddress = await clearingHouse.getUniswapV3Factory();
  console.log("uniV3Factory address:", uniV3FactoryAddress);

  // 15. 设置合约间引用关系
  console.log("\n=== 设置合约间引用关系 ===");
  
  // 设置 OrderBook 的 Exchange 引用
  // await orderBook.setExchange(exchange.address);
  console.log("OrderBook exchange reference set");

  // 设置 Exchange 的 AccountBalance 引用
  // await exchange.setAccountBalance(accountBalance.address);
  console.log("Exchange accountBalance reference set");

  // 设置 AccountBalance 的 Vault 引用
  // await accountBalance.setVault(vault.address);
  console.log("AccountBalance vault reference set");

  // 设置 Vault 的 CollateralManager 引用
  // await vault.setCollateralManager(collateralManager.address);
  console.log("Vault collateralManager reference set");

  // 设置 InsuranceFund 的 Vault 引用
  // await insuranceFund.setVault(vault.address);
  console.log("InsuranceFund vault reference set");

  // 设置 ClearingHouse 的 DelegateApproval 引用
  // await clearingHouse.setDelegateApproval(delegateApproval.address);
  console.log("ClearingHouse delegateApproval reference set");

  // 设置各合约的 ClearingHouse 引用
  // await marketRegistry.setClearingHouse(clearingHouse.address);
  // await orderBook.setClearingHouse(clearingHouse.address);
  // await exchange.setClearingHouse(clearingHouse.address);
  // await accountBalance.setClearingHouse(clearingHouse.address);
  // await vault.setClearingHouse(clearingHouse.address);
  console.log("ClearingHouse references set in all contracts");

  // 16. 添加抵押品配置
  console.log("\n=== 配置抵押品 ===");
  
  // 添加 WETH 作为抵押品
  // await collateralManager.addCollateral(weth.address, {
  //   priceFeed: priceFeedDispatcher.address, // 使用相同的价格调度器
  //   collateralRatio: "700000", // 70%
  //   discountRatio: "100000", // 10%
  //   depositCap: parseEther("1000") // 1000 WETH
  // });
  console.log("WETH added as collateral");

  // 添加 WBTC 作为抵押品
  // await collateralManager.addCollateral(wbtc.address, {
  //   priceFeed: priceFeedDispatcher.address,
  //   collateralRatio: "700000", // 70%
  //   discountRatio: "100000", // 10%
  //   depositCap: parseUnits("1000", 8) // 1000 WBTC
  // });
  console.log("WBTC added as collateral");

  // 17. 创建交易池
  console.log("\n=== 创建交易池 ===");
  
  // 在 Uniswap V3 中创建池子
  // await uniV3Factory.createPool(baseToken.address, quoteToken.address, UNI_FEE_TIER);
  // const poolAddress = await uniV3Factory.getPool(baseToken.address, quoteToken.address, UNI_FEE_TIER);
  const poolAddress = "0xaccde1b759e723c8d7e3758f925c77c29ab58f9c";
  console.log("Uniswap V3 Pool created at:", poolAddress);

  // 获取池子合约实例并初始化价格
  const IUniswapV3Pool = await ethers.getContractFactory("UniswapV3Pool");
  const pool = IUniswapV3Pool.attach(poolAddress);
  const initPrice = "91442"
  // 初始化池子
  // await pool.initialize(encodePriceSqrt(initPrice,"1"));
  console.log("Pool initialized successfully");

  // 18. 设置白名单
  console.log("\n=== 设置白名单 ===");
  
  // 将关键合约添加到代币白名单
  // await baseToken.addWhitelist(clearingHouse.address);
  // await baseToken.addWhitelist(poolAddress);
  // await baseToken.addWhitelist(deployer.address); // 部署者地址也加入白名单以便测试
  // await quoteToken.addWhitelist(clearingHouse.address);
  // await quoteToken.addWhitelist(poolAddress);
  // await quoteToken.addWhitelist(deployer.address);
  console.log("Whitelists configured");

  // 19. 铸币和初始流动性
  console.log("\n=== 准备初始流动性 ===");
  
  // 为清算所铸造足够的代币
  // await quoteToken.mintMaximumTo(clearingHouse.address);
  // await baseToken.mintMaximumTo(clearingHouse.address);
  console.log("Tokens minted to ClearingHouse");

  // 在市场注册表中添加池子
  await marketRegistry.addPool(baseToken.address, UNI_FEE_TIER, { gasLimit: 1000000 });
  console.log("Pool added to MarketRegistry");

  // 设置市场注册表的费用管理员
  // await marketRegistry.setFeeManager(deployer.address, true);
  console.log("Fee manager set");

  console.log("\n=== 部署完成! ===");
  console.log("核心合约地址:");
  console.log("ClearingHouse:", clearingHouse.address);
  console.log("Vault:", vault.address);
  console.log("Exchange:", exchange.address);
  console.log("OrderBook:", orderBook.address);
  console.log("MarketRegistry:", marketRegistry.address);
  console.log("AccountBalance:", accountBalance.address);
  console.log("InsuranceFund:", insuranceFund.address);
  console.log("CollateralManager:", collateralManager.address);
  console.log("BaseToken:", baseToken.address);
  console.log("QuoteToken:", quoteToken.address);
  console.log("USDC:", usdc.address);
  console.log("WETH:", weth.address);
  console.log("WBTC:", wbtc.address);
  console.log("Uniswap V3 Pool:", poolAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });