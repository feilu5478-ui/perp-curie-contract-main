# 部署流程

## 部署BaseToken和QuoteToken

npx hardhat run scripts/deployTokens.ts --network sepolia

​	BaseToken: 用作基础代币，例如ETH

​	QuoteToken: 用作报价代币，例如USDC

​	需要确保BaseToken < QuoteToken，对应uniswap V3 token0 < token1

```
=== 部署 BaseToken 和 QuoteToken ===
部署者: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
价格预言机地址: 0x137e565B66D7e1aCb3B08c6a35C16e18F5aa1C22

1. 部署 QuoteToken...
   QuoteToken 部署地址: 0x945EC0dDA06834dD592Ad246e07B47f025B8611E
   ✅ QuoteToken 初始化完成

2. 部署 BaseToken...
   BaseToken 部署地址: 0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e
   ✅ BaseToken 初始化完成

3. 验证地址顺序...
   BaseToken 地址: 0x15605ccb7e9a1d40f5c911abd03eaf43ef45326e
   QuoteToken 地址: 0x945ec0dda06834dd592ad246e07b47f025b8611e
   BaseToken < QuoteToken: true
   ✅ 地址顺序符合要求

4. 验证代币配置...
   BaseToken 价格预言机: 0x0000000000000000000000000000000000000000
   BaseToken 状态: Open
   获取指数价格失败: cannot estimate gas; transaction may fail or may require manual gas limit [ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (error={"name":"ProviderError","code":3,"_isProviderError":true}, method="call", transaction={"from":"0x7c6332D587B13E38A677f1556809301D5A2E1B60","to":"0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e","data":"0x120806470000000000000000000000000000000000000000000000000000000000000000","accessList":null}, code=UNPREDICTABLE_GAS_LIMIT, version=providers/5.6.1)
   部署者 BaseToken 余额: 0
   部署者 QuoteToken 余额: 0

🎉 代币部署完成!
==========================================

BaseToken 地址: 0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e
QuoteToken 地址: 0x945EC0dDA06834dD592Ad246e07B47f025B8611E
价格预言机: 0x137e565B66D7e1aCb3B08c6a35C16e18F5aa1C22

部署者: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
==========================================
```



## 部署ClearingHouseConfig

​	0x2D0F2F30E47918be3D99dF88983251DA221063DE



## 部署UniswapV3Factory



## 部署UniswapV3PriceFeed

​	构造函数所需参数：

​		pool：uniswap创建的交易对池子地址



## 部署ChainlinkPriceFeeds

​	构造函数所需参数：

​		Aggregator：Chainlink 聚合器地址（两种代币的价格）

​		timeout：超时时间

​		twapInterval：TWAP 间隔



## 部署PriceFeedDispatcher

​	构造函数所需参数：

​		ChainlinkPriceFeedV3：上一步部署的ChainlinkPriceFeedV3地址

​	关键方法：setUniswapV3PriceFeed

​		用于设置UniswapV3PriceFeed地址，需填入部署的UniswapV3PriceFeed地址

```
👤 Deployer: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
💰 Balance: 1.63391631071789832 ETH
🎯 Deployment Options:
1. Deploy only Chainlink system (without Uniswap)
2. Deploy full system with Uniswap TKA/TKB pool

🔹 Deploying full price feed system with Uniswap...
🏁 Setting up complete price feed system...
🚀 Deploying ChainlinkPriceFeedV3...
   Aggregator: 0x694AA1769357215DE4FAC081bf1f309aDC325306
   Timeout: 3600 seconds
   TWAP Interval: 900 seconds
✅ ChainlinkPriceFeedV3 deployed to: 0x4aB0123054Cc53909818d4bBC356c14A29fcd65B
📊 Caching initial price...
✅ Initial price cached

🚀 Deploying PriceFeedDispatcher...
   ChainlinkPriceFeedV3: 0x4aB0123054Cc53909818d4bBC356c14A29fcd65B
✅ PriceFeedDispatcher deployed to: 0x2aFd8B0B9CA476fA85A35bF7AB138d15fda35164

🚀 Deploying UniswapV3PriceFeed...
   Pool: 0xd5b035544d07095ebbdc03370f6cf1cb49a77194
   Pair: PBASE/PQUOTE
✅ UniswapV3PriceFeed deployed to: 0x1dBd0A6512d3b2530687133101b8f70dB7cb3779
🔍 Verifying pool details...
   Token0: 0x118Eb3F0d7c0aE4056328851B3eE7510108AA230
   Token1: 0x41cffBcE944DDcb71769Dec7C7628a4Cf88Bad9F
   Fee Tier: 500 (0.05%)
   Liquidity: 100000000000000000005435327
   Current Tick: 0
   SqrtPriceX96: 79228162514264337593543950336
   Current Price: 1 PBASE/PQUOTE

🔗 Setting UniswapV3PriceFeed to dispatcher...
✅ UniswapV3PriceFeed set in dispatcher

🔍 Verifying price feed system...
✅ ChainlinkPriceFeedV3 in dispatcher: true
✅ UniswapV3PriceFeed in dispatcher: true
✅ Uniswap PBASE/PQUOTE Price: 1.0
✅ Current price from dispatcher: 4226.615139
✅ 1-hour TWAP price: 4226.615139
✅ Using Uniswap: false
✅ Chainlink timed out: false

🧪 Testing price feed functionality...
✅ Chainlink price: 4226.615139
✅ Chainlink last valid price: 4226.615139 at 2025-10-27T06:05:24.000Z
✅ Uniswap price: 1.0 PBASE/PQUOTE
✅ Uniswap pool: 0xd5B035544d07095ebbdC03370F6CF1CB49a77194
✅ Dispatcher price: 4226.615139
✅ Dispatcher TWAP: 4226.615139

💾 Deployment saved to: E:\perp-oracle-contract-main\deployments\sepolia\price-feed-system.json

🎉 Price feed system deployed successfully!

📋 Contract Addresses:
   ChainlinkPriceFeedV3: 0x4aB0123054Cc53909818d4bBC356c14A29fcd65B
   PriceFeedDispatcher: 0x2aFd8B0B9CA476fA85A35bF7AB138d15fda35164
   UniswapV3PriceFeed: 0x1dBd0A6512d3b2530687133101b8f70dB7cb3779
   Trading Pair: PBASE/PQUOTE
   
   {
  "timestamp": "2025-10-27T07:03:33.400Z",
  "network": "sepolia",
  "config": {
    "chainlinkTimeout": 3600,
    "twapInterval": 900,
    "uniswapPool": "0xd5b035544d07095ebbdc03370f6cf1cb49a77194"
  },
  "contracts": {
    "ChainlinkPriceFeedV3": "0x4aB0123054Cc53909818d4bBC356c14A29fcd65B",
    "PriceFeedDispatcher": "0x2aFd8B0B9CA476fA85A35bF7AB138d15fda35164",
    "UniswapV3PriceFeed": "0x1dBd0A6512d3b2530687133101b8f70dB7cb3779"
  },
  "tokens": {
    "baseToken": "PBASE",
    "quoteToken": "PQUOTE",
    "baseTokenAddress": "0x118eb3f0d7c0ae4056328851b3ee7510108aa230",
    "quoteTokenAddress": "0x41cffbce944ddcb71769dec7c7628a4cf88bad9f"
  }
}

=== 部署 PriceFeedDispatcher ===
使用 ChainlinkPriceFeedV3 地址: 0x4aB0123054Cc53909818d4bBC356c14A29fcd65B
部署者: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
✅ PriceFeedDispatcher 部署地址: 0x137e565B66D7e1aCb3B08c6a35C16e18F5aa1C22

2. 验证部署...
ChainlinkPriceFeedV3 地址: 0x4aB0123054Cc53909818d4bBC356c14A29fcd65B
UniswapV3PriceFeed 地址: 0x0000000000000000000000000000000000000000
价格精度: 18
当前价格: 4124172153000000000000
```



## 部署InsuranceFund

npx hardhat run scripts/deploy-insurance-fund.ts --network sepolia

​	初始化合约所需参数：

​		tokenArg：结算代币地址（如 USDC）

​	主要方法：

​		setVault：设置 Vault 合约地址

​		setDistributionThreshold：设置费用分配阈值

​		setSurplusBeneficiary：设置盈余受益人地址（通常是一个治理合约或奖励分发合约）

```
👤 Deployer: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
💰 ETH Balance: 1.632544137567143237 ETH
🚀 Deploying InsuranceFund...
   Settlement Token: 0x945EC0dDA06834dD592Ad246e07B47f025B8611E
✅ InsuranceFund deployed to: 0xa6fDD6AC6c52e02831962C7f37C092Be666C2A3B

🔍 Verifying basic functionality...
✅ Settlement Token: 0x945EC0dDA06834dD592Ad246e07B47f025B8611E
✅ Vault: 0x0000000000000000000000000000000000000000 (will be set later)
✅ Surplus Beneficiary: 0x0000000000000000000000000000000000000000 (will be set later)

💾 Deployment saved to: deployments/sepolia/insurance-fund.json

🎉 Insurance Fund deployed successfully!

📋 Next Steps:
   1. Deploy Vault contract (if not already deployed)
   2. Deploy SurplusBeneficiary contract (if needed)
   3. Run set-vault.ts to set Vault address
   4. Run set-beneficiary.ts to set SurplusBeneficiary address
```



## 部署MarketRegistry

npx hardhat run scripts/deploy-market-registry.ts --network sepolia

```
开始部署 MarketRegistry 合约...
使用参数:
UniswapV3 Factory: 0xCbaec1555707dFAff3303ed6123Db16Eb67F1791
Quote Token: 0x945EC0dDA06834dD592Ad246e07B47f025B8611E
部署者地址: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
部署者余额: 1632543427097038607
正在部署 MarketRegistry...
MarketRegistry 已部署到: 0x91F83B0351b89194366a9b6986EE7887e6F7A0c5

验证合约配置...
验证 UniswapV3 Factory: 0xCbaec1555707dFAff3303ed6123Db16Eb67F1791
验证 Quote Token: 0x945EC0dDA06834dD592Ad246e07B47f025B8611E
验证 Max Orders Per Market: 255
实现合约地址: 0x3dD1c05c4BFb66dAD706325026237776A961FBcc
代理管理员地址: 0x49CDFF5760D7c428e7A60d9f2714aB9FE9f2B5fE

部署完成!
MarketRegistry 代理地址: 0x91F83B0351b89194366a9b6986EE7887e6F7A0c5
MarketRegistry 实现地址: 0x3dD1c05c4BFb66dAD706325026237776A961FBcc
```



## 部署OrderBook

npx hardhat run scripts/deploy-order-book-non-upgradeable.ts --network sepolia

```
开始部署 OrderBook 合约（不可升级模式）...
使用参数:
MarketRegistry: 0x3dD1c05c4BFb66dAD706325026237776A961FBcc
部署者地址: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
部署者余额: 1632542717217649750

验证 MarketRegistry 合约...
✓ MarketRegistry 验证成功
  Quote Token: 0x0000000000000000000000000000000000000000
  UniswapV3 Factory: 0x0000000000000000000000000000000000000000
  Max Orders Per Market: 0

正在部署 OrderBook（不可升级模式）...
✓ OrderBook 合约已部署到: 0x269D854FF25dA67Cbe409820c742EB4600f0Cc43
初始化 OrderBook 合约...
✓ 合约初始化成功

验证 OrderBook 配置...
Exchange 地址: 0x0000000000000000000000000000000000000000
合约所有者: 0x7c6332D587B13E38A677f1556809301D5A2E1B60

测试基本功能...
✓ 基本功能测试通过
  初始订单数量: 0

部署信息已保存到: E:\perp-curie-contract-main\perp-curie-contract-main\deployments\order-book-sepolia-1761621978748.json

🎉 部署完成!
==========================================
OrderBook 地址: 0x269D854FF25dA67Cbe409820c742EB4600f0Cc43
部署网络: sepolia
部署类型: 不可升级
==========================================
```



## 部署AccountBalance

npx hardhat run scripts/deploy-account-balance.ts --network sepolia

```
开始部署 AccountBalance 合约（可升级模式）...
使用参数:
ClearingHouseConfig: 0x2D0F2F30E47918be3D99dF88983251DA221063DE
OrderBook: 0x269D854FF25dA67Cbe409820c742EB4600f0Cc43
部署者地址: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
部署者余额: 1632537497341671289

验证依赖合约...
✓ ClearingHouseConfig 验证成功
  MM Ratio: 62500
  Max Markets Per Account: 255
✓ OrderBook 验证成功
  Exchange 地址: 0x0000000000000000000000000000000000000000

正在部署 AccountBalance...
✓ AccountBalance 已部署到: 0x347AAe8b046f4a75c1DE19733C5aef2baBe1fF4B

验证 AccountBalance 配置...
ClearingHouseConfig 地址: 0x2D0F2F30E47918be3D99dF88983251DA221063DE
OrderBook 地址: 0x269D854FF25dA67Cbe409820c742EB4600f0Cc43
Vault 地址: 0x0000000000000000000000000000000000000000
合约所有者: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
✓ 合约配置验证成功
实现合约地址: 0x69D0C8ad2B2c4874f7bc301fB70364a35E100961
代理管理员地址: 0x49CDFF5760D7c428e7A60d9f2714aB9FE9f2B5fE

测试基本功能...
✓ 基本功能测试通过
  初始 BaseTokens 数量: 0

部署信息已保存到: E:\perp-curie-contract-main\perp-curie-contract-main\deployments\account-balance-sepolia-1761628099687.json

🎉 部署完成!
==========================================
AccountBalance 代理地址: 0x347AAe8b046f4a75c1DE19733C5aef2baBe1fF4B
实现合约地址: 0x69D0C8ad2B2c4874f7bc301fB70364a35E100961
代理管理员地址: 0x49CDFF5760D7c428e7A60d9f2714aB9FE9f2B5fE
部署网络: sepolia
部署类型: 可升级
==========================================
```



## 部署Exchange

npx hardhat run scripts/deploy-exchange-non-upgradeable.ts --network sepolia

```
开始部署 Exchange 合约（不可升级模式）...
使用参数:
MarketRegistry: 0x91F83B0351b89194366a9b6986EE7887e6F7A0c5
OrderBook: 0x269D854FF25dA67Cbe409820c742EB4600f0Cc43
ClearingHouseConfig: 0x2D0F2F30E47918be3D99dF88983251DA221063DE
部署者地址: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
部署者余额: 1632536787379861795

验证依赖合约...
✓ MarketRegistry 验证成功
  Quote Token: 0x945EC0dDA06834dD592Ad246e07B47f025B8611E
✓ OrderBook 验证成功
  Exchange 地址: 0x0000000000000000000000000000000000000000
✓ ClearingHouseConfig 验证成功
  MM Ratio: 62500

正在部署 Exchange（不可升级模式）...
✓ Exchange 合约已部署到: 0x891b4cb8743E3Ae419226068408dD00b225Cb46A
初始化 Exchange 合约...
✓ 合约初始化成功

验证 Exchange 配置...
OrderBook 地址: 0x269D854FF25dA67Cbe409820c742EB4600f0Cc43
AccountBalance 地址: 0x0000000000000000000000000000000000000000
ClearingHouseConfig 地址: 0x2D0F2F30E47918be3D99dF88983251DA221063DE
合约所有者: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
✓ 合约初始化验证成功

测试基本功能...
✓ 基本功能测试通过
  默认 MaxTickCrossed: 0

部署信息已保存到: E:\perp-curie-contract-main\perp-curie-contract-main\deployments\exchange-non-upgradeable-sepolia-1761628331251.json

🎉 部署完成!
==========================================
Exchange 地址: 0x891b4cb8743E3Ae419226068408dD00b225Cb46A
部署网络: sepolia
部署类型: 不可升级
==========================================
```



## 部署Vault

npx hardhat run scripts/deploy-vault-upgradeable.ts --network sepolia

```
开始部署 Vault 合约（可升级模式）...
使用参数:
InsuranceFund: 0xa6fDD6AC6c52e02831962C7f37C092Be666C2A3B
ClearingHouseConfig: 0x2D0F2F30E47918be3D99dF88983251DA221063DE
AccountBalance: 0x347AAe8b046f4a75c1DE19733C5aef2baBe1fF4B
Exchange: 0x891b4cb8743E3Ae419226068408dD00b225Cb46A
部署者地址: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
部署者余额: 1632532364102629465

验证依赖合约...
✓ InsuranceFund 验证成功
  Settlement Token: 0x945EC0dDA06834dD592Ad246e07B47f025B8611E
✓ ClearingHouseConfig 验证成功
  MM Ratio: 62500
  TWAP Interval: 900
✓ AccountBalance 验证成功
  Vault 地址: 0x0000000000000000000000000000000000000000
✓ Exchange 验证成功
  AccountBalance 地址: 0x0000000000000000000000000000000000000000

正在部署 Vault（可升级模式）...
✓ Vault 已部署到: 0x2daD334f3ed5156f372310457Ecf34355B71B215

验证 Vault 配置...
Settlement Token: 0x945EC0dDA06834dD592Ad246e07B47f025B8611E
InsuranceFund 地址: 0xa6fDD6AC6c52e02831962C7f37C092Be666C2A3B
ClearingHouseConfig 地址: 0x2D0F2F30E47918be3D99dF88983251DA221063DE
AccountBalance 地址: 0x347AAe8b046f4a75c1DE19733C5aef2baBe1fF4B
Exchange 地址: 0x891b4cb8743E3Ae419226068408dD00b225Cb46A
✓ 合约配置验证成功
实现合约地址: 0x39b23bDA15EB178239E9d88CA5066635D26f55D1
代理管理员地址: 0x49CDFF5760D7c428e7A60d9f2714aB9FE9f2B5fE

测试基本功能...
✓ 基本功能测试通过
  代币精度: 18
  总债务: 0

部署信息已保存到: E:\perp-curie-contract-main\perp-curie-contract-main\deployments\vault-upgradeable-sepolia-1761628740508.json

🎉 部署完成!
==========================================
Vault 代理地址: 0x2daD334f3ed5156f372310457Ecf34355B71B215
实现合约地址: 0x39b23bDA15EB178239E9d88CA5066635D26f55D1
代理管理员地址: 0x49CDFF5760D7c428e7A60d9f2714aB9FE9f2B5fE
部署网络: sepolia
部署类型: 可升级
==========================================
```



## 部署CollateralManager

npx hardhat run scripts/deploy-collateral-manager-upgradeable.ts --network sepolia

```
开始部署 CollateralManager 合约（可升级模式）...
使用参数:
ClearingHouseConfig: 0x2D0F2F30E47918be3D99dF88983251DA221063DE
Vault: 0x2daD334f3ed5156f372310457Ecf34355B71B215
MaxCollateralTokensPerAccount: 10
DebtNonSettlementTokenValueRatio: 500000
LiquidationRatio: 800000
MMRatioBuffer: 100000
CLInsuranceFundFeeRatio: 100000
DebtThreshold: 1000000000000000000000
CollateralValueDust: 1000000000000000000
部署者地址: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
部署者余额: 1632531537441709653

验证依赖合约...
✓ ClearingHouseConfig 验证成功
  MM Ratio: 62500
✓ Vault 验证成功
  Settlement Token: 0x945EC0dDA06834dD592Ad246e07B47f025B8611E

正在部署 CollateralManager（可升级模式）...
✓ CollateralManager 已部署到: 0x8112A50f57277790eCBA7E1D93B7a4c139B4864E

验证 CollateralManager 配置...
ClearingHouseConfig 地址: 0x2D0F2F30E47918be3D99dF88983251DA221063DE
Vault 地址: 0x2daD334f3ed5156f372310457Ecf34355B71B215
MaxCollateralTokensPerAccount: 10
MMRatioBuffer: 100000
DebtNonSettlementTokenValueRatio: 500000
LiquidationRatio: 800000
CLInsuranceFundFeeRatio: 100000
DebtThreshold: 1000000000000000000000
CollateralValueDust: 1000000000000000000
✓ 合约配置验证成功
实现合约地址: 0xD1Bb4734bb2249B9152fd92255b6CF66318bC4ce
代理管理员地址: 0x49CDFF5760D7c428e7A60d9f2714aB9FE9f2B5fE

测试基本功能...
✓ 基本功能测试通过
  验证 MM Ratio: 162500

部署信息已保存到: E:\perp-curie-contract-main\perp-curie-contract-main\deployments\collateral-manager-upgradeable-sepolia-1761628956023.json

🎉 部署完成!
==========================================
CollateralManager 代理地址: 0x8112A50f57277790eCBA7E1D93B7a4c139B4864E
实现合约地址: 0xD1Bb4734bb2249B9152fd92255b6CF66318bC4ce
代理管理员地址: 0x49CDFF5760D7c428e7A60d9f2714aB9FE9f2B5fE
部署网络: sepolia
部署类型: 可升级
==========================================
```



## 部署DelegateApproval

npx hardhat run scripts/delegate-approval-non-upgradeable.ts --network sepolia

```
开始部署 DelegateApproval 合约（不可升级模式）...
部署者地址: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
部署者余额: 2134118814028299400

正在部署 DelegateApproval...
✓ DelegateApproval 合约已部署到: 0x053E346BeC082Be5026E686A85fFDFcD5892F104
初始化 DelegateApproval 合约...
✓ 合约初始化成功

验证 DelegateApproval 配置...
合约所有者: 0x7c6332D587B13E38A677f1556809301D5A2E1B60
开仓操作代码: 1
添加流动性操作代码: 2
移除流动性操作代码: 4
✓ 合约初始化验证成功

测试基本功能...
测试授权功能...
✓ 授权功能测试通过
✓ 权限检查功能测试通过
  授权检查结果: true
  开仓权限检查: true
测试撤销权限功能...
✓ 撤销权限功能测试通过
  撤销后授权检查: false

部署信息已保存到: E:\perp-curie-contract-main\perp-curie-contract-main\deployments\delegate-approval-sepolia-1761299021224.json

🎉 部署完成!
==========================================

DelegateApproval 地址: 0x053E346BeC082Be5026E686A85fFDFcD5892F104
部署网络: sepolia

部署类型: 不可升级
==========================================
```

## 部署ClearingHouse

npx hardhat run scripts/deploy-ClearingHouse.ts --network sepolia

```
开始部署 ClearingHouse 合约...
部署到网络: sepolia
ClearingHouse 代理合约地址: 0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB
ClearingHouse 实现合约地址: 0xCbE7aF10C512cA5567FB4D38e4543966AEE704A2
代理管理员地址: 0x49CDFF5760D7c428e7A60d9f2714aB9FE9f2B5fE
验证合约初始化状态...
Quote Token: 0x945EC0dDA06834dD592Ad246e07B47f025B8611E
Vault: 0x2daD334f3ed5156f372310457Ecf34355B71B215
Exchange: 0x891b4cb8743E3Ae419226068408dD00b225Cb46A
部署信息已保存到: E:\perp-curie-contract-main\perp-curie-contract-main\deployments\ClearingHouse-sepolia.json
ClearingHouse 合约部署完成!
```

# 部署之后设置

## 添加白名单操作

`npx hardhat run scripts/addWhitelist.ts --network sepolia`

## 铸造最大供应量给ClearingHouse

`npx hardhat run scripts/mintTokensToClearingHouse.ts --network sepolia`

## 为创建的base和quote创建交易池

`npx hardhat run scripts/cjdui.js --network sepolia`

## Vault合约配置

`npx hardhat run scripts/set-vault-addresses.ts --network sepolia`

## InsuranceFund合约配置

设置Vault地址：`npx hardhat run scripts/set-vault.ts --network sepolia`

## OrderBook合约配置

设置Exchange地址：`npx hardhat run scripts/set-order-book-exchange.ts --network sepolia`

## Exchange合约配置

设置AccountBalance地址：`npx hardhat run scripts/set-exchange-account-balance.ts --network sepolia`

设置最大Tick跨度：`npx hardhat run scripts/set-exchange-max-tick.ts --network sepolia`

## AccountBalance合约配置

设置Vault地址：`npx hardhat run scripts/set-account-balance-vault.ts --network sepolia`

## MarketRegistry合约配置

添加池子地址：`npx hardhat run scripts/addPoolToMarketRegistry.ts --network sepolia`

## 为继承了ClearingHouseCallee的合约设置ClearingHouse地址

`npx hardhat run scripts/initializeFullSystem.ts --network sepolia`

# 操作

## 市场注册

npx hardhat run scripts/addPoolToMarketRegistry.ts --network sepolia

## 存款

npx hardhat run scripts/depositToVault.ts --network sepolia

## 开仓

npx hardhat run scripts/openPosition.ts --network sepolia

# 错误集

1、部署可升级模式失败

```
部署失败: Error: Contract `contracts/OrderBook.sol:OrderBook` is not upgrade safe

contracts\OrderBook.sol:90: Duplicate calls found to initializer `__Context_init` for contract `ContextUpgradeable`
    Only call each parent initializer once
    https://zpl.in/upgrades/error-001
```

```
正在部署 Exchange（可升级模式）...
部署失败: Error: Contract `contracts/Exchange.sol:Exchange` is not upgrade safe

contracts\Exchange.sol:90: Duplicate calls found to initializer `__Context_init` for contract `ContextUpgradeable`
    Only call each parent initializer once
    https://zpl.in/upgrades/error-001
```

2、开仓失败：Fail with error 'CHD_OCH'

3、市场注册失败：Fail with error 'MR_CHBNE'
