[根目录](../../CLAUDE.md) > [contracts](../) > **marketRegistry**

---

# MarketRegistry 市场注册表模块

## 模块职责

`MarketRegistry` 是 Perpetual Protocol 的**市场注册表合约**，负责管理所有交易市场的信息，包括交易对池的信息、费用率、手续费等。它作为市场的元数据中心，为整个协议提供市场配置和查询服务。

### 核心职责

1. **市场管理**: 添加、配置、激活交易市场
2. **池信息**: 管理 Uniswap V3 池信息
3. **费用管理**: 设置和更新交易费率
4. **白名单**: 管理市场白名单
5. **价格限制**: 配置市场价格限制
6. **配额管理**: 管理每个市场的订单配额

## 入口与启动

### 合约信息
- **文件**: `contracts/MarketRegistry.sol`
- **Solidity版本**: 0.7.6
- **许可证**: GPL-3.0-or-later
- **继承**:
  - `IMarketRegistry` - 市场注册表接口
  - `IMarketRegistryFeeManager` - 费用管理接口
  - `ClearingHouseCallee` - 清算所调用者
  - `MarketRegistryStorageV4` - 存储结构 (V4)

### 初始化参数
```solidity
function initialize(
    address uniswapV3FactoryArg,  // Uniswap V3 工厂
    address quoteTokenArg        // 报价代币
) external initializer
```

## 对外接口

### 主要功能

#### 1. 市场管理
```solidity
/// 添加交易池
/// @param baseToken 基础资产代币
/// @param feeRatio 费率比率
function addPool(address baseToken, uint24 feeRatio) external onlyOwner returns (address);

/// 激活市场
function addBaseToken(address baseToken) external onlyOwner;

/// 移除市场
function removePool(address baseToken) external onlyOwner;
```

#### 2. 费用管理
```solidity
/// 设置最大市场价差比率
function setMaxMarketPriceRatio(uint24 ratio) external onlyOwner;

/// 设置费用管理器
function setFeeManager(address trader, bool isFeeManager) external onlyOwner;
```

#### 3. 查询功能
```solidity
/// 获取交易池地址
function getPool(address baseToken) external view returns (address);

/// 获取市场列表
function getMarkets(uint256 start, uint256 end) external view returns (address[] memory);

/// 检查池是否存在
function hasPool(address baseToken) external view returns (bool);

/// 获取每市场最大订单数
function getMaxOrdersPerMarket() external view returns (uint8);
```

### 常量定义
- `_DEFAULT_MAX_MARKET_PRICE_SPREAD_RATIO = 0.1e6` - 默认最大市场价差 (10%)
- `_ONE_HUNDRED_PERCENT_RATIO = 1e6` - 100% 比例

## 关键依赖

- `UniswapV3Factory` - Uniswap V3 工厂
- `QuoteToken` - 报价代币
- `BaseToken` - 基础代币
- `ClearingHouse` - 清算所

## 数据模型

### 存储结构 (MarketRegistryStorageV4)
- `_uniswapV3Factory` - Uniswap V3 工厂地址
- `_quoteToken` - 报价代币地址
- `_poolMap` - 基础资产到池地址的映射
- `_clearingHouse` - 清算所地址
- `_maxOrdersPerMarket` - 每市场最大订单数

### 修饰符
- `checkRatio(uint24 ratio)` - 验证比率
- `checkPool(address baseToken)` - 验证池存在
- `onlyFeeManager()` - 仅费用管理器

## 测试与质量

### 测试覆盖
- ✅ 添加/移除池
- ✅ 池信息查询
- ✅ 费用率设置
- ✅ 白名单验证
- ✅ 价格限制检查

## 常见问题

### Q: 如何添加新的交易对？
**A**:
1. 确保基础代币有 18 位小数
2. 在 Uniswap V3 中创建池
3. 调用 `addPool()` 添加到市场注册表
4. 验证白名单设置

### Q: 交易池的最小要求是什么？
**A**:
- 基础代币必须是 18 位小数
- 基础代币地址 < 报价代币地址
- 池必须在 Uniswap V3 中存在
- 价格已初始化

### Q: 如何设置交易费率？
**A**: 通过 `IMarketRegistryFeeManager` 接口调用费用管理函数。

## 相关文件

### 核心文件
- `contracts/MarketRegistry.sol` - 主合约
- `contracts/interface/IMarketRegistry.sol` - 市场接口
- `contracts/interface/IMarketRegistryFeeManager.sol` - 费用管理接口
- `contracts/storage/MarketRegistryStorage.sol` - 存储

### 脚本文件
- `scripts/deploy-market-registry.ts` - 部署市场注册表
- `scripts/addPoolToMarketRegistry.ts` - 添加池
- `scripts/setMarketRegistryClearingHouse.ts` - 设置清算所
- `scripts/deepDiagnoseMR_PNE.ts` - 诊断工具

## 变更记录

### [未发布] - 2025-11-12
- 改进池验证逻辑
- 优化市场查询性能
- 增强错误处理

---

**注意**: 本文档基于当前代码生成，具体实现请以源代码为准。市场注册表是协议的市场元数据核心。
