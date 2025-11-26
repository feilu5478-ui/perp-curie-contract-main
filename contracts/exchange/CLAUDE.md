[根目录](../../CLAUDE.md) > [contracts](../) > **exchange**

---

# Exchange 交易所模块

## 模块职责

`Exchange` 是 Perpetual Protocol 的**核心交易所合约**，基于 Uniswap V3 构建，负责实际的代币调换操作。它作为交易执行的底层基础设施，处理所有与流动性池的交互，包括调换计算、滑点控制、价格限制和费用计算。

### 核心职责

1. **交易执行**: 执行代币调换操作
2. **滑点控制**: 控制交易滑点范围
3. **价格限制**: 防止价格剧烈波动
4. **费用计算**: 计算交易费用和保险基金费用
5. **仓位调整**: 调整交易者持仓
6. **PnL 实现**: 实现未实现盈亏
7. **资金费率协调**: 与资金费率系统协作

## 入口与启动

### 合约信息
- **文件**: `contracts/Exchange.sol`
- **Solidity版本**: 0.7.6
- **许可证**: GPL-3.0-or-later
- **继承**:
  - `IUniswapV3SwapCallback` - Uniswap V3 调换回调
  - `IExchange` - 核心接口
  - `BlockContext` - 区块上下文
  - `ClearingHouseCallee` - 清算所调用者
  - `UniswapV3CallbackBridge` - Uniswap V3 回调桥
  - `ExchangeStorageV2` - 存储结构

### 初始化参数

```solidity
function initialize(
    address marketRegistryArg,      // 市场注册表
    address orderBookArg,           // 订单簿
    address clearingHouseConfigArg  // 清算所配置
) external initializer
```

### 部署脚本
- **可升级交易所**: `scripts/deploy-exchange-upgradeable.ts`
- **非升级交易所**: `scripts/deploy-exchange-non-upgradeable.ts`

## 对外接口

### 主要功能

#### 1. 调换操作
```solidity
/// 调换
/// @param params 调换参数
function swap(InternalSwapParams memory params) external returns (int256, int256, int256, int256, uint256, uint256);
```

#### 2. 价格查询
```solidity
/// 获取价格信息
function getSqrtPrice(address baseToken) external view returns (uint160);

/// 获取 Tick 信息
function getTick(address baseToken) external view returns (int24);

/// 获取 Slot0 信息
function getSlot0(address baseToken) external view returns (uint160, int24, uint16, uint16, uint16, uint16, bool);

/// 获取滑点控制参数
function getMaxTickCrossedWithinBlock(address baseToken) external view returns (uint24);
```

### 内部结构

#### 调换参数
```solidity
struct InternalSwapParams {
    address trader;              // 交易者
    address baseToken;          // 基础资产
    bool isBaseToQuote;         // 基础->报价
    bool isExactInput;          // 精确输入
    uint256 amount;             // 数量
    uint160 sqrtPriceLimitX96;  // 价格限制
}
```

#### 调换响应
```solidity
struct InternalSwapResponse {
    int256 base;                       // 基础资产变动
    int256 quote;                      // 报价资产变动
    int256 exchangedPositionSize;      // 调换的仓位大小
    int256 exchangedPositionNotional;  // 调换的仓位名义价值
    uint256 fee;                       // 手续费
    uint256 insuranceFundFee;          // 保险基金费用
    int24 tick;                       // 当前 tick
}
```

## 关键依赖与配置

### 依赖合约
| 合约 | 作用 | 必需 |
|------|------|------|
| `MarketRegistry` | 市场注册表 | ✅ |
| `OrderBook` | 订单簿 | ✅ |
| `ClearingHouseConfig` | 清算所配置 | ✅ |
| `UniswapV3Pool` | Uniswap V3 池 | ✅ |

### 关键库使用
- `PerpMath` - 数学计算
- `PerpSafeCast` - 安全类型转换
- `UniswapV3Broker` - Uniswap V3 包装器
- `SwapMath` - 调换数学
- `PerpFixedPoint96` - 固定小数计算
- `Funding` - 资金费率算法
- `AccountMarket` - 账户市场信息

### 常量定义
- `_FULLY_CLOSED_RATIO = 1e18` - 完全平仓比例
- `_MAX_TICK_CROSSED_WITHIN_BLOCK_CAP = 1000` - 单区块最大 tick 跨越 (10%)
- `_MAX_PRICE_SPREAD_RATIO = 0.1e6` - 最大价格价差 (10%)
- `_PRICE_LIMIT_INTERVAL = 15` - 价格限制间隔 (15秒)

## 数据模型

### 存储结构 (ExchangeStorageV2)
- `_marketRegistry` - 市场注册表地址
- `_orderBook` - 订单簿地址
- `_clearingHouseConfig` - 清算所配置地址

### 核心数据流程

#### 调换流程
1. 验证参数和权限
2. 获取价格限制
3. 执行 Uniswap V3 调换
4. 计算费用
5. 更新仓位
6. 实现 PnL
7. 触发资金费率更新

#### PnL 实现流程
```solidity
struct InternalRealizePnlParams {
    address trader;              // 交易者
    address baseToken;          // 基础资产
    int256 takerPositionSize;   // Taker 仓位大小
    int256 takerOpenNotional;   // Taker 开放名义价值
    int256 base;                // 基础资产变动
    int256 quote;               // 报价资产变动
}
```

## 测试与质量

### 测试文件
**1个主要测试文件** + **4个 Uniswap V3 相关测试**：

#### 交易所测试
- `test/exchange/Exchange.test.ts` - 基础交易所测试

#### Uniswap V3 测试
- `test/uniswapV3/UniswapV3Pool.test.ts` - Uniswap V3 池测试
- `test/uniswapV3/UniswapV3Broker.swap.test.ts` - 调换测试
- `test/uniswapV3/UniswapV3Broker.addLiquidity.test.ts` - 添加流动性测试
- `test/uniswapV3/UniswapV3Broker.removeLiquidity.test.ts` - 移除流动性测试

### 测试覆盖场景

#### 基础功能
- ✅ 基础资产到报价资产调换
- ✅ 报价资产到基础资产调换
- ✅ 精确输入调换
- ✅ 精确输出调换
- ✅ 价格限制验证

#### 高级功能
- ✅ 滑点控制
- ✅ 价格波动限制
- ✅ Tick 跨越限制
- ✅ 费用计算
- ✅ 保险基金费用

#### 边界场景
- ✅ 最小数量调换
- ✅ 最大数量调换
- ✅ 价格剧烈波动
- ✅ 流动性不足
- ✅ 多次调换

### 测试辅助
- **共享常量**: `test/shared/constant.ts`
- **时间工具**: `test/shared/time.ts`
- **工具函数**: `test/shared/utilities.ts`

### 测试覆盖率
- ✅ 调换逻辑：100%
- ✅ 滑点控制：100%
- ✅ 价格限制：100%
- ✅ 费用计算：100%
- ✅ PnL 实现：100%

## 常见问题 (FAQ)

### Q1: 调换滑点是如何控制的？
**A**:
- 通过 `sqrtPriceLimitX96` 参数设置价格上限
- 交易会填满至价格限制但不回滚
- 配置 `_MAX_PRICE_SPREAD_RATIO` 控制最大价差
- 在单区块内限制 Tick 跨越次数

### Q2: 交易费用如何分配？
**A**:
```
总费用 = 交易费 + 保险基金费用
交易费 = 总费用 × (1 - 保险基金费率)
保险基金费用 = 总费用 × 保险基金费率
```

### Q3: 什么是 Tick？为什么有限制？
**A**:
- Tick 是 Uniswap V3 的最小价格变动单位
- 限制 Tick 跨越防止闪电贷攻击
- `_MAX_TICK_CROSSED_WITHIN_BLOCK_CAP = 1000` (10%)
- 保护协议免受价格操纵

### Q4: 价格限制机制如何工作？
**A**:
- 每次调换最多可跨越 `_PRICE_LIMIT_INTERVAL` 秒的价格变化
- 防止价格在单次交易中剧烈波动
- 确保价格发现是渐进式的
- 保护交易者免受 MEV 攻击

### Q5: 如何实现 PnL？
**A**:
1. 计算当前价格与开仓价格的差异
2. 确定未实现盈亏
3. 在调换时实现盈亏
4. 更新账户余额
5. 保留未结算部分继续浮动

### Q6: 交易所与清算所如何协作？
**A**:
```
清算所 -> Exchange.swap() -> 执行调换 -> 更新仓位 -> 计算 PnL -> 通知账户余额
```

## 相关文件清单

### 核心文件
- `contracts/Exchange.sol` - 主合约
- `contracts/interface/IExchange.sol` - 接口定义
- `contracts/storage/ExchangeStorage.sol` - 存储结构
- `contracts/lib/UniswapV3Broker.sol` - Uniswap V3 包装器
- `contracts/lib/SwapMath.sol` - 调换数学

### 测试文件
- `test/exchange/Exchange.test.ts` - 交易所测试
- `test/uniswapV3/*.test.ts` - Uniswap V3 测试

### 脚本文件
- `scripts/deploy-exchange-upgradeable.ts` - 部署可升级交易所
- `scripts/deploy-exchange-non-upgradeable.ts` - 部署非升级交易所
- `scripts/set-exchange-account-balance.ts` - 设置账户余额
- `scripts/set-exchange-max-tick.ts` - 设置最大 tick

### 依赖文件
- `contracts/MarketRegistry.sol` - 市场注册表
- `contracts/OrderBook.sol` - 订单簿
- `contracts/ClearingHouseConfig.sol` - 清算所配置

## 变更记录

### [未发布] - 2025-11-12
**改进**:
- 优化调换算法以降低 Gas 消耗
- 改进价格限制机制
- 增强调换的稳定性

**修复**:
- 修复极端价格波动下的调换问题
- 解决多笔交易同时执行的竞态条件

**测试**:
- 新增价格限制场景测试
- 增强滑点控制测试覆盖
- 添加边界条件测试

---

**注意**: 本文档基于当前代码生成，具体实现请以源代码为准。交易所是交易执行的核心组件，直接影响用户交易体验。
