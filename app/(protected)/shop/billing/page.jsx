'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Trash, X, FileText } from 'lucide-react';
import { useShopData } from '../ShopDataContext';

// --- Utility: Convert Number to Indian Rupees Words ---
const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const format = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + format(n % 100) : '');
    return '';
  };

  const grand = Math.floor(num);
  if (grand === 0) return 'Zero Rupees Only';
  
  let str = '';
  if (grand >= 10000000) {
    str += format(Math.floor(grand / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  if (grand >= 100000) {
    str += format(Math.floor((grand % 10000000) / 100000)) + ' Lakh ';
  }
  if (grand >= 1000) {
    str += format(Math.floor((grand % 100000) / 1000)) + ' Thousand ';
  }
  str += format(grand % 1000);

  return str.trim() + ' Rupees Only';
};

export default function BillingPage() {
  const { shopData } = useShopData();
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [billDiscount, setBillDiscount] = useState(0);
  const [showInvoice, setShowInvoice] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, iRes] = await Promise.all([
          fetch('/api/shop/customers'),
          fetch('/api/shop/inventory')
        ]);
        setCustomers(await cRes.json());
        setInventory(await iRes.json());
      } catch (err) {
        toast.error("Failed to load data");
      }
    };
    fetchData();
  }, []);

  const addToCart = (item) => {
    const existing = cart.find(c => c.itemId === item._id);
    if (existing) return toast.error("Item already in cart");

    const gstMatch = item.gstSlab.match(/@(\d+(\.\d+)?)%/);
    const gstRate = gstMatch ? parseFloat(gstMatch[1]) : 0;

    setCart([...cart, {
      itemId: item._id,
      name: item.name,
      hsnCode: item.hsnCode || 'N/A',
      quantity: 1,
      unit: item.unit.secondaryUnit || item.unit.baseUnit,
      rate: Number(item.salePrice.amount),
      taxType: item.salePrice.taxType,
      gstRate: gstRate,
      discount: 0
    }]);
  };

  const calculatedTotals = useMemo(() => {
    let taxable = 0;
    let totalGst = 0;
    let totalItemDiscounts = 0;

    const items = cart.map(item => {
      const baseVal = item.rate * item.quantity;
      const taxableAmount = Math.max(0, baseVal - Number(item.discount));
      const gstAmount = item.taxType === 'exclusive' ? (taxableAmount * item.gstRate) / 100 : 0;
      
      taxable += taxableAmount;
      totalGst += gstAmount;
      totalItemDiscounts += Number(item.discount);

      return {
        ...item,
        taxableAmount,
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2,
        igstAmount: 0,
        netAmount: taxableAmount + gstAmount
      };
    });

    const grossBeforeBillDisc = taxable + totalGst;
    const gross = Math.max(0, grossBeforeBillDisc - Number(billDiscount));
    const grand = Math.round(gross);
    const totalDiscount = totalItemDiscounts + Number(billDiscount);
    
    return { items, taxable, totalGst, gross, grand, roundOff: grand - gross, totalDiscount };
  }, [cart, billDiscount]);

  const handleSave = async () => {
    if (!selectedCustomer) return toast.error("Please select a customer");
    if (cart.length === 0) return toast.error("Cart is empty");

    const loadingId = toast.loading("Processing Bill...");
    try {
      const payload = {
        customerId: selectedCustomer._id,
        items: calculatedTotals.items,
        totalTaxableValue: calculatedTotals.taxable,
        totalCGST: calculatedTotals.totalGst / 2,
        totalSGST: calculatedTotals.totalGst / 2,
        totalGST: calculatedTotals.totalGst,
        billDiscount: Number(billDiscount),
        grossAmount: calculatedTotals.gross,
        roundOff: calculatedTotals.roundOff,
        grandTotal: calculatedTotals.grand,
        amountInWords: numberToWords(calculatedTotals.grand),
        paymentMode,
        billType: 'Tax Invoice'
      };

      const res = await fetch('/api/shop/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");

      setShowInvoice(data.sale);
      setCart([]);
      setBillDiscount(0);
      toast.success("Bill Saved Successfully", { id: loadingId });
    } catch (err) {
      toast.error(err.message, { id: loadingId });
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 text-black font-sans">
      {/* POS Header */}
      <header className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText size={24}/> BILLING / POS
        </h1>
        <div className="flex gap-4">
          <select 
            className="border border-black rounded px-3 py-1 font-bold text-sm outline-none"
            value={paymentMode} 
            onChange={e => setPaymentMode(e.target.value)}
          >
            <option value="Cash">Cash Sale</option>
            <option value="Online">Online / UPI</option>
            <option value="Credit">Credit (Udhaar)</option>
          </select>
          <button 
            onClick={handleSave} 
            className="bg-black text-white px-8 py-2 rounded font-bold hover:bg-gray-800 transition-all active:scale-95"
          >
            SAVE & PRINT
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4 flex flex-col overflow-hidden">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</label>
            <select 
              className="w-full border border-black p-2 rounded mt-1 font-bold text-sm"
              onChange={e => setSelectedCustomer(customers.find(c => c._id === e.target.value))}
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Inventory</label>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {inventory.map(item => (
                <button 
                  key={item._id} 
                  onClick={() => addToCart(item)}
                  className="w-full text-left p-3 border rounded hover:border-black transition-all flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-[10px] text-gray-400">Stock: {item.stockQuantity}</p>
                  </div>
                  <p className="font-bold text-sm">₹{item.salePrice.amount}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* POS Table */}
        <div className="lg:col-span-3 bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-black text-white sticky top-0">
                <tr className="uppercase text-[10px] font-bold">
                  <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-center">Unit</th>
                  <th className="p-4 text-center">Qty</th>
                  <th className="p-4 text-center">Rate</th>
                  <th className="p-4 text-center">GST%</th>
                  <th className="p-4 text-center">Discount</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map((item, i) => (
                  <tr key={i}>
                    <td className="p-4 font-bold">{item.name}</td>
                    <td className="p-4 text-center uppercase text-xs">{item.unit}</td>
                    <td className="p-4 text-center">
                      <input type="number" value={item.quantity} className="w-16 border rounded text-center p-1" onChange={e => {
                          const nc = [...cart]; nc[i].quantity = Number(e.target.value); setCart(nc);
                      }}/>
                    </td>
                    <td className="p-4 text-center">₹{item.rate}</td>
                    <td className="p-4 text-center text-xs font-bold text-gray-400">{item.gstRate}%</td>
                    <td className="p-4 text-center">
                      <input type="number" value={item.discount} className="w-20 border rounded text-center p-1 font-bold" onChange={e => {
                          const nc = [...cart]; nc[i].discount = Number(e.target.value); setCart(nc);
                      }}/>
                    </td>
                    <td className="p-4 text-right font-bold">₹{item.netAmount?.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))}>
                        <Trash size={16} className="text-gray-300 hover:text-black"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Totals */}
          <div className="p-6 border-t flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-4 text-sm font-bold">
              <span>Bill Discount: 
                <input type="number" value={billDiscount} onChange={e => setBillDiscount(Number(e.target.value))} className="ml-2 border rounded p-1 w-20"/>
              </span>
              <span className="ml-4 text-gray-500 uppercase text-[10px]">Total Discount: ₹{calculatedTotals.totalDiscount.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-gray-400">Grand Total</p>
              <p className="text-4xl font-bold">₹{calculatedTotals.grand.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- INVOICE MODAL --- */}
      {showInvoice && (
        <div className="fixed inset-0 bg-white z-50 p-8 overflow-y-auto print:p-0">
          <div className="max-w-4xl mx-auto border border-black p-8">
            <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="font-bold uppercase text-xs tracking-widest border border-black px-2 py-1">Tax Invoice Preview</h2>
                <button onClick={() => setShowInvoice(null)} className="p-1 border border-black rounded"><X/></button>
            </div>

            <div className="flex justify-between items-start border-b border-black pb-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold uppercase leading-tight">{shopData?.shopName}</h1>
                    <p className="text-[10px] font-bold">AGRICULTURE SOLUTIONS & TRADING</p>
                    <p className="text-xs mt-2 max-w-xs leading-tight font-medium">Plot No 45, Industrial Area, Dhandhusar, Gujarat - 362001</p>
                    <p className="text-[10px] font-bold mt-1">GSTIN: 24AAABC0000A1Z5 | MOB: +91 98765 43210</p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold border border-black px-4 py-1 inline-block uppercase mb-4">Tax Invoice</div>
                    <p className="text-sm">Inv No: <span className="font-bold">{showInvoice.billNumber}</span></p>
                    <p className="text-sm">Date: <span className="font-bold">{new Date(showInvoice.date).toLocaleDateString('en-IN')}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
                <div className="border border-black p-3">
                    <p className="text-[9px] font-bold uppercase border-b border-black mb-2">Billed To:</p>
                    <p className="font-bold">{selectedCustomer?.name}</p>
                    <p>Phone: {selectedCustomer?.phone}</p>
                    <p className="text-gray-500 text-xs mt-1">{selectedCustomer?.address || "Gujarat, India"}</p>
                </div>
                <div className="border border-black p-3">
                    <p className="text-[9px] font-bold uppercase border-b border-black mb-2">Payment Details:</p>
                    <p>Method: <span className="font-bold">{showInvoice.paymentMode}</span></p>
                    <p>Status: <span className="font-bold uppercase">{showInvoice.paymentMode === 'Credit' ? 'Unpaid' : 'Paid'}</span></p>
                </div>
            </div>

            <table className="w-full border-collapse border border-black mb-6 text-sm font-medium">
                <thead>
                    <tr className="bg-gray-100 uppercase text-[10px] font-bold">
                        <th className="border border-black p-2 text-center">Sr</th>
                        <th className="border border-black p-2 text-left">Description</th>
                        <th className="border border-black p-2 text-center">Unit</th>
                        <th className="border border-black p-2 text-center">Qty</th>
                        <th className="border border-black p-2 text-center">Rate</th>
                        <th className="border border-black p-2 text-center">Disc.</th>
                        <th className="border border-black p-2 text-center">GST%</th>
                        <th className="border border-black p-2 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {showInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="border border-black p-2 text-center text-xs">{idx + 1}</td>
                            <td className="border border-black p-2 font-bold uppercase text-xs">{item.name}</td>
                            <td className="border border-black p-2 text-center uppercase text-[10px]">{item.unit}</td>
                            <td className="border border-black p-2 text-center font-bold text-xs">{item.quantity}</td>
                            <td className="border border-black p-2 text-center text-xs">{item.rate.toFixed(2)}</td>
                            <td className="border border-black p-2 text-center text-xs">{item.discount.toFixed(2)}</td>
                            <td className="border border-black p-2 text-center text-[10px] font-bold">{item.gstRate}%</td>
                            <td className="border border-black p-2 text-right font-bold text-xs">{item.netAmount.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="grid grid-cols-2 gap-8 text-sm font-bold">
                <div className="space-y-4">
                    <div className="border border-black p-3 bg-gray-50">
                        <p className="text-[8px] uppercase mb-1 font-bold">Total In Words:</p>
                        <p className="italic text-xs">{showInvoice.amountInWords}</p>
                    </div>
                    <div className="text-[8px] uppercase text-gray-400 font-bold leading-tight">
                        <p>1. Goods once sold will not be returned.</p>
                        <p>2. Subject to Junagadh Jurisdiction.</p>
                    </div>
                </div>
                <div className="border border-black border-t-0">
                    <div className="flex justify-between p-2 border-t border-black text-xs uppercase">
                        <span>Taxable Amount</span> <span>₹{showInvoice.totalTaxableValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 text-xs uppercase">
                        <span>GST Tax Amount</span> <span>₹{showInvoice.totalGST.toFixed(2)}</span>
                    </div>
                    {/* --- TOTAL DISCOUNT ROW --- */}
                    <div className="flex justify-between p-2 text-xs uppercase border-t border-dotted border-black">
                        <span>Total Savings</span> 
                        <span>-₹{(showInvoice.items.reduce((sum, i) => sum + i.discount, 0) + showInvoice.billDiscount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 border-t-2 border-black font-bold text-lg bg-gray-100 uppercase">
                        <span>Grand Total</span> <span>₹{showInvoice.grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-16 flex justify-between items-end">
                <div className="text-center w-40">
                    <div className="border-t border-black pt-1 uppercase text-[9px] font-bold">Receiver's Sign</div>
                </div>
                <div className="text-center w-56">
                    <p className="text-[8px] font-bold uppercase mb-8">For {shopData?.shopName}</p>
                    <div className="border-t border-black pt-1 uppercase text-[9px] font-bold">Authorized Signatory</div>
                </div>
            </div>

            <button onClick={() => window.print()} className="mt-8 w-full bg-black text-white py-4 font-bold uppercase tracking-widest print:hidden">
                Print Official Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}