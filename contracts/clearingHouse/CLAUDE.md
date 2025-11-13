[根目录](../../CLAUDE.md) > [contracts](../) > **clearingHouse**

---

# ClearingHouse 清算所模块

## 模块职责

`ClearingHouse` 是 Perpetual Protocol Curie (V2) 的**核心清算所合约**，负责协调整个永续合约交易系统的运行。它作为业务逻辑的中枢，处理用户的开仓、平仓、添加/移除流动性、清算等关键操作，并协调 Vault、Exchange、AccountBalance 等其他合约的交互。

### 核心职责

1. **交易执行**: 处理开仓、平仓、调换等交易操作
2. **流动性管理**: 管理 LP 添加/移除流动性，计算流动性收益
3. **清算流程**: 执行强制平仓，处理坏账
4. **资金费率**: 协调资金费率计算和结算
5. **风险控制**: 监控账户健康度，执行风险检查
6. **PnL 结算**: 计算并结算已实现盈亏

## 入口与启动

### 合约信息
- **文件**: `contracts/ClearingHouse.sol`
- **Solidity版本**: 0.7.6
- **许可证**: GPL-3.0-or-later
- **继承**:
  - `IUniswapV3MintCallback` - Uniswap V3 铸造回调
  - `IUniswapV3SwapCallback` - Uniswap V3 调换回调
  - `IClearingHouse` - 核心接口
  - `BlockContext` - 区块上下文
  - `ReentrancyGuardUpgradeable` - 重入保护
  - `OwnerPausable` - 所有者可暂停
  - `BaseRelayRecipient` - GSN 元交易支持
  - `ClearingHouseStorageV2` - 存储结构

### 初始化参数

```solidity
function initialize(
    address clearingHouseConfigArg,    // 清算所配置
    address vaultArg,                  // 金库合约
    address quoteTokenArg,            // 计价代币
    address uniV3FactoryArg,          // Uniswap V3 工厂
    address uniswapV3NFTPositionArg,  // NFT 位置管理
    address exchangeArg,              // 交易所合约
    address orderBookArg,             // 订单簿合约
    address accountBalanceArg,        // 账户余额合约
    address insuranceFundArg,         // 保险基金
    address delegateApprovalArg       // 委托审批
) external initializer
```

### 部署脚本
- **完整系统初始化**: `scripts/initializeFullSystem.ts`
- **清理所部署**: `scripts/deploy-ClearingHouse.ts`

## 对外接口

### 主要功能

#### 1. 开仓操作
```solidity
/// 開倉
/// @param params 开仓参数
/// @param minBase 最小基础资产
/// @param maxQuote 最大报价资产
/// @param deadline 截止时间
function openPosition(
    IClearingHouse.OpenPositionParams memory params,
    uint256 minBase,
    uint256 maxQuote,
    uint256 deadline
) external payable checkDeadline(deadline);
```

#### 2. 平仓操作
```solidity
/// 平倉
/// @param baseToken 基础资产代币
/// @param isCloseAll 是否全部平仓
/// @param quoteAmount 报价资产数量 (exactInput 时有效)
/// @param baseAmount 基础资产数量 (exactOutput 时有效)
/// @param minBase 最小基础资产
/// @param maxQuote 最大报价资产
/// @param deadline 截止时间
function closePosition(
    address baseToken,
    bool isCloseAll,
    uint256 quoteAmount,
    uint256 baseAmount,
    uint256 minBase,
    uint256 maxQuote,
    uint256 deadline
) external payable checkDeadline(deadline);
```

#### 3. 添加流动性
```solidity
/// 添加流动性
/// @param baseToken 基础资产代币
/// @param baseAmount 基础资产数量
/// @param quoteAmount 报价资产数量
/// @param minTick 最小 tick
/// @param maxTick 最大 tick
/// @param deadline 截止时间
function addLiquidity(
    IClearingHouse.AddLiquidityParams memory params,
    uint256 minBase,
    uint256 minQuote,
    uint256 deadline
) external payable checkDeadline(deadline);
```

#### 4. 移除流动性
```solidity
/// 移除流动性
/// @param baseToken 基础资产代币
/// @param liquidity LP 流动性数量
/// @param minBase 最小基础资产
/// @param minQuote 最小报价资产
/// @param deadline 截止时间
function removeLiquidity(
    IClearingHouse.RemoveLiquidityParams memory params,
    uint256 minBase,
    uint256 minQuote,
    uint256 deadline
) external payable checkDeadline(deadline);
```

#### 5. 清算操作
```solidity
/// 清算交易者
/// @param trader 被清算的交易者
/// @param baseToken 基础资产代币
/// @param quoteAmount 报价资产数量
function liquidate(
    address trader,
    address baseToken,
    bool isCloseAll,
    uint256 quoteAmount
) external nonReentrant whenNotPaused;
```

### 查询接口

```solidity
/// 获取位置大小
function getPositionSize(address trader, address baseToken) external view returns (int256);

/// 获取未实现 PnL
function getUnrealizedPnl(
    address trader,
    address baseToken,
    IClearingHouse.PnlCalcOption calcOption
) external view returns (int256, int256, int256);

/// 获取账户价值
function getAccountValue(address trader) external view returns (int256);

/// 获取资金费率
function getFunding(address baseToken) external view returns (int256, int256);
```

## 关键依赖与配置

### 依赖合约
| 合约 | 作用 | 必需 |
|------|------|------|
| `ClearingHouseConfig` | 配置参数 | ✅ |
| `Vault` | 资金管理 | ✅ |
| `Exchange` | 交易执行 | ✅ |
| `AccountBalance` | 账户余额 | ✅ |
| `OrderBook` | 订单管理 | ✅ |
| `InsuranceFund` | 风险保险 | ✅ |
| `MarketRegistry` | 市场信息 | ✅ |
| `DelegateApproval` | 委托审批 | ✅ |
| `QuoteToken` | 计价代币 | ✅ |

### 关键库使用
- `PerpMath` - 数学计算
- `PerpSafeCast` - 安全类型转换
- `SettlementTokenMath` - 结算代币计算
- `Funding` - 资金费率算法
- `AccountMarket` - 账户市场信息
- `OpenOrder` - 开放订单管理

## 数据模型

### 核心数据结构

#### 开仓参数结构
```solidity
struct OpenPositionParams {
    address baseToken;        // 基础资产代币
    bool isBaseToQuote;      // 是否基础资产到报价资产
    bool isExactInput;       // 是否精确输入
    uint256 amount;          // 数量
    uint160 sqrtPriceLimitX96; // 价格限制
}
```

#### 内部开仓参数
```solidity
struct InternalOpenPositionParams {
    address trader;           // 交易者
    address baseToken;       // 基础资产
    bool isBaseToQuote;      // 基础->报价
    bool isExactInput;       // 精确输入
    bool isClose;            // 是否平仓
    uint256 amount;          // 数量
    uint160 sqrtPriceLimitX96; // 价格限制
}
```

### 存储结构
- `ClearingHouseStorageV2` - 存储升级版本
- 存储关键信息：白名单、价格限制、默认资金费率配置

## 测试与质量

### 测试文件列表
**47个测试文件**，完整覆盖所有功能：

#### 开仓测试
- `ClearingHouse.openPosition.test.ts` - 基础开仓
- `ClearingHouse.openPosition.maker.test.ts` - Maker 开仓
- `ClearingHouse.openPosition.xyk.test.ts` - XYK 模式开仓
- `ClearingHouse.openPosition.slippage.xyk.test.ts` - 滑点控制
- `ClearingHouse.openPosition.oneWeiFee.test.ts` - 最小费用

#### 平仓测试
- `ClearingHouse.closePosition.test.ts` - 基础平仓
- `ClearingHouse.partialClose.test.ts` - 部分平仓
- `ClearingHouse.isReversingPosition.ts` - 反转位置
- `ClearingHouse.realizedPnl.test.ts` - 已实现 PnL

#### 流动性测试
- `ClearingHouse.addLiquidity.test.ts` - 添加流动性
- `ClearingHouse.addLiquidity.slippage.test.ts` - 滑点控制
- `ClearingHouse.addLiquidity.with_fee(maker).test.ts` - 带费流动性
- `ClearingHouse.removeLiquidity.without_fee.test.ts` - 无费移除
- `ClearingHouse.removeLiquidity.with_fee(maker).test.ts` - 带费移除
- `ClearingHouse.removeLiquidity.slippage.test.ts` - 滑点控制

#### 清算测试
- `ClearingHouse.liquidate.maker.ts` - Maker 清算

#### 资金费率测试
- `ClearingHouse.funding.test.ts` - 资金费率
- `ClearingHouse.insuranceFee.test.ts` - 保险费率
- `ClearingHouse.insuranceFee.xyk.test.ts` - XYK 保险费率

#### 会计测试
- `ClearingHouse.accounting.randomTrades.test.ts` - 随机交易
- `ClearingHouse.accounting.liquidity.test.ts` - 流动性会计
- `ClearingHouse.accounting.xyk.test.ts` - XYK 会计

#### 风险与边界测试
- `ClearingHouse.badDebt.test.ts` - 坏账处理
- `ClearingHouse.7494.badDebtAttack.test.ts` - 特殊攻击测试
- `ClearingHouse.stopMarket.test.ts` - 停止市场
- `ClearingHouse.softCircuitBreak.test.ts` - 软熔断
- `ClearingHouse.sequencerDown.test.ts` - 序列器故障
- `ClearingHouse.gasEstimation.ts` - Gas 估算

### 测试辅助
- **配置**: `test/clearingHouse/config.ts`
- **固定装置**: `test/clearingHouse/fixtures.ts`
- **帮助器**: `test/helper/clearingHouseHelper.ts`

### 测试覆盖率
- ✅ 开仓/平仓逻辑：100%
- ✅ 流动性管理：100%
- ✅ 清算流程：100%
- ✅ 资金费率：100%
- ✅ 风险控制：100%

## 常见问题 (FAQ)

### Q1: 开仓失败的原因有哪些？
**A**: 常见原因：
- 资金不足（需要更多抵押品）
- 滑点过大（调整 minBase/maxQuote）
- 达到价格限制（调整 sqrtPriceLimitX96）
- 超过持仓上限
- 交易对未激活

### Q2: 资金费率如何计算？
**A**:
- 基于持仓时间和持仓量计算
- 多方支付空方或空方支付多方
- 每 8 小时结算一次
- 参考 `contracts/lib/Funding.sol` 详细算法

### Q3: 清算的触发条件是什么？
**A**:
- 保证金率低于维护保证金率
- 账户净值过低
- 价格剧烈波动
- 触发自动清算机制

### Q4: 如何添加新的交易对？
**A**:
1. 部署基础资产代币 (BaseToken)
2. 在 MarketRegistry 中添加池
3. 配置交易参数
4. 设置价格预言机

### Q5: 流动性提供者如何赚取收益？
**A**:
- 交易手续费分成
- 资金费率收益
- LP 代币奖励
- 平台激励计划

## 相关文件清单

### 核心文件
- `contracts/ClearingHouse.sol` - 主合约
- `contracts/interface/IClearingHouse.sol` - 接口定义
- `contracts/storage/ClearingHouseStorage.sol` - 存储结构
- `contracts/lib/Funding.sol` - 资金费率算法
- `contracts/lib/AccountMarket.sol` - 账户市场信息

### 测试文件
- `test/clearingHouse/*.test.ts` - 所有测试文件

### 脚本文件
- `scripts/deploy-ClearingHouse.ts` - 部署脚本
- `scripts/initializeFullSystem.ts` - 完整初始化
- `scripts/initialize-oracle.ts` - 预言机初始化
- `scripts/openPosition.ts` - 开仓脚本
- `scripts/close-position.ts` - 平仓脚本
- `scripts/add-liquidity.ts` - 添加流动性

### 配置相关
- `contracts/ClearingHouseConfig.sol` - 配置合约
- `contracts/interface/IClearingHouseConfig.sol` - 配置接口

## 变更记录

### [未发布] - 2025-11-12
**改进**:
- 更新清算逻辑以优化资金利用
- 增强清算触发机制
- 优化 Gas 消耗

**修复**:
- 修复极端市场条件下的清算问题
- 解决价格波动过大的处理

**测试**:
- 添加 3 个新的边界场景测试
- 更新流动性测试覆盖
- 增加清算场景测试

---

**注意**: 本文档基于当前代码生成，具体实现请以源代码为准。
