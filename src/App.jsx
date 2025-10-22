import React, { useState, useRef } from 'react';

// Main App Component
export default function App() {
  const [formData, setFormData] = useState({
    manual: '',
    all: '',
    containerId: '',
    tareWeight: '',
  });
  const [apiKey, setApiKey] = useState(''); // State to hold the API key
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const uploadFileInputRef = useRef(null);
  const scanFileInputRef = useRef(null);

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
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });

  // Processes the uploaded image from either button
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!apiKey) {
      setError("Please enter your Google Gemini API key to proceed.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const base64ImageData = await fileToBase64(file);
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            parts: [
              { text: "Extract all visible text from the image. Preserve the original line breaks." },
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
        const errorBody = await response.json();
        throw new Error(`API Error: ${errorBody.error?.message || response.statusText}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        const rawText = text.trim();
        let finalContainerId = '';
        let finalTareWeight = '';

        const cleanedText = rawText.replace(/\s+/g, '');
        const containerIdRegex = /[A-Z]{4}\d{7}/;
        const idMatch = cleanedText.match(containerIdRegex);
        if (idMatch) {
          finalContainerId = idMatch[0];
        }
        
        const lines = rawText.split('\n');
        const tareLine = lines.find(line => line.toUpperCase().includes('TARE'));
        if (tareLine) {
          const numberMatch = tareLine.match(/[\d,.]+/);
          if (numberMatch) {
            finalTareWeight = numberMatch[0].replace(/\D/g, '');
          }
        }

        setFormData((prev) => ({
          ...prev,
          all: rawText,
          containerId: finalContainerId,
          tareWeight: finalTareWeight,
        }));
      } else {
        throw new Error("Could not extract text. The image might be unclear or empty.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Check your network and API key.");
      console.error(err);
    } finally {
      setIsLoading(false);
      e.target.value = null;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center font-sans p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        
        <div>
          <h1 className="text-2xl font-bold text-center text-gray-800">Container Information</h1>
          <p className="text-center text-gray-500">Enter details or scan an image.</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* API Key Input */}
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
              Google Gemini API Key
            </label>
            <input
              type="password"
              id="apiKey"
              name="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Paste your API key here"
            />
             <p className="mt-1 text-xs text-gray-500">
              Get your free key from Google AI Studio.
            </p>
          </div>
          
          <hr/>

          <div>
            <label htmlFor="all" className="block text-sm font-medium text-gray-700">
              Raw OCR Output
            </label>
            <textarea
              id="all"
              name="all"
              value={formData.all}
              onChange={handleInputChange}
              rows={4}
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Extracted text will appear here..."
              readOnly
            />
          </div>

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

          <div>
            <label htmlFor="tareWeight" className="block text-sm font-medium text-gray-700">
              Tare Weight (KGS)
            </label>
            <input
              type="text"
              id="tareWeight"
              name="tareWeight"
              value={formData.tareWeight}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 2100"
            />
          </div>
        </form>

        <div className="space-y-4 pt-2">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <input
                type="file"
                ref={scanFileInputRef}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                accept="image/*"
                capture="environment"
            />
            <input
                type="file"
                ref={uploadFileInputRef}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                accept="image/*"
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => scanFileInputRef.current.click()}
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Scan with Camera'}
              </button>
              <button
                type="button"
                onClick={() => uploadFileInputRef.current.click()}
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Upload Image'}
              </button>
            </div>
             <p className="text-xs text-gray-500 text-center px-4">
              <strong>Note:</strong> On a mobile device, 'Scan' should open the camera. In a desktop browser or this preview, it will open a file picker.
            </p>
        </div>

      </div>
    </div>
  );
}

