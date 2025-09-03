"use server";

import { db } from "@/lib/db";

interface GraphData {
  name: string;
  total: number;
}

export const getTotalRevenue = async (storeId: string) => {
  try {
    const paidOrders = await db.order.findMany({
      where: {
        storeId,
        isPaid: true,
      },
      include: {
        orderItems: {
          include: {
            variant: {
              include: {
                product: true,
                variantPrices: true, // Include variantPrices
              },
            },
          },
        },
      },
    });

    const totalRevenue = paidOrders.reduce((total, order) => {
      const orderTotal = order.orderItems.reduce((orderSum: number, item) => {
        // Use the first variantPrice's price, or fallback to 0
        const price = item.variant.variantPrices[0]?.price || 0;
        return orderSum + item.quantity * price;
      }, 0);
      return total + orderTotal;
    }, 0);

    return totalRevenue;
  } catch (error) {
    console.error("[GET_TOTAL_REVENUE]", error);
    return 0;
  }
};

export const getSalesCount = async (storeId: string) => {
  try {
    const totalSales = await db.order.count({
      where: {
        storeId,
        isPaid: true,
      },
    });
    return totalSales;
  } catch (error) {
    console.error("[GET_SALES_COUNT]", error);
    return 0;
  }
};

export const getProductsInStock = async (storeId: string) => {
  try {
    const productsWithStock = await db.variant.findMany({
      where: {
        product: {
          storeId,
        },
        stock: {
          gt: 0,
        },
      },
      distinct: ["productId"],
    });
    return productsWithStock.length;
  } catch (error) {
    console.error("[GET_PRODUCTS_IN_STOCK]", error);
    return 0;
  }
};

export const getGraphRevenue = async (storeId: string) => {
  try {
    const paidOrders = await db.order.findMany({
      where: {
        storeId,
        isPaid: true,
      },
      include: {
        orderItems: {
          include: {
            variant: {
              include: {
                variantPrices: true, // Include variantPrices
              },
            },
          },
        },
      },
    });

    const monthlyRevenue: { [key: number]: number } = {};

    for (const order of paidOrders) {
      const month = order.createdAt.getMonth();
      let revenueForOrder = 0;

      for (const item of order.orderItems) {
        // Use the first variantPrice's price, or fallback to 0
        const price = item.variant.variantPrices[0]?.price || 0;
        revenueForOrder += item.quantity * price;
      }

      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + revenueForOrder;
    }

    const graphData: GraphData[] = [
      { name: "Jan", total: 0 },
      { name: "Feb", total: 0 },
      { name: "Mar", total: 0 },
      { name: "Apr", total: 0 },
      { name: "May", total: 0 },
      { name: "Jun", total: 0 },
      { name: "Jul", total: 0 },
      { name: "Aug", total: 0 },
      { name: "Sep", total: 0 },
      { name: "Oct", total: 0 },
      { name: "Nov", total: 0 },
      { name: "Dec", total: 0 },
    ];

    for (const month in monthlyRevenue) {
      graphData[parseInt(month)].total = monthlyRevenue[parseInt(month)];
    }

    return graphData;
  } catch (error) {
    console.error("[GET_GRAPH_REVENUE]", error);
    return [];
  }
};
