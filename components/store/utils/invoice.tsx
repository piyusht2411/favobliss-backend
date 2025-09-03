"use client";

import { myNumberToWords, wrapNumber } from "@/lib/utils";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download} from "lucide-react";

export interface InvoiceItem {
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

export interface InvoiceData {
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

interface Props {
  invoiceData: InvoiceData;
}

const Invoice = (props: Props) => {
  const { invoiceData } = props;
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    if (invoiceRef.current) {
      html2canvas(invoiceRef.current, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        pdf.addImage(
          imgData,
          "PNG",
          imgX,
          imgY,
          imgWidth * ratio,
          imgHeight * ratio
        );
        pdf.save(`invoice_${invoiceData.soldBy.invoiceNo}.pdf`);
      });
    }
  };

  const isTaxDouble = invoiceData.deliveredTo.state === "Delhi" ? true : false;

  return (
    <>
      <div className="flex justify-end px-12 pt-8 items-center">
        <button
          onClick={handleDownloadPDF}
          className="mb-4 px-4 py-2 bg-black text-white rounded-xl flex gap-1 items-center"
        >
          <Download className="mr-2 h-4 w-4" />
          Save as PDF
        </button>
      </div>

      <div ref={invoiceRef} className="max-w-4xl mx-auto p-6 bg-white">
        <div className="border-4 border-black">
          <div className="flex justify-between items-center p-4">
            <div className="w-16 h-16 bg-black flex items-center justify-center">
              <span className="text-orange-500 text-3xl font-bold italic transform -skew-x-12">
                L
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-wider">TAX INVOICE</h1>
            <div className="text-transparent">jnjcjnc</div>
          </div>

          <div className="grid grid-cols-2 border-b-2 border-black">
            <div className="p-4">
              <h3 className="font-bold mb-3 text-center text-xl">Sold By:</h3>
              <div className="text-sm space-y-1 leading-tight">
                <p className="font-semibold text-base">
                  {invoiceData.soldBy.company}
                </p>
                <p className="text-base">
                  {invoiceData.soldBy.address.split(",")[0]}
                </p>
                <p className="text-base">
                  {invoiceData.soldBy.address.split(",")[1]}
                </p>
                <p className="text-base">
                  {invoiceData.soldBy.address.split(",")[2]}
                </p>
                <br />
                <p className="text-base">East Delhi 110092</p>
                <p className="text-base">Delhi</p>
                <p className="text-base">India</p>
                <p className="text-base">
                  State Code : {invoiceData.soldBy.stateCode}
                </p>
                <p className="text-base">Ph: {invoiceData.soldBy.phone}</p>
                <p className="text-base">
                  GSTIN No.: {invoiceData.soldBy.gstin}
                </p>
                <br />
                <p className="text-base">
                  Invoice No. : {invoiceData.soldBy.invoiceNo}
                </p>
                <p className="text-base">
                  Invoice Date : {invoiceData.soldBy.invoiceDate}
                </p>
                <p className="text-base">
                  Order No. : {invoiceData.soldBy.orderNo}
                </p>
                <p className="text-base">
                  Order Date : {invoiceData.soldBy.orderDate}
                </p>
              </div>
            </div>

            <div className="p-4 border-2 border-t-0 border-r-0 border-b-0 border-l-0">
              <h3 className="font-bold mb-3 text-center text-xl">
                Delivered To:
              </h3>
              <div className="text-sm space-y-1 leading-tight">
                <p className="font-semibold text-base">
                  {invoiceData.deliveredTo.name}
                </p>
                <p className="text-base">
                  {invoiceData.deliveredTo.address.split(",")[0]}
                </p>
                <p className="text-base">
                  {invoiceData.deliveredTo.address.split(",")[1]}
                </p>
                <p className="text-base">
                  {invoiceData.deliveredTo.address.split(",")[2]}
                </p>
                <p className="text-base">{invoiceData.deliveredTo.city}</p>
                <p className="text-base">{invoiceData.deliveredTo.state}</p>
                <p className="text-base">{invoiceData.deliveredTo.country}</p>
                <p className="text-base">
                  State Code : {invoiceData.deliveredTo.stateCode}
                </p>
                <br />
                {/* <p className="text-base">
                  Payment Method : {invoiceData.deliveredTo.paymentMethod}
                </p>
                <p className="text-base">
                  Shipped By : {invoiceData.deliveredTo.shippedBy}
                </p>
                <p className="text-base">
                  AWB No. : {invoiceData.deliveredTo.awbNo}
                </p>
                <p className="text-base">
                  eWaybill No. : {invoiceData.deliveredTo.waybillNo}
                </p> */}
              </div>
            </div>
          </div>

          <div className="border-b-2 border-black">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                {/* Description */}
                <col style={{ width: "28%" }} />
                {/* HSN */}
                <col style={{ width: "10%" }} />
                {/* Qty */}
                <col style={{ width: "6%" }} />
                {/* Unit Price */}
                <col style={{ width: "12%" }} />
                {/* Unit Disc. */}
                <col style={{ width: "10%" }} />
                {/* Taxable Value */}
                <col style={{ width: "12%" }} />
                {/* Tax columns: either IGST (one col) or CGST + SGST (two cols) */}
                {isTaxDouble ? (
                  <>
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                  </>
                ) : (
                  <col style={{ width: "10%" }} />
                )}
                {/* Total */}
                <col style={{ width: "12%" }} />
              </colgroup>

              <thead>
                <tr className="bg-[#d2d2d2] border-black border-b-2">
                  <th className="border-r-2 border-black p-2 text-center font-bold">
                    Description
                  </th>
                  <th className="border-r-2 border-black p-2 text-center font-bold">
                    HSN
                  </th>
                  <th className="border-r-2 border-black p-2 text-center font-bold">
                    Qty
                  </th>
                  <th className="border-r-2 border-black p-2 text-center font-bold">
                    Unit Price
                  </th>
                  <th className="border-r-2 border-black p-2 text-center font-bold">
                    Unit Disc.
                  </th>
                  <th className="border-r-2 border-black p-2 text-center font-bold">
                    Taxable Value
                  </th>
                  {isTaxDouble && (
                    <th className="border-r-2 border-black p-2 text-center font-bold">
                      CGST
                    </th>
                  )}
                  {isTaxDouble ? (
                    <th className="border-r-2 border-black p-2 text-center font-bold">
                      SGST
                    </th>
                  ) : (
                    <th className="border-r-2 border-black p-2 text-center font-bold">
                      IGST
                    </th>
                  )}
                  <th className="p-2 text-center font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => (
                  <tr key={index} className="border-b border-black">
                    <td className="border-r-2 border-black p-2 text-left align-top">
                      <div className="leading-tight">
                        <p className="text-base">{item.description}</p>
                        <p className="mt-1 text-base">SKU : {item.sku}</p>
                      </div>
                    </td>
                    <td className="border-r-2 border-black p-2 text-center align-top">
                      <div className="leading-tight">
                        <p className="text-base">{wrapNumber(item.hsn, 5)}</p>
                      </div>
                    </td>
                    <td className="border-r-2 border-black p-2 text-center align-top text-base">
                      {item.qty}
                    </td>
                    <td className="border-r-2 border-black p-2 text-center align-top text-base">
                      {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="border-r-2 border-black p-2 text-center align-top text-base">
                      {item.unitDisc.toFixed(2)}
                    </td>
                    <td className="border-r-2 border-black p-2 text-center align-top text-base">
                      {item.taxableValue.toFixed(2)}
                    </td>
                    {isTaxDouble && (
                      <td className="border-r-2 border-black p-2 text-center align-top text-base">
                        {(Number(item.igst) / 2).toFixed(2)}
                      </td>
                    )}
                    {isTaxDouble ? (
                      <td className="border-r-2 border-black p-2 text-center align-top text-base">
                        {(Number(item.igst) / 2).toFixed(2)}
                      </td>
                    ) : (
                      <td className="border-r-2 border-black p-2 text-center align-top text-base">
                        {item.igst.toFixed(2)}
                      </td>
                    )}
                    <td className="p-2 text-center align-top text-base">
                      {wrapNumber(item.total.toFixed(2), 8)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#d2d2d2] border-black border-t-2">
                  <td
                    colSpan={2}
                    className="border-r-2 border-black p-2 text-center font-bold"
                  >
                    Net Total
                  </td>
                  <td className="border-r-2 border-black p-2 text-center font-bold">
                    {invoiceData.items.length}
                  </td>
                  <td
                    colSpan={isTaxDouble ? 5 : 4}
                    className="border-r-2 border-black"
                  ></td>
                  <td className="p-2 text-right font-bold">
                    {invoiceData.netTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-1 py-8">
            <div className="border-2 border-black p-6 flex justify-between items-center">
              <p className="font-bold text-lg">
                Net Amount Payable (In Words):{" "}
              </p>
              <p className="text-center text-lg w-2/5">
                {myNumberToWords(invoiceData.netTotal)} Rupees Only
              </p>
            </div>
          </div>

          <div className="p-1 mt-8">
            <div className="flex justify-between items-center min-h-[180px] border-2 border-black">
              <div className="p-4 flex justify-center items-center">
                <div className="text-sm space-y-4">
                  <p className="leading-loose">
                    All disputes are subject to Delhi jurisdiction only. Goods
                    once sold will only be taken back or exchanged as per the
                    store&apos; exchange/return policy.
                  </p>
                </div>
              </div>
              <div className="p-4 relative w-full">
                <div className="flex flex-col h-full justify-between">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-20 border-2 border-gray-400 mb-3 flex items-center justify-center bg-gray-50">
                      <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-600">Stamp</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-center">
                      Authorised Signature for
                    </p>
                    <p className="text-lg font-bold text-center">
                      Favobliss Infotech Pvt Ltd.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-2">
              <p className="text-base">
                {" "}
                Whether tax is payable under reverse charge:No
              </p>
              <p className="text-lg">1/1</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Invoice;
