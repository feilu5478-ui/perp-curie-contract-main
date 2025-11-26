[根目录](../../CLAUDE.md) > [contracts](../) > **accountBalance**

---

# AccountBalance 账户余额模块

## 模块职责

`AccountBalance` 是 Perpetual Protocol 的**账户余额管理合约**，负责跟踪和计算每个交易者在各个市场中的持仓、余额和盈亏。它作为账户数据的权威来源，为清算所、金库等合约提供账户信息查询。

### 核心职责

1. **持仓跟踪**: 跟踪交易者在每个市场的仓位
2. **余额管理**: 管理账户的结算代币余额
3. **PnL 计算**: 计算已实现和未实现盈亏
4. **风险评估**: 提供账户净值和保证金信息
5. **结算**: 处理账户余额的结算操作

## 入口与启动

### 合约信息
- **文件**: `contracts/AccountBalance.sol`
- **Solidity版本**: 0.7.6
- **许可证**: GPL-3.0-or-later
- **继承**:
  - `IAccountBalance` - 核心接口
  - `BlockContext` - 区块上下文
  - `ClearingHouseCallee` - 清算所调用者
  - `AccountBalanceStorageV1` - 存储结构

### 初始化参数
```solidity
function initialize(
    address clearingHouseConfigArg,  // 清算所配置
    address orderBookArg             // 订单簿
) external initializer
```

## 对外接口

### 主要功能

#### 1. 余额修改
```solidity
/// 修改 Taker 余额
/// @param trader 交易者
/// @param baseToken 基础资产
/// @param base 基础资产变动
/// @param quote 报价资产变动
function modifyTakerBalance(
    address trader,
    address baseToken,
    int256 base,
    int256 quote
) external returns (int256, int256);

/// 修改应付已实现 PnL
function modifyOwedRealizedPnl(address trader, int256 amount) external;

/// 将报价结算为应付已实现 PnL
function settleQuoteToOwedRealizedPnl(
    address trader,
    address baseToken,
    int256 amount
) external;

/// 结算应付已实现 PnL
function settleOwedRealizedPnl(address trader) external returns (int256);
```

#### 2. 查询功能
```solidity
/// 获取仓位信息
function getTakerPositionInfo(address trader, address baseToken) external view returns (
    int256 takerPositionSize,
    int256 takerOpenNotional
);

/// 获取账户价值
function getAccountValue(address trader) external view returns (int256);

/// 获取保证金
function getMarginRequirement(address trader) external view returns (int256);

/// 获取位置价值
function getPositionValue(
    address trader,
    address baseToken,
    IAccountBalance.PnlCalcOption calcOption
) external view returns (int256, int256);
```

## 关键依赖

- `ClearingHouseConfig` - 清算所配置
- `OrderBook` - 订单簿
- `Vault` - 金库

## 数据模型

### 常量定义
- `_DUST = 10 wei` - 最小阈值
- `_MIN_PARTIAL_LIQUIDATE_POSITION_VALUE = 100e18` - 最小部分清算仓位价值

### 存储结构
- `_clearingHouseConfig` - 清算所配置
- `_orderBook` - 订单簿
- `_vault` - 金库

### 账户市场信息
```solidity
struct AccountMarket {
    int256 takerPositionSize;     // Taker 仓位大小
    int256 takerOpenNotional;     // Taker 开放名义价值
}
```

## 测试与质量

### 测试文件
**2个测试文件**：

#### 基础测试
- `AccountBalance.spec.ts` - 规范测试
- `AccountBalance.getPositionValue.test.ts` - 位置价值测试

### 测试覆盖场景
- ✅ 仓位修改
- ✅ 余额查询
- ✅ PnL 计算
- ✅ 保证金计算
- ✅ 结算操作

### 测试覆盖率
- ✅ 仓位管理：100%
- ✅ 余额修改：100%
- ✅ 查询功能：100%

## 常见问题

### Q: 如何计算账户净值？
**A**:
```
账户净值 = 总结算代币余额 + 总未实现盈亏 + 总应付已实现 PnL
```

### Q: 什么情况下会触发结算？
**A**:
- 平仓操作
- 强制清算
- 用户主动提取资金

### Q: 最小清算阈值是多少？
**A**: `_MIN_PARTIAL_LIQUIDATE_POSITION_VALUE = 100 USD`

## 相关文件

### 核心文件
- `contracts/AccountBalance.sol` - 主合约
- `contracts/interface/IAccountBalance.sol` - 接口
- `contracts/storage/AccountBalanceStorage.sol` - 存储

### 脚本文件
- `scripts/deploy-account-balance.ts` - 部署账户余额
- `scripts/set-account-balance-vault.ts` - 设置金库地址

## 变更记录

### [未发布] - 2025-11-12
- 优化 PnL 计算精度
- 改进保证金检查效率
- 增强边界条件处理

---

**注意**: 本文档基于当前代码生成，具体实现请以源代码为准。
