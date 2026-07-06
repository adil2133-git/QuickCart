const User = require("./shared/user");
const CustomerProfile = require("./customer/customerProfile");
const DriverProfile = require("./driver/driverProfile");
const StoreProfile = require("./store/storeProfile");
const Category = require("./store/category");
const Product = require("./store/product");
const Cart = require("./customer/cart");
const Order = require("./shared/order");
const OrderStatusHistory = require("./shared/orderStatusHistory");
const DriverDeliveryRequest = require("./driver/driverDeliveryRequest");
const DriverEarnings = require("./driver/driverEarnings");
const WalletTransaction = require("./driver/walletTransaction");
const WithdrawalRequest = require("./driver/withdrawalRequest");
const DriverReview = require("./driver/driverReview");
const StoreReview = require("./store/storeReview");
const StoreTransaction = require("./store/storeTransaction");
const SettlementRecord = require("./admin/settlementRecord");
const Complaint = require("./admin/complaint");
const PlatformRevenue = require("./admin/platformRevenue");

module.exports = {
    User,
    CustomerProfile,
    DriverProfile,
    StoreProfile,
    Category,
    Product,
    Cart,
    Order,
    OrderStatusHistory,
    DriverDeliveryRequest,
    DriverEarnings,
    WalletTransaction,
    WithdrawalRequest,
    DriverReview,
    StoreReview,
    StoreTransaction,
    SettlementRecord,
    Notification,
    Complaint,
    PlatformRevenue,
};
