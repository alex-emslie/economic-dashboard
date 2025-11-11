import { useState } from 'react';
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  TrendingUp,
  Work,
  LocalAtm,
  AccountBalance,
  ShowChart,
} from '@mui/icons-material';
import EconomicChart from './components/EconomicChart';
import { ECONOMIC_INDICATORS } from './services/fredApi';

const drawerWidth = 280;

// Create a modern theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Map icons to indicators
const indicatorIcons = {
  GDP: <TrendingUp />,
  UNEMPLOYMENT: <Work />,
  INFLATION: <LocalAtm />,
  FED_RATE: <AccountBalance />,
  SP500: <ShowChart />,
};

function App() {
  const [selectedIndicator, setSelectedIndicator] = useState(ECONOMIC_INDICATORS.GDP);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
        <CssBaseline />

        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{
            width: `calc(100% - ${drawerWidth}px)`,
            ml: `${drawerWidth}px`,
            bgcolor: 'white',
            color: 'text.primary',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              U.S. Economic Dashboard
            </Typography>
            <Typography
              variant="body2"
              sx={{ ml: 'auto', color: 'text.secondary' }}
            >
              Powered by FRED API
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Side Navigation Drawer */}
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: '#1e1e1e',
              color: 'white',
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Toolbar sx={{ bgcolor: '#121212', justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              Economic Indicators
            </Typography>
          </Toolbar>

          <List sx={{ pt: 2 }}>
            {Object.values(ECONOMIC_INDICATORS).map((indicator) => (
              <ListItem key={indicator.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={selectedIndicator.id === indicator.id}
                  onClick={() => setSelectedIndicator(indicator)}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      bgcolor: indicator.color,
                      '&:hover': {
                        bgcolor: indicator.color,
                        opacity: 0.9,
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.08)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {indicatorIcons[indicator.id]}
                  </ListItemIcon>
                  <ListItemText
                    primary={indicator.title}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: selectedIndicator.id === indicator.id ? 'bold' : 'normal',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <Typography variant="caption" color="rgba(255,255,255,0.6)">
              Select an indicator to view its historical data and trends
            </Typography>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            minHeight: '100vh',
            width: '100%',
            maxWidth: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Toolbar />
          <Box sx={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <EconomicChart indicator={selectedIndicator} />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
