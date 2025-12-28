'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, FileDown, X, Edit, Trash, Image as ImageIcon, Package, AlertCircle, IndianRupee } from 'lucide-react';

// --- Helper: Calculate Price Including GST ---
const calculatePriceWithGst = (priceObj, gstSlab) => {
  const amount = Number(priceObj?.amount) || 0;
  // If the price is already inclusive, just return the amount
  if (priceObj?.taxType === 'inclusive') return amount;
  
  // Extract numeric rate from slab strings like "GST@18%" or "IGST@12%"
  const match = gstSlab?.match(/@(\d+(\.\d+)?)%/);
  const rate = match ? parseFloat(match[1]) : 0;
  
  // Final Price = Base Amount + (Base Amount * GST Rate / 100)
  return amount + (amount * rate) / 100;
};

// --- Reusable Modal Component (Unchanged) ---
function Modal({ isOpen, onClose, title, children, footer, size = 'max-w-3xl' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className={`relative w-full ${size} bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Reusable FormInput Component (list prop removed) ---
function FormInput({ label, name, value, onChange, placeholder, required = false, type = 'text', maxLength, pattern, min, step, onFocus, onBlur, autoComplete = "off" }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        pattern={pattern}
        min={min}
        step={step}
        onFocus={onFocus} // Added
        onBlur={onBlur}   // Added
        autoComplete={autoComplete} // Added
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
      />
    </div>
  );
}

// --- Reusable FormSelect Component (Unchanged) ---
function FormSelect({ label, name, value, onChange, children, required = false, disabled = false }) {
    return (
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${disabled ? 'bg-gray-100' : ''}`}
        >
          {children}
        </select>
      </div>
    );
}

// --- Constants (Unchanged) ---
const UNITS_LIST = [
  'Pieces (pcs)', 'Bags', 'Box', 'Bottles', 'Bundle', 'Cartons', 'Cans', 'Dozen', 
  'Grams (g)', 'Kilograms (kg)', 'Liters (l)', 'Milliliters (ml)', 'Meters (m)', 'Packets', 'Rolls', 'Set'
];

const GST_SLABS = [
  'GST@0%', 'IGST@0%', 'GST@0.1%', 'IGST@0.1%', 'GST@0.25%', 'IGST@0.25%', 'GST@1%', 'IGST@1%',
  'GST@1.5%', 'IGST@1.5%', 'GST@3%', 'IGST@3%', 'GST@5%', 'IGST@5%', 'GST@6%', 'IGST@6%',
  'GST@12%', 'IGST@12%', 'GST@18%', 'IGST@18%', 'GST@28%', 'IGST@28%', 'GST@40%', 'IGST@40%',
  'Exempted', 'Non-GST Supply'
];

const INITIAL_FORM_DATA = {
  name: '',
  hsnCode: '',
  category: '',
  unit: {
    baseUnit: 'Pieces (pcs)',
    secondaryUnit: '',
    conversionFactor: 1,
  },
  stockQuantity: 0,
  lowStockAlertLevel: 0,
  purchasePrice: {
    amount: '',
    taxType: 'exclusive',
  },
  salePrice: {
    amount: '',
    taxType: 'exclusive',
  },
  gstSlab: 'GST@0%',
  imageUrl: '',
  expiryDate: '',
};

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  
  // For image upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- NEW: State for custom dropdowns ---
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [isNameFocused, setIsNameFocused] = useState(false);
  
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [isCategoryFocused, setIsCategoryFocused] = useState(false);
  // ---

  // Memoized list of unique categories
  const categories = useMemo(() => {
    const categorySet = new Set(items.map(item => item.category).filter(Boolean));
    return [...categorySet].sort();
  }, [items]);

  // --- Fetch All Items (Unchanged) ---
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/shop/inventory');
      if (!res.ok) {
        throw new Error(await res.json().then(d => d.message));
      }
      const data = await res.json();
      setItems(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- Form Handlers ---
  
  // General handler for simple inputs
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested state
    if (name.includes('.')) {
      const [outerKey, innerKey] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [outerKey]: {
          ...prev[outerKey],
          [innerKey]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // --- NEW: Category suggestion logic ---
    if (name === 'category') {
      if (value) {
        setCategorySuggestions(
          categories.filter(cat => cat.toLowerCase().includes(value.toLowerCase()))
        );
      } else {
        setCategorySuggestions(categories); // Show all if empty
      }
    }
    // ---
  };

  // --- NEW: Specific handler for Item Name ---
  const handleNameChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, name: value }));

    if (value) {
      setNameSuggestions(
        items.filter(item => item.name.toLowerCase().includes(value.toLowerCase()))
      );
    } else {
      setNameSuggestions([]); // Don't show all items if empty
    }
  };

  // --- NEW: Function to handle selecting a name suggestion ---
  const selectNameSuggestion = (item) => {
    toast.success(`Copied details from "${item.name}"`);
    setFormData({
      ...item, // Copy all details
      _id: undefined, // Remove ID
      stockQuantity: 0, // Reset stock
      // Convert low stock from base unit back to purchase unit for display
      lowStockAlertLevel: (item.lowStockAlertLevel / (item.unit.conversionFactor || 1)) || 0,
      name: item.name, // Ensure the selected name is set
    });
    setImagePreview(item.imageUrl || null);
    setImageFile(null);
    setNameSuggestions([]);
    setIsNameFocused(false);
  };
  
  // --- NEW: Function to handle selecting a category suggestion ---
  const selectCategorySuggestion = (category) => {
    setFormData(prev => ({ ...prev, category: category }));
    setCategorySuggestions([]);
    setIsCategoryFocused(false);
  };
  
  // --- NEW: Focus and Blur handlers ---
  const handleNameFocus = () => setIsNameFocused(true);
  const handleNameBlur = () => {
    // Delay blur to allow click on suggestion
    setTimeout(() => setIsNameFocused(false), 150);
  };
  
  const handleCategoryFocus = () => {
    setIsCategoryFocused(true);
    // Show all categories if input is empty
    if (!formData.category) {
      setCategorySuggestions(categories);
    }
  };
  const handleCategoryBlur = () => {
    setTimeout(() => setIsCategoryFocused(false), 150);
  };
  // ---

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const openAddModal = () => {
    setFormData(INITIAL_FORM_DATA);
    setImageFile(null);
    setImagePreview(null);
    setIsUploading(false);
    setNameSuggestions([]);
    setCategorySuggestions([]);
    setIsAddModalOpen(true);
  };
  
  const uploadImage = async () => {
    if (!imageFile) return null;
    setIsUploading(true);
    try {
      const sigRes = await fetch('/api/cloudinary/sign-upload', { method: 'POST' });
      if (!sigRes.ok) throw new Error('Failed to get upload signature.');
      const { signature, timestamp, apiKey, cloudName } = await sigRes.json();
      
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const uploadRes = await fetch(uploadUrl, { method: 'POST', body: formData });
      
      if (!uploadRes.ok) throw new Error('Cloudinary upload failed.');
      const uploadData = await uploadRes.json();
      return uploadData.secure_url;
    } catch (err) {
      toast.error(`Image upload failed: ${err.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // --- Add Item Submit Logic (Updated) ---
const handleAddItem = async (e) => {
    e.preventDefault();
    const loadingToastId = toast.loading('Processing...');
    
    try {
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        toast.loading('Uploading item image...', { id: loadingToastId });
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          toast.dismiss(loadingToastId);
          return; 
        }
        finalImageUrl = uploadedUrl;
      }
      
      toast.loading('Saving item to inventory...', { id: loadingToastId });
      
      const bodyToSend = {
        ...formData,
        imageUrl: finalImageUrl,
        stockQuantity: Number(formData.stockQuantity) || 0,
        lowStockAlertLevel: Number(formData.lowStockAlertLevel) || 0,
      };

      const res = await fetch('/api/shop/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyToSend),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Item created successfully!', { id: loadingToastId });
      setIsAddModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.message, { id: loadingToastId });
    }
  };
  
  // --- Filtered Items (Unchanged) ---
  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.hsnCode && item.hsnCode.includes(searchTerm)) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm]);
  
  // (Unchanged)
  const isGstRequired = formData.purchasePrice.taxType === 'exclusive' || formData.salePrice.taxType === 'exclusive';
  useEffect(() => {
    if (!isGstRequired) {
      setFormData(prev => ({ ...prev, gstSlab: 'GST@0%' }));
    }
  }, [isGstRequired]);
  
  // (Updated)
  const stockUnitLabel = formData.unit.secondaryUnit || formData.unit.baseUnit;
  const conversionLabel = `1 ${formData.unit.secondaryUnit || 'Secondary'} = ? ${formData.unit.baseUnit}`;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Inventory & Product Management</h1>
      <p className="mt-2 text-gray-600">Manage your product catalog, stock levels, and inventory here.</p>

      {/* --- Header & Actions (Unchanged) --- */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search by name, HSN, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => toast('Exporting (Coming Soon)', { icon: '↓' })}
            className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FileDown size={18} />
            Export
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus size={18} />
            Add New Item
          </button>
        </div>
      </div>

      {/* --- Item Table (Unchanged) --- */}
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock (In Base Unit)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Price (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price (₹)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Loading items...</td>
                </tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No items found. Click "Add New Item" to get started.
                  </td>
                </tr>
              )}
              {!loading && filteredItems.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {item.imageUrl ? (
                          <img className="h-10 w-10 rounded-md object-cover" src={item.imageUrl} alt={item.name} />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                            <Package size={20} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.category || 'No Category'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${item.stockQuantity <= item.lowStockAlertLevel ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                      {item.stockQuantity}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">{item.unit.baseUnit}</span>
                  </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
  ₹{calculatePriceWithGst(item.salePrice, item.gstSlab).toFixed(2)}
  <span className="text-[10px] text-gray-400 block font-normal">(Incl. GST)</span>
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
  ₹{calculatePriceWithGst(item.purchasePrice, item.gstSlab).toFixed(2)}
  <span className="text-[10px] text-gray-400 block font-normal">(Incl. GST)</span>
</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-1">
                    <button 
                      onClick={() => toast.error('Edit not implemented')}
                      className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-full" 
                      title="Edit Item"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => toast.error('Delete not implemented')}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full" 
                      title="Delete Item"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Add Item Modal (UPDATED with custom dropdowns) --- */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Item"
        size="max-w-4xl"
        footer={
          <>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" form="add-item-form" disabled={isUploading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50">
              {isUploading ? 'Uploading Image...' : 'Save Item'}
            </button>
          </>
        }
      >
        <form id="add-item-form" onSubmit={handleAddItem} className="space-y-6">
          
          {/* --- Basic Info --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* --- UPDATED: Item Name Input --- */}
            <div className="md:col-span-2 relative">
              <FormInput 
                label="Item Name" 
                name="name" 
                value={formData.name} 
                onChange={handleNameChange} 
                placeholder="Type or select existing item" 
                required 
                onFocus={handleNameFocus}
                onBlur={handleNameBlur}
              />
              {isNameFocused && nameSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {nameSuggestions.map(item => (
                    <li 
                      key={item._id} 
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      onMouseDown={() => selectNameSuggestion(item)} // Use onMouseDown to fire before blur
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* --- UPDATED: Category Input --- */}
            <div className="relative">
              <FormInput 
                label="Item Category" 
                name="category" 
                value={formData.category} 
                onChange={handleFormChange} 
                placeholder="Type or select category" 
                onFocus={handleCategoryFocus}
                onBlur={handleCategoryBlur}
              />
              {isCategoryFocused && categorySuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {categorySuggestions.map(category => (
                    <li 
                      key={category} 
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      onMouseDown={() => selectCategorySuggestion(category)}
                    >
                      {category}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <FormInput label="HSN Code" name="hsnCode" value={formData.hsnCode} onChange={handleFormChange} placeholder="e.g., 08081000" />
            <FormInput label="Expiry Date" name="expiryDate" value={formData.expiryDate} onChange={handleFormChange} type="date" />
          </div>

          <hr />

          {/* --- Units & Stock (UPDATED LABELS) --- */}
          <div>
            <h4 className="text-md font-medium text-gray-800">Units & Stock</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
              <FormSelect label="Base Unit (Smallest Unit)" name="unit.baseUnit" value={formData.unit.baseUnit} onChange={handleFormChange} required>
                {UNITS_LIST.map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </FormSelect>
              
              <FormSelect label="Secondary Unit (Purchase Unit)" name="unit.secondaryUnit" value={formData.unit.secondaryUnit} onChange={handleFormChange}>
                <option value="">None</option>
                {UNITS_LIST.map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </FormSelect>

              <FormInput 
                label="Conversion" 
                name="unit.conversionFactor" 
                value={formData.unit.conversionFactor} 
                onChange={handleFormChange} 
                type="number" 
                min="1" 
                step="any" 
                disabled={!formData.unit.secondaryUnit} 
                placeholder={conversionLabel} 
              />
              
              <FormInput 
                label={`Opening Stock (in ${stockUnitLabel})`}
                name="stockQuantity" 
                value={formData.stockQuantity} 
                onChange={handleFormChange} 
                type="number" min="0" step="any" required 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <FormInput 
                label={`Low Stock Alert (in ${stockUnitLabel})`}
                name="lowStockAlertLevel" 
                value={formData.lowStockAlertLevel} 
                onChange={handleFormChange} 
                type="number" min="0" step="any" 
                placeholder={`e.g., 10`}
              />
            </div>
          </div>
          
          <hr />

          {/* --- Pricing (UPDATED GST SLAB) --- */}
          <div>
            <h4 className="text-md font-medium text-gray-800">Pricing & Tax</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
              
{/* --- Purchase Price Section --- */}
<div className="space-y-2 p-3 bg-gray-50 rounded-md border">
  <FormInput 
    label="Purchase Price (₹)" 
    name="purchasePrice.amount" 
    value={formData.purchasePrice.amount} 
    onChange={handleFormChange} 
    type="number" 
    min="0" 
    step="0.01" 
    required 
  />
  
  {/* NEW: Final Purchase Price Preview */}
  <div className="text-xs font-bold text-blue-600 px-1">
    Total Incl. GST: ₹{calculatePriceWithGst(formData.purchasePrice, formData.gstSlab).toFixed(2)}
  </div>

  <div className="flex gap-4 pt-2">
    <label className="flex items-center gap-2 text-sm">
      <input 
        type="radio" 
        name="purchasePrice.taxType" 
        value="exclusive" 
        checked={formData.purchasePrice.taxType === 'exclusive'} 
        onChange={handleFormChange} 
      />
      Excluding GST
    </label>
    <label className="flex items-center gap-2 text-sm">
      <input 
        type="radio" 
        name="purchasePrice.taxType" 
        value="inclusive" 
        checked={formData.purchasePrice.taxType === 'inclusive'} 
        onChange={handleFormChange} 
      />
      Including GST
    </label>
  </div>
</div>

{/* --- Sale Price Section --- */}
<div className="space-y-2 p-3 bg-gray-50 rounded-md border">
  <FormInput 
    label="Sale Price (₹)" 
    name="salePrice.amount" 
    value={formData.salePrice.amount} 
    onChange={handleFormChange} 
    type="number" 
    min="0" 
    step="0.01" 
    required 
  />
  
  {/* NEW: Final Sale Price Preview */}
  <div className="text-xs font-bold text-green-600 px-1">
    Total Incl. GST: ₹{calculatePriceWithGst(formData.salePrice, formData.gstSlab).toFixed(2)}
  </div>

  <div className="flex gap-4 pt-2">
    <label className="flex items-center gap-2 text-sm">
      <input 
        type="radio" 
        name="salePrice.taxType" 
        value="exclusive" 
        checked={formData.salePrice.taxType === 'exclusive'} 
        onChange={handleFormChange} 
      />
      Excluding GST
    </label>
    <label className="flex items-center gap-2 text-sm">
      <input 
        type="radio" 
        name="salePrice.taxType" 
        value="inclusive" 
        checked={formData.salePrice.taxType === 'inclusive'} 
        onChange={handleFormChange} 
      />
      Including GST
    </label>
  </div>
</div>

              <div className="space-y-2 p-3 rounded-md">
                <FormSelect label="GST Slab" name="gstSlab" value={formData.gstSlab} onChange={handleFormChange} disabled={!isGstRequired}>
                  {GST_SLABS.map(slab => <option key={slab} value={slab}>{slab}</option>)}
                </FormSelect>
                {!isGstRequired && (
                  <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                    <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">GST Slab set to 'GST@0%' because prices are tax inclusive.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <hr />

          {/* --- Image Upload (Unchanged) --- */}
          <div>
            <h4 className="text-md font-medium text-gray-800">Item Image</h4>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-md border border-gray-300 bg-gray-50">
                {imagePreview ? (
                  <img src={imagePreview} alt="Item preview" className="h-full w-full object-cover rounded-md" />
                ) : formData.imageUrl ? (
                   <img src={formData.imageUrl} alt="Current item" className="h-full w-full object-cover rounded-md" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleImageFileChange}
                className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-green-50 file:text-green-700
                          hover:file:bg-green-100"
              />
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}