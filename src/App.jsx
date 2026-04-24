import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  Button,
  Text,
  AccordionRoot,
  AccordionItem,
  AccordionItemTrigger,
  AccordionItemContent,
} from '@chakra-ui/react';
import {
  TrendingUp,
  CircleDollarSign,
  LineChart,
  Users,
  Smile,
  Globe,
  ChevronDown,
  Settings,
} from 'lucide-react';
import EconomicChart, { ControlsPanel } from './components/EconomicChart';
import { ECONOMIC_INDICATORS } from './services/fredApi';
import { BLS_INDICATORS } from './services/blsApi';
import { WORLD_BANK_INDICATORS } from './services/worldBankApi';


// ── Theme tokens ──────────────────────────────────────────────────────────────

export const t = (dark) => ({
  pageBg:        dark ? '#0f172a' : '#f9fafb',
  sidebarBg:     dark ? '#1e293b' : '#ffffff',
  cardBg:        dark ? '#1e293b' : '#ffffff',
  cardBgAlt:     dark ? '#0f172a' : '#f9fafb',
  border:        dark ? '#334155' : '#e5e7eb',
  borderSubtle:  dark ? '#1e293b' : '#f3f4f6',
  textPrimary:   dark ? '#f1f5f9' : '#111827',
  textSecondary: dark ? '#94a3b8' : '#6b7280',
  textMuted:     dark ? '#64748b' : '#9ca3af',
  navActive:     dark ? '#334155' : '#f3f4f6',
  navHover:      dark ? '#1e293b' : '#f9fafb',
  inputBg:       dark ? '#334155' : '#f9fafb',
});

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'output',        label: 'Economic Output',    icon: TrendingUp },
  { id: 'labor',         label: 'Labor Market',        icon: Users },
  { id: 'prices',        label: 'Prices & Inflation',  icon: CircleDollarSign },
  { id: 'financial',     label: 'Financial Markets',   icon: LineChart },
  { id: 'consumer',      label: 'Consumer & Income',   icon: Smile },
  { id: 'government',    label: 'Government & Trade',  icon: Globe },
  { id: 'international', label: 'International',       icon: Globe },
];

// Merge all indicators from all sources
const ALL_INDICATORS = { ...ECONOMIC_INDICATORS, ...BLS_INDICATORS, ...WORLD_BANK_INDICATORS };

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({ indicator, isActive, onSelect, darkMode }) {
  const tk = t(darkMode);
  return (
    <Button
      onClick={() => onSelect(indicator)}
      justifyContent="flex-start"
      px={2}
      py={1}
      h="auto"
      fontSize="xs"
      fontWeight={isActive ? 'semibold' : 'normal'}
      bg={isActive ? tk.navActive : 'transparent'}
      color={isActive ? tk.textPrimary : tk.textSecondary}
      _hover={{ bg: tk.navHover, color: tk.textPrimary }}
      borderRadius="md"
      w="full"
    >
      <Flex align="center" gap={2} w="full" minW={0}>
        <Text
          flex={1}
          textAlign="left"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          title={indicator.title}
        >
          {indicator.title}
        </Text>
      </Flex>
    </Button>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [selectedIndicator, setSelectedIndicator] = useState(ALL_INDICATORS.GDP);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [showMoM, setShowMoM] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);
  const [timeRange, setTimeRange] = useState('1Y');
  const [visibleSegments, setVisibleSegments] = useState(
    ALL_INDICATORS.GDP.segments.map(s => s.id)
  );

  // Reset segments when indicator changes
  useEffect(() => {
    setVisibleSegments(selectedIndicator.segments.map(s => s.id));
  }, [selectedIndicator]);

  const toggleSegment = (segmentId) => {
    setVisibleSegments(prev =>
      prev.includes(segmentId) ? prev.filter(id => id !== segmentId) : [...prev, segmentId]
    );
  };

  const toggleAllSegments = () => {
    setVisibleSegments(prev =>
      prev.length === selectedIndicator.segments.length
        ? []
        : selectedIndicator.segments.map(s => s.id)
    );
  };

  // Group indicators by category
  const byCategory = CATEGORIES.map(cat => ({
    category: cat,
    indicators: Object.values(ALL_INDICATORS).filter(ind => ind.category === cat.id),
  })).filter(group => group.indicators.length > 0);

  const tk = t(darkMode);

  return (
    <Flex w="full" minH="100vh" bg={tk.pageBg}>
      {/* Left Sidebar */}
      <Box
        w="280px"
        bg={tk.sidebarBg}
        boxShadow="md"
        flexShrink={0}
        display="flex"
        flexDirection="column"
        position="sticky"
        top={0}
        h="100vh"
        overflowY="auto"
      >
        {/* App title */}
        <Box px={4} py={5} borderBottom="1px" borderColor={tk.border}>
          <Text fontSize="sm" fontWeight="bold" color={tk.textPrimary} letterSpacing="tight">
            Economic Dashboard
          </Text>
          <Text fontSize="xs" color={tk.textMuted} mt={0.5}>FRED · BLS</Text>
        </Box>

        {/* Navigation */}
        <Box flex={1} px={2} py={1} overflowY="auto">
          <AccordionRoot
            multiple
            defaultValue={[byCategory[0]?.category.id]}
            variant="plain"
          >
            {byCategory.map(({ category, indicators }) => {
              const CategoryIcon = category.icon;
              const hasActive = indicators.some(ind => ind.id === selectedIndicator.id);
              return (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  border="1px"
                  borderColor={tk.border}
                  borderRadius="md"
                  mb={1.5}
                  overflow="hidden"
                >
                  <AccordionItemTrigger
                    px={3}
                    py={1.5}
                    fontSize="xs"
                    fontWeight="semibold"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    color={hasActive ? tk.textPrimary : tk.textSecondary}
                    bg={hasActive ? tk.navActive : tk.sidebarBg}
                    _hover={{ bg: tk.navHover, color: tk.textPrimary }}
                    cursor="pointer"
                  >
                    <Flex align="center" gap={1.5} flex={1}>
                      <CategoryIcon size={12} />
                      {category.label}
                    </Flex>
                    <Box
                      as="span"
                      display="inline-flex"
                      style={{ transition: 'transform 150ms ease' }}
                      _open={{ transform: 'rotate(0deg)' }}
                      _closed={{ transform: 'rotate(-90deg)' }}
                    >
                      <ChevronDown size={12} style={{ color: tk.textMuted }} />
                    </Box>
                  </AccordionItemTrigger>
                  <AccordionItemContent pt={1} pb={1.5} px={1} borderTop="1px" borderColor={tk.borderSubtle}>
                    <VStack spacing={0} align="stretch">
                      {indicators.map(indicator => (
                        <NavItem
                          key={indicator.id}
                          indicator={indicator}
                          isActive={selectedIndicator.id === indicator.id}
                          onSelect={setSelectedIndicator}
                          darkMode={darkMode}
                        />
                      ))}
                    </VStack>
                  </AccordionItemContent>
                </AccordionItem>
              );
            })}
          </AccordionRoot>
        </Box>

        {/* Footer */}
        <Box px={4} py={3} borderTop="1px" borderColor={tk.border}>
          <Text fontSize="10px" color={tk.textMuted} lineHeight="1.5">
            Federal Reserve Economic Data (FRED) · Bureau of Labor Statistics (BLS)
          </Text>
        </Box>
      </Box>

      {/* Main Content */}
      <Flex flex={1} direction="column" minH="100vh" overflow="hidden">
        <Box as="main" flex={1} p={8} overflow="auto">
          <EconomicChart
            indicator={selectedIndicator}
            controlsOpen={controlsOpen}
            onControlsToggle={() => setControlsOpen(o => !o)}
            showForecast={showForecast}
            setShowForecast={setShowForecast}
            showMoM={showMoM}
            showTable={showTable}
            darkMode={darkMode}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            visibleSegments={visibleSegments}
            setVisibleSegments={setVisibleSegments}
          />
        </Box>
      </Flex>

      {/* Right Controls Panel */}
      {controlsOpen && (
        <ControlsPanel
          onClose={() => setControlsOpen(false)}
          indicator={selectedIndicator}
          showForecast={showForecast}
          setShowForecast={setShowForecast}
          showMoM={showMoM}
          setShowMoM={setShowMoM}
          showTable={showTable}
          setShowTable={setShowTable}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          visibleSegments={visibleSegments}
          toggleSegment={toggleSegment}
          toggleAllSegments={toggleAllSegments}
        />
      )}
    </Flex>
  );
}

export default App;
