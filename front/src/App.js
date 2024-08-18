import { useState, useEffect } from 'react';
import './App.css'; 

function SearchPage() {
  const colors = [
    '#538392', '#6295A2', '#80B9AD', '#B3E2A7',
    'rgb(83, 131, 146)', 'rgb(98, 149, 162)', 'rgb(128, 185, 173)', 'rgb(179, 226, 167)'
  ];

  const [labels, setLabels] = useState([]);
  const [summary, setSummary] = useState('Lorem ipsum dolor sit amet...');
  const [url, setUrl] = useState('');

  const labelsData = [
    {text: 'Technology'},
    {text: 'Business'},
    {text: 'Health'},
  ];

  useEffect(() => {
    // Set labels with colors
    const updatedLabels = labelsData.map((label, index) => ({
      text: label.text,
      color: colors[index % colors.length] // Rotate through colors
    }));
    setLabels(updatedLabels);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    setSummary(data.summary);
    setLabels(data.labels);
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-semibold text-gray-800 mb-8">Easy Web Scraping</h1>
      <form className="w-full max-w-lg flex items-center mb-8" onSubmit={handleSubmit}>
        <input
          type="text"
          className="flex-grow px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter the URL for webscraping"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="submit"
          className="ml-4 px-6 py-2 text-white bg-[#538392] rounded-lg shadow-md hover:bg-[#3e5b65] transition-all duration-300"
        >
          Search
        </button>
      </form>
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Summary of the website</h2>
        <p className="text-lg text-gray-700 mb-4">
          {summary}
        </p>
        <div className="flex flex-wrap gap-2">
          {labels.map((label, index) => (
            <span
              key={index}
              className="px-3 py-1 text-white rounded-full"
              style={{ backgroundColor: label.color }}
            >
              {label.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
