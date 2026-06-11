import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ORDER_STATUS, ORDER_MESSAGES } from '../constants/index.js';
import { Order } from '../types/domain.js';
import { photoApi } from '../api/photoApi.js';
import { printTable } from '../utils/table.js';
import { handleError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import {
  summarizeCustomers,
  getTopCustomers,
  formatCurrency,
  calculateSummaryStats,
  CustomerSummary,
} from '../services/customerSummary.js';

function buildStatusHint(): string {
  return ORDER_MESSAGES.STATUS_FILTER_HINT.replace('{statuses}', ORDER_STATUS.join(', '));
}

async function handleOrderList(options: { status?: string }): Promise<void> {
  logger.divider(ORDER_MESSAGES.LIST_TITLE);
  const orders: Order[] = await photoApi.listOrders(options.status);

  if (orders.length === 0) {
    logger.warn(ORDER_MESSAGES.NO_ORDERS);
    return;
  }

  printTable(
    ['ID', '客户', '日期', '类型', '状态', '金额'],
    orders.map((item) => [item.id, item.customerName, item.date, item.shootType, item.status, formatCurrency(item.amount)])
  );

  logger.blank();
  const answer = await inquirer.prompt<{ complete: boolean; id: number }>([
    { type: 'confirm', name: 'complete', message: ORDER_MESSAGES.COMPLETE_CONFIRM },
    { type: 'number', name: 'id', message: ORDER_MESSAGES.INPUT_ORDER_ID, when: (a: { complete?: boolean }) => a.complete },
  ]);

  if (answer.complete) {
    await photoApi.completeOrder(answer.id);
    logger.success(ORDER_MESSAGES.COMPLETE_SUCCESS.replace('{id}', String(answer.id)));
  }

  logger.info(buildStatusHint());
}

async function handleCustomerSummary(options: { status?: string; top?: string }): Promise<void> {
  const topN = options.top ? parseInt(options.top, 10) : 0;

  logger.divider(ORDER_MESSAGES.CUSTOMER_SUMMARY_TITLE);
  const orders: Order[] = await photoApi.listOrders(options.status);

  if (orders.length === 0) {
    logger.warn(ORDER_MESSAGES.NO_CUSTOMER_DATA);
    return;
  }

  const summaries: CustomerSummary[] = topN > 0 ? getTopCustomers(orders, topN) : summarizeCustomers(orders);

  if (summaries.length === 0) {
    logger.warn(ORDER_MESSAGES.NO_CUSTOMER_DATA);
    return;
  }

  const stats = calculateSummaryStats(summaries);
  printTable(
    [ORDER_MESSAGES.RANK, ORDER_MESSAGES.CUSTOMER_NAME, ORDER_MESSAGES.ORDER_COUNT, ORDER_MESSAGES.TOTAL_AMOUNT, ORDER_MESSAGES.AVG_AMOUNT, ORDER_MESSAGES.LAST_ORDER_DATE],
    summaries.map((item) => {
      const isTopThree = item.rank <= 3;
      return [
        isTopThree ? chalk.bold.yellow(item.rank) : String(item.rank),
        isTopThree ? chalk.bold(item.customerName) : item.customerName,
        String(item.orderCount),
        isTopThree ? chalk.bold.green(formatCurrency(item.totalAmount)) : formatCurrency(item.totalAmount),
        formatCurrency(item.avgAmount),
        item.lastOrderDate,
      ];
    })
  );

  logger.blank();
  printTable(
    ['客户总数', '订单总数', '汇总收入', '客户均价'],
    [[String(stats.totalCustomers), String(stats.totalOrders), formatCurrency(stats.totalRevenue), formatCurrency(stats.avgCustomerValue)]]
  );

  if (topN > 0 && topN < summaries.length) {
    logger.info(`仅显示前 ${topN} 名客户`);
  }
}

export function registerOrderCommand(program: Command): void {
  const orderCmd = program.command('order').description('订单管理');

  orderCmd
    .command('list')
    .description('查看订单列表')
    .option('--status <status>', '订单状态筛选')
    .action(async (options) => {
      try {
        await handleOrderList(options);
      } catch (error) {
        handleError(error);
      }
    });

  orderCmd
    .command('summary')
    .description('客户消费汇总（按金额排序）')
    .option('--status <status>', '订单状态筛选')
    .option('--top <n>', '仅显示前 N 名客户')
    .action(async (options) => {
      try {
        await handleCustomerSummary(options);
      } catch (error) {
        handleError(error);
      }
    });

  orderCmd
    .option('--status <status>', '订单状态筛选')
    .action(async (options) => {
      try {
        await handleOrderList(options);
      } catch (error) {
        handleError(error);
      }
    });
}
