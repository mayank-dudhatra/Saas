'use client'; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store } from 'lucide-react'; 
// --- 1. Import the context hook ---
import { useShopData } from '../ShopDataContext';

// --- 2. Remove the {shopData} prop ---
export default function SettingsPage() {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null); 
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // --- 3. Get data AND the setter function from context ---
    const { shopData, setShopData } = useShopData();

    // 4. Get the current logo URL directly from the context's state
    const currentLogoUrl = shopData?.shopLogoUrl;

    const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        setFile(selectedFile);
        setError('');
        setPreviewUrl(URL.createObjectURL(selectedFile));
      }
    };

    const handleUploadSubmit = async (e) => {
      e.preventDefault();
      if (!file) {
        setError("Please select a file to upload.");
        return;
      }

      setLoading(true);
      setMessage('');
      setError('');

      try {
        // --- STAGE 1: Get Signature (no change) ---
        const sigRes = await fetch('/api/cloudinary/sign-upload', { method: 'POST' });
        if (!sigRes.ok) throw new Error(await sigRes.json().then(d => d.message));
        const { signature, timestamp, apiKey, cloudName } = await sigRes.json();
        
        // --- STAGE 2: Upload File to Cloudinary (no change) ---
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const uploadRes = await fetch(uploadUrl, { method: 'POST', body: formData });
        
        if (!uploadRes.ok) throw new Error(await uploadRes.json().then(d => d.error.message));
        const uploadData = await uploadRes.json();
        const logoUrl = uploadData.secure_url;

        // --- STAGE 3: Save the new URL to our Database (no change) ---
        const saveRes = await fetch('/api/shop/settings/update-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logoUrl: logoUrl }),
        });
        
        if (!saveRes.ok) throw new Error(await saveRes.json().then(d => d.message));

        // --- THIS IS THE FIX ---
        // 5. Manually update the global context state.
        //    This will instantly update this page AND the sidebar.
        setShopData(prevData => ({
          ...prevData,
          shopLogoUrl: logoUrl
        }));
        // --- END FIX ---

        setMessage("Logo updated successfully!");
        setFile(null);
        setPreviewUrl(null);
        e.target.reset(); 
        
        // 6. We still call router.refresh() to ensure the server-side
        //    data is up-to-date for the *next* full-page load.
        router.refresh(); 

      } catch (err) {
        console.error("Upload failed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Shop Settings</h1>
        <p className="mt-2 text-gray-600">Update your shop details, manage staff, and configure preferences.</p>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md max-w-lg">
          <h2 className="text-xl font-semibold text-gray-700">Update Shop Logo</h2>
          
          <div className="mt-4">
            <p className="block text-sm font-medium text-gray-700">Current Logo</p>
            <div className="mt-2 flex h-24 w-24 items-center justify-center rounded-md border border-gray-300 bg-gray-50">
              {/* This now reads from the context's state */}
              {currentLogoUrl ? (
                <img 
                  src={currentLogoUrl} 
                  alt="Current shop logo" 
                  className="h-full w-full object-cover rounded-md"
                />
              ) : (
                <Store className="h-10 w-10 text-gray-400" />
              )}
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Choose a new logo file to upload. This will replace the current logo.
          </p>
          
          <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
                New Logo File
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                required
                className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-green-50 file:text-green-700
                          hover:file:bg-green-100"
              />
            </div>
            
            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium">New Logo Preview:</p>
                <img src={previewUrl} alt="Logo preview" className="mt-2 rounded-md border border-gray-300 h-24 w-24 object-cover" />
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading || !file}
              className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload and Save Logo'}
            </button>

            {message && <p className="text-sm text-green-600 mt-2">{message}</p>}
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </form>
        </div>
      </div>
    );
  }