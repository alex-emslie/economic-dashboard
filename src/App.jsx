import { useState } from 'react';
import EconomicChart from './components/EconomicChart';
import { ECONOMIC_INDICATORS } from './services/fredApi';

// Icon components as simple SVGs
const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const WorkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LocalAtmIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AccountBalanceIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ShowChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

// Map icons to indicators
const indicatorIcons = {
  GDP: <TrendingUpIcon />,
  UNEMPLOYMENT: <WorkIcon />,
  INFLATION: <LocalAtmIcon />,
  FED_RATE: <AccountBalanceIcon />,
  SP500: <ShowChartIcon />,
};

function App() {
  const [selectedIndicator, setSelectedIndicator] = useState(ECONOMIC_INDICATORS.GDP);

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-900 text-white flex flex-col flex-shrink-0">
        {/* Sidebar Header */}
        <div className="bg-gray-950 p-4 text-center">
          <h2 className="text-xl font-bold text-blue-500">Economic Indicators</h2>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 pt-4">
          <ul className="space-y-1 px-2">
            {Object.values(ECONOMIC_INDICATORS).map((indicator) => (
              <li key={indicator.id}>
                <button
                  onClick={() => setSelectedIndicator(indicator)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                    selectedIndicator.id === indicator.id
                      ? 'font-bold'
                      : 'hover:bg-gray-800'
                  }`}
                  style={{
                    backgroundColor: selectedIndicator.id === indicator.id ? indicator.color : 'transparent',
                  }}
                >
                  <span className="flex-shrink-0">{indicatorIcons[indicator.id]}</span>
                  <span className="text-sm text-left">{indicator.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-400">
            Select an indicator to view its historical data and trends
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top App Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">U.S. Economic Dashboard</h1>
            <p className="text-sm text-gray-500">Powered by FRED API</p>
          </div>
        </header>

        {/* Chart Content */}
        <main className="flex-1 flex flex-col">
          <EconomicChart indicator={selectedIndicator} />
        </main>
      </div>
    </div>
  );
}

export default App;
