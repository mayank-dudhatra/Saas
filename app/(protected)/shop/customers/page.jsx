// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import { useRouter } from 'next/navigation';
// import { UserPlus, Edit, Trash, Eye, X, Search, CreditCard, Printer, FileDown } from 'lucide-react';

// // --- Reusable Modal Component ---
// function Modal({ isOpen, onClose, title, children }) {
//   if (!isOpen) return null;
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
//       <div className="relative w-full max-w-lg p-6 bg-white rounded-lg shadow-xl m-4">
//         <div className="flex items-center justify-between pb-3 border-b">
//           <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
//           <button
//             onClick={onClose}
//             className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
//           >
//             <X size={20} />
//           </button>
//         </div>
//         <div className="mt-4">{children}</div>
//       </div>
//     </div>
//   );
// }

// // --- Reusable Input Component ---
// function FormInput({ label, name, value, onChange, placeholder, required = false, type = 'text' }) {
//   return (
//     <div>
//       <label htmlFor={name} className="block text-sm font-medium text-gray-700">
//         {label} {required && <span className="text-red-500">*</span>}
//       </label>
//       <input
//         type={type}
//         id={name}
//         name={name}
//         value={value}
//         onChange={onChange}
//         placeholder={placeholder}
//         required={required}
//         className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
//       />
//     </div>
//   );
// }

// export default function CustomersPage() {
//   const [customers, setCustomers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const router = useRouter();

//   // --- Modal States ---
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
//   const [selectedCustomer, setSelectedCustomer] = useState(null);
//   const [newPassword, setNewPassword] = useState('');

//   // --- Form State ---
//   const [formData, setFormData] = useState({
//     _id: '',
//     name: '',
//     phone: '',
//     address: '',
//     password: '',
//   });

//   // --- Fetch All Customers ---
//   const fetchCustomers = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch('/api/shop/customers');
//       if (!res.ok) {
//         throw new Error(await res.json().then(d => d.message));
//       }
//       const data = await res.json();
//       setCustomers(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCustomers();
//   }, []);

//   // --- Handle Form Input Change ---
//   const handleFormChange = (e) => {
//     // --- THIS LINE IS NOW FIXED ---
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // --- Add Customer Logic ---
//   const openAddModal = () => {
//     setFormData({ _id: '', name: '', phone: '', address: '', password: '' });
//     setError('');
//     setIsAddModalOpen(true);
//   };

//   const handleAddCustomer = async (e) => {
//     e.preventDefault();
//     setError('');
//     try {
//       const res = await fetch('/api/shop/customers', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });
      
//       const data = await res.json();
//       if (!res.ok) {
//         throw new Error(data.message);
//       }
      
//       // Show password modal
//       setNewPassword(data.initialPassword);
//       setIsPasswordModalOpen(true);

//       setIsAddModalOpen(false);
//       fetchCustomers(); // Refresh list
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   // --- Edit Customer Logic ---
//   const openEditModal = (customer) => {
//     setSelectedCustomer(customer);
//     setFormData({ ...customer });
//     setError('');
//     setIsEditModalOpen(true);
//   };

//   const handleEditCustomer = async (e) => {
//     e.preventDefault();
//     setError('');
//     try {
//       const res = await fetch(`/api/shop/customers/${selectedCustomer._id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });

//       if (!res.ok) {
//         throw new Error(await res.json().then(d => d.message));
//       }
      
//       setIsEditModalOpen(false);
//       fetchCustomers(); // Refresh list
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   // --- Delete Customer Logic ---
//   const openDeleteModal = (customer) => {
//     setSelectedCustomer(customer);
//     setError('');
//     setIsDeleteModalOpen(true);
//   };

//   const handleDeleteCustomer = async () => {
//     try {
//       const res = await fetch(`/api/shop/customers/${selectedCustomer._id}`, {
//         method: 'DELETE',
//       });

//       if (!res.ok) {
//         throw new Error(await res.json().then(d => d.message));
//       }
      
//       setIsDeleteModalOpen(false);
//       fetchCustomers(); // Refresh list
//     } catch (err) {
//       setError(err.message);
//     }
//   };
  
//   // --- View Customer Logic ---
//   const handleViewCustomer = (customerId) => {
//     // This will navigate to the detailed page we will build next
//     // router.push(`/shop/customers/${customerId}`);
//     alert(`View Customer (Coming Soon): ${customerId}`);
//   };

//   // --- Add Payment Logic (Stub) ---
//   const handleAddPayment = (customer) => {
//     alert(`Add Payment (Coming Soon) for: ${customer.name}`);
//   };

//   // --- Filtered Customers for Search ---
//   const filteredCustomers = useMemo(() => {
//     return customers.filter(
//       (customer) =>
//         customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         customer.phone.includes(searchTerm)
//     );
//   }, [customers, searchTerm]);

//   return (
//     <div>
//       <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
//       <p className="mt-2 text-gray-600">Add, view, edit, and manage all your shop's customers.</p>

//       {/* --- Header & Actions --- */}
//       <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
//         {/* Search Bar */}
//         <div className="relative w-full md:max-w-md">
//           <input
//             type="text"
//             placeholder="Search by name or phone..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
//           />
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
//         </div>
        
//         {/* Action Buttons */}
//         <div className="flex gap-2 w-full md:w-auto">
//           <button
//             onClick={() => alert('Exporting (Coming Soon)')}
//             className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
//           >
//             <FileDown size={18} />
//             Export
//           </button>
//           <button
//             onClick={openAddModal}
//             className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//           >
//             <UserPlus size={18} />
//             Add Customer
//           </button>
//         </div>
//       </div>

//       {/* --- Customer Table --- */}
//       <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance (₹)</th>
//                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {loading && (
//                 <tr>
//                   <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Loading customers...</td>
//                 </tr>
//               )}
//               {!loading && error && (
//                 <tr>
//                   <td colSpan="4" className="px-6 py-4 text-center text-red-500">{error}</td>
//                 </tr>
//               )}
//               {!loading && filteredCustomers.length === 0 && (
//                 <tr>
//                   <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No customers found.</td>
//                 </tr>
//               )}
//               {!loading && filteredCustomers.map((customer) => (
//                 <tr key={customer._id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm font-medium text-gray-900">{customer.name}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm text-gray-700">{customer.phone}</div>
//                     <div className="text-xs text-gray-500">{customer.address}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                       customer.balance > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
//                     }`}>
//                       {customer.balance.toFixed(2)}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-1">
//                     <button 
//                       onClick={() => handleAddPayment(customer)}
//                       className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full" 
//                       title="Add Payment"
//                     >
//                       <CreditCard size={18} />
//                     </button>
//                     <button 
//                       onClick={() => handleViewCustomer(customer._id)}
//                       className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full" 
//                       title="View Details"
//                     >
//                       <Eye size={18} />
//                     </button>
//                     <button 
//                       onClick={() => openEditModal(customer)}
//                       className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-full" 
//                       title="Edit Customer"
//                     >
//                       <Edit size={18} />
//                     </button>
//                     <button 
//                       onClick={() => openDeleteModal(customer)}
//                       className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full" 
//                       title="Delete Customer"
//                     >
//                       <Trash size={18} />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* --- Add Customer Modal --- */}
//       <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Customer">
//         <form onSubmit={handleAddCustomer} className="space-y-4">
//           <FormInput label="Name" name="name" value={formData.name} onChange={handleFormChange} placeholder="Full Name" required />
//           <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="10-digit phone number" required />
//           <FormInput label="Address" name="address" value={formData.address} onChange={handleFormChange} placeholder="City, State" />
//           <FormInput label="Password" name="password" value={formData.password} onChange={handleFormChange} placeholder="Leave blank to auto-generate" />
//           {error && <p className="text-sm text-red-600">{error}</p>}
//           <div className="flex justify-end gap-2 pt-4 border-t">
//             <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
//               Cancel
//             </button>
//             <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700">
//               Save Customer
//             </button>
//           </div>
//         </form>
//       </Modal>

//       {/* --- Edit Customer Modal --- */}
//       <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer">
//         <form onSubmit={handleEditCustomer} className="space-y-4">
//           <FormInput label="Name" name="name" value={formData.name} onChange={handleFormChange} placeholder="Full Name" required />
//           <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="10-digit phone number" required />
//           <FormInput label="Address" name="address" value={formData.address} onChange={handleFormChange} placeholder="City, State" />
//           {error && <p className="text-sm text-red-600">{error}</p>}
//           <div className="flex justify-end gap-2 pt-4 border-t">
//             <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
//               Cancel
//             </button>
//             <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700">
//               Update Customer
//             </button>
//           </div>
//         </form>
//       </Modal>

//       {/* --- Delete Confirmation Modal --- */}
//       <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Customer">
//         <p>Are you sure you want to delete <span className="font-bold">{selectedCustomer?.name}</span>?</p>
//         <p className="text-sm text-red-600">This action cannot be undone.</p>
//         {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
//         <div className="flex justify-end gap-2 pt-4 border-t mt-4">
//           <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
//             Cancel
//           </button>
//           <button type="button" onClick={handleDeleteCustomer} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">
//             Delete
//           </button>
//         </div>
//       </Modal>

//       {/* --- Show Initial Password Modal --- */}
//       <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Customer Created!">
//         <p>The customer has been created successfully. Please share this auto-generated password with them:</p>
//         <div className="my-4 p-3 text-center bg-gray-100 rounded-md">
//           <span className="text-lg font-bold text-green-700 tracking-wider">{newPassword}</span>
//         </div>
//         <p className="text-sm text-gray-600">They can use this password to log in with their phone number and your Shop ID.</p>
//         <div className="flex justify-end pt-4 border-t mt-4">
//           <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700">
//             Done
//           </button>
//         </div>
//       </Modal>

//     </div>
//   );
// }

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { UserPlus, Edit, Trash, Eye, X, Search, CreditCard, Printer, FileDown } from 'lucide-react';

// --- Reusable Modal Component ---
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg p-6 bg-white rounded-lg shadow-xl m-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

// --- Reusable Input Component ---
function FormInput({ label, name, value, onChange, placeholder, required = false, type = 'text' }) {
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
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
      />
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // --- Modal States ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // --- Form State ---
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    phone: '',
    address: '',
    password: '',
  });

  // --- Fetch All Customers ---
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/shop/customers');
      if (!res.ok) {
        throw new Error(await res.json().then(d => d.message));
      }
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // --- Handle Form Input Change ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Add Customer Logic ---
  const openAddModal = () => {
    setFormData({ _id: '', name: '', phone: '', address: '', password: '' });
    setIsAddModalOpen(true);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const loadingToastId = toast.loading('Creating customer...');
    
    try {
      const res = await fetch('/api/shop/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message);
      }
      
      toast.dismiss(loadingToastId);
      
      toast.success(
        <div>
          <p className="font-bold">Customer Created!</p>
          <p className="text-sm mt-1">
            Password: <strong className="font-mono text-green-700">{data.initialPassword}</strong>
          </p>
        </div>,
        { duration: 10000 } 
      );

      setIsAddModalOpen(false);
      fetchCustomers(); // Refresh list
    } catch (err) {
      toast.dismiss(loadingToastId);
      toast.error(err.message);
    }
  };

  // --- Edit Customer Logic ---
  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setFormData({ ...customer });
    setIsEditModalOpen(true);
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    const loadingToastId = toast.loading('Updating customer...');
    
    try {
      const res = await fetch(`/api/shop/customers/${selectedCustomer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(await res.json().then(d => d.message));
      }
      
      toast.dismiss(loadingToastId);
      toast.success('Customer updated successfully!');
      
      setIsEditModalOpen(false);
      fetchCustomers(); // Refresh list
    } catch (err) {
      toast.dismiss(loadingToastId);
      toast.error(err.message);
    }
  };

  // --- Delete Customer Logic ---
  const openDeleteModal = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCustomer = async () => {
    const loadingToastId = toast.loading('Deleting customer...');
    try {
      const res = await fetch(`/api/shop/customers/${selectedCustomer._id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(await res.json().then(d => d.message));
      }
      
      toast.dismiss(loadingToastId);
      toast.success('Customer deleted successfully.');
      
      setIsDeleteModalOpen(false);
      fetchCustomers(); // Refresh list
    } catch (err) {
      toast.dismiss(loadingToastId);
      toast.error(err.message);
    }
  };
  
  // --- Stubbed functions updated to use toast ---
  const handleViewCustomer = (customerId) => {
    toast('View details coming soon!', { icon: '👀' });
    // router.push(`/shop/customers/${customerId}`);
  };

  const handleAddPayment = (customer) => {
    toast('Add payment flow coming soon!', { icon: '💳' });
  };
  
  const handleExport = () => {
     toast('Exporting customers (Coming Soon)...', { icon: '↓' });
  };

  // --- Filtered Customers for Search ---
  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
      <p className="mt-2 text-gray-600">Add, view, edit, and manage all your shop's customers.</p>

      {/* --- Header & Actions --- */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>
        
        {/* Action Buttons */}
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
            Add Customer
          </button>
        </div>
      </div>

      {/* --- Customer Table --- */}
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance (₹)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Loading customers...</td>
                </tr>
              )}
              {/* Error row is no longer needed */}
              {!loading && filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No customers found.</td>
                </tr>
              )}
              {!loading && filteredCustomers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{customer.phone}</div>
                    <div className="text-xs text-gray-500">{customer.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.balance > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {customer.balance.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-1">
                    <button 
                      onClick={() => handleAddPayment(customer)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full" 
                      title="Add Payment"
                    >
                      <CreditCard size={18} />
                    </button>
                    <button 
                      onClick={() => handleViewCustomer(customer._id)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full" 
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => openEditModal(customer)}
                      className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-full" 
                      title="Edit Customer"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(customer)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full" 
                      title="Delete Customer"
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

      {/* --- Add Customer Modal --- */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Customer">
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <FormInput label="Name" name="name" value={formData.name} onChange={handleFormChange} placeholder="Full Name" required />
          <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="10-digit phone number" required />
          <FormInput label="Address" name="address" value={formData.address} onChange={handleFormChange} placeholder="City, State" />
          <FormInput label="Password" name="password" value={formData.password} onChange={handleFormChange} placeholder="Leave blank to auto-generate" />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700">
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* --- Edit Customer Modal --- */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer">
        <form onSubmit={handleEditCustomer} className="space-y-4">
          <FormInput label="Name" name="name" value={formData.name} onChange={handleFormChange} placeholder="Full Name" required />
          <FormInput label="Phone" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="10-digit phone number" required />
          <FormInput label="Address" name="address" value={formData.address} onChange={handleFormChange} placeholder="City, State" />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700">
              Update Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* --- Delete Confirmation Modal --- */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Customer">
        <p>Are you sure you want to delete <span className="font-bold">{selectedCustomer?.name}</span>?</p>
        <p className="text-sm text-red-600">This action cannot be undone.</p>
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleDeleteCustomer} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">
            Delete
          </button>
        </div>
      </Modal>
      
    </div>
  );
}