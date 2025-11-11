# U.S. Economic Dashboard

A beautiful data visualization dashboard that displays real-time U.S. economic indicators using the Federal Reserve Economic Data (FRED) API.

## Features

- **Interactive Line Charts**: Visualize economic trends over time using Recharts
- **5 Key Economic Indicators**:
  - Gross Domestic Product (GDP)
  - Unemployment Rate
  - Consumer Price Index (Inflation)
  - Federal Funds Rate
  - S&P 500 Index
- **Modern UI**: Built with Material-UI for a clean, professional look
- **Side Navigation**: Easily switch between different economic indicators
- **Real-time Data**: Pulls the latest data from the FRED API

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A free FRED API key

## Getting Your FRED API Key

1. Visit https://fred.stlouisfed.org/
2. Click "My Account" and create a free account
3. Go to https://fred.stlouisfed.org/docs/api/api_key.html
4. Request an API key (it's instant and free!)

## Setup Instructions

1. **Add your FRED API key**:
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

   Then open `.env` and add your FRED API key:
   ```
   VITE_FRED_API_KEY=your_actual_api_key_here
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:5173`

## Project Structure

```
economic-dashboard/
├── src/
│   ├── components/
│   │   └── EconomicChart.jsx    # Reusable chart component
│   ├── services/
│   │   └── fredApi.js            # FRED API integration
│   ├── App.jsx                   # Main app with navigation
│   └── main.jsx                  # Entry point
├── package.json
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technologies Used

- **React** - UI library
- **Vite** - Build tool and dev server
- **Material-UI** - Component library and styling
- **Recharts** - Charting library
- **Axios** - HTTP client for API calls
- **FRED API** - Economic data source

## Adding More Indicators

To add more economic indicators:

1. Find the series ID on [FRED](https://fred.stlouisfed.org/)
2. Add a new entry to `ECONOMIC_INDICATORS` in `src/services/fredApi.js`
3. Add an icon mapping in `src/App.jsx`

## API Rate Limits

The FRED API has the following limits for free accounts:
- 120 requests per 60 seconds
- No daily limit

## License

MIT

## Acknowledgments

- Data provided by [Federal Reserve Economic Data (FRED)](https://fred.stlouisfed.org/)
- Built with [React](https://react.dev/) and [Material-UI](https://mui.com/)
