'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Edit, Trash, Eye, X, Search, CreditCard, FileDown, AlertCircle } from 'lucide-react';

// --- Reusable Modal Component (Unchanged) ---
function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]">
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

// --- Reusable Input Component (Unchanged) ---
function FormInput({ label, name, value, onChange, placeholder, required = false, type = 'text', maxLength, pattern }) {
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
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
      />
    </div>
  );
}

// --- Reusable Select Component (Unchanged) ---
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

export default function PartiesPage() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Modal States (Unchanged) ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);

  // --- Form State (Unchanged) ---
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    phone: '',
    address: '',
    email: '',
    gstin: '',
    gstType: 'Unregistered',
    openingBalance: 0,
  });

  // --- GSTIN Validation Logic (Unchanged) ---
  useEffect(() => {
    if (!isAddModalOpen && !isEditModalOpen) return;
    const gstin = formData.gstin.trim().toUpperCase();
    if (gstin.length === 15) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (gstinRegex.test(gstin)) {
        setFormData(prev => ({ ...prev, gstType: 'Registered' }));
      }
    } else if (gstin.length === 0) {
        setFormData(prev => ({ ...prev, gstType: 'Unregistered' }));
    }
  }, [formData.gstin, isAddModalOpen, isEditModalOpen]);


  // --- Fetch All Parties (Unchanged) ---
  const fetchParties = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/shop/parties');
      if (!res.ok) {
        throw new Error(await res.json().then(d => d.message));
      }
      const data = await res.json();
      setParties(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  // --- Handle Form Input Change (Unchanged) ---
  const handleFormChange = (e) => {
    let { name, value } = e.target;
    if (name === 'gstin') {
        value = value.toUpperCase();
    }
    // Handle openingBalance to allow empty string but store as 0
    if (name === 'openingBalance') {
        // Allow empty string for user input, but treat as 0 for parseFloat
        if (value === '') {
            setFormData((prev) => ({ ...prev, [name]: '' }));
            return;
        }
        value = parseFloat(value);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- CRUD Logic Functions (Unchanged) ---
  const openAddModal = () => {
    setFormData({
      _id: '', name: '', phone: '', address: '', email: '',
      gstin: '', gstType: 'Unregistered', openingBalance: 0,
    });
    setIsAddModalOpen(true);
  };

  const handleAddParty = async (e) => {
    e.preventDefault();
    const loadingToastId = toast.loading('Creating party...');
    try {
      const res = await fetch('/api/shop/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Ensure openingBalance is a number, defaulting empty string to 0
        body: JSON.stringify({
          ...formData,
          openingBalance: Number(formData.openingBalance) || 0
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.dismiss(loadingToastId);
      toast.success('Party created successfully!');
      setIsAddModalOpen(false);
      fetchParties();
    } catch (err) {
      toast.dismiss(loadingToastId);
      toast.error(err.message);
    }
  };

  const openEditModal = (party) => {
    setSelectedParty(party);
    // Ensure openingBalance is set from the party's current balance
    setFormData({ ...party, openingBalance: party.balance });
    setIsEditModalOpen(true);
  };

  const handleEditParty = async (e) => {
    e.preventDefault();
    const loadingToastId = toast.loading('Updating party...');
    try {
      const res = await fetch(`/api/shop/parties/${selectedParty._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), 
      });
      if (!res.ok) throw new Error(await res.json().then(d => d.message));
      toast.dismiss(loadingToastId);
      toast.success('Party updated successfully!');
      setIsEditModalOpen(false);
      fetchParties();
    } catch (err) {
      toast.dismiss(loadingToastId);
      toast.error(err.message);
    }
  };

  const openDeleteModal = (party) => {
    setSelectedParty(party);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteParty = async () => {
    const loadingToastId = toast.loading('Deleting party...');
    try {
      const res = await fetch(`/api/shop/parties/${selectedParty._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.json().then(d => d.message));
      toast.dismiss(loadingToastId);
      toast.success('Party deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchParties();
    } catch (err) {
      toast.dismiss(loadingToastId);
      toast.error(err.message, { duration: 5000 });
    }
  };
  
  const handleViewParty = (partyId) => toast('View party details (coming soon)!', { icon: '👀' });
  const handleAddPayment = (party) => toast(`Add payment for ${party.name} (coming soon)!`, { icon: '💳' });
  const handleExport = () => toast('Exporting parties (Coming Soon)...', { icon: '↓' });

  const filteredParties = useMemo(() => {
    return parties.filter(
      (party) =>
        party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.phone.includes(searchTerm) ||
        (party.gstin && party.gstin.includes(searchTerm.toUpperCase()))
    );
  }, [parties, searchTerm]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Party Management (Suppliers)</h1>
      <p className="mt-2 text-gray-600">Add, view, and manage your suppliers and other parties.</p>

      {/* --- Header & Actions (Unchanged) --- */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search by name, phone, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleExport}
            className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FileDown size={18} />
            Export
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <UserPlus size={18} />
            Add Party
          </button>
        </div>
      </div>

      {/* --- Parties Table --- */}
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance (₹)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Loading parties...</td>
                </tr>
              )}
              {!loading && filteredParties.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No parties found. Click "Add Party" to get started.
                  </td>
                </tr>
              )}
              {!loading && filteredParties.map((party) => (
                <tr key={party._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{party.name}</div>
                    <div className="text-xs text-gray-500">{party.address || 'No address'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{party.phone}</div>
                    <div className="text-xs text-gray-500">{party.email || 'No email'}</div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{party.gstin || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{party.gstType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* --- 1. FIRST FIX (in Table) --- */}
                    {/* Wrap `party.balance` in Number() to ensure it's a number */}
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      party.balance > 0 ? 'bg-green-100 text-green-800' // Positive (Party owes me) = Green
                      : party.balance < 0 ? 'bg-red-100 text-red-800' // Negative (I owe Party) = Red
                      : 'bg-gray-100 text-gray-800' // Zero = Neutral
                    }`}>
                      {Number(party.balance).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-1">
                    <button 
                      onClick={() => handleAddPayment(party)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full" 
                      title="Add Payment"
                    >
                      <CreditCard size={18} />
                    </button>
                    <button 
                      onClick={() => handleViewParty(party._id)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full" 
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => openEditModal(party)}
                      className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-full" 
                      title="Edit Party"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(party)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full" 
                      title="Delete Party"
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

      {/* --- Add Party Modal (Unchanged) --- */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Party/Supplier"
        footer={
          <>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" form="add-party-form" className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700">
              Save Party
            </button>
          </>
        }
      >
        <form id="add-party-form" onSubmit={handleAddParty} className="space-y-4">
          <FormInput label="Party Name" name="name" value={formData.name} onChange={handleFormChange} placeholder="Full Name or Business Name" required />
          <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="10-digit phone number" required maxLength={10} pattern="\d{10}" />
          <FormInput label="Email" name="email" value={formData.email} onChange={handleFormChange} placeholder="party@example.com" type="email" />
          <FormInput label="Address" name="address" value={formData.address} onChange={handleFormChange} placeholder="City, State" />
          <FormInput label="GSTIN" name="gstin" value={formData.gstin} onChange={handleFormChange} placeholder="15-digit GSTIN (Optional)" maxLength={15} />
          <FormSelect label="GST Type" name="gstType" value={formData.gstType} onChange={handleFormChange} disabled={formData.gstin.length === 15 || formData.gstin.length === 0}>
            <option value="Unregistered">Unregistered</option>
            <option value="Registered">Registered</option>
            <option value="Composition">Composition</option>
          </FormSelect>
          <FormInput label="Opening Balance (₹)" name="openingBalance" value={formData.openingBalance} onChange={handleFormChange} type="number" />
          <p className="text-xs text-gray-500 -mt-3">
            <b>Positive number:</b> Party owes you (e.g., Advance paid).
            <br/>
            <b>Negative number:</b> You owe the party (e.g., Old credit).
          </p>
        </form>
      </Modal>

      {/* --- Edit Party Modal --- */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Party/Supplier"
        footer={
          <>
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" form="edit-party-form" className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700">
              Update Party
            </button>
          </>
        }
      >
        <form id="edit-party-form" onSubmit={handleEditParty} className="space-y-4">
          <FormInput label="Party Name" name="name" value={formData.name} onChange={handleFormChange} placeholder="Full Name or Business Name" required />
          <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="10-digit phone number" required maxLength={10} pattern="\d{10}" />
          <FormInput label="Email" name="email" value={formData.email} onChange={handleFormChange} placeholder="party@example.com" type="email" />
          <FormInput label="Address" name="address" value={formData.address} onChange={handleFormChange} placeholder="City, State" />
          <FormInput label="GSTIN" name="gstin" value={formData.gstin} onChange={handleFormChange} placeholder="15-digit GSTIN (Optional)" maxLength={15} />
          <FormSelect label="GST Type" name="gstType" value={formData.gstType} onChange={handleFormChange} disabled={formData.gstin.length === 15 || formData.gstin.length === 0}>
            <option value="Unregistered">Unregistered</option>
            <option value="Registered">Registered</option>
            <option value="Composition">Composition</option>
          </FormSelect>
           <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div>
                        {/* --- 2. SECOND FIX (in Edit Modal) --- */}
                        {/* Wrap `formData.openingBalance` in Number() */}
                        <p className="text-sm text-yellow-700 font-semibold">
                            Balance: ₹{Number(formData.openingBalance).toFixed(2)}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          This balance cannot be edited. It only changes from new bills or payments.
                          <br/>
                          (Positive = Party owes you, Negative = You owe party)
                        </p>
                    </div>
                </div>
            </div>
        </form>
      </Modal>

      {/* --- Delete Confirmation Modal (Unchanged) --- */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Delete Party"
        footer={
          <>
            <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="button" onClick={handleDeleteParty} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete <span className="font-bold">{selectedParty?.name}</span>?</p>
        <p className="text-sm text-red-600">This action cannot be undone.</p>
      </Modal>
      
    </div>
  );
}