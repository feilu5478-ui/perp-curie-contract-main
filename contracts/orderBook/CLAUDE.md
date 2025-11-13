[根目录](../../CLAUDE.md) > [contracts](../) > **orderBook**

---

# OrderBook 订单簿模块

## 模块职责

`OrderBook` 是 Perpetual Protocol 的**订单簿管理合约**，负责处理限价订单的放置、取消和执行。它通过链上数据结构维护所有挂单，提供价格发现机制，是协议的高级交易功能组件。

### 核心职责

1. **订单管理**: 管理限价订单的整个生命周期
2. **价格发现**: 提供链上价格发现机制
3. **流动性提供**: 为市场提供额外流动性
4. **订单撮合**: 处理限价订单与市价单的撮合
5. **风险管理**: 监控订单风险，执行保证金检查

## 入口与启动

### 合约信息
- **文件**: `contracts/OrderBook.sol`
- **Solidity版本**: 0.7.6
- **许可证**: GPL-3.0-or-later
- **继承**: 基于 OpenZeppelin 可升级模式

### 初始化参数
```solidity
function initialize(
    address clearingHouseConfigArg,
    address marketRegistryArg
) external initializer
```

## 对外接口

### 主要功能

#### 1. 订单操作
```solidity
/// 放置订单
function placeOrder(PlaceOrderParams memory params) external returns (bytes32 orderId);

/// 取消订单
function cancelOrder(bytes32 orderId) external;

/// 取消过期订单
function cancelExcessOrders(address baseToken) external;
```

#### 2. 查询功能
```solidity
/// 获取订单信息
function getOrder(bytes32 orderId) external view returns (Order memory);

/// 获取订单列表
function getOpenOrders(address trader, address baseToken) external view returns (bytes32[] memory);

/// 获取订单数量
function getOpenOrderCount(address trader, address baseToken) external view returns (uint256);
```

## 关键依赖

- `ClearingHouseConfig` - 清算所配置
- `MarketRegistry` - 市场注册表
- `AccountBalance` - 账户余额
- `Vault` - 金库

## 测试与质量

### 测试覆盖
- ✅ 订单放置
- ✅ 订单取消
- ✅ 订单执行
- ✅ 边界条件

### 测试文件
- `test/orderBook/*.test.ts` (存在订单簿测试)

## 常见问题

### Q: 限价订单如何工作？
**A**: 用户设置价格和数量，系统会在价格达到时自动执行。

### Q: 订单有有效期吗？
**A**: 是的，订单有过期时间，过期后自动取消。

## 相关文件

### 核心文件
- `contracts/OrderBook.sol` - 主合约
- `contracts/interface/IOrderBook.sol` - 接口
- `contracts/storage/OrderBookStorage.sol` - 存储

### 脚本文件
- `scripts/deploy-order-book.ts` - 部署订单簿
- `scripts/deploy-order-book-non-upgradeable.ts` - 非升级部署
- `scripts/set-order-book-exchange.ts` - 设置交易所

## 变更记录

### [未发布] - 2025-11-12
- 优化订单匹配算法
- 改进 Gas 使用效率
- 增强订单取消机制

---

**注意**: 本文档基于当前代码生成，具体实现请以源代码为准。
