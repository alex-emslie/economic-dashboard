import { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  Button,
  Text,
  Icon,
} from '@chakra-ui/react';
import EconomicChart from './components/EconomicChart';
import { ECONOMIC_INDICATORS } from './services/fredApi';

// Icon components as simple SVGs
const TrendingUpIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </Icon>
);

const WorkIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </Icon>
);

const LocalAtmIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </Icon>
);

const AccountBalanceIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </Icon>
);

const ShowChartIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </Icon>
);

const HouseIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </Icon>
);

const ShoppingCartIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </Icon>
);

const FactoryIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v1m0 0v1m0-1h6m-6 0v1m6-1v1m0-1v1m0-1h6M3 12h18M3 12v9h18v-9M3 12l3-9m15 9l-3-9M9 12v5m6-5v5" />
  </Icon>
);

const PeopleIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </Icon>
);

const WalletIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </Icon>
);

const SmileyIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </Icon>
);

const ReceiptIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </Icon>
);

const GlobeIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </Icon>
);

const DocumentIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </Icon>
);

const CashIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </Icon>
);

const SpeedIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </Icon>
);

const ClipboardIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </Icon>
);

const GaugeIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </Icon>
);

// Map icons to indicators
const indicatorIcons = {
  GDP: TrendingUpIcon,
  UNEMPLOYMENT: WorkIcon,
  INFLATION: LocalAtmIcon,
  FED_RATE: AccountBalanceIcon,
  SP500: ShowChartIcon,
  HOUSING: HouseIcon,
  RETAIL_SALES: ShoppingCartIcon,
  INDUSTRIAL_PRODUCTION: FactoryIcon,
  LABOR_FORCE: PeopleIcon,
  WAGES: WalletIcon,
  CONSUMER_SENTIMENT: SmileyIcon,
  PERSONAL_INCOME: ReceiptIcon,
  TRADE_BALANCE: GlobeIcon,
  DEBT: DocumentIcon,
  MONEY_SUPPLY: CashIcon,
  PRODUCTIVITY: SpeedIcon,
  JOBLESS_CLAIMS: ClipboardIcon,
  CAPACITY_UTILIZATION: GaugeIcon,
};

function App() {
  const [selectedIndicator, setSelectedIndicator] = useState(ECONOMIC_INDICATORS.GDP);

  return (
    <Flex w="full" minH="100vh" bg="gray.50">
      {/* Sidebar */}
      <Box
        w="256px"
        bg="white"
        borderRight="1px"
        borderColor="gray.200"
        flexShrink={0}
        display="flex"
        flexDirection="column"
      >
        {/* Navigation */}
        <Box flex={1} p={4} pt={6}>
          <Box mb={2}>
            <Text
              px={3}
              fontSize="xs"
              fontWeight="semibold"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
            >
              Indicators
            </Text>
          </Box>
          <VStack spacing={1} align="stretch">
            {Object.values(ECONOMIC_INDICATORS).map((indicator) => {
              const IconComponent = indicatorIcons[indicator.id];
              return (
                <Button
                  key={indicator.id}
                  onClick={() => setSelectedIndicator(indicator)}
                  leftIcon={<IconComponent boxSize={6} />}
                  justifyContent="flex-start"
                  px={6}
                  py={6}
                  h="auto"
                  fontSize="base"
                  fontWeight={selectedIndicator.id === indicator.id ? 'medium' : 'normal'}
                  bg={selectedIndicator.id === indicator.id ? 'gray.100' : 'transparent'}
                  color={selectedIndicator.id === indicator.id ? 'gray.900' : 'gray.600'}
                  _hover={{
                    bg: selectedIndicator.id === indicator.id ? 'gray.100' : 'gray.50',
                    color: 'gray.900',
                  }}
                  borderRadius="lg"
                >
                  {indicator.title}
                </Button>
              );
            })}
          </VStack>
        </Box>

        {/* Footer */}
        <Box p={4} borderTop="1px" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500">
            Data from Federal Reserve Economic Data (FRED)
          </Text>
        </Box>
      </Box>

      {/* Main Content */}
      <Flex flex={1} direction="column" minH="100vh" overflow="hidden">
        {/* Chart Content */}
        <Box as="main" flex={1} p={8} overflow="auto">
          <EconomicChart indicator={selectedIndicator} />
        </Box>
      </Flex>
    </Flex>
  );
}

export default App;
