import { Order } from '../types/domain.js';
import { logger } from '../utils/logger.js';
import { ORDER_MESSAGES, COMMON_MESSAGES, ERROR_CODES } from '../constants/index.js';
import { AppError } from '../utils/errors.js';

export interface CustomerSummary {
  rank: number;
  customerName: string;
  orderCount: number;
  totalAmount: number;
  avgAmount: number;
  lastOrderDate: string;
}

interface CustomerAccumulator {
  customerName: string;
  orderCount: number;
  totalAmount: number;
  lastOrderDate: string;
}

export function summarizeCustomers(orders: Order[]): CustomerSummary[] {
  logger.debug(`开始汇总客户数据，订单总数: ${orders.length}`);

  if (!orders || orders.length === 0) {
    logger.warn(ORDER_MESSAGES.NO_ORDERS);
    return [];
  }

  const customerMap = new Map<string, CustomerAccumulator>();

  for (const order of orders) {
    if (!order.customerName) {
      logger.debug(`跳过订单 ${order.id}：客户姓名为空`);
      continue;
    }

    const key = order.customerName.trim();
    const existing = customerMap.get(key);

    if (existing) {
      existing.orderCount += 1;
      existing.totalAmount += Number(order.amount) || 0;
      if (order.date > existing.lastOrderDate) {
        existing.lastOrderDate = order.date;
      }
    } else {
      customerMap.set(key, {
        customerName: key,
        orderCount: 1,
        totalAmount: Number(order.amount) || 0,
        lastOrderDate: order.date,
      });
    }
  }

  logger.debug(`汇总完成，客户数量: ${customerMap.size}`);

  const summaries: CustomerSummary[] = Array.from(customerMap.values())
    .map((acc) => ({
      rank: 0,
      customerName: acc.customerName,
      orderCount: acc.orderCount,
      totalAmount: Number(acc.totalAmount.toFixed(2)),
      avgAmount: Number((acc.totalAmount / acc.orderCount).toFixed(2)),
      lastOrderDate: acc.lastOrderDate,
    }))
    .sort((a, b) => {
      const amountDiff = b.totalAmount - a.totalAmount;
      if (amountDiff !== 0) return amountDiff;
      const countDiff = b.orderCount - a.orderCount;
      if (countDiff !== 0) return countDiff;
      return b.lastOrderDate.localeCompare(a.lastOrderDate);
    });

  summaries.forEach((item, index) => {
    item.rank = index + 1;
  });

  logger.debug(`排序完成，第一名: ${summaries[0]?.customerName}，金额: ${summaries[0]?.totalAmount}`);

  return summaries;
}

export function getTopCustomers(orders: Order[], limit = 10): CustomerSummary[] {
  if (limit <= 0) {
    throw new AppError(ERROR_CODES.INVALID_PARAMS, `${COMMON_MESSAGES.INVALID_INPUT}：limit 必须为正整数`);
  }
  const all = summarizeCustomers(orders);
  return all.slice(0, limit);
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function calculateSummaryStats(summaries: CustomerSummary[]): {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  avgCustomerValue: number;
} {
  if (summaries.length === 0) {
    return { totalCustomers: 0, totalOrders: 0, totalRevenue: 0, avgCustomerValue: 0 };
  }
  const totalOrders = summaries.reduce((sum, s) => sum + s.orderCount, 0);
  const totalRevenue = summaries.reduce((sum, s) => sum + s.totalAmount, 0);
  return {
    totalCustomers: summaries.length,
    totalOrders,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    avgCustomerValue: Number((totalRevenue / summaries.length).toFixed(2)),
  };
}
