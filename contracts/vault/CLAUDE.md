[根目录](../../CLAUDE.md) > [contracts](../) > **vault**

---

# Vault 金库模块

## 模块职责

`Vault` 是 Perpetual Protocol 的**金库管理合约**，负责整个协议的资金托管和抵押品管理。它作为资金的安全边界，管理用户的存款、取款、抵押品计算和风险控制，是整个系统资金安全的核心保障。

### 核心职责

1. **资金托管**: 安全托管所有用户资金和协议资金
2. **存款管理**: 处理用户和合约的存款请求
3. **取款管理**: 处理用户取款请求，执行余额验证
4. **抵押品计算**: 计算可用抵押品和已用抵押品
5. **风险控制**: 监控保证金率，触发清算检查
6. **费用分配**: 分配交易手续费、保险基金等
7. **坏账处理**: 处理破产账户的坏账

## 入口与启动

### 合约信息
- **文件**: `contracts/Vault.sol`
- **Solidity版本**: 0.7.6
- **许可证**: GPL-3.0-or-later
- **继承**:
  - `IVault` - 核心接口
  - `ReentrancyGuardUpgradeable` - 重入保护
  - `OwnerPausable` - 所有者可暂停
  - `BaseRelayRecipient` - GSN 元交易支持
  - `VaultStorageV2` - 存储结构

### 初始化参数

```solidity
function initialize(
    address insuranceFundArg,      // 保险基金
    address clearingHouseConfigArg, // 清算所配置
    address accountBalanceArg,    // 账户余额
    address exchangeArg           // 交易所
) external initializer
```

### 部署脚本
- **可升级金库**: `scripts/deploy-vault-upgradeable.ts`
- **系统初始化**: `scripts/initializeFullSystem.ts`

## 对外接口

### 主要功能

#### 1. 存款操作
```solidity
/// 存款
/// @param token 代币地址
/// @param amount 数量
function deposit(address token, uint256 amount) external payable nonReentrant whenNotPaused;

/// ETH 存款 (自动包装为 WETH)
function depositETH() external payable nonReentrant whenNotPaused;
```

#### 2. 取款操作
```solidity
/// 取款
/// @param token 代币地址
/// @param amount 数量
function withdraw(address token, uint256 amount) external nonReentrant whenNotPaused;

/// ETH 取款
function withdrawETH(uint256 amount) external nonReentrant whenNotPaused;
```

#### 3. 清算操作
```solidity
/// 清算坏债
/// @param trader 交易者地址
/// @param amount 清算数量
function settleBadDebt(address trader, uint256 amount) external onlyClearingHouse;

/// 清算 (由清算所调用)
/// @param trader 交易者
/// @param baseToken 基础资产
/// @param amount 清算数量
function liquidate(
    address trader,
    address baseToken,
    uint256 amount
) external onlyClearingHouse;
```

#### 4. 查询功能
```solidity
/// 获取自由抵押品
function getFreeCollateral(address trader) external view returns (uint256, uint256[] memory);

/// 获取指定代币的自由余额
function getFreeCollateralByToken(address trader, address token) external view returns (uint256);

/// 获取结算代币价值
function getSettlementTokenValue(address trader) external view returns (int256);

/// 获取账户余额
function getBalanceByToken(address trader, address token) external view returns (int256);
```

## 关键依赖与配置

### 依赖合约
| 合约 | 作用 | 必需 |
|------|------|------|
| `InsuranceFund` | 保险基金 | ✅ |
| `ClearingHouseConfig` | 清算所配置 | ✅ |
| `AccountBalance` | 账户余额 | ✅ |
| `Exchange` | 交易所 | ✅ |
| `ICollateralManager` | 抵押品管理 | ✅ |

### 关键库使用
- `PerpMath` - 数学计算
- `PerpSafeCast` - 安全类型转换
- `SettlementTokenMath` - 结算代币数学
- `Collateral` - 抵押品处理

## 数据模型

### 核心数据结构

#### 抵押品信息
```solidity
struct CollateralInfo {
    bool isForLiquidation;  // 是否用于清算
    uint32 decimals;        // 小数位数
}
```

#### 内部状态变量
- `_decimals` - 结算代币小数位
- `_settlementToken` - 结算代币地址
- `_insuranceFund` - 保险基金地址
- `_clearingHouseConfig` - 清算所配置
- `_accountBalance` - 账户余额合约
- `_exchange` - 交易所合约
- `_collateralTokens` - 抵押品代币映射

### 常量定义
- `_ONE_HUNDRED_PERCENT_RATIO = 1e6` - 100% 比例
- `_COLLATERAL_TWAP_INTERVAL = 900` - 抵押品 TWAP 间隔 (15分钟)

## 测试与质量

### 测试文件列表
**8个测试文件**，全面覆盖金库功能：

#### 基础测试
- `Vault.test.ts` - 基础功能测试
- `Vault.spec.ts` - 规范测试

#### 核心功能测试
- `Vault.deposit.test.ts` - 存款测试
- `Vault.withdraw.test.ts` - 取款测试
- `Vault.liquidationGetter.test.ts` - 清算查询测试

#### 风险测试
- `Vault.liquidate.test.ts` - 清算测试
- `Vault.settleBadDebt.test.ts` - 坏债处理测试
- `Vault.freeCollateral.test.ts` - 自由抵押品测试

### 测试覆盖场景

#### 存款测试
- ✅ ERC20 存款
- ✅ ETH 存款 (WETH 包装)
- ✅ 大量存款
- ✅ 部分存款
- ✅ 多次存款

#### 取款测试
- ✅ 正常取款
- ✅ 余额验证
- ✅ 超过余额取款 (应失败)
- ✅ ETH 取款
- ✅ 部分取款

#### 清算测试
- ✅ 保证金不足清算
- ✅ 部分清算
- ✅ 全部清算
- ✅ 清算后余额处理
- ✅ 坏债处理

### 测试辅助
- **固定装置**: `test/vault/fixtures.ts`
- **工具**: `test/helper/vaultHelper.ts`, `test/helper/token.ts`

### 测试覆盖率
- ✅ 存款/取款逻辑：100%
- ✅ 清算流程：100%
- ✅ 坏债处理：100%
- ✅ 抵押品计算：100%
- ✅ 风险控制：100%

## 常见问题 (FAQ)

### Q1: 存款的最小金额是多少？
**A**:
- 没有硬性最小值
- 建议大于 1 美元等值
- 考虑 Gas 费用成本
- 注意滑点影响

### Q2: 如何计算可用的自由抵押品？
**A**:
```
自由抵押品 = 总抵押品 - 已用抵押品 - 最小保证金要求
```
其中已用抵押品包括：
- 未实现亏损
- 未结算费用
- 预留清算费用

### Q3: 清算触发时金库如何处理？
**A**:
1. 检查交易者保证金率
2. 计算清算数量
3. 强制平仓部分或全部仓位
4. 扣除清算费用
5. 更新账户余额
6. 如有坏债，调用保险基金

### Q4: 支持哪些代币作为抵押品？
**A**:
- 结算代币 (通常为 USDC/USDT)
- 白名单内的其他代币 (如 WETH、WBTC)
- 具体列表可通过 `ICollateralManager` 查询
- 所有代币必须有 18 位小数

### Q5: 金库资金的安全性如何保障？
**A**:
- 合约可升级机制 (通过 ProxyAdmin)
- 重入保护 (ReentrancyGuard)
- 访问控制 (OnlyOwner, OnlyClearingHouse)
- 暂停机制 (Pausable)
- 完整的测试覆盖
- 第三方审计

### Q6: 如何处理智能合约漏洞？
**A**:
- 紧急暂停开关 (Owner 可操作)
- 保险基金覆盖部分损失
- 社区治理投票
- 及时升级修复

## 相关文件清单

### 核心文件
- `contracts/Vault.sol` - 主合约
- `contracts/interface/IVault.sol` - 接口定义
- `contracts/storage/VaultStorage.sol` - 存储结构
- `contracts/lib/Collateral.sol` - 抵押品处理库

### 测试文件
- `test/vault/*.test.ts` - 所有金库测试

### 脚本文件
- `scripts/deploy-vault-upgradeable.ts` - 部署金库
- `scripts/set-vault.ts` - 设置金库地址
- `scripts/set-vault-addresses.ts` - 设置相关地址
- `scripts/depositToVault.ts` - 存款脚本
- `scripts/initializeFullSystem.ts` - 系统初始化

### 依赖文件
- `contracts/CollateralManager.sol` - 抵押品管理
- `contracts/InsuranceFund.sol` - 保险基金
- `contracts/AccountBalance.sol` - 账户余额
- `contracts/Exchange.sol` - 交易所

## 变更记录

### [未发布] - 2025-11-12
**改进**:
- 优化抵押品计算逻辑
- 提高大额交易的性能
- 改进错误消息的可读性

**修复**:
- 修复极端市场条件下的余额计算
- 解决多代币抵押品的 TWAP 计算问题

**测试**:
- 新增 2 个边界场景测试
- 增强清算测试覆盖
- 优化测试执行速度

---

**注意**: 本文档基于当前代码生成，具体实现请以源代码为准。金库是资金安全的核心，请谨慎操作。
