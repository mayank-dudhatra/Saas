'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, Trash, Printer, X, FileText, IndianRupee, Percent, Store, User, Package } from 'lucide-react';
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

  // Fetch initial data
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
      taxType: item.salePrice.taxType, // This is mandatory for the schema
      gstRate: gstRate,
      discount: 0
    }]);
  };

  const calculatedTotals = useMemo(() => {
    let taxable = 0;
    let totalGst = 0;

    const items = cart.map(item => {
      const baseVal = item.rate * item.quantity;
      const taxableAmount = Math.max(0, baseVal - Number(item.discount));
      const gstAmount = item.taxType === 'exclusive' ? (taxableAmount * item.gstRate) / 100 : 0;
      
      taxable += taxableAmount;
      totalGst += gstAmount;

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
    
    return { items, taxable, totalGst, gross, grand, roundOff: grand - gross };
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
      console.error("Save Error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* 1. Header & Actions */}
      <header className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
        <h1 className="text-xl font-black flex items-center gap-2 text-green-700">
          <FileText size={24}/> BILLING / POS
        </h1>
        <div className="flex gap-4">
          <select 
            className="border-2 border-gray-100 rounded-md px-3 py-1 font-bold text-sm focus:border-green-500 outline-none"
            value={paymentMode} 
            onChange={e => setPaymentMode(e.target.value)}
          >
            <option value="Cash">Cash Sale</option>
            <option value="Online">Online / UPI</option>
            <option value="Credit">Credit (Udhaar)</option>
          </select>
          <button 
            onClick={handleSave} 
            className="bg-green-600 text-white px-8 py-2 rounded-md font-black hover:bg-green-700 shadow-lg transition-all active:scale-95"
          >
            SAVE & PRINT
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
        {/* 2. Selection Sidebar */}
        <div className="lg:col-span-1 space-y-4 flex flex-col overflow-hidden">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</label>
            <select 
              className="w-full border-2 border-gray-50 p-2 rounded mt-1 font-bold text-sm"
              onChange={e => setSelectedCustomer(customers.find(c => c._id === e.target.value))}
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
            </select>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Inventory</label>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {inventory.map(item => (
                <button 
                  key={item._id} 
                  onClick={() => addToCart(item)}
                  className="w-full text-left p-3 border rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex justify-between items-center group"
                >
                  <div>
                    <p className="font-bold text-sm group-hover:text-green-700">{item.name}</p>
                    <p className="text-[10px] text-gray-400">Stock: {item.stockQuantity} {item.unit.baseUnit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-black text-sm">₹{item.salePrice.amount}</p>
                    <p className="text-[9px] text-gray-400 uppercase">{item.salePrice.taxType}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Main Bill Table */}
        <div className="lg:col-span-3 bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-white sticky top-0 z-10">
                <tr className="uppercase text-[10px] tracking-wider">
                  <th className="p-4 text-left">Item Description</th>
                  <th className="p-4 text-center">Qty</th>
                  <th className="p-4 text-center">Rate</th>
                  <th className="p-4 text-center">Discount (₹)</th>
                  <th className="p-4 text-center">GST%</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cart.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-black text-gray-800">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">HSN: {item.hsnCode}</p>
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        value={item.quantity} 
                        className="w-16 border-2 border-gray-100 rounded text-center p-1 font-bold"
                        onChange={e => {
                          const nc = [...cart]; 
                          nc[i].quantity = Number(e.target.value); 
                          setCart(nc);
                        }}
                      />
                    </td>
                    <td className="p-4 text-center font-bold">₹{item.rate}</td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        placeholder="0" 
                        className="w-20 border-2 border-red-50 rounded text-center p-1 text-red-600 font-bold focus:border-red-300 outline-none" 
                        value={item.discount} 
                        onChange={e => {
                          const nc = [...cart]; 
                          nc[i].discount = Number(e.target.value); 
                          setCart(nc);
                        }}
                      />
                    </td>
                    <td className="p-4 text-center text-xs font-bold text-gray-500">{item.gstRate}%</td>
                    <td className="p-4 text-right font-black text-gray-900">₹{item.netAmount?.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))}>
                        <Trash size={16} className="text-red-300 hover:text-red-600 transition-colors"/>
                      </button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-20 text-center text-gray-300">
                      <div className="flex flex-col items-center gap-2">
                        <Package size={48} className="opacity-20"/>
                        <p className="font-bold uppercase tracking-widest text-xs">Your cart is empty</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Bottom Calculations Panel */}
          <div className="p-6 bg-gray-50 border-t grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex items-center gap-4">
               <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-center gap-4">
                  <div className="bg-red-500 p-2 rounded text-white"><Percent size={16}/></div>
                  <div>
                    <label className="text-[10px] font-black text-red-400 uppercase block">Extra Bill Discount</label>
                    <input 
                      type="number" 
                      value={billDiscount} 
                      onChange={e => setBillDiscount(Number(e.target.value))} 
                      className="bg-transparent border-b-2 border-red-200 w-32 font-black text-red-600 text-xl outline-none focus:border-red-500"
                    />
                  </div>
               </div>
            </div>
            
            <div className="space-y-2 text-right">
              <div className="flex justify-between text-xs text-gray-500 font-bold px-2">
                <span>TOTAL TAXABLE:</span> <span>₹{calculatedTotals.taxable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 font-bold px-2">
                <span>TOTAL GST:</span> <span>₹{calculatedTotals.totalGst.toFixed(2)}</span>
              </div>
              <div className="bg-green-600 text-white p-4 rounded-xl shadow-lg inline-block min-w-[300px] text-left transform hover:scale-105 transition-transform cursor-pointer">
                <p className="text-[10px] font-black uppercase opacity-70 tracking-tighter">Grand Total Payable</p>
                <div className="flex justify-between items-baseline">
                  <span className="text-4xl font-black">₹{calculatedTotals.grand.toFixed(2)}</span>
                  <span className="text-[10px] font-bold opacity-80 italic">Incl. All Taxes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PROFESSIONAL INVOICE MODAL */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl p-10 relative shadow-2xl print:p-0 print:shadow-none my-auto">
             <button 
                onClick={() => setShowInvoice(null)} 
                className="absolute top-6 right-6 print:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
             >
                <X size={24} className="text-gray-400"/>
             </button>
             
             {/* Section 1: Business Details (Header) */}
             <div className="flex justify-between border-b-4 border-green-600 pb-8 mb-8">
                <div className="flex gap-6 items-center">
                  <div className="bg-green-600 p-4 rounded-2xl shadow-inner">
                    {shopData?.shopLogoUrl ? (
                      <img src={shopData.shopLogoUrl} className="h-16 w-16 object-cover rounded-lg" />
                    ) : (
                      <Store className="text-white h-12 w-12"/>
                    )}
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-gray-800 tracking-tighter uppercase">{shopData?.shopName}</h2>
                    <p className="text-xs font-black text-green-600 uppercase tracking-[0.2em] mb-1">Advanced Agriculture Solutions</p>
                    <p className="text-[11px] text-gray-400 font-bold max-w-xs leading-tight">
                      Plot No 45, Industrial Area, Dhandhusar, Gujarat - 362001
                    </p>
                    <div className="flex gap-4 mt-2">
                       <span className="text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded font-black">GSTIN: 24AAABC0000A1Z5</span>
                       <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-black">MOB: +91 98765 43210</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-center">
                  <div className="bg-gray-800 text-white px-4 py-1 text-[10px] font-black inline-block rounded-full mb-3 uppercase tracking-widest ml-auto">Tax Invoice</div>
                  <h3 className="text-3xl font-black text-gray-800">#{showInvoice.billNumber}</h3>
                  <p className="text-sm font-black text-gray-400">DATE: {new Date(showInvoice.date).toLocaleDateString('en-IN')}</p>
                </div>
             </div>

             {/* Section 2: Customer Details & Invoice Metadata */}
             <div className="grid grid-cols-2 gap-10 mb-8">
                <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest flex items-center gap-2">
                    <User size={12}/> Bill To Customer
                  </p>
                  <p className="text-2xl font-black text-gray-800">{selectedCustomer?.name}</p>
                  <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-2">
                    <span>Phone:</span> <span className="text-gray-800">{selectedCustomer?.phone}</span>
                  </p>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">{selectedCustomer?.address || "Dhandhusar, Junagadh"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 text-center flex flex-col justify-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Mode</p>
                    <p className="text-lg font-black text-gray-800">{showInvoice.paymentMode}</p>
                  </div>
                  <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 text-center flex flex-col justify-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <p className={`text-lg font-black uppercase ${showInvoice.paymentMode === 'Credit' ? 'text-red-600' : 'text-green-600'}`}>
                      {showInvoice.paymentMode === 'Credit' ? 'Unpaid' : 'Paid'}
                    </p>
                  </div>
                </div>
             </div>

             {/* Section 3: Item Table */}
             <div className="border-2 border-gray-800 rounded-2xl overflow-hidden mb-10">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-white uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-4 text-left">Sr.</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-center">HSN</th>
                      <th className="p-4 text-center">Qty</th>
                      <th className="p-4 text-center">Rate</th>
                      <th className="p-4 text-center">Tax %</th>
                      <th className="p-4 text-right">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-50">
                    {showInvoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-4 text-gray-400 font-bold">{idx+1}</td>
                        <td className="p-4 font-black text-gray-800">
                          {item.name}
                          {item.discount > 0 && <span className="ml-2 text-[9px] bg-red-100 text-red-600 px-1 rounded">Disc. ₹{item.discount}</span>}
                        </td>
                        <td className="p-4 text-center text-gray-400 font-mono text-xs">{item.hsnCode}</td>
                        <td className="p-4 text-center font-black">{item.quantity} {item.unit}</td>
                        <td className="p-4 text-center font-bold">₹{item.rate}</td>
                        <td className="p-4 text-center text-gray-500 font-bold">{item.gstRate}%</td>
                        <td className="p-4 text-right font-black text-gray-900">₹{item.netAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>

             {/* Section 4: Totals & Summary */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  {/* Tax Summary Box */}
                  <div className="p-5 bg-gray-50 rounded-2xl border-2 border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">GST Tax Breakdown</p>
                    <div className="grid grid-cols-3 text-[10px] font-black text-gray-400 border-b pb-2 mb-2">
                       <span>TAXABLE VALUE</span><span>CGST (50%)</span><span>SGST (50%)</span>
                    </div>
                    <div className="grid grid-cols-3 text-sm font-black text-gray-800">
                       <span>₹{showInvoice.totalTaxableValue.toFixed(2)}</span>
                       <span>₹{showInvoice.totalCGST.toFixed(2)}</span>
                       <span>₹{showInvoice.totalSGST.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Amount in Words */}
                  <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-100">
                    <p className="text-[9px] font-black text-green-400 uppercase mb-1 tracking-widest">Amount in Words</p>
                    <p className="text-sm font-black text-green-800 italic leading-tight">
                      {showInvoice.amountInWords}
                    </p>
                  </div>
                </div>

                {/* Final Calculations Box */}
                <div className="bg-gray-800 rounded-3xl p-8 text-white shadow-2xl space-y-4">
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span>Sub-Total</span><span>₹{showInvoice.totalTaxableValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span>Integrated GST</span><span>₹{showInvoice.totalGST.toFixed(2)}</span>
                  </div>
                  {showInvoice.billDiscount > 0 && (
                    <div className="flex justify-between text-xs font-bold text-red-400 uppercase tracking-widest">
                      <span>Extra Discount</span><span>-₹{showInvoice.billDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest pb-4 border-b border-gray-700">
                    <span>Round-Off</span><span>₹{showInvoice.roundOff.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-black uppercase text-green-400 tracking-[0.3em]">Total Payable</span>
                    <span className="text-5xl font-black text-green-400 tracking-tighter">
                      <span className="text-xl align-top mr-1">₹</span>
                      {showInvoice.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
             </div>

             {/* Section 5: Footer & Signatures */}
             <div className="mt-16 grid grid-cols-3 gap-10 pt-10 border-t-2 border-gray-50 items-end">
                <div className="col-span-2">
                  <h4 className="text-[10px] font-black text-gray-800 uppercase mb-3 tracking-widest">Declaration & Terms</h4>
                  <ul className="text-[10px] text-gray-400 font-bold space-y-1 leading-relaxed">
                    <li>1. We declare that this invoice shows the actual price of the goods described.</li>
                    <li>2. All items sold are subject to local market jurisdiction only.</li>
                    <li>3. Goods once sold will not be returned under any circumstances.</li>
                    <li>4. This is a computer-generated tax invoice and does not require a physical signature.</li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="h-20 flex items-center justify-center opacity-10 grayscale select-none mb-3">
                    <Store size={64}/>
                  </div>
                  <div className="border-t-2 border-gray-800 pt-2">
                    <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Authorized Signatory</p>
                    <p className="text-[9px] text-gray-400 font-bold">FOR {shopData?.shopName?.toUpperCase()}</p>
                  </div>
                </div>
             </div>

             {/* Print Button */}
             <div className="mt-12 flex gap-4 print:hidden">
                <button 
                  onClick={() => window.print()} 
                  className="flex-1 bg-green-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-4 shadow-xl shadow-green-200 hover:bg-green-700 hover:-translate-y-1 transition-all active:scale-95"
                >
                  <Printer size={24}/> PRINT OFFICIAL TAX INVOICE
                </button>
             </div>
          </div>
        </div>
      )}
      
      {/* Scrollbar CSS */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}