import React, { useState, useRef } from 'react';

// Main App Component
export default function App() {
  const [formData, setFormData] = useState({
    manual: '',
    all: '',
    containerId: '',
    tareWeight: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Handles changes in the text inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Converts a file to a base64 string
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Get only the base64 part
      reader.onerror = (error) => reject(error);
    });

  // Processes the uploaded image
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const base64ImageData = await fileToBase64(file);
      const apiKey = ""; // API key is handled by the environment
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            parts: [
              { text: "Extract the container ID from this image. It usually follows a 4-letter, 7-digit format (e.g., MSDU2876414). Provide only the ID." },
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64ImageData,
                },
              },
            ],
          },
        ],
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        // Clean up the response and set the container ID
        const containerId = text.trim().replace(/\s/g, ''); // Remove spaces
        setFormData((prev) => ({ ...prev, containerId }));
      } else {
        throw new Error("Could not extract text from the image.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
      console.error(err);
    } finally {
      setIsLoading(false);
      // Reset file input to allow uploading the same file again
      e.target.value = null;
    }
  };


  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center font-sans">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-center text-gray-800">Container Information</h1>
          <p className="text-center text-gray-500">Enter details manually or upload an image.</p>
        </div>

        {/* Form Inputs */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* Manual Input */}
          <div>
            <label htmlFor="manual" className="block text-sm font-medium text-gray-700">
              Manual
            </label>
            <input
              type="text"
              id="manual"
              name="manual"
              value={formData.manual}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter manual data"
            />
          </div>

          {/* All Input */}
          <div>
            <label htmlFor="all" className="block text-sm font-medium text-gray-700">
              All
            </label>
            <input
              type="text"
              id="all"
              name="all"
              value={formData.all}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter all data"
            />
          </div>

          {/* ContainerID Input */}
          <div>
            <label htmlFor="containerId" className="block text-sm font-medium text-gray-700">
              Container ID
            </label>
            <input
              type="text"
              id="containerId"
              name="containerId"
              value={formData.containerId}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., MSKU1234567"
            />
          </div>

          {/* Tare Weight Input */}
          <div>
            <label htmlFor="tareWeight" className="block text-sm font-medium text-gray-700">
              Tare Weight
            </label>
            <input
              type="text"
              id="tareWeight"
              name="tareWeight"
              value={formData.tareWeight}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 4500 KG"
            />
          </div>
        </form>

        {/* Action Buttons and Status */}
        <div className="space-y-4 pt-2">
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                disabled
              >
                Scan
              </button>
               {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                accept="image/*"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Upload Image'}
              </button>
            </div>
        </div>

      </div>
    </div>
  );
}

