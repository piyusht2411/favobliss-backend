import Invoice from "@/components/store/utils/invoice";
import { db } from "@/lib/db";
interface InvoiceItem {
  description: string;
  hsn: string;
  sku: string;
  qty: number;
  unitPrice: number;
  unitDisc: number;
  taxableValue: number;
  igst: number;
  total: number;
}

interface InvoiceData {
  soldBy: {
    company: string;
    address: string;
    city: string;
    state: string;
    country: string;
    stateCode: string;
    phone: string;
    gstin: string;
    invoiceNo: string;
    invoiceDate: string;
    orderNo: string;
    orderDate: string;
  };
  deliveredTo: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    stateCode: string;
    paymentMethod: string;
    shippedBy: string;
    awbNo: string;
    waybillNo: string;
  };
  items: InvoiceItem[];
  netTotal: number;
}

export default async function page({
  params,
}: {
  params: { orderId: string };
}) {
  try {
    const order = await db.order.findUnique({
      where: { id: params.orderId },
      include: {
        orderItems: {
          include: {
            variant: {
              include: {
                product: true,
                variantPrices: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return (
        <div className="max-w-4xl mx-auto p-6 bg-white">Order not found</div>
      );
    }

    const invoiceData: InvoiceData = {
      soldBy: {
        company: "Favobliss Infotech Pvt Ltd",
        address:
          "246/59, EAST SCHOOL BLOCK, NEAR ALLAH COLONY MANDAWALI, East Delhi, Delhi 110092",
        city: "Delhi",
        state: "Delhi",
        country: "India",
        stateCode: "07",
        phone: "8920466675 ",
        gstin: "07AACCF6639H1ZI",
        invoiceNo: order.invoiceNumber || "Pending",
        invoiceDate: order.updatedAt.toISOString().split("T")[0],
        orderNo: order.orderNumber || "Pending",
        orderDate: order.createdAt.toISOString().split("T")[0],
      },
      deliveredTo: {
        name: order.customerName || "Unknown Customer",
        address: order.address || "",
        city: order.zipCode ? "Delhi" : "",
        state: order.zipCode ? "Delhi" : "",
        country: "India",
        stateCode: order.zipCode ? "07" : "",
        paymentMethod: order.isPaid ? "Prepaid" : "Cash on Delivery",
        shippedBy: "Delhivery Surface 5kg",
        awbNo: "1504863793810",
        waybillNo: "",
      },
      items: order.orderItems.map((item) => {
        const unitPrice =
          item.variant.tax !== 0 && item.variant.tax !== null
            ? item.price - (item.price * item.variant.tax) / 100
            : item.price || 0;
        const unitDisc = 0;
        const taxableValue =
          (item.variant.tax !== 0 && item.variant.tax !== null
            ? item.price - (item.price * item.variant.tax) / 100
            : item.price) * item.quantity || 0;
        const igstRate =
          item.variant.tax !== 0 && item.variant.tax !== null
            ? item.variant.tax / 100
            : 0;
        const igst = item.price * igstRate;
        const total = taxableValue + igst;
        return {
          description:
            item.name || item.variant.name || "Unknown Product",
          hsn: item.variant.hsn || "N/A",
          sku: item.variant.sku || "N/A",
          tax: item.variant.tax || 0,
          qty: item.quantity,
          unitPrice,
          unitDisc,
          taxableValue,
          igst,
          total,
        };
      }),
      netTotal: order.orderItems.reduce((sum, item) => {
        const taxableValue = item.price * item.quantity || 0;
        return sum + taxableValue;
      }, 0),
    };

    return <Invoice invoiceData={invoiceData} />;
  } catch (error) {
    console.error("TaxInvoice Page Error:", error);
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white">
        Internal server error
      </div>
    );
  }
}
