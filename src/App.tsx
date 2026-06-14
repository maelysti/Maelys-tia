import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  Plus,
  Trash2,
  Lock,
  Sun,
  Moon,
  Database,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Download,
  Upload,
  Info,
  ChevronRight,
  ChevronLeft,
  Calculator,
  Grid,
  Edit2,
  Sliders,
  Maximize2,
  X,
  PieChart,
  Camera,
  LogOut,
  Save,
  History,
  AlertTriangle
} from 'lucide-react';

import WelcomeScreen from './components/WelcomeScreen';
import BoxModal from './components/BoxModal';
import MajBsdModal from './components/MajBsdModal';
import ScreenshotTool from './components/ScreenshotTool';
import {
  OrderMeta,
  SizeDetails,
  ColorConfig,
  ModelsDatabase,
  ColorResult,
  PackedRow,
  LocalSaveListItem
} from './types';
import {
  computeColorResult,
  generateSQLString,
  parseSQLString,
  exportToExcel,
  parseCartonRange,
  PALETTE,
  BG_COLORS_DARK,
  BG_COLORS_LIGHT,
  getRemainderRowColor,
  isRemainderRow
} from './utils';

// Default template structures
const DEFAULT_DATABASE: ModelsDatabase = {
  dim_models: [
    { name: 'WOOLWORTHS', L: 60, l: 40, h: 30 },
    { name: 'HUGO BOSS', L: 65, l: 45, h: 35 },
    { name: 'STANDARD', L: 61, l: 41, h: 30 }
  ],
  weight_piece_models: [
    { name: 'POLO SHIRT', wPiece: 0.25 },
    { name: 'T-SHIRT', wPiece: 0.18 },
    { name: 'JACKET', wPiece: 0.65 }
  ],
  weight_carton_models: [
    { name: 'MEDIUM BOX', wCarton: 0.8 },
    { name: 'LARGE BOX', wCarton: 1.2 }
  ]
};

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const CUSTS = [
  '6TH SENS', 'AGOA CTN', 'ANTHROPOLOGIE', 'ARMANI', 'AUSTIN REED', 'AWAY', 'BARBOUR', 'BONOBO', 'BRENTWOOD GENTS',
  'BREUNINGER', 'BROOKS', 'CAPE UNION', 'CHARLES TYRWITT', 'CONBIPEL', 'COUNTRY ROAD&TRENERY GENTS', 'DANIEL HECHTER',
  'DILLARDS', 'DOUBLE TWO', 'EDGARS', 'EL CORTE GENTS', 'EWM', 'EXACT', 'FABIANI', 'Faherty Brand Ladies',
  'FASHION PROJECT', 'FCN LADIES', 'FREE PEOPLE LADIES', 'GENTLEMAN FARMER', 'GIESSWEIN', 'GIOVANNI', 'HACKETT',
  'Harmont&Blaine Gents', 'HARRIS WILLSON', 'HOUSE OF BRUAR', 'HUG', 'HUGO BOSS', 'INSPECTION LYON&DEC', 'IZAC',
  'JACQUES VERT', 'JHONNIE O', 'JOHN CRAIG', 'JOHN LEWIS', 'JOS A BANK', 'JOSEPH ABBOUD', 'JULES', 'KWAY GENTS',
  'LACOSTE', 'LEFT OVER 2019', 'LION OF PORCHES & DECENIO', 'M&S', 'MAKRO', 'MARKETING TRIPS LADIES',
  'MARKHAM -FABIANI-UNION DENIM', 'MASK', 'MASSIMO', 'MONOPRIX', 'MOORES', 'MOSS BROS', 'MR BLUE', 'NEXT',
  'ORVIS', 'PETER MILLAR', 'PICK n PAY', 'POLO JEANS', 'PRINGLE', 'QUEENSPARK', 'REDBAT', 'RELAY GENTS',
  'RIVERWALK', 'RODD&GUNN', 'ROOTS', 'RUSSEL', 'SACOOR', 'SANDRO', 'SAS DEVRED', 'SCALPERS', 'SCOTCH & SODA',
  'SKIPERBAR', 'SPITZ', 'STOCK ORDER', 'STOKOMANI', 'SUIT SUPPLY', 'SUPERBALIST', 'THOMAS DEAN', 'TOMMY',
  'UNIQ mens', 'UZZI', 'VERWEIJ', 'WOOLOVERS', 'WOOLWORTHS', 'ZADIG&VOLTAIRE', 'ZLABELS'
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Database templates state (persisted via local storage)
  const [db, setDb] = useState<ModelsDatabase>(() => {
    const saved = localStorage.getItem('packing_list_pro_db');
    return saved ? JSON.parse(saved) : DEFAULT_DATABASE;
  });

  // Order Meta (with auto-save restore)
  const [meta, setMeta] = useState<OrderMeta>(() => {
    const saved = localStorage.getItem('packing_list_pro_current_meta');
    return saved ? JSON.parse(saved) : {
      order: '',
      customer: '',
      po: '',
      refClient: '',
      invoice: '',
      style: '',
      styleNumber: '',
      sku: '',
      yarn: '',
      composition: '',
      destination: '',
      address: '',
      pays: '',
      portDepart: '',
      portArrivee: '',
      qty: '',
      filename: ''
    };
  });

  // Packing strategy parameters (with auto-save restore)
  const [globalPackingMode, setGlobalPackingMode] = useState<'strict_solide' | 'mixte_autorise'>(() => {
    const saved = localStorage.getItem('packing_list_pro_current_globalPackingMode');
    return (saved === 'strict_solide' || saved === 'mixte_autorise') ? saved : 'strict_solide';
  });

  const [maxSizesPerBox, setMaxSizesPerBox] = useState<number>(() => {
    const saved = localStorage.getItem('packing_list_pro_current_maxSizesPerBox');
    return saved ? Number(saved) : 3;
  });

  const [forceSingleCarton, setForceSingleCarton] = useState<boolean>(() => {
    const saved = localStorage.getItem('packing_list_pro_current_forceSingleCarton');
    return saved === 'true';
  });

  // Interactive dynamic Colors state (with auto-save restore)
  const [colors, setColors] = useState<ColorConfig[]>(() => {
    const saved = localStorage.getItem('packing_list_pro_current_colors');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeColorIdx, setActiveColorIdx] = useState<number>(0);

  // Saved snapshots lists history database
  const [savedLists, setSavedLists] = useState<LocalSaveListItem[]>(() => {
    const saved = localStorage.getItem('packing_list_pro_saved_lists');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAutosaveEnabled, setIsAutosaveEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('packing_list_pro_current_is_autosave_enabled');
    return saved !== 'false'; // default to true
  });

  const [saveNameInput, setSaveNameInput] = useState<string>('');
  const [savesError, setSavesError] = useState<string | null>(null);
  const [savesSuccess, setSavesSuccess] = useState<string | null>(null);

  // Auto-complete choices
  const [custQuery, setCustQuery] = useState('');
  const [custSuggestions, setCustSuggestions] = useState<string[]>([]);
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  // Modals state triggers
  const [boxModalCtx, setBoxModalCtx] = useState<{
    isOpen: boolean;
    sizeName: string;
    colorName: string;
    initialDetails: SizeDetails;
    colorIdx: number;
  } | null>(null);

  const [isMajBsdOpen, setIsMajBsdOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isPdfPrintSelectorOpen, setIsPdfPrintSelectorOpen] = useState(false);
  const [isSqlImportOpen, setIsSqlImportOpen] = useState(false);

  // Accordion Expansions to collapse sections for clean layout
  const [isOrderMetaExpanded, setIsOrderMetaExpanded] = useState<boolean>(true);
  const [isPackingStrategyExpanded, setIsPackingStrategyExpanded] = useState<boolean>(true);
  const [isColorInputExpanded, setIsColorInputExpanded] = useState<boolean>(true);

  // Active Input Section Tab (separates metadata, strategy, and color sheet editing)
  const [activeInputTab, setActiveInputTab] = useState<'meta' | 'strategy' | 'colors' | 'packing_list' | 'breakdown' | 'summary' | 'saves'>('colors');

  // Active page state for sidebar: 'saisie' (page 1: Saisie & Préparation) or 'suivi' (page 2: Suivi & Livrables)
  const [sidebarActivePage, setSidebarActivePage] = useState<'saisie' | 'suivi'>('saisie');

  // Controlled wrapper to set active inputs and automatically update the sidebar page grouping
  const handleSetActiveInputTab = (tab: 'meta' | 'strategy' | 'colors' | 'packing_list' | 'breakdown' | 'summary' | 'saves') => {
    setActiveInputTab(tab);
    if (['meta', 'strategy', 'colors'].includes(tab)) {
      setSidebarActivePage('saisie');
    } else {
      setSidebarActivePage('suivi');
    }
  };

  const handleSwitchSidebarPage = (page: 'saisie' | 'suivi') => {
    setSidebarActivePage(page);
    if (page === 'saisie') {
      setActiveInputTab('colors');
    } else {
      setActiveInputTab('packing_list');
    }
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('packing_list_pro_sidebar_collapsed') === 'true';
  });

  // Print checklist parameters
  const [printSections, setPrintSections] = useState({
    hdr: true,
    meta: true,
    ind: true,
    cpl: true,
    leg: true,
    bk: true,
    stats: true,
    dim: false
  });

  const [printColumns, setPrintColumns] = useState({
    ctn: true,
    color: true,
    sku: true,
    sizes: true,
    nbctn: true,
    totalqty: true,
    net: true,
    gross: true,
    cbm: true
  });

  // Calculations Results display
  const [results, setResults] = useState<ColorResult[]>([]);
  const [selectedExportColors, setSelectedExportColors] = useState<string[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [sqlStatus, setSqlStatus] = useState<string | null>(null);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);

  // Modern global toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync selected export colors when results compute
  useEffect(() => {
    if (results.length > 0) {
      const validNames = results.map(r => r.nom);
      const stillValid = selectedExportColors.filter(c => validNames.includes(c));
      if (stillValid.length === 0) {
        setSelectedExportColors(validNames);
      } else {
        setSelectedExportColors(stillValid);
      }
    } else {
      setSelectedExportColors([]);
    }
  }, [results]);

  // File drag state
  const sqlFileRef = useRef<HTMLInputElement>(null);

  // Initialize initial color component
  useEffect(() => {
    if (colors.length === 0) {
      resetColorsToDefault();
    }
  }, []);

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Persistence for user saved snapshots database
  useEffect(() => {
    localStorage.setItem('packing_list_pro_saved_lists', JSON.stringify(savedLists));
  }, [savedLists]);

  // Sync isAutosaveEnabled setting
  useEffect(() => {
    localStorage.setItem('packing_list_pro_current_is_autosave_enabled', String(isAutosaveEnabled));
  }, [isAutosaveEnabled]);

  // Sync isSidebarCollapsed setting
  useEffect(() => {
    localStorage.setItem('packing_list_pro_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Real-time background auto-saver
  useEffect(() => {
    if (isAutosaveEnabled) {
      localStorage.setItem('packing_list_pro_current_meta', JSON.stringify(meta));
      localStorage.setItem('packing_list_pro_current_globalPackingMode', globalPackingMode);
      localStorage.setItem('packing_list_pro_current_maxSizesPerBox', String(maxSizesPerBox));
      localStorage.setItem('packing_list_pro_current_forceSingleCarton', String(forceSingleCarton));
      localStorage.setItem('packing_list_pro_current_colors', JSON.stringify(colors));
    }
  }, [meta, globalPackingMode, maxSizesPerBox, forceSingleCarton, colors, isAutosaveEnabled]);

  // Save database modifications
  const handleSaveDatabase = (newDb: ModelsDatabase) => {
    setDb(newDb);
    localStorage.setItem('packing_list_pro_db', JSON.stringify(newDb));
  };

  const resetColorsToDefault = () => {
    const defaultColor: ColorConfig = {
      nom: 'COULEUR 1',
      mode: 'inherit',
      tailles: [...DEFAULT_SIZES],
      sizes: {}
    };
    DEFAULT_SIZES.forEach((sz, idx) => {
      defaultColor.sizes[sz] = {
        qtyTot: 0,
        cap: 25,
        wPiece: idx === 0 ? 0.25 : idx === 1 ? 0.27 : idx === 2 ? 0.30 : idx === 3 ? 0.32 : 0.35,
        wCarton: 0.80,
        cbmUnit: (61 * 41 * 30) / 1000000,
        dimL: 61,
        diml: 41,
        dimH: 30,
        sku: ''
      };
    });
    setColors([defaultColor]);
    setActiveColorIdx(0);
    setHasGenerated(false);
  };

  // Helper auto-calculate file name
  const updateFilenameAndTotal = (updatedMeta: OrderMeta, currentColors: ColorConfig[] = colors) => {
    let sumPcs = 0;
    currentColors.forEach(c => {
      c.tailles.forEach(t => {
        sumPcs += c.sizes[t]?.qtyTot || 0;
      });
    });

    const qtyString = sumPcs > 0 ? `${sumPcs}PCS` : '';
    const parts = [
      updatedMeta.order,
      updatedMeta.customer,
      updatedMeta.po,
      updatedMeta.style,
      qtyString
    ].filter(Boolean);

    const autoFile = parts.length > 0 ? `PACKING LIST ${parts.join(' ')}` : '';
    const outputQty = sumPcs > 0 ? `${sumPcs.toLocaleString('fr-FR')} PCS` : '';

    setMeta({
      ...updatedMeta,
      filename: updatedMeta.filename && updatedMeta.filename !== meta.filename ? updatedMeta.filename : autoFile,
      qty: outputQty
    });
  };

  // Input bindings
  const handleMetaChange = (key: keyof OrderMeta, value: string) => {
    const nextMeta = { ...meta, [key]: value };

    // Set auto customer template configs when chosen
    if (key === 'customer') {
      const matchedDim = db.dim_models.find(m => m.name.toUpperCase() === value.trim().toUpperCase());
      if (matchedDim) {
        // Apply this default size configuration to all current colors sizes!
        applyDimensionToAllColors(matchedDim.L, matchedDim.l, matchedDim.h);
      }

      // Compute suggestions
      if (value.trim() === '') {
        setCustSuggestions([]);
        setShowCustDropdown(false);
      } else {
        const filtered = CUSTS.filter(c => c.toUpperCase().includes(value.toUpperCase())).slice(0, 10);
        setCustSuggestions(filtered);
        setShowCustDropdown(filtered.length > 0);
      }
    }

    updateFilenameAndTotal(nextMeta);
  };

  const applyDimensionToAllColors = (L: number, l: number, h: number) => {
    const nextColors = colors.map(c => {
      const nextSizes = { ...c.sizes };
      c.tailles.forEach(t => {
        const item = nextSizes[t];
        if (item) {
          nextSizes[t] = {
            ...item,
            dimL: L,
            diml: l,
            dimH: h,
            cbmUnit: (L * l * h) / 1000000
          };
        }
      });
      return { ...c, sizes: nextSizes };
    });
    setColors(nextColors);
  };

  const handleSelectCustomerSuggestion = (cust: string) => {
    setCustQuery(cust);
    setShowCustDropdown(false);
    const nextMeta = { ...meta, customer: cust };

    const matchedDim = db.dim_models.find(m => m.name.toUpperCase() === cust.toUpperCase());
    if (matchedDim) {
      applyDimensionToAllColors(matchedDim.L, matchedDim.l, matchedDim.h);
    }

    updateFilenameAndTotal(nextMeta);
  };

  // Strategic Mode Select configurations
  const handleSelectPackingMode = (mode: 'strict_solide' | 'mixte_autorise') => {
    setGlobalPackingMode(mode);
    setHasGenerated(false);
  };

  // Config tab functions
  const handleAddColorTab = () => {
    const nextIdx = colors.length + 1;
    const modelColor = colors[0] || {
      tailles: [...DEFAULT_SIZES],
      sizes: {}
    };

    const newColor: ColorConfig = {
      nom: `COULEUR ${nextIdx}`,
      mode: 'inherit',
      tailles: [...modelColor.tailles],
      sizes: {}
    };

    modelColor.tailles.forEach(t => {
      const origSpec = modelColor.sizes[t];
      newColor.sizes[t] = {
        qtyTot: 0,
        cap: origSpec?.cap || 25,
        wPiece: origSpec?.wPiece || 0.25,
        wCarton: origSpec?.wCarton || 0.80,
        cbmUnit: origSpec?.cbmUnit || (61 * 41 * 30) / 1000000,
        dimL: origSpec?.dimL || 61,
        diml: origSpec?.diml || 41,
        dimH: origSpec?.dimH || 30,
        sku: ''
      };
    });

    const nextColors = [...colors, newColor];
    setColors(nextColors);
    setActiveColorIdx(nextColors.length - 1);
    setHasGenerated(false);
    updateFilenameAndTotal(meta, nextColors);
  };

  const handleRemoveActiveColorTab = () => {
    if (colors.length <= 1) {
      alert('Un minimum d\'une couleur est requis.');
      return;
    }
    const nextColors = colors.filter((_, idx) => idx !== activeColorIdx);
    setColors(nextColors);
    setActiveColorIdx(Math.max(0, activeColorIdx - 1));
    setHasGenerated(false);
    updateFilenameAndTotal(meta, nextColors);
  };

  const handleUpdateColorName = (val: string) => {
    const nextColors = colors.map((c, i) => (i === activeColorIdx ? { ...c, nom: val.toUpperCase() } : c));
    setColors(nextColors);
    updateFilenameAndTotal(meta, nextColors);
  };

  const handleUpdateTabMode = (mode: 'inherit' | 'strict_solide' | 'mixte_autorise') => {
    const nextColors = colors.map((c, i) => (i === activeColorIdx ? { ...c, mode } : c));
    setColors(nextColors);
    setHasGenerated(false);
  };

  const handleAddSizeColumn = () => {
    const nextColors = colors.map((c, ci) => {
      const label = `S-${c.tailles.length + 1}`;
      const nextTailles = [...c.tailles, label];
      const nextSizes = { ...c.sizes };

      nextSizes[label] = {
        qtyTot: 0,
        cap: 25,
        wPiece: 0.25,
        wCarton: 0.80,
        cbmUnit: (61 * 41 * 30) / 1000000,
        dimL: 61,
        diml: 41,
        dimH: 30,
        sku: ''
      };

      return {
        ...c,
        tailles: nextTailles,
        sizes: nextSizes
      };
    });

    setColors(nextColors);
    setHasGenerated(false);
  };

  const handleRemoveLastSizeColumn = () => {
    const model = colors[activeColorIdx];
    if (model.tailles.length <= 1) {
      alert('Minimum 1 taille requise.');
      return;
    }

    const nextColors = colors.map(c => {
      const removedSize = c.tailles[c.tailles.length - 1];
      const nextTailles = c.tailles.slice(0, -1);
      const nextSizes = { ...c.sizes };
      delete nextSizes[removedSize];

      return {
        ...c,
        tailles: nextTailles,
        sizes: nextSizes
      };
    });

    setColors(nextColors);
    setHasGenerated(false);
    updateFilenameAndTotal(meta, nextColors);
  };

  const handleSizeHeaderChange = (idx: number, newVal: string) => {
    const cleanVal = newVal.trim().toUpperCase();
    if (!cleanVal) return;

    const currentTab = colors[activeColorIdx];
    const oldKey = currentTab.tailles[idx];
    if (oldKey === cleanVal) return;

    // Look for duplicates in other headings
    if (currentTab.tailles.includes(cleanVal)) {
      alert(`La taille "${cleanVal}" existe déjà pour cette couleur.`);
      return;
    }

    // Rename size mapping key for all colors to maintain table uniformity
    const nextColors = colors.map(c => {
      const nextTailles = c.tailles.map((t, i) => (i === idx ? cleanVal : t));
      const nextSizes = { ...c.sizes };

      if (nextSizes[oldKey]) {
        nextSizes[cleanVal] = { ...nextSizes[oldKey] };
        delete nextSizes[oldKey];
      }

      return {
        ...c,
        tailles: nextTailles,
        sizes: nextSizes
      };
    });

    setColors(nextColors);
    setHasGenerated(false);
  };

  const handleUpdateSizeCell = (sizeName: string, field: keyof SizeDetails, val: string | number) => {
    const nextColors = colors.map((c, i) => {
      if (i !== activeColorIdx) return c;
      const nextSizes = { ...c.sizes };
      const valNum = field === 'sku' ? String(val) : (typeof val === 'string' ? parseFloat(val) || 0 : val);

      nextSizes[sizeName] = {
        ...nextSizes[sizeName],
        [field]: valNum
      };

      return { ...c, sizes: nextSizes };
    });

    setColors(nextColors);
    setHasGenerated(false);

    if (field === 'qtyTot') {
      updateFilenameAndTotal(meta, nextColors);
    }
  };

  const handleUpdateActiveColorAllSizes = (field: keyof SizeDetails, val: string | number, isSkuPrefix: boolean = false) => {
    const nextColors = colors.map((c, i) => {
      if (i !== activeColorIdx) return c;
      const nextSizes = { ...c.sizes };
      c.tailles.forEach(sz => {
        let valueToSet = val;
        if (isSkuPrefix) {
          valueToSet = String(val).trim() + "-" + sz;
        } else if (field !== 'sku') {
          valueToSet = typeof val === 'string' ? parseFloat(val) || 0 : val;
        } else {
          valueToSet = String(val);
        }

        nextSizes[sz] = {
          ...nextSizes[sz],
          [field]: valueToSet
        };
      });
      return { ...c, sizes: nextSizes };
    });

    setColors(nextColors);
    setHasGenerated(false);

    if (field === 'qtyTot') {
      updateFilenameAndTotal(meta, nextColors);
    }
  };

  const handlePasteGrid2D = (
    e: React.ClipboardEvent<HTMLInputElement>,
    startingSizeName: string,
    startingField: keyof SizeDetails
  ) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    // Split text into rows (by newline) and cells (by tab)
    const lines = pastedText.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
    if (lines.length === 0) return;

    const activeColorConfig = colors[activeColorIdx];
    if (!activeColorConfig) return;

    const sizeIndex = activeColorConfig.tailles.indexOf(startingSizeName);
    if (sizeIndex === -1) return;

    // Fields sequence in the Grid UI:
    const fieldsSeq: (keyof SizeDetails)[] = ['qtyTot', 'cap', 'sku'];
    const startingFieldIdx = fieldsSeq.indexOf(startingField);
    if (startingFieldIdx === -1) return;

    const nextColors = colors.map((c, idx) => {
      if (idx !== activeColorIdx) return c;
      const nextSizes = { ...c.sizes };

      lines.forEach((lineText, lineOffset) => {
        const fieldIdx = startingFieldIdx + lineOffset;
        if (fieldIdx >= fieldsSeq.length) return; // Exceeds the grid row fields
        const currentField = fieldsSeq[fieldIdx];

        // Split columns of this line. Excel tabs first, fall back to spaces if single column
        const cols = lineText.split('\t');
        const valuesList = cols.length > 1 ? cols : lineText.split(/[\s,]+/);

        valuesList.forEach((rawVal, colOffset) => {
          const destIdx = sizeIndex + colOffset;
          if (destIdx < c.tailles.length) {
            const destSizeName = c.tailles[destIdx];
            const valStr = rawVal.trim();
            if (valStr !== '') {
              if (currentField === 'sku') {
                nextSizes[destSizeName] = {
                  ...nextSizes[destSizeName],
                  sku: valStr
                };
              } else {
                const valNum = parseFloat(valStr);
                nextSizes[destSizeName] = {
                  ...nextSizes[destSizeName],
                  [currentField]: isNaN(valNum) ? 0 : valNum
                };
              }
            }
          }
        });
      });

      return { ...c, sizes: nextSizes };
    });

    setColors(nextColors);
    setHasGenerated(false);

    // If we modified qtyTot, sync filename and totals
    if (startingFieldIdx === 0 || lines.length > 1) {
      updateFilenameAndTotal(meta, nextColors);
    }
    triggerToast('⚡ Données collées depuis le presse-papiers !', 'success');
  };

  // Model automatic loaders
  const handleApplyDimModel = (modelName: string) => {
    const matched = db.dim_models.find(m => m.name === modelName);
    if (!matched) return;

    const nextColors = colors.map((c, ci) => {
      if (ci !== activeColorIdx) return c;
      const nextSizes = { ...c.sizes };
      c.tailles.forEach(t => {
        nextSizes[t] = {
          ...nextSizes[t],
          dimL: matched.L,
          diml: matched.l,
          dimH: matched.h,
          cbmUnit: (matched.L * matched.l * matched.h) / 1000000
        };
      });
      return { ...c, sizes: nextSizes, selectedDimModelName: modelName };
    });
    setColors(nextColors);
    setHasGenerated(false);
    triggerToast(`📐 Dimensions appliquées : ${matched.name} (${matched.L}x${matched.l}x${matched.h} cm)`, 'success');
  };

  const handleApplyPieceWeightModel = (modelName: string) => {
    const matched = db.weight_piece_models.find(m => m.name === modelName);
    if (!matched) return;

    const nextColors = colors.map((c, ci) => {
      if (ci !== activeColorIdx) return c;
      const nextSizes = { ...c.sizes };
      c.tailles.forEach(t => {
        nextSizes[t] = {
          ...nextSizes[t],
          wPiece: matched.wPiece
        };
      });
      return { ...c, sizes: nextSizes, selectedPieceWeightModelName: modelName };
    });
    setColors(nextColors);
    setHasGenerated(false);
    triggerToast(`⚖️ Poids unitaire appliqué : ${matched.name} (${matched.wPiece} KG)`, 'success');
  };

  const handleApplyCartonWeightModel = (modelName: string) => {
    const matched = db.weight_carton_models.find(m => m.name === modelName);
    if (!matched) return;

    const nextColors = colors.map((c, ci) => {
      if (ci !== activeColorIdx) return c;
      const nextSizes = { ...c.sizes };
      c.tailles.forEach(t => {
        nextSizes[t] = {
          ...nextSizes[t],
          wCarton: matched.wCarton
        };
      });
      return { ...c, sizes: nextSizes, selectedCartonWeightModelName: modelName };
    });
    setColors(nextColors);
    setHasGenerated(false);
    triggerToast(`📦 Tare carton vide appliquée : ${matched.name} (${matched.wCarton} KG)`, 'success');
  };

  // Box details modal triggers
  const openBoxDetailsModal = (sizeName: string, config: SizeDetails) => {
    setBoxModalCtx({
      isOpen: true,
      sizeName,
      colorName: colors[activeColorIdx].nom,
      initialDetails: config,
      colorIdx: activeColorIdx
    });
  };

  const saveBoxDetailsModal = (updated: SizeDetails) => {
    if (!boxModalCtx) return;
    const { colorIdx, sizeName } = boxModalCtx;

    const nextColors = colors.map((c, ci) => {
      if (ci !== colorIdx) return c;
      const nextSizes = { ...c.sizes, [sizeName]: updated };
      return { ...c, sizes: nextSizes };
    });

    setColors(nextColors);
    setBoxModalCtx(null);
    setHasGenerated(false);
    triggerToast(`🛠️ Gabarit de colisage mis à jour pour ${sizeName} !`, 'success');
  };

  // Generate Results Trigger
  const handleGenerateList = () => {
    const outputResults = colors.map((c, idx) => {
      return computeColorResult(c, globalPackingMode, forceSingleCarton, maxSizesPerBox, idx);
    });

    setResults(outputResults);
    setHasGenerated(true);
  };

  const handleResetScreen = () => {
    setMeta({
      order: '',
      customer: '',
      po: '',
      refClient: '',
      invoice: '',
      style: '',
      styleNumber: '',
      sku: '',
      yarn: '',
      composition: '',
      destination: '',
      address: '',
      pays: '',
      portDepart: '',
      portArrivee: '',
      qty: '',
      filename: ''
    });

    setCustQuery('');
    setGlobalPackingMode('strict_solide');
    setForceSingleCarton(false);
    setMaxSizesPerBox(3);
    setHasGenerated(false);
    setResults([]);
    resetColorsToDefault();
    setShowResetConfirm(false);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Save current active list to the database
  const handleSaveCurrentList = (customName: string) => {
    try {
      const timestamp = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const autoLabel = [
        meta.order ? `Order #${meta.order}` : '',
        meta.customer ? `${meta.customer}` : '',
        meta.style ? `${meta.style}` : ''
      ].filter(Boolean).join(' - ') || 'Fiche sans nom';

      const finalName = customName.trim() || `${autoLabel} (${timestamp})`;
      const newListItem: LocalSaveListItem = {
        id: 'save_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        name: finalName,
        savedAt: new Date().toISOString(),
        meta: { ...meta },
        globalPackingMode,
        maxSizesPerBox,
        forceSingleCarton,
        colors: JSON.parse(JSON.stringify(colors)) // deep copy
      };

      setSavedLists(prev => [newListItem, ...prev]);
      triggerToast(`💾 Fiche sauvegardée : "${finalName}"`, 'success');
      setSavesError(null);
      setSaveNameInput('');
    } catch (err: any) {
      setSavesError(`❌ Erreur lors de la sauvegarde : ${err?.message || err}`);
      triggerToast(`Erreur lors de la sauvegarde`, 'error');
    }
  };

  // Load a specified list from the database
  const handleLoadSavedList = (item: LocalSaveListItem) => {
    try {
      setMeta({ ...item.meta });
      setGlobalPackingMode(item.globalPackingMode);
      setMaxSizesPerBox(item.maxSizesPerBox);
      setForceSingleCarton(item.forceSingleCarton);
      setColors(JSON.parse(JSON.stringify(item.colors))); // deep copy
      setHasGenerated(false);
      setResults([]);
      triggerToast(`🔌 Fiche "${item.name}" rechargée !`, 'success');
      setSavesError(null);
    } catch (err: any) {
      setSavesError(`❌ Erreur lors du rechargement de la fiche : ${err?.message || err}`);
      triggerToast(`Erreur de chargement`, 'error');
    }
  };

  // Delete a list snapshot with inline double click protection
  const handleDeleteSavedList = (id: string, name: string) => {
    setSavedLists(prev => prev.filter(item => item.id !== id));
    setConfirmDeleteId(null);
    triggerToast(`🗑️ Sauvegarde "${name}" supprimée.`, 'info');
  };

  // Excel Exports
  const handleExcelExport = async () => {
    try {
      let activeResults = results;
      if (!hasGenerated || activeResults.length === 0) {
        activeResults = colors.map((c, idx) => {
          return computeColorResult(c, globalPackingMode, forceSingleCarton, maxSizesPerBox, idx);
        });
        setResults(activeResults);
        setHasGenerated(true);
      }

      // Filter based on selected colors
      const filteredResults = activeResults.filter(res => selectedExportColors.includes(res.nom));
      const resultsToExport = filteredResults.length > 0 ? filteredResults : activeResults;

      const sizesInputsMapping: { [colorIdx: number]: { tailles: string[]; D: { [size: string]: SizeDetails } } } = {};
      colors.forEach((c, idx) => {
        sizesInputsMapping[idx] = {
          tailles: c.tailles,
          D: c.sizes
        };
      });

      await exportToExcel(resultsToExport, meta, sizesInputsMapping, printColumns);
    } catch (err: any) {
      alert(`Erreur d'exportation Excel: ${err.message}`);
    }
  };

  // Print selections applying to printable style structures
  const handleTriggerPrint = () => {
    setIsPdfPrintSelectorOpen(false);

    // Filter printable nodes based on filters chosen
    const styleEl = document.createElement('style');
    styleEl.id = 'print-filter-styles';

    let css = '';
    if (!printSections.hdr) css += '.print-hdr { display: none !important; } ';
    if (!printSections.meta) css += '.print-meta { display: none !important; } ';
    if (!printSections.ind) css += '.print-ind-card { display: none !important; } ';
    if (!printSections.cpl) css += '.print-cpl-card { display: none !important; } ';
    if (!printSections.leg) css += '.print-legend { display: none !important; } ';
    if (!printSections.bk) css += '.print-bk-table { display: none !important; } ';
    if (!printSections.stats) css += '.print-stats-box { display: none !important; } ';
    if (!printSections.dim) css += '.print-dim-table { display: none !important; } ';

    if (!printColumns.ctn) css += '.col-ctn-index { display: none !important; } ';
    if (!printColumns.color) css += '.col-color-lbl { display: none !important; } ';
    if (!printColumns.sku) css += '.col-sku-lbl { display: none !important; } ';
    if (!printColumns.sizes) css += '.col-sizes-cells { display: none !important; } ';
    if (!printColumns.nbctn) css += '.col-nbctn-metric { display: none !important; } ';
    if (!printColumns.totalqty) css += '.col-totalqty-metric { display: none !important; } ';
    if (!printColumns.net) css += '.col-net-metric { display: none !important; } ';
    if (!printColumns.gross) css += '.col-gross-metric { display: none !important; } ';
    if (!printColumns.cbm) css += '.col-cbm-metric { display: none !important; } ';

    styleEl.innerHTML = `@media print { ${css} }`;
    document.head.appendChild(styleEl);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        styleEl.remove();
      }, 500);
    }, 200);
  };

  const handleOpenPdfPrintSelector = () => {
    if (!hasGenerated || results.length === 0) {
      const activeResults = colors.map((c, idx) => {
        return computeColorResult(c, globalPackingMode, forceSingleCarton, maxSizesPerBox, idx);
      });
      setResults(activeResults);
      setHasGenerated(true);
    }
    setIsPdfPrintSelectorOpen(true);
  };

  // SQL snapshots export & backup loading
  const handleExportSQL = () => {
    let activeResults = results;
    if (!hasGenerated || activeResults.length === 0) {
      activeResults = colors.map((c, idx) => {
        return computeColorResult(c, globalPackingMode, forceSingleCarton, maxSizesPerBox, idx);
      });
      setResults(activeResults);
      setHasGenerated(true);
    }

    const inputSizesMapping: { [colorIdx: number]: { tailles: string[]; D: { [size: string]: SizeDetails } } } = {};
    colors.forEach((c, idx) => {
      inputSizesMapping[idx] = {
        tailles: c.tailles,
        D: c.sizes
      };
    });

    const sqlStr = generateSQLString(
      meta,
      globalPackingMode,
      maxSizesPerBox,
      forceSingleCarton,
      colors.map(c => ({
        nom: c.nom,
        mode: c.mode,
        selectedPieceWeightModelName: c.selectedPieceWeightModelName,
        selectedCartonWeightModelName: c.selectedCartonWeightModelName,
        selectedDimModelName: c.selectedDimModelName
      })),
      inputSizesMapping,
      activeResults
    );

    const blob = new Blob([sqlStr], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedFilename = (meta.filename || 'SNAPSHOT')
      .replace(/[\/\\:*?"<>|]/g, '_')
      .replace(/\s+/g, '_');
    link.download = `${sanitizedFilename}_DB.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSqlFileSubmit = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setSqlStatus('⏳ Lecture du fichier SQL...');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const sqlText = e.target?.result as string;
        const parsed = parseSQLString(sqlText);

        const restoredMeta = { ...meta };
        const keyMap: { [key: string]: keyof OrderMeta } = {
          order: 'order',
          customer: 'customer',
          po: 'po',
          ref_client: 'refClient',
          invoice: 'invoice',
          style: 'style',
          style_number: 'styleNumber',
          sku: 'sku',
          yarn: 'yarn',
          composition: 'composition',
          destination: 'destination',
          address: 'address',
          pays: 'pays',
          port_depart: 'portDepart',
          port_arrivee: 'portArrivee'
        };

        Object.entries(parsed.cfg).forEach(([k, val]) => {
          const mapKey = keyMap[k];
          if (mapKey) restoredMeta[mapKey] = val;
        });

        if (parsed.cfg.filename) restoredMeta.filename = parsed.cfg.filename;
        if (parsed.cfg.global_mode) setGlobalPackingMode(parsed.cfg.global_mode as any);
        if (parsed.cfg.max_sizes) setMaxSizesPerBox(parseInt(parsed.cfg.max_sizes) || 3);
        if (parsed.cfg.force_single_ctn) setForceSingleCarton(parsed.cfg.force_single_ctn === '1');

        if (parsed.colors.length === 0) {
          throw new Error('Données colors introuvables dans le fichier de sauvegarde.');
        }

        // Reconstruct dynamic colors input details
        const reconstructedColors: ColorConfig[] = [];

        parsed.colors.forEach((colRow) => {
          const sizesMap = parsed.sizes[colRow.id] || {};
          const sizeIndexes = Object.keys(sizesMap).map(Number).sort((a, b) => a - b);

          const sizesListNames = sizeIndexes.map(idx => sizesMap[idx].name);
          const sizesDict: { [sz: string]: SizeDetails } = {};

          sizesListNames.forEach((name, idx) => {
            const raw = sizesMap[sizeIndexes[idx]] || {};
            const qtyTot = typeof raw.qtyTot !== 'undefined' ? Number(raw.qtyTot) : (typeof raw.qty !== 'undefined' ? Number(raw.qty) : (typeof raw.qty_tot !== 'undefined' ? Number(raw.qty_tot) : 0));
            const cap = typeof raw.cap !== 'undefined' ? Number(raw.cap) : 25;
            const wPiece = typeof raw.wPiece !== 'undefined' ? Number(raw.wPiece) : (typeof raw.w_piece !== 'undefined' ? Number(raw.w_piece) : 0.25);
            const wCarton = typeof raw.wCarton !== 'undefined' ? Number(raw.wCarton) : (typeof raw.w_carton !== 'undefined' ? Number(raw.w_carton) : 0.8);
            const dimL = typeof raw.dimL !== 'undefined' ? Number(raw.dimL) : (typeof raw.dim_L !== 'undefined' ? Number(raw.dim_L) : 61);
            const diml = typeof raw.diml !== 'undefined' ? Number(raw.diml) : (typeof raw.dim_l !== 'undefined' ? Number(raw.dim_l) : 41);
            const dimH = typeof raw.dimH !== 'undefined' ? Number(raw.dimH) : (typeof raw.dim_h !== 'undefined' ? Number(raw.dim_h) : 30);
            const sku = raw.sku || '';

            sizesDict[name] = {
              qtyTot: isNaN(qtyTot) ? 0 : qtyTot,
              cap: isNaN(cap) ? 25 : cap,
              wPiece: isNaN(wPiece) ? 0.25 : wPiece,
              wCarton: isNaN(wCarton) ? 0.8 : wCarton,
              cbmUnit: ((isNaN(dimL) ? 61 : dimL) * (isNaN(diml) ? 41 : diml) * (isNaN(dimH) ? 30 : dimH)) / 1000000,
              dimL: isNaN(dimL) ? 61 : dimL,
              diml: isNaN(diml) ? 41 : diml,
              dimH: isNaN(dimH) ? 30 : dimH,
              sku: sku
            };
          });

          // Model restore & auto-detector logic
          let selectedPieceWeightModelName = (colRow as any).selectedPieceWeightModelName;
          if ((!selectedPieceWeightModelName || selectedPieceWeightModelName === '') && Object.keys(sizesDict).length > 0) {
            const weights = Object.values(sizesDict).map(s => s.wPiece);
            const uniqueWeight = weights.every(w => w === weights[0]) ? weights[0] : null;
            if (uniqueWeight !== null) {
              const matched = db.weight_piece_models.find(m => m.wPiece === uniqueWeight);
              if (matched) selectedPieceWeightModelName = matched.name;
            }
          }

          let selectedCartonWeightModelName = (colRow as any).selectedCartonWeightModelName;
          if ((!selectedCartonWeightModelName || selectedCartonWeightModelName === '') && Object.keys(sizesDict).length > 0) {
            const weights = Object.values(sizesDict).map(s => s.wCarton);
            const uniqueWeight = weights.every(w => w === weights[0]) ? weights[0] : null;
            if (uniqueWeight !== null) {
              const matched = db.weight_carton_models.find(m => m.wCarton === uniqueWeight);
              if (matched) selectedCartonWeightModelName = matched.name;
            }
          }

          let selectedDimModelName = (colRow as any).selectedDimModelName;
          if ((!selectedDimModelName || selectedDimModelName === '') && Object.keys(sizesDict).length > 0) {
            const sizesArray = Object.values(sizesDict);
            const firstVal = sizesArray[0];
            const isUniform = sizesArray.every(s => s.dimL === firstVal.dimL && s.diml === firstVal.diml && s.dimH === firstVal.dimH);
            if (isUniform) {
              const matched = db.dim_models.find(m => m.L === firstVal.dimL && m.l === firstVal.diml && m.h === firstVal.dimH);
              if (matched) selectedDimModelName = matched.name;
            }
          }

          reconstructedColors.push({
            nom: colRow.nom,
            mode: colRow.mode as any,
            tailles: sizesListNames,
            sizes: sizesDict,
            selectedPieceWeightModelName: selectedPieceWeightModelName || undefined,
            selectedCartonWeightModelName: selectedCartonWeightModelName || undefined,
            selectedDimModelName: selectedDimModelName || undefined
          });
        });

        setColors(reconstructedColors);
        setActiveColorIdx(0);
        setSqlStatus('✅ Restauration effectuée avec succès ! Génération en cours...');

        setTimeout(() => {
          setMeta(restoredMeta);
          setCustQuery(restoredMeta.customer);
          setIsSqlImportOpen(false);
          setSqlStatus(null);
          // Auto fire trigger calculation
          const output = reconstructedColors.map((c, idx) => {
            return computeColorResult(c, parsed.cfg.global_mode as any || globalPackingMode, parsed.cfg.force_single_ctn === '1', parseInt(parsed.cfg.max_sizes) || maxSizesPerBox, idx);
          });
          setResults(output);
          setHasGenerated(true);
        }, 1200);

      } catch (err: any) {
        setSqlStatus(`❌ Erreur d'importation: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  const activeResults = results.filter(res => selectedExportColors.includes(res.nom));

  // Grand totals mapping helpers
  const getGrandTotalsSummary = (targetResults = activeResults) => {
    let totC = 0;
    let totP = 0;
    let totN = 0;
    let totG = 0;
    let totV = 0;

    targetResults.forEach(res => {
      totC += res.totals.c;
      totP += res.totals.p;
      totN += res.totals.n;
      totG += res.totals.g;
      totV += res.totals.v;
    });

    return { c: totC, p: totP, n: totN, g: totG, v: totV };
  };

  const isStandardSizeAlwaysShown = (sizeName: string) => {
    const norm = sizeName.toUpperCase().trim();
    return ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '2 XL'].includes(norm);
  };

  // Render combined grid size headings list
  const getOverallUniqueSizes = () => {
    const list: string[] = [];
    colors.forEach(c => {
      if (selectedExportColors.length > 0 && !selectedExportColors.includes(c.nom)) {
        return;
      }
      c.tailles.forEach(t => {
        const qty = c.sizes[t]?.qtyTot || 0;
        const isAlways = isStandardSizeAlwaysShown(t);
        if ((isAlways || qty > 0) && !list.includes(t)) {
          list.push(t);
        }
      });
    });
    return list;
  };

  if (!isAuthenticated) {
    return <WelcomeScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  const grandTotals = getGrandTotalsSummary();
  const summaryUniqueSizes = getOverallUniqueSizes();

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-[#0a0d14] text-slate-100' : 'bg-[#f4f6fa] text-slate-900'} transition-colors duration-300 pb-12`}>
      
      {/* Dynamic Modal components */}
      {boxModalCtx?.isOpen && (
        <BoxModal
          isOpen={boxModalCtx.isOpen}
          sizeName={boxModalCtx.sizeName}
          colorName={boxModalCtx.colorName}
          initialDetails={boxModalCtx.initialDetails}
          onClose={() => setBoxModalCtx(null)}
          onSave={saveBoxDetailsModal}
        />
      )}

      {isMajBsdOpen && (
        <MajBsdModal
          isOpen={isMajBsdOpen}
          database={db}
          onClose={() => setIsMajBsdOpen(false)}
          onSaveDatabase={handleSaveDatabase}
        />
      )}

      {/* PDF Selection Print Overlay */}
      {isPdfPrintSelectorOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9500] backdrop-blur-xs px-4">
          <div className="bg-[#1a1d27] border border-amber-500/70 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-sm font-mono text-amber-500 font-bold uppercase">
                📄 CONFIGURATION DE L'IMPRESSION PDF
              </h3>
              <button
                onClick={() => setIsPdfPrintSelectorOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                  Sections à inclure :
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries({
                    hdr: "📋 En-tête document",
                    meta: "ℹ️ Infos commande",
                    ind: "📦 PL par couleur",
                    cpl: "📁 PL combinée",
                    leg: "🎨 Légende couleurs",
                    bk: "📊 Breakdown résumé",
                    stats: "📈 Stats globales",
                    dim: "📐 Gabarit carton"
                  }).map(([key, label]) => {
                    const active = (printSections as any)[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setPrintSections({ ...printSections, [key]: !active })}
                        className={`p-2.5 rounded-lg border text-left text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
                          active
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-slate-800 bg-[#222636] text-slate-400'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[10px] ${active ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-600'}`}>
                          {active && '✓'}
                        </div>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                  Colonnes du tableau à afficher :
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries({
                    ctn: "N° Carton",
                    color: "Couleur",
                    sku: "SKU",
                    sizes: "Pcs/Taille",
                    nbctn: "Cartons",
                    totalqty: "Total Qty",
                    net: "Poids Net",
                    gross: "Poids Brut",
                    cbm: "CBM m³"
                  }).map(([key, label]) => {
                    const active = (printColumns as any)[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setPrintColumns({ ...printColumns, [key]: !active })}
                        className={`p-2 rounded-lg border text-left text-[11px] font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                          active
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-slate-800 bg-[#222636] text-slate-400'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-sm border flex items-center justify-center text-[8px] ${active ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-600'}`}>
                          {active && '✓'}
                        </div>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Iframe sandbox printing warning */}
              <div className="bg-amber-500/10 border border-amber-500/25 p-3.5 rounded-xl text-xs space-y-1">
                <p className="text-amber-400 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                  ⚠️ CONSEIL POUR L'IMPRESSION (IFRAME) :
                </p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Si le bouton ci-dessous ne lance pas l'imprimante, c'est que l'aperçu de test AI Studio restreint l'accès. 
                  Veuillez ouvrir l'application dans son propre onglet via le bouton <b>"Ouvrir dans un nouvel onglet"</b> en haut à droite pour pouvoir exporter sans blocage !
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsPdfPrintSelectorOpen(false)}
                className="flex-1 py-2.5 border border-slate-700 text-slate-400 rounded-lg font-semibold text-xs hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                onClick={handleTriggerPrint}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-bold text-xs shadow-lg hover:shadow-xl hover:shadow-amber-500/15"
              >
                🖨️ IMPRIMER / PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Import Backups Modal */}
      {isSqlImportOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9500] backdrop-blur-xs px-4">
          <div className="bg-[#1a1d27] border border-blue-500/70 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-sm font-mono text-blue-400 font-bold uppercase">
                📥 CHARGER SNAPSHOT SQL
              </h3>
              <button
                onClick={() => setIsSqlImportOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="file"
              ref={sqlFileRef}
              accept=".sql"
              className="hidden"
              onChange={(e) => handleSqlFileSubmit(e.target.files)}
            />

            <div
              onClick={() => sqlFileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleSqlFileSubmit(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-505/5 p-8 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
            >
              <Upload className="w-10 h-10 text-blue-500" />
              <div className="text-center">
                <p className="text-xs text-slate-200 font-semibold mb-1">
                  Glissez votre fichier de snapshot .sql ici
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Ou cliquez pour parcourir vos dossiers locaux
                </p>
              </div>
            </div>

            {sqlStatus && (
              <div className="p-3 bg-slate-900 border border-slate-800 text-xs font-mono text-center rounded-lg text-blue-400">
                {sqlStatus}
              </div>
            )}

            <button
              onClick={() => setIsSqlImportOpen(false)}
              className="w-full py-2.5 border border-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-800 transition-all cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
      {/* HEADER & ACTIONS TOP BLOCK (STICKY) */}
      <div className={`sticky top-0 z-40 print:hidden transition-all duration-300 border-b pb-1.5 shadow-sm ${
        darkMode ? 'bg-[#0a0d14]/95 border-slate-800/80 shadow-black/15' : 'bg-[#f4f6fa]/95 border-slate-200/80'
      } backdrop-blur-md`}>
        {/* Sleek Top Bar containing GENERATE, Reset, Excel, PDF, SQL Export, SQL Import, Mode toggle */}
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7.5 h-7.5 bg-gradient-to-r from-[#ff5000] to-[#ff9900] rounded-lg flex items-center justify-center shadow-md shadow-orange-500/15">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-black tracking-wider uppercase font-sans ${darkMode ? 'text-white' : 'text-slate-900'}`}>Andry <span className="text-[#ff5000]">Nantenaina</span></span>
              <span className="text-[8px] font-mono tracking-widest text-[#94a3b8] -mt-0.5 uppercase">Logistique officer</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateList}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#ff5000] to-[#ff8a00] hover:brightness-110 text-white font-bold rounded-lg text-[11px] transition-all focus:outline-none flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10 hover:scale-[1.01] active:scale-[0.99] uppercase tracking-wider font-mono animate-pulse hover:animate-none"
            >
              <Calculator className="w-3.5 h-3.5 text-white" />
              <span>GÉNÉRER / COMPUTE</span>
            </button>

            {/* Admin / Utility actions moved from floating panel beside GÉNÉRER */}
            <button
              onClick={() => setIsMajBsdOpen(true)}
              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-semibold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 hover:scale-[1.02]"
              title="🗂️ MAJ BSD (Gabarits)"
            >
              <Database className="w-3 h-3" />
              <span className="hidden sm:inline">Gabarits</span>
            </button>

            <button
              onClick={() => setIsCapturingScreen(true)}
              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 font-semibold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 hover:scale-[1.02]"
              title="📸 CAPTURE D'ÉCRAN"
            >
              <Camera className="w-3 h-3" />
              <span className="hidden sm:inline">Capture</span>
            </button>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-500 hover:text-rose-400 font-semibold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 hover:scale-[1.02]"
              title="🚪 SE DÉCONNECTER"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>

            <div className="h-4 w-px bg-slate-800/60 dark:bg-slate-700/60 mx-0.5" />

            {results.length > 0 && (
              <button
                onClick={handleGenerateList}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
                  !hasGenerated
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-extrabold animate-pulse shadow-md shadow-amber-500/20'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-400'
                }`}
                title={!hasGenerated ? "Cliquez ici pour recalculer et appliquer vos modifications !" : "Les calculs sont à jour"}
              >
                <RefreshCw className={`w-3 h-3 ${!hasGenerated ? 'animate-spin' : ''}`} style={!hasGenerated ? { animationDuration: '2.5s' } : undefined} />
                <span>{!hasGenerated ? 'REFRESH REQUIS' : 'REFRESH'}</span>
              </button>
            )}

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 hover:text-red-400 font-semibold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1"
                title="Saisir à zéro"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Réinitialiser</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/40 p-0.5 rounded-lg transition-all">
                <span className="text-[9px] text-red-400 font-bold px-1 uppercase font-mono">OK?</span>
                <button
                  onClick={handleResetScreen}
                  className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded text-[9px] transition-all cursor-pointer"
                >
                  Oui
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-[9px] transition-all cursor-pointer"
                >
                  Non
                </button>
              </div>
            )}

            <div className="h-4 w-px bg-slate-800/60 dark:bg-slate-700/60 mx-0.5" />

            <button
              onClick={handleExcelExport}
              className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[#34d399] hover:scale-[1.02] cursor-pointer transition-all flex items-center gap-1"
              title="Exporter vers Microsoft Excel"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              <span>Excel</span>
            </button>

            <button
              onClick={handleOpenPdfPrintSelector}
              className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 hover:scale-[1.02] cursor-pointer transition-all flex items-center gap-1"
              title="Générer un PDF / Imprimer"
            >
              <FileText className="w-3 h-3 text-amber-500" />
              <span>PDF / Imprimer</span>
            </button>

            <div className="h-4 w-px bg-slate-800/60 dark:bg-slate-700/60 mx-0.5" />

            <button
              onClick={handleExportSQL}
              className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:scale-[1.02] cursor-pointer transition-all flex items-center gap-1"
              title="Exporter la base au format SQL"
            >
              <Database className="w-3 h-3 text-blue-400" />
              <span>SQL Export</span>
            </button>

            <button
              onClick={() => setIsSqlImportOpen(true)}
              className="px-2.5 py-1.5 bg-[#1f2430]/90 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              title="Restaurer à partir d'un fichier SQL"
            >
              <Upload className="w-3 h-3 text-slate-300" />
              <span>SQL Import</span>
            </button>

            <div className="h-4 w-px bg-slate-800/60 dark:bg-slate-700/60 mx-1" />

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-1.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                darkMode ? 'border-slate-800 bg-slate-900 text-amber-400 hover:text-white' : 'border-slate-300 bg-white text-slate-600 hover:text-black'
              }`}
              title={darkMode ? "Mode Clair" : "Mode Sombre"}
            >
              {darkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container workspace */}
      <main className="max-w-7xl mx-auto px-4 space-y-6 print:px-0 pb-44 pt-6 mb-12">

        {/* Mobile Header indicator explaining menu state */}
        <div className="lg:hidden flex items-center justify-between w-full p-3 border rounded-xl font-sans text-xs font-bold transition-all print:hidden shadow-xs border-dashed z-30 sticky top-[60px] bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-md border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4f8ef7] animate-pulse" />
            <span className="uppercase tracking-wider font-mono text-[11px]">
              {
                activeInputTab === 'meta' ? '📋 RÉFÉRENCES' : 
                activeInputTab === 'strategy' ? '⚙️ STRATÉGIE' : 
                activeInputTab === 'colors' ? '⌨️ SAISIE COLISAGE' : 
                activeInputTab === 'packing_list' ? '📦 PACKING LIST' : 
                activeInputTab === 'breakdown' ? '📊 BREAKDOWN' : 
                activeInputTab === 'summary' ? '📈 RECAPITULATIF' : '💾 SAUVEGARDES'
              }
            </span>
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-[#4f8ef7] cursor-pointer"
          >
            {isSidebarCollapsed ? '👁️ Afficher Rubans' : '🙈 Masquer Rubans'}
          </button>
        </div>

        {/* INPUT PANELS & SIDEBAR NAVIGATION RIBBONS */}
        <div className="flex flex-col lg:flex-row gap-6 print:hidden items-start">
          
          {/* SIDEBAR NAVIGATION: PETITS RUBANS À GAUCHE */}
          <div 
            className={`flex-shrink-0 transition-all duration-300 ease-in-out self-start z-30 
              ${isSidebarCollapsed ? 'hidden lg:flex lg:w-20' : 'w-full lg:w-64 flex'} 
              flex-col gap-2.5 sticky top-[135px] sm:top-[140px] lg:top-[75px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none border rounded-2xl p-3 
              ${darkMode ? 'bg-[#121620] border-slate-800/80' : 'bg-slate-50 border-slate-250/80 shadow-xs'}
            `}
          >
            {/* COLLAPSE/EXPAND TOGGLE HEADER - DESKTOP ONLY */}
            <div className={`hidden lg:flex items-center justify-between border-b pb-2 ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} ${isSidebarCollapsed ? 'justify-center border-none pb-0' : 'px-1 mb-1'}`}>
              {!isSidebarCollapsed && (
                <span className={`text-[10px] font-mono tracking-wider font-extrabold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  🧭 Navigation
                </span>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`p-1.5 rounded-lg border hover:scale-[1.05] active:scale-[0.95] cursor-pointer transition-all ${
                  darkMode
                    ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-black hover:bg-slate-100 shadow-xs'
                }`}
                title={isSidebarCollapsed ? "Déployer le panneau" : "Réduire le panneau"}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* SECTION 1: SAISIE (REFERENCE / STRATEGY / COLISAGE) */}
            <div className={`flex flex-col gap-1.5 ${isSidebarCollapsed ? 'items-center' : 'w-full'}`}>
              {!isSidebarCollapsed && (
                <div className={`px-1 text-[9px] font-mono tracking-wider font-extrabold uppercase mb-1 transition-colors select-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  ✍️ SAISIE
                </div>
              )}
              
              <div className={isSidebarCollapsed ? 'flex flex-col gap-2' : 'flex flex-col gap-1.5 w-full'}>
                {/* RIBBON 1: RÉFÉRENCES */}
                <button
                  onClick={() => setActiveInputTab('meta')}
                  className={`group flex items-center gap-3 transition-all border rounded-xl relative cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${
                    isSidebarCollapsed 
                      ? 'lg:w-12 lg:h-12 lg:justify-center p-0 lg:p-2' 
                      : 'p-2.5 text-left w-full'
                  } ${
                    activeInputTab === 'meta'
                      ? darkMode
                        ? 'bg-[#2a1305] border-[#ff5000]/50 text-[#ff5000] shadow-md shadow-[#ff5000]/10'
                        : 'bg-white border-[#ff5000] text-[#ff5000] shadow-sm shadow-[#ff5000]/10 font-bold'
                      : darkMode
                        ? 'bg-[#161a23] border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                  }`}
                  title="📋 RÉFÉRENCES : Coordonnées Commande"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-transform duration-300 ${
                      activeInputTab === 'meta' ? 'bg-[#ff5000] scale-y-100' : 'bg-slate-500 scale-y-0 group-hover:scale-y-50'
                    }`}
                  />
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${activeInputTab === 'meta' ? 'bg-[#ff5000]/10 text-[#ff5000]' : 'bg-slate-500/5 text-slate-500'} transition-colors ${isSidebarCollapsed ? 'ml-0' : 'ml-0.5'}`}>
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0 pr-1 select-none">
                      <div className="text-[10px] font-mono tracking-wider font-extrabold uppercase truncate">
                        📋 RÉFÉRENCES
                      </div>
                      <div className={`text-[9px] hidden lg:block mt-0.5 font-sans truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Commande & Clients
                      </div>
                    </div>
                  )}
                  {!isSidebarCollapsed && (
                    <ChevronRight className={`w-3 h-3 ml-auto hidden lg:block transition-all duration-200 ${activeInputTab === 'meta' ? 'translate-x-[2px] text-[#ff5000]' : 'text-slate-600'}`} />
                  )}
                </button>

                {/* RIBBON 2: STRATÉGIE */}
                <button
                  onClick={() => setActiveInputTab('strategy')}
                  className={`group flex items-center gap-3 transition-all border rounded-xl relative cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${
                    isSidebarCollapsed 
                      ? 'lg:w-12 lg:h-12 lg:justify-center p-0 lg:p-2' 
                      : 'p-2.5 text-left w-full'
                  } ${
                    activeInputTab === 'strategy'
                      ? darkMode
                        ? 'bg-[#2a1305] border-[#ff5000]/50 text-[#ff5000] shadow-md shadow-[#ff5000]/10'
                        : 'bg-white border-[#ff5000] text-[#ff5000] shadow-sm shadow-[#ff5000]/10 font-bold'
                      : darkMode
                        ? 'bg-[#161a23] border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                  }`}
                  title="⚙️ STRATÉGIE : Normes d'Emballage"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-transform duration-300 ${
                      activeInputTab === 'strategy' ? 'bg-[#ff5000] scale-y-100' : 'bg-slate-500 scale-y-0 group-hover:scale-y-50'
                    }`}
                  />
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${activeInputTab === 'strategy' ? 'bg-[#ff5000]/10 text-[#ff5000]' : 'bg-slate-500/5 text-slate-500'} transition-colors ${isSidebarCollapsed ? 'ml-0' : 'ml-0.5'}`}>
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0 pr-1 select-none">
                      <div className="text-[10px] font-mono tracking-wider font-extrabold uppercase truncate">
                        ⚙️ STRATÉGIE
                      </div>
                      <div className={`text-[9px] hidden lg:block mt-0.5 font-sans truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Normes d'Emballage
                      </div>
                    </div>
                  )}
                  {!isSidebarCollapsed && (
                    <ChevronRight className={`w-3 h-3 ml-auto hidden lg:block transition-all duration-200 ${activeInputTab === 'strategy' ? 'translate-x-[2px] text-[#ff5000]' : 'text-slate-600'}`} />
                  )}
                </button>

                {/* RIBBON 3: COLISAGE */}
                <button
                  onClick={() => setActiveInputTab('colors')}
                  className={`group flex items-center gap-3 transition-all border rounded-xl relative cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${
                    isSidebarCollapsed 
                      ? 'lg:w-12 lg:h-12 lg:justify-center p-0 lg:p-2' 
                      : 'p-2.5 text-left w-full'
                  } ${
                    activeInputTab === 'colors'
                      ? darkMode
                        ? 'bg-[#2a1305] border-[#ff5000]/50 text-[#ff5000] shadow-md shadow-[#ff5000]/10'
                        : 'bg-white border-[#ff5000] text-[#ff5000] shadow-sm shadow-[#ff5000]/10 font-bold'
                      : darkMode
                        ? 'bg-[#161a23] border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                  }`}
                  title="⌨️ GRILLE SAISIE : Colisage par Couleur"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-transform duration-300 ${
                      activeInputTab === 'colors' ? 'bg-[#ff5000] scale-y-100' : 'bg-slate-500 scale-y-0 group-hover:scale-y-50'
                    }`}
                  />
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${activeInputTab === 'colors' ? 'bg-[#ff5000]/10 text-[#ff5000]' : 'bg-slate-500/5 text-slate-500'} transition-colors ${isSidebarCollapsed ? 'ml-0' : 'ml-0.5'}`}>
                    <Grid className="w-3.5 h-3.5" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0 pr-1 select-none">
                      <div className="text-[10px] font-mono tracking-wider font-extrabold uppercase truncate">
                        ⌨️ GRILLE SAISIE
                      </div>
                      <div className={`text-[9px] hidden lg:block mt-0.5 font-sans truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Colisage par Couleur
                      </div>
                    </div>
                  )}
                  {!isSidebarCollapsed && (
                    <ChevronRight className={`w-3 h-3 ml-auto hidden lg:block transition-all duration-200 ${activeInputTab === 'colors' ? 'translate-x-[2px] text-[#ff5000]' : 'text-slate-600'}`} />
                  )}
                </button>
              </div>
            </div>

            {/* SEPARATOR */}
            <div className={`h-px my-1 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-200'} ${isSidebarCollapsed ? 'w-8' : 'w-full'}`} />

            {/* SECTION 2: SUIVI (PACKING LIST / BREAKDOWN / RECAP / SAUVEGARDES) */}
            <div className={`flex flex-col gap-1.5 ${isSidebarCollapsed ? 'items-center' : 'w-full'}`}>
              {!isSidebarCollapsed && (
                <div className={`px-1 text-[9px] font-mono tracking-wider font-extrabold uppercase mb-1 transition-colors select-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  📊 SUIVI & LIVRABLES
                </div>
              )}
              
              <div className={isSidebarCollapsed ? 'flex flex-col gap-2' : 'flex flex-col gap-1.5 w-full'}>
                {/* RIBBON 4: PACKING LIST */}
                <button
                  onClick={() => setActiveInputTab('packing_list')}
                  className={`group flex items-center gap-3 transition-all border rounded-xl relative cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${
                    isSidebarCollapsed 
                      ? 'lg:w-12 lg:h-12 lg:justify-center p-0 lg:p-2' 
                      : 'p-2.5 text-left w-full'
                  } ${
                    activeInputTab === 'packing_list'
                      ? darkMode
                        ? 'bg-[#2a1305] border-[#ff5000]/50 text-[#ff5000] shadow-md shadow-[#ff5000]/10'
                        : 'bg-white border-[#ff5000] text-[#ff5000] shadow-sm shadow-[#ff5000]/10 font-bold'
                      : darkMode
                        ? 'bg-[#161a23] border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                  }`}
                  title="📦 PACKING LIST : Fiches de Colisage"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-transform duration-300 ${
                      activeInputTab === 'packing_list' ? 'bg-[#ff5000] scale-y-100' : 'bg-slate-500 scale-y-0 group-hover:scale-y-50'
                    }`}
                  />
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${activeInputTab === 'packing_list' ? 'bg-[#ff5000]/10 text-[#ff5000]' : 'bg-slate-500/5 text-slate-500'} transition-colors ${isSidebarCollapsed ? 'ml-0' : 'ml-0.5'}`}>
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0 pr-1 select-none">
                      <div className="text-[10px] font-mono tracking-wider font-extrabold uppercase truncate">
                        📦 PACKING LIST
                      </div>
                      <div className={`text-[9px] hidden lg:block mt-0.5 font-sans truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Fiches de Colisage
                      </div>
                    </div>
                  )}
                  {!isSidebarCollapsed && (
                    <ChevronRight className={`w-3 h-3 ml-auto hidden lg:block transition-all duration-200 ${activeInputTab === 'packing_list' ? 'translate-x-[2px] text-[#ff5000]' : 'text-slate-600'}`} />
                  )}
                </button>

                {/* RIBBON 5: COLOR/SIZE BREAKDOWN */}
                <button
                  onClick={() => setActiveInputTab('breakdown')}
                  className={`group flex items-center gap-3 transition-all border rounded-xl relative cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${
                    isSidebarCollapsed 
                      ? 'lg:w-12 lg:h-12 lg:justify-center p-0 lg:p-2' 
                      : 'p-2.5 text-left w-full'
                  } ${
                    activeInputTab === 'breakdown'
                      ? darkMode
                        ? 'bg-[#2a1305] border-[#ff5000]/50 text-[#ff5000] shadow-md shadow-[#ff5000]/10'
                        : 'bg-white border-[#ff5000] text-[#ff5000] shadow-sm shadow-[#ff5000]/10 font-bold'
                      : darkMode
                        ? 'bg-[#161a23] border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                  }`}
                  title="📊 BREAKDOWN : Résumé Couleur/Taille"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-transform duration-300 ${
                      activeInputTab === 'breakdown' ? 'bg-[#ff5000] scale-y-100' : 'bg-slate-500 scale-y-0 group-hover:scale-y-50'
                    }`}
                  />
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${activeInputTab === 'breakdown' ? 'bg-[#ff5000]/10 text-[#ff5000]' : 'bg-slate-500/5 text-slate-500'} transition-colors ${isSidebarCollapsed ? 'ml-0' : 'ml-0.5'}`}>
                    <Grid className="w-3.5 h-3.5" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0 pr-1 select-none">
                      <div className="text-[10px] font-mono tracking-wider font-extrabold uppercase truncate">
                        📊 BREAKDOWN
                      </div>
                      <div className={`text-[9px] hidden lg:block mt-0.5 font-sans truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Résumé Couleur/Taille
                      </div>
                    </div>
                  )}
                  {!isSidebarCollapsed && (
                    <ChevronRight className={`w-3 h-3 ml-auto hidden lg:block transition-all duration-200 ${activeInputTab === 'breakdown' ? 'translate-x-[2px] text-[#ff5000]' : 'text-slate-600'}`} />
                  )}
                </button>

                {/* RIBBON 6: RECAPITULATIF */}
                <button
                  onClick={() => setActiveInputTab('summary')}
                  className={`group flex items-center gap-3 transition-all border rounded-xl relative cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${
                    isSidebarCollapsed 
                      ? 'lg:w-12 lg:h-12 lg:justify-center p-0 lg:p-2' 
                      : 'p-2.5 text-left w-full'
                  } ${
                    activeInputTab === 'summary'
                      ? darkMode
                        ? 'bg-[#2a1305] border-[#ff5000]/50 text-[#ff5000] shadow-md shadow-[#ff5000]/10'
                        : 'bg-white border-[#ff5000] text-[#ff5000] shadow-sm shadow-[#ff5000]/10 font-bold'
                      : darkMode
                        ? 'bg-[#161a23] border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                  }`}
                  title="📈 RECAPITULATIF : Résumé & Analyses"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-transform duration-300 ${
                      activeInputTab === 'summary' ? 'bg-[#ff5000] scale-y-100' : 'bg-slate-500 scale-y-0 group-hover:scale-y-50'
                    }`}
                  />
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${activeInputTab === 'summary' ? 'bg-[#ff5000]/10 text-[#ff5000]' : 'bg-slate-500/5 text-slate-500'} transition-colors ${isSidebarCollapsed ? 'ml-0' : 'ml-0.5'}`}>
                    <PieChart className="w-3.5 h-3.5" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0 pr-1 select-none">
                      <div className="text-[10px] font-mono tracking-wider font-extrabold uppercase truncate">
                        📈 RECAP
                      </div>
                      <div className={`text-[9px] hidden lg:block mt-0.5 font-sans truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Résumé & Analyses
                      </div>
                    </div>
                  )}
                  {!isSidebarCollapsed && (
                    <ChevronRight className={`w-3 h-3 ml-auto hidden lg:block transition-all duration-200 ${activeInputTab === 'summary' ? 'translate-x-[2px] text-[#ff5000]' : 'text-slate-600'}`} />
                  )}
                </button>

                {/* RIBBON 7: SAUVEGARDES */}
                <button
                  onClick={() => setActiveInputTab('saves')}
                  className={`group flex items-center gap-3 transition-all border rounded-xl relative cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${
                    isSidebarCollapsed 
                      ? 'lg:w-12 lg:h-12 lg:justify-center p-0 lg:p-2' 
                      : 'p-2.5 text-left w-full'
                  } ${
                    activeInputTab === 'saves'
                      ? darkMode
                        ? 'bg-[#2a1305] border-[#ff5000]/50 text-[#ff5000] shadow-md shadow-[#ff5000]/10'
                        : 'bg-white border-[#ff5000] text-[#ff5000] shadow-sm shadow-[#ff5000]/15 font-bold'
                      : darkMode
                        ? 'bg-[#161a23] border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                  }`}
                  title="💾 SAUVEGARDES : Sauvegarde & Historique"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-transform duration-300 ${
                      activeInputTab === 'saves' ? 'bg-[#ff5000] scale-y-100' : 'bg-slate-50 scale-y-0 group-hover:scale-y-50'
                    }`}
                  />
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${activeInputTab === 'saves' ? 'bg-[#ff5000]/10 text-[#ff5000]' : 'bg-slate-500/5 text-slate-500'} transition-colors ${isSidebarCollapsed ? 'ml-0' : 'ml-0.5'}`}>
                    <History className="w-3.5 h-3.5" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0 pr-1 select-none">
                      <div className="text-[10px] font-mono tracking-wider font-extrabold uppercase truncate">
                        💾 SAUVEGARDES
                      </div>
                      <div className={`text-[9px] hidden lg:block mt-0.5 font-sans truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Sauvegarde & Historique
                      </div>
                    </div>
                  )}
                  {!isSidebarCollapsed && (
                    <ChevronRight className={`w-3 h-3 ml-auto hidden lg:block transition-all duration-200 ${activeInputTab === 'saves' ? 'translate-x-[2px] text-[#ff5000]' : 'text-slate-600'}`} />
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* MAIN WORKSHEET CONTENT PANEL */}
          <div className="flex-1 w-full min-w-0 overflow-visible">
            <AnimatePresence mode="wait">
              {activeInputTab === 'meta' && (
                <motion.div
                  key="meta-section"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* ORDER METADATA FRAME */}
                  <div className={`rounded-xl border p-5 ${darkMode ? 'bg-[#161a23] border-slate-800' : 'bg-white border-slate-200'} space-y-4 transition-all duration-300 shadow-sm`}>
                    
                    {/* Plain Static Styled Header */}
                    <div className="flex items-center gap-2 border-b border-dashed pb-3 border-slate-800/60">
                      <div className="w-2 h-4 bg-[#ff5000] rounded-sm" />
                      <h2 className={`text-xs font-mono font-bold tracking-wider ${darkMode ? 'text-slate-100' : 'text-slate-705'} uppercase`}>
                        📋 Informations Commande & Références
                      </h2>
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Sub-section: References */}
                      <div className="space-y-4">
              <div className="text-[10px] font-mono tracking-widest text-[#ff5000] font-bold uppercase flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5" /> Références En-têtes
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Order / Commande</label>
                  <input
                    type="text"
                    value={meta.order}
                    onChange={(e) => handleMetaChange('order', e.target.value)}
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 focus:outline-none transition-all ${
                      darkMode ? 'bg-[#1f2430] border-slate-800 text-white focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20' : 'bg-[#f4f6fb] border-slate-350 text-slate-900 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20'
                    }`}
                    placeholder="ex: 2630001AA"
                  />
                </div>

                <div className="flex flex-col gap-1 relative">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Customer / Client</label>
                  <input
                    type="text"
                    value={meta.customer}
                    onChange={(e) => handleMetaChange('customer', e.target.value)}
                    onFocus={() => { if (meta.customer) setShowCustDropdown(true); }}
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 focus:outline-none transition-all ${
                      darkMode ? 'bg-[#1f2430] border-slate-800 text-white focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20' : 'bg-[#f4f6fb] border-slate-350 text-slate-900 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20'
                    }`}
                    placeholder="ex: Johnnie-O"
                    autoComplete="off"
                  />

                  {/* Autocomplete sugerences */}
                  {showCustDropdown && (
                    <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border shadow-xl max-h-48 overflow-y-auto ${
                      darkMode ? 'bg-[#1a1d27] border-slate-700' : 'bg-white border-slate-300'
                    }`}>
                      {custSuggestions.map((c, i) => (
                        <div
                          key={i}
                          onClick={() => handleSelectCustomerSuggestion(c)}
                          className="px-3 py-2 text-xs font-mono hover:bg-blue-500 hover:text-white cursor-pointer transition-colors"
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">PO# Client</label>
                  <input
                    type="text"
                    value={meta.po}
                    onChange={(e) => handleMetaChange('po', e.target.value)}
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 focus:outline-none transition-all ${
                      darkMode ? 'bg-[#1f2430] border-slate-800 text-white focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20' : 'bg-[#f4f6fb] border-slate-350 text-slate-900 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20'
                    }`}
                    placeholder="ex: 08788-00"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-amber-500 uppercase font-semibold">Ref Client ★</label>
                  <input
                    type="text"
                    value={meta.refClient}
                    onChange={(e) => handleMetaChange('refClient', e.target.value)}
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 focus:outline-none transition-all ${
                      darkMode
                        ? 'bg-[#1f2430]/60 border-amber-900/40 text-white focus:border-amber-500'
                        : 'bg-amber-500/5 border-amber-300 text-slate-900 focus:border-amber-500'
                    }`}
                    placeholder="ex: RC-2025-001"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section: Order Details */}
            <div className="space-y-4 pt-2">
              <div className="text-[10px] font-mono tracking-widest text-[#ff5000] font-bold uppercase flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5" /> Informations de commande
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Row 1 */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Style N°</label>
                  <input
                    type="text"
                    value={meta.style}
                    onChange={(e) => handleMetaChange('style', e.target.value)}
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 focus:outline-none transition-all ${
                      darkMode ? 'bg-[#1f2430] border-slate-800 text-white focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20' : 'bg-[#f4f6fb] border-slate-350 text-slate-900 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20'
                    }`}
                    placeholder="ex: AMANDA"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-amber-500 uppercase font-semibold">Style Number ★</label>
                  <input
                    type="text"
                    value={meta.styleNumber}
                    onChange={(e) => handleMetaChange('styleNumber', e.target.value)}
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 focus:outline-none transition-all ${
                      darkMode
                        ? 'bg-[#1f2430]/60 border-amber-900/40 text-white focus:border-amber-500'
                        : 'bg-amber-500/5 border-amber-300 text-slate-900 focus:border-amber-500'
                    }`}
                    placeholder="ex: JWSW100150"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-amber-500 uppercase font-semibold">SKU Global ★</label>
                  <input
                    type="text"
                    value={meta.sku}
                    onChange={(e) => handleMetaChange('sku', e.target.value)}
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 focus:outline-none transition-all ${
                      darkMode
                        ? 'bg-[#1f2430]/60 border-amber-900/40 text-white focus:border-amber-500'
                        : 'bg-amber-500/5 border-amber-300 text-slate-900 focus:border-amber-500'
                    }`}
                    placeholder="ex: SKU-100150"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-amber-500 uppercase font-semibold">Yarn / Fil ★</label>
                  <input
                    type="text"
                    value={meta.yarn}
                    onChange={(e) => handleMetaChange('yarn', e.target.value)}
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 focus:outline-none transition-all ${
                      darkMode
                        ? 'bg-[#1f2430]/60 border-amber-900/40 text-white focus:border-amber-500'
                        : 'bg-amber-500/5 border-amber-300 text-slate-900 focus:border-amber-500'
                    }`}
                    placeholder="ex: 100% Cotton"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-amber-500 uppercase font-semibold">Composition ★</label>
                  <input
                    type="text"
                    value={meta.composition}
                    onChange={(e) => handleMetaChange('composition', e.target.value)}
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 focus:outline-none transition-all ${
                      darkMode
                        ? 'bg-[#1f2430]/60 border-amber-900/40 text-white focus:border-amber-500'
                        : 'bg-amber-500/5 border-amber-300 text-slate-900 focus:border-amber-500'
                    }`}
                    placeholder="ex: 80% Cotton 20% Poly"
                  />
                </div>

                {/* Row 2 */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-amber-500 uppercase font-semibold">Destination ★</label>
                  <input
                    type="text"
                    value={meta.destination}
                    onChange={(e) => handleMetaChange('destination', e.target.value)}
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 focus:outline-none transition-all ${
                      darkMode
                        ? 'bg-[#1f2430]/60 border-amber-900/40 text-white focus:border-amber-500'
                        : 'bg-amber-500/5 border-amber-300 text-slate-900 focus:border-amber-500'
                    }`}
                    placeholder="ex: New York"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Fichier Export</label>
                  <input
                    type="text"
                    value={meta.filename}
                    onChange={(e) => handleMetaChange('filename', e.target.value)}
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 focus:outline-none transition-all ${
                      darkMode ? 'bg-[#1f2430] border-slate-800 text-white focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20' : 'bg-[#f4f6fb] border-slate-350 text-slate-900 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20'
                    }`}
                    placeholder="Nom automatique"
                  />
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Couleur(s) (Auto)</label>
                  <input
                    type="text"
                    value={colors.map(c => c.nom).filter(Boolean).join(', ')}
                    disabled
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 font-medium opacity-70 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-[#ff5000]/85' : 'bg-slate-100 border-slate-300 text-[#ff5000]'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Quantité Totale (Auto)</label>
                  <input
                    type="text"
                    value={meta.qty}
                    disabled
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 font-medium opacity-70 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-emerald-400' : 'bg-slate-100 border-slate-300 text-emerald-600'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-amber-500 flex items-center gap-1 pt-1">
              <Info className="w-3.5 h-3.5" />
              <span>★ = Paramètres requis demandés par le tableau de colisage client.</span>
            </div>
                  </div>
                </div>
              </motion.div>
            )}

              {activeInputTab === 'strategy' && (
                <motion.div
                  key="strategy-section"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* PACKING STRATEGY FRAME */}
                  <div className={`rounded-xl border p-5 ${darkMode ? 'bg-[#161a23] border-slate-800' : 'bg-white border-slate-200'} space-y-4 transition-all duration-300 shadow-sm`}>
                    
                    {/* Plain Static Styled Header */}
                    <div className="flex items-center gap-2 border-b border-dashed pb-3 border-slate-800/60">
                      <div className="w-2 h-4 bg-orange-500 rounded-sm" />
                      <h2 className={`text-xs font-mono font-bold tracking-wider ${darkMode ? 'text-slate-100' : 'text-slate-705'} uppercase`}>
                        ⚙️ Stratégie de Colisage et d'Emballage
                      </h2>
                    </div>

                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Solid Mode card */}
              <div
                onClick={() => handleSelectPackingMode('strict_solide')}
                className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all flex items-start gap-3 ${
                  globalPackingMode === 'strict_solide'
                    ? 'border-[#ff5000] bg-[#ff5000]/5 text-[#ff5000]'
                    : 'border-slate-800/80 bg-slate-900/20 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="p-2.5 bg-[#ff5000] rounded-lg text-white">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-mono tracking-tight text-white uppercase">Solid Pack Strict</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mode Colisage Solide. Chaque carton contient exclusivement des pièces d'une seule et unique taille.
                  </p>
                </div>
              </div>

              {/* Mixed Mode card */}
              <div
                onClick={() => handleSelectPackingMode('mixte_autorise')}
                className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all flex items-start gap-3 ${
                  globalPackingMode === 'mixte_autorise'
                    ? 'border-purple-500 bg-purple-500/5 text-purple-400'
                    : 'border-slate-800/80 bg-slate-900/20 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="p-2.5 bg-purple-500 rounded-lg text-white">
                  <Sliders className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-mono tracking-tight text-white uppercase">Mixed Pack Autorisé</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Les fragments restants sont intelligemment regroupés dans des cartons mixtes contenant plusieurs tailles.
                  </p>
                </div>
              </div>

              {/* Unique mixed config */}
              <div className="bg-[#1f2430]/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300 font-semibold uppercase">Forcer 1 carton unique</span>
                  <button
                    onClick={() => {
                      setForceSingleCarton(!forceSingleCarton);
                      setHasGenerated(false);
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
                      forceSingleCarton
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {forceSingleCarton ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Si activé, toutes les couleurs et tailles calculées sont injectées dans un unique et seul carton.
                </p>
              </div>
            </div>

            {/* Variable sizes mixed selection */}
            <AnimatePresence>
              {globalPackingMode === 'mixte_autorise' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#222636]/40 border border-slate-800 rounded-lg p-3 flex items-center gap-3"
                >
                  <span className="text-xs font-mono font-semibold text-purple-400">
                    Max tailles différentes par carton mixte :
                  </span>
                  <div className="flex gap-2">
                    {[2, 3, 4, 99].map(num => (
                      <button
                        key={num}
                        onClick={() => {
                          setMaxSizesPerBox(num);
                          setHasGenerated(false);
                        }}
                        className={`px-3.5 py-1 text-xs font-mono font-bold rounded-lg cursor-pointer transition-all ${
                          maxSizesPerBox === num
                            ? 'bg-purple-500 border border-purple-500 text-white'
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}
                      >
                        {num === 99 ? 'Toutes' : `${num} tailles`}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

              {activeInputTab === 'colors' && (() => {
                const activeColorConfig = colors[activeColorIdx];
                const activeColorResult = activeColorConfig ? computeColorResult(
                  activeColorConfig,
                  globalPackingMode,
                  forceSingleCarton,
                  maxSizesPerBox,
                  activeColorIdx
                ) : null;
                return (
                  <motion.div
                    key="colors-section"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.15 }}
                  >
                  {/* SPREADSHEET COLORS EDITOR */}
                  <div className={`rounded-xl border p-5 ${darkMode ? 'bg-[#121522] border-slate-800/80 shadow-black/25' : 'bg-white border-slate-200'} space-y-4 transition-all duration-300 shadow-sm`}>
                    
                    {/* Plain Static Styled Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-dashed pb-3 border-slate-200/50 dark:border-slate-800/60 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-4 bg-[#ff5000] rounded-sm" />
                        <h2 className={`text-xs font-sans font-bold tracking-wider ${darkMode ? 'text-slate-100' : 'text-slate-700'} uppercase`}>
                          ⌨️ Saisie des colisages par Couleur
                        </h2>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-[10px] sm:text-[11px] font-sans font-semibold">
                        <span className="text-xs">📋</span>
                        <span>Astuce : Vous pouvez copier-coller des données directement depuis Excel (Ctrl+V) sur la grille !</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Config workspace tabs */}
                      <div className={`flex flex-wrap items-center justify-between gap-3 p-2 border rounded-xl transition-all duration-300 ${
                        darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100/60 border-slate-200'
                      }`}>
                        <div className="flex flex-wrap gap-1.5">
                          {colors.map((c, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setActiveColorIdx(idx);
                              }}
                              className={`px-3.5 py-2 rounded-lg text-xs font-sans font-bold transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                                activeColorIdx === idx
                                  ? darkMode
                                    ? 'bg-[#2a1305] border border-[#ff5000]/50 text-[#ff5000] font-extrabold shadow-md'
                                    : 'bg-[#ff5000]/5 border border-[#ff5000]/60 text-[#ff5000] font-extrabold shadow-sm'
                                  : darkMode
                                    ? 'bg-[#1a1d27] border border-slate-800/50 text-slate-400 hover:text-white hover:border-slate-700'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-950 hover:border-slate-350 shadow-xs'
                              }`}
                            >
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                              <span className="truncate max-w-[115px]">{c.nom || `COULEUR ${idx + 1}`}</span>
                              {(() => {
                                const sum = c.tailles.reduce((acc, t) => acc + (c.sizes[t]?.qtyTot || 0), 0);
                                if (sum > 0) {
                                  return (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono leading-none ${
                                      activeColorIdx === idx
                                        ? 'bg-[#ff5000]/20 text-[#ff5000] font-black'
                                        : 'bg-slate-500/10 text-slate-400'
                                    }`}>
                                      {sum}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleAddColorTab}
                            className="px-3 py-1.5 bg-[#ff5000]/10 hover:bg-[#ff5000]/20 border border-[#ff5000]/30 text-[#ff5000] font-sans font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> ＋ Couleur
                          </button>
                          <button
                            onClick={handleRemoveActiveColorTab}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> － Couleur
                          </button>
                        </div>
                      </div>

            {/* Active Tab Workspace Panel */}
            {colors[activeColorIdx] && (
              <div className="space-y-4 pt-1 animate-fadeIn">
                <div className={`flex flex-wrap items-center gap-4 justify-between border rounded-xl p-4 transition-all duration-300 ${
                  darkMode ? 'bg-[#1f2430]/30 border-slate-800/50' : 'bg-[#f4f6fb]/50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-md border border-slate-700" style={{ backgroundColor: PALETTE[activeColorIdx % PALETTE.length] }} />
                    <input
                      type="text"
                      value={colors[activeColorIdx].nom}
                      onChange={(e) => handleUpdateColorName(e.target.value)}
                      className={`text-sm font-mono font-bold uppercase py-1 border-b border-dashed focus:border-[#ff5000] bg-transparent focus:outline-none transition-colors ${
                        darkMode ? 'border-slate-700 text-white' : 'border-slate-300 text-slate-800'
                      }`}
                      placeholder="NOM COULEUR"
                    />
                    <span className="text-[10px] text-slate-500 font-mono italic">(Saisissez pour renommer)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">MODE :</span>
                    <button
                      onClick={() => handleUpdateTabMode('strict_solide')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        colors[activeColorIdx].mode === 'strict_solide'
                          ? 'bg-[#ff5000] border border-[#ff5000] text-white shadow-md'
                          : darkMode
                            ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                            : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                      }`}
                    >
                      📦 SOLID
                    </button>
                    <button
                      onClick={() => handleUpdateTabMode('mixte_autorise')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        colors[activeColorIdx].mode === 'mixte_autorise'
                          ? 'bg-purple-500 border border-purple-500 text-white shadow-md'
                          : darkMode
                            ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                            : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                      }`}
                    >
                      🔀 MIXED
                    </button>
                    <button
                      onClick={() => handleUpdateTabMode('inherit')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        colors[activeColorIdx].mode === 'inherit'
                          ? 'bg-amber-500/15 border border-amber-500 text-amber-500 font-extrabold'
                          : darkMode
                            ? 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-350'
                            : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-700 shadow-xs'
                      }`}
                    >
                      ⚙️ Global
                    </button>

                    <div className={`h-5 w-px mx-1.5 hidden sm:block ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />

                    <button
                      onClick={handleAddSizeColumn}
                      className="px-3 py-1.5 bg-[#ff5000]/10 hover:bg-[#ff5000]/20 border border-[#ff5000]/30 text-[#ff5000] font-mono text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                      title="Ajouter une colonne de taille au tableau"
                    >
                      <Plus className="w-3.5 h-3.5" /> ＋ Taille
                    </button>
                    <button
                      onClick={handleRemoveLastSizeColumn}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-mono text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                      title="Retirer la dernière colonne de taille"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> － Taille
                    </button>
                  </div>
                </div>

                {/* Quick Models/Presets Application section */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-xl p-4 transition-all duration-300 ${
                  darkMode ? 'bg-[#222636]/20 border-slate-800/40' : 'bg-[#f8fafc] border-slate-200'
                }`}>
                  {/* Category 1: Weight Per Piece */}
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${
                      darkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      ⚖️ Poids par pièce (Appliquer à tous)
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleApplyPieceWeightModel(e.target.value);
                          e.target.value = ""; // reset selection
                        }
                      }}
                      className={`w-full p-2 border rounded-lg text-xs font-mono outline-none transition-all cursor-pointer ${
                        darkMode
                          ? 'border-slate-800 bg-[#161a23] text-slate-205 hover:border-slate-700 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20'
                          : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20'
                      }`}
                    >
                      <option value="">-- Sélectionner Poids Pièce --</option>
                      {db.weight_piece_models.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name} ({m.wPiece} KG)
                        </option>
                      ))}
                    </select>
                    {colors[activeColorIdx]?.selectedPieceWeightModelName && (
                      <div className="text-[11px] font-mono text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/15 font-sans">
                        <span className="scale-90 pb-0.5">🟢</span>
                        <span>Modèle : </span>
                        <span className="underline text-emerald-600 dark:text-emerald-300">{colors[activeColorIdx].selectedPieceWeightModelName}</span>
                      </div>
                    )}
                  </div>

                  {/* Category 2: Empty Carton Weight */}
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${
                      darkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      📦 Poids carton vide (Appliquer à tous)
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleApplyCartonWeightModel(e.target.value);
                          e.target.value = ""; // reset selection
                        }
                      }}
                      className={`w-full p-2 border rounded-lg text-xs font-mono outline-none transition-all cursor-pointer ${
                        darkMode
                          ? 'border-slate-800 bg-[#161a23] text-slate-205 hover:border-slate-700 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20'
                          : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20'
                      }`}
                    >
                      <option value="">-- Sélectionner Poids Carton --</option>
                      {db.weight_carton_models.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name} ({m.wCarton} KG)
                        </option>
                      ))}
                    </select>
                    {colors[activeColorIdx]?.selectedCartonWeightModelName && (
                      <div className="text-[11px] font-mono text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/15 font-sans">
                        <span className="scale-90 pb-0.5">🟢</span>
                        <span>Modèle : </span>
                        <span className="underline text-emerald-600 dark:text-emerald-300">{colors[activeColorIdx].selectedCartonWeightModelName}</span>
                      </div>
                    )}
                  </div>

                  {/* Category 3: Carton Dimensions */}
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${
                      darkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      📐 Dimensions carton (Appliquer à tous)
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleApplyDimModel(e.target.value);
                          e.target.value = ""; // reset selection
                        }
                      }}
                      className={`w-full p-2 border rounded-lg text-xs font-mono outline-none transition-all cursor-pointer ${
                        darkMode
                          ? 'border-slate-800 bg-[#161a23] text-slate-205 hover:border-slate-700 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20'
                          : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/20'
                      }`}
                    >
                      <option value="">-- Sélectionner Dimensions --</option>
                      {db.dim_models.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name} ({m.L}x{m.l}x{m.h} cm)
                        </option>
                      ))}
                    </select>
                    {colors[activeColorIdx]?.selectedDimModelName && (
                      <div className="text-[11px] font-mono text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/15 font-sans">
                        <span className="scale-90 pb-0.5">🟢</span>
                        <span>Modèle : </span>
                        <span className="underline text-emerald-600 dark:text-emerald-300">{colors[activeColorIdx].selectedDimModelName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Real-time cargo statistics estimates to see live calculations as you update numbers */}
                {activeColorResult && (
                  <div className={`grid grid-cols-2 lg:grid-cols-5 gap-3 p-3.5 border rounded-xl transition-all duration-300 ${
                    darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-[#f0f4f8] border-slate-200'
                  }`}>
                    <div className={`p-2 rounded-lg border flex flex-col justify-center ${
                      darkMode ? 'bg-[#10121d] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
                    }`}>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                        👕 Total Pièces
                      </span>
                      <span className={`text-xs font-bold font-mono mt-0.5 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {activeColorResult.totals.p} pcs
                      </span>
                    </div>

                    <div className={`p-2 rounded-lg border flex flex-col justify-center ${
                      darkMode ? 'bg-[#10121d] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
                    }`}>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                        📦 Cartons Projetés
                      </span>
                      <span className={`text-xs font-bold font-mono mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        {activeColorResult.totals.c} {activeColorResult.totals.c > 1 ? 'ctns' : 'ctn'}
                      </span>
                    </div>

                    <div className={`p-2 rounded-lg border flex flex-col justify-center ${
                      darkMode ? 'bg-[#10121d] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
                    }`}>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                        ⚖️ Poids Net Estimé
                      </span>
                      <span className={`text-xs font-bold font-mono mt-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                        {activeColorResult.totals.n.toFixed(2)} KG
                      </span>
                    </div>

                    <div className={`p-2 rounded-lg border flex flex-col justify-center ${
                      darkMode ? 'bg-[#10121d] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
                    }`}>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                        🏋️ Poids Brut Estimé
                      </span>
                      <span className={`text-xs font-bold font-mono mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
                        {activeColorResult.totals.g.toFixed(2)} KG
                      </span>
                    </div>

                    <div className={`p-2 rounded-lg border flex flex-col justify-center col-span-2 lg:col-span-1 ${
                      darkMode ? 'bg-[#10121d] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
                    }`}>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                        📐 Cube Global Vol
                      </span>
                      <span className={`text-xs font-bold font-mono mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {activeColorResult.totals.v.toFixed(4)} m³
                      </span>
                    </div>
                  </div>
                )}

                <div className={`overflow-x-auto rounded-xl border transition-all duration-300 ${
                  darkMode ? 'border-slate-800 bg-slate-900/10' : 'border-slate-200 bg-slate-50/40 shadow-sm'
                }`}>
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className={`${
                        darkMode ? 'bg-slate-900/60 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                      } font-mono font-bold border-b`}>
                        <th className={`py-3 px-4 text-left border-r font-sans tracking-wide ${
                          darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                        }`}>
                          PARAMÈTRE DE COLISAGE
                        </th>
                        {colors[activeColorIdx].tailles.map((sz, idx) => (
                          <th key={idx} className={`border-r min-w-28 p-1.5 ${darkMode ? 'border-slate-800' : 'border-slate-205'}`}>
                            <input
                              type="text"
                              value={sz}
                              onChange={(e) => handleSizeHeaderChange(idx, e.target.value)}
                              className={`w-full text-center border font-mono font-bold px-2 py-1.5 rounded-md focus:outline-none uppercase transition-all ${
                                darkMode
                                  ? 'bg-[#1f2430] border-transparent text-white focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/10 hover:border-slate-800'
                                  : 'bg-white border-slate-200 text-slate-800 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/10 hover:border-slate-300 hover:shadow-xs'
                              }`}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                      {/* Row 1: QTY Totale */}
                      <tr className={darkMode ? '' : 'hover:bg-slate-50/50'}>
                        <td className={`py-2 px-4 text-left font-sans font-semibold border-r ${
                          darkMode ? 'border-slate-800 bg-[#222636]/10 text-slate-300' : 'border-slate-200 bg-slate-100/30 text-slate-755'
                        }`}>
                          <div className="flex flex-col">
                            <span>Quantité Totale à Emballer</span>
                            <span className="text-[10px] text-slate-500 font-normal italic font-mono">Presse-papiers Excel tolléré</span>
                          </div>
                        </td>
                        {colors[activeColorIdx].tailles.map((sz) => {
                          const qTot = colors[activeColorIdx].sizes[sz]?.qtyTot || 0;
                          const c = colors[activeColorIdx].sizes[sz]?.cap || 0;
                          const lastPcs = qTot - (c > 0 ? Math.floor(qTot / c) * c : 0);
                          let remColor: any = null;
                          if (lastPcs > 0 && activeColorResult) {
                            const remRow = activeColorResult.rows.find(row => row.sizes[sz] > 0 && isRemainderRow(row, activeColorConfig));
                            if (remRow) {
                              remColor = getRemainderRowColor(remRow, activeColorResult, activeColorConfig, darkMode);
                            }
                          }

                          return (
                            <td key={sz} className={`p-1 border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`} style={remColor ? { backgroundColor: remColor.bg + '1a' } : undefined}>
                              <input
                                type="number"
                                min="0"
                                value={colors[activeColorIdx].sizes[sz]?.qtyTot || ''}
                                onChange={(e) => handleUpdateSizeCell(sz, 'qtyTot', e.target.value)}
                                onPaste={(e) => handlePasteGrid2D(e, sz, 'qtyTot')}
                                className={`w-full text-center py-1.5 font-bold rounded-md bg-transparent border focus:outline-none transition-all ${
                                  remColor
                                    ? ''
                                    : (darkMode
                                      ? 'bg-[#222636] border-slate-800 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/10 text-white'
                                      : 'bg-white border-slate-200 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/10 text-slate-850 hover:border-slate-300')
                                }`}
                                style={remColor ? { backgroundColor: remColor.bg, color: remColor.text, borderColor: remColor.bg } : undefined}
                                placeholder="0"
                              />
                            </td>
                          );
                        })}
                      </tr>

                      {/* Row 2: Cap */}
                      <tr className={darkMode ? '' : 'hover:bg-slate-50/50'}>
                        <td className={`py-2 px-4 text-left font-sans font-semibold border-r ${
                          darkMode ? 'border-slate-800 bg-[#222636]/10 text-slate-350' : 'border-slate-200 bg-slate-100/30 text-slate-750'
                        }`}>
                          <div className="flex flex-col gap-1.5">
                            <span>Pièces Max par Carton (Cap)</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                placeholder="Tous"
                                className={`w-14 px-1.5 py-0.5 text-center text-[10px] rounded border font-mono font-semibold leading-normal ${
                                  darkMode 
                                    ? 'bg-[#10121d] border-slate-700 text-[#ff5000] focus:border-[#ff5000]' 
                                    : 'bg-white border-slate-300 text-[#ff5000] focus:border-[#ff5000]'
                                } focus:outline-none`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = (e.currentTarget as HTMLInputElement).value;
                                    const num = parseInt(val, 10);
                                    if (num > 0) {
                                      handleUpdateActiveColorAllSizes('cap', val);
                                      (e.currentTarget as HTMLInputElement).value = '';
                                      triggerToast(`⚡ Capacité de ${num} pcs appliquée à toutes les tailles !`, 'success');
                                    }
                                  }
                                }}
                              />
                              <span className="text-[9px] text-slate-500 font-mono font-medium">⏎ Appliquer</span>
                            </div>
                          </div>
                        </td>
                        {colors[activeColorIdx].tailles.map((sz) => (
                          <td key={sz} className={`p-1 border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <input
                              type="number"
                              min="1"
                              value={colors[activeColorIdx].sizes[sz]?.cap || ''}
                              onChange={(e) => handleUpdateSizeCell(sz, 'cap', e.target.value)}
                              onPaste={(e) => handlePasteGrid2D(e, sz, 'cap')}
                              className={`w-full text-center py-1.5 font-bold rounded-md bg-transparent border focus:outline-none transition-all ${
                                darkMode
                                  ? 'bg-[#222636] border-slate-800 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/10 text-slate-300'
                                  : 'bg-white border-slate-200 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/10 text-slate-600 hover:border-slate-300'
                              }`}
                              placeholder="25"
                            />
                          </td>
                        ))}
                      </tr>

                      {/* Row 3: SKU per size */}
                      <tr className={darkMode ? '' : 'hover:bg-slate-50/50'}>
                        <td className={`py-2 px-4 text-left font-sans font-semibold border-r ${
                          darkMode ? 'border-slate-800 bg-[#222636]/10 text-emerald-400' : 'border-slate-200 bg-emerald-50/10 text-emerald-800'
                        }`}>
                          <div className="flex flex-col gap-1.5">
                            <span>SKU spécifique (facultatif)</span>
                            <div className="flex items-center gap-1.5 font-normal text-slate-500">
                              <input
                                type="text"
                                placeholder="Prefix"
                                className={`w-16 px-1.5 py-0.5 text-center text-[10px] rounded border font-mono font-semibold leading-normal ${
                                  darkMode 
                                    ? 'bg-[#10121d] border-slate-700 text-emerald-350 focus:border-emerald-500' 
                                    : 'bg-white border-slate-300 text-emerald-650 focus:border-emerald-500'
                                } focus:outline-none`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = (e.currentTarget as HTMLInputElement).value;
                                    if (val.trim()) {
                                      handleUpdateActiveColorAllSizes('sku', val, true);
                                      (e.currentTarget as HTMLInputElement).value = '';
                                      triggerToast(`⚡ SKUs générés (ex: ${val.trim()}-${colors[activeColorIdx].tailles[0]}) !`, 'success');
                                    }
                                  }
                                }}
                              />
                              <span className="text-[9px] text-slate-500 font-mono font-medium">⏎ Remplir</span>
                            </div>
                          </div>
                        </td>
                        {colors[activeColorIdx].tailles.map((sz) => (
                          <td key={sz} className={`p-1 border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <input
                              type="text"
                              value={colors[activeColorIdx].sizes[sz]?.sku || ''}
                              onChange={(e) => handleUpdateSizeCell(sz, 'sku', e.target.value)}
                              onPaste={(e) => handlePasteGrid2D(e, sz, 'sku')}
                              className={`w-full text-center py-1 font-mono font-semibold text-[11px] uppercase rounded-md border focus:outline-none transition-all ${
                                darkMode
                                  ? 'bg-[#222636] border-slate-800 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/10 text-emerald-350'
                                  : 'bg-white border-slate-200 focus:border-[#ff5000] focus:ring-1 focus:ring-[#ff5000]/10 text-emerald-600 hover:border-slate-300'
                              }`}
                              placeholder="SKU"
                            />
                          </td>
                        ))}
                      </tr>

                      {/* Row 4: Config Button */}
                      <tr className={darkMode ? '' : 'hover:bg-slate-50/50'}>
                        <td className={`py-2.5 px-4 text-left font-sans font-semibold border-r ${
                          darkMode ? 'border-slate-800 bg-[#222636]/10 text-slate-350' : 'border-slate-200 bg-slate-100/30 text-slate-600'
                        }`}>
                          Configure Gabarit (Poids/Dimensions)
                        </td>
                        {colors[activeColorIdx].tailles.map((sz) => {
                          const config = colors[activeColorIdx].sizes[sz];
                          return (
                            <td key={sz} className={`p-1.5 border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                              <button
                                onClick={() => openBoxDetailsModal(sz, config)}
                                className={`px-3.5 py-1.5 rounded-md font-mono text-xs w-full cursor-pointer transition-all border ${
                                  darkMode
                                    ? 'bg-[#1a1d27] hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                                }`}
                              >
                                ✏️ Éditer
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* NEW RECAP TABLE: PROJECTION DES COLIS (FULL VS LAST) */}
                {colors[activeColorIdx] && (() => {
                  const activeColorConfig = colors[activeColorIdx];
                  const activeColorResult = computeColorResult(
                    activeColorConfig,
                    globalPackingMode,
                    forceSingleCarton,
                    maxSizesPerBox,
                    activeColorIdx
                  );
                  
                  // Sum metrics for the TOTALE column
                  let sumQtyTot = 0;
                  let sumQtyFullCtn = 0;
                  let sumQtyFullPcs = 0;
                  let sumQtyLastPcs = 0;
                  
                  activeColorConfig.tailles.forEach(t => {
                    const qTot = activeColorConfig.sizes[t]?.qtyTot || 0;
                    const c = activeColorConfig.sizes[t]?.cap || 25;
                    const fullCtn = c > 0 ? Math.floor(qTot / c) : 0;
                    const fullPcs = fullCtn * c;
                    const lastPcs = qTot - fullPcs;
                    
                    sumQtyTot += qTot;
                    sumQtyFullCtn += fullCtn;
                    sumQtyFullPcs += fullPcs;
                    sumQtyLastPcs += lastPcs;
                  });

                  return (
                    <div className="mt-6 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/10 dark:bg-[#161a23]/30 px-3.5 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">📊</span>
                          <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                            SYNTHÈSE DE PROJECTION DES COLIS (Saisie Actuelle)
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Cartons Total pour cette couleur :</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            darkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-80 * 10'
                          }`} style={{ backgroundColor: darkMode ? '#ff500020' : '#ff500010', color: '#ff5000' }}>
                            {activeColorResult ? activeColorResult.totals.c : 0} {activeColorResult && activeColorResult.totals.c > 1 ? 'cartons' : 'carton'}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`overflow-x-auto rounded-xl border transition-all duration-300 ${
                        darkMode ? 'border-slate-800 bg-[#161a23]' : 'border-slate-200 bg-white shadow-sm'
                      }`}>
                        <table className="w-full text-xs text-center border-collapse">
                          <thead>
                            <tr className={`${
                              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-250'
                            } font-mono font-bold border-b text-slate-400`}>
                              <th className={`py-3 px-4 text-left border-r font-sans tracking-wide uppercase text-[10px] font-black ${
                                darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
                              }`} style={{ width: '220px' }}>
                                INDICATION PAR COLISAGE
                              </th>
                              {activeColorConfig.tailles.map((sz) => (
                                <th key={sz} className={`p-2 border-r font-mono font-black text-xs text-[#4f8ef7] ${darkMode ? 'border-slate-800 bg-[#4f8ef7]/5' : 'border-slate-200 bg-[#4f8ef7]/5'}`}>
                                  {sz}
                                </th>
                              ))}
                              <th className={`p-2 font-mono font-black text-xs text-amber-500 ${darkMode ? 'border-slate-800 bg-amber-500/5' : 'border-slate-250 bg-amber-500/5'}`}>
                                TOTALE
                              </th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y font-mono font-semibold ${darkMode ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-800'}`}>
                            {/* Line 1: QTY PCS TOTALE */}
                            <tr className={darkMode ? 'bg-slate-900/10 hover:bg-slate-800/10' : 'bg-white hover:bg-slate-50'}>
                              <td className={`py-2.5 px-4 text-left font-sans font-medium border-r ${
                                darkMode ? 'border-slate-800 bg-[#222636]/15 text-slate-300' : 'border-slate-200 bg-slate-100/40 text-slate-800'
                              }`}>
                                QTY PCS TOTALE
                              </td>
                              {activeColorConfig.tailles.map((sz) => {
                                const qTot = activeColorConfig.sizes[sz]?.qtyTot || 0;
                                return (
                                  <td key={sz} className={`p-2 border-r font-black text-xs ${darkMode ? 'border-slate-800 text-slate-100' : 'border-slate-200 text-slate-800'}`}>
                                    {qTot}
                                  </td>
                                );
                              })}
                              <td className="p-2 font-bold text-emerald-500 bg-emerald-500/5">{sumQtyTot}</td>
                            </tr>

                            {/* Line 2: QTY PCS PAR CARTON */}
                            <tr className={darkMode ? 'bg-slate-900/10 hover:bg-slate-800/10' : 'bg-white hover:bg-slate-50'}>
                              <td className={`py-2.5 px-4 text-left font-sans font-medium border-r ${
                                darkMode ? 'border-slate-800 bg-[#222636]/15 text-slate-300' : 'border-slate-200 bg-slate-100/40 text-slate-800'
                              }`}>
                                QTY PCS PAR CARTON
                              </td>
                              {activeColorConfig.tailles.map((sz) => {
                                const c = activeColorConfig.sizes[sz]?.cap || 0;
                                return (
                                  <td key={sz} className={`p-2 border-r text-slate-500 dark:text-slate-400 font-medium ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                                    {c}
                                  </td>
                                );
                              })}
                              <td className="p-2 font-medium text-slate-500 dark:text-slate-400 font-mono">—</td>
                            </tr>

                            {/* Line 3: QTY CARTON FULL */}
                            <tr className={darkMode ? 'bg-slate-900/10 hover:bg-slate-800/10' : 'bg-white hover:bg-slate-50'}>
                              <td className={`py-2.5 px-4 text-left font-sans font-medium border-r ${
                                darkMode ? 'border-slate-800 bg-[#222636]/15 text-slate-300' : 'border-slate-200 bg-slate-100/40 text-slate-800'
                              }`}>
                                QTY CARTON FULL
                              </td>
                              {activeColorConfig.tailles.map((sz) => {
                                const qTot = activeColorConfig.sizes[sz]?.qtyTot || 0;
                                const c = activeColorConfig.sizes[sz]?.cap || 0;
                                const fullCtn = c > 0 ? Math.floor(qTot / c) : 0;
                                return (
                                  <td key={sz} className={`p-2 border-r font-semibold ${darkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
                                    {fullCtn}
                                  </td>
                                );
                              })}
                              <td className="p-2 font-black text-[#ff5000] bg-[#ff5000]/5">{sumQtyFullCtn}</td>
                            </tr>

                            {/* Line 4: QTY PCS FULL TOTALE */}
                            <tr className={darkMode ? 'bg-slate-900/10 hover:bg-slate-800/10' : 'bg-white hover:bg-slate-50'}>
                              <td className={`py-2.5 px-4 text-left font-sans font-medium border-r ${
                                darkMode ? 'border-slate-800 bg-[#222636]/15 text-slate-300' : 'border-slate-200 bg-slate-100/40 text-slate-800'
                              }`}>
                                QTY PCS FULL (TOTAL PACKÉ)
                              </td>
                              {activeColorConfig.tailles.map((sz) => {
                                const qTot = activeColorConfig.sizes[sz]?.qtyTot || 0;
                                const c = activeColorConfig.sizes[sz]?.cap || 0;
                                const fullCtn = c > 0 ? Math.floor(qTot / c) : 0;
                                const fullPcs = fullCtn * c;
                                return (
                                  <td key={sz} className={`p-2 border-r font-medium ${darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                                    {fullPcs}
                                  </td>
                                );
                              })}
                              <td className="p-2 font-black text-indigo-500 bg-indigo-500/5">{sumQtyFullPcs}</td>
                            </tr>

                            {/* Line 5: QTY PCS LAST */}
                            <tr className={darkMode ? 'bg-[#ff5000]/5 hover:bg-[#ff5000]/10' : 'bg-amber-500/5 hover:bg-amber-500/10'}>
                              <td className={`py-2.5 px-4 text-left font-sans font-black border-r text-red-655 dark:text-orange-400 ${
                                darkMode ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-slate-100/20'
                              }`}>
                                QTY PCS LAST (RESTE)
                              </td>
                              {activeColorConfig.tailles.map((sz) => {
                                const qTot = activeColorConfig.sizes[sz]?.qtyTot || 0;
                                const c = activeColorConfig.sizes[sz]?.cap || 0;
                                const fullCtn = c > 0 ? Math.floor(qTot / c) : 0;
                                const fullPcs = fullCtn * c;
                                const lastPcs = qTot - fullPcs;
                                
                                // GET DYNAMIC COLOR HIGHLIGHT BASED ON PACKING RESULTS
                                let cellStyle: React.CSSProperties = {};
                                if (lastPcs > 0 && activeColorResult) {
                                  const remRow = activeColorResult.rows.find(row => row.sizes[sz] > 0 && isRemainderRow(row, activeColorConfig));
                                  if (remRow) {
                                    const remColor = getRemainderRowColor(remRow, activeColorResult, activeColorConfig, darkMode);
                                    if (remColor) {
                                      cellStyle = {
                                        backgroundColor: remColor.bg,
                                        color: remColor.text,
                                        fontWeight: 'black'
                                      };
                                    }
                                  }
                                }
                                
                                return (
                                  <td key={sz} className={`p-2 border-r font-mono font-black ${darkMode ? 'border-slate-800 text-slate-100' : 'border-slate-200 text-slate-800'}`} style={cellStyle}>
                                    {lastPcs}
                                  </td>
                                );
                              })}
                              <td className="p-2 font-black text-red-500 bg-red-500/5">{sumQtyLastPcs}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
                  </div>
                </div>
              </motion.div>
            );
          })()}

              {activeInputTab === 'packing_list' && (
                <motion.div
                  key="packing-list-section"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {!hasGenerated ? (
                    <div className={`rounded-xl border p-8 text-center space-y-4 ${darkMode ? 'bg-[#161a23] border-slate-800' : 'bg-white border-slate-205'} shadow-sm`}>
                      <div className="w-12 h-12 bg-emerald-500/10 text-[#34d399] rounded-full flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h3 className={`text-sm font-bold font-mono uppercase ${darkMode ? 'text-white' : 'text-slate-800'}`}>Packing List non générée</h3>
                        <p className={`text-xs max-w-md mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Veuillez saisir vos grilles de colisage dans l'onglet <b>⌨️ GRILLE SAISIE</b>, puis cliquez sur le bouton ci-dessous pour lancer la génération de la Packing List.
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateList}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-550 to-emerald-600 hover:brightness-110 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>GÉNÉRER LA PACKING LIST</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Color Selector Filter Control */}
                      {results.length > 1 && (
                        <div id="color-filter-card" className={`p-4 rounded-xl border print:hidden shadow-sm transition-colors ${
                          darkMode ? 'bg-[#161a23] border-slate-800' : 'bg-white border-slate-205'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold tracking-tight text-amber-500 font-mono">🎨 FILTRER PAR COULEURS À AFFICHER & EXPORTER</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                                {selectedExportColors.length}/{results.length} sélectionnée(s)
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedExportColors(results.map(r => r.nom))}
                                className="px-2.5 py-1 text-[11px] font-bold font-mono rounded bg-slate-800 hover:bg-slate-705 text-[#3b82f6] border border-slate-700/60 cursor-pointer transition-all"
                              >
                                TOUTES LES COULEURS
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {results.map((res) => {
                              const isChecked = selectedExportColors.includes(res.nom);
                              return (
                                <button
                                  key={res.nom}
                                  onClick={() => {
                                    if (isChecked) {
                                      if (selectedExportColors.length > 1) {
                                        setSelectedExportColors(selectedExportColors.filter(c => c !== res.nom));
                                      }
                                    } else {
                                      setSelectedExportColors([...selectedExportColors, res.nom]);
                                    }
                                  }}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                                    isChecked
                                      ? (darkMode 
                                        ? 'bg-[#1e2330] border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.15)] text-amber-400' 
                                        : 'bg-amber-100/40 border-amber-500 text-amber-800 font-bold')
                                      : (darkMode 
                                        ? 'bg-transparent border-slate-800 text-slate-400 opacity-60 hover:opacity-100 hover:border-slate-700' 
                                        : 'bg-transparent border-slate-200 text-slate-500 opacity-60 hover:opacity-100 hover:border-slate-300')
                                  }`}
                                >
                                  <div className="w-3 h-3 rounded-full flex items-center justify-center border border-slate-700/40" style={{ backgroundColor: res.color }}>
                                    {isChecked && (
                                      <span className="text-[8px] text-white">✓</span>
                                    )}
                                  </div>
                                  <span>{res.nom}</span>
                                  <span className={`text-[10px] px-1.5 py-0.15 rounded font-mono ${isChecked ? 'bg-amber-500/10 text-amber-500 font-bold' : 'bg-slate-800/10 text-slate-400'}`}>
                                    {res.totals.p.toLocaleString('fr-FR')} Pcs
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {activeResults.map((res, ci) => {
                        const origIdx = res.colorIndex ?? ci;
                        const bgClass = darkMode ? BG_COLORS_DARK[origIdx % PALETTE.length] : BG_COLORS_LIGHT[origIdx % PALETTE.length];
                        const activeColorSizes = res.tailles.filter(t => isStandardSizeAlwaysShown(t) || (colors[origIdx]?.sizes[t]?.qtyTot || 0) > 0);
                        return (
                          <div
                            key={ci}
                            className={`rounded-xl border p-5 print-ind-card break-inside-avoid shadow-sm ${
                              darkMode ? 'bg-[#161a23] border-slate-800' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 bg-[#222636]/10 px-4 py-2.5 rounded-lg border border-slate-800/60 mb-3 text-blue-400 font-mono font-bold uppercase text-xs">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: res.color }} />
                              PACKING LIST — COULEUR : {res.nom}
                            </div>

                            <div className="pb-3 text-xs">
                              {res.mode === 'strict_solide' ? (
                                <span className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold font-mono tracking-wide">
                                  🔒 SOLID PACK STRICT
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold font-mono tracking-wide">
                                  🔀 MIXED PACK AUTORISÉ (max {maxSizesPerBox} tailles)
                                </span>
                              )}
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-855 bg-slate-900/10">
                              <table className="w-full text-xs text-center border-collapse">
                                <thead>
                                  <tr className="bg-slate-900 border-b border-slate-800 font-mono font-bold text-[10px] text-slate-400">
                                    {printColumns.ctn && (
                                      <>
                                        <th className="py-2.5 px-2 uppercase text-center border-r border-slate-800 col-ctn-index">N° DÉBUT</th>
                                        <th className="py-2.5 px-2 uppercase text-center border-r border-slate-800 col-ctn-index">N° FIN</th>
                                      </>
                                    )}
                                    {printColumns.color && <th className="px-2 border-r border-slate-800 col-color-lbl">COULEUR</th>}
                                    {(() => {
                                      const origColor = colors.find(c => c.nom === res.nom);
                                      const showSkuCol = printColumns.sku && !!(origColor && Object.values(origColor.sizes || {}).some((s: any) => s.sku && String(s.sku).trim() !== ''));
                                      return showSkuCol && <th className="px-3 border-r border-slate-800 col-sku-lbl bg-emerald-500/5 text-emerald-404">SKU</th>;
                                    })()}
                                    {printColumns.sizes && activeColorSizes.map(t => (
                                      <th key={t} className="px-2 border-r border-slate-800 bg-blue-505/5 text-[#4f8ef7] col-sizes-cells">{t}</th>
                                    ))}
                                    <th className="px-2 border-r border-slate-800">PCS/CTN</th>
                                    {printColumns.nbctn && <th className="px-2 border-r border-slate-800 col-nbctn-metric">NB CTN</th>}
                                    {printColumns.totalqty && <th className="px-2 border-r border-slate-800 col-totalqty-metric">TOTAL QTY</th>}
                                    {printColumns.net && <th className="px-2 border-r border-slate-800 text-teal-400 col-net-metric">N.W (KG)</th>}
                                    {printColumns.gross && <th className="px-2 border-r border-slate-800 text-red-400 col-gross-metric">G.W (KG)</th>}
                                    {printColumns.cbm && <th className="px-2 col-cbm-metric">CBM (m³)</th>}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono font-medium">
                                  {res.rows.map((row, rIdx) => {
                                    const origColor = colors.find(c => c.nom === res.nom);
                                    const showSkuCol = printColumns.sku && !!(origColor && Object.values(origColor.sizes || {}).some((s: any) => s.sku && String(s.sku).trim() !== ''));
                                    return (
                                      <tr
                                        key={rIdx}
                                        className="hover:bg-slate-800/40 divide-x divide-slate-800/40"
                                      >
                                        {printColumns.ctn && (
                                          <>
                                            <td className="py-2 px-2 text-center font-bold text-slate-350 col-ctn-index">
                                              {parseCartonRange(row.cartonRange).start}
                                            </td>
                                            <td className="py-2 px-2 text-center font-bold text-slate-350 col-ctn-index">
                                              {parseCartonRange(row.cartonRange).end}
                                            </td>
                                          </>
                                        )}
                                        {printColumns.color && <td className="px-2 font-bold col-color-lbl" style={{ color: res.color }}>{res.nom}</td>}
                                        {showSkuCol && <td className="px-3 truncate max-w-28 text-[11px] text-emerald-444 font-semibold col-sku-lbl">{row.skus.join('/') || '—'}</td>}
                                        {printColumns.sizes && activeColorSizes.map(t => (
                                          <td key={t} className="px-2 font-bold col-sizes-cells">{row.sizes[t] || ''}</td>
                                        ))}
                                        <td className="px-2 font-bold bg-slate-900/10">{row.pcsPerCarton}</td>
                                        {printColumns.nbctn && <td className="px-2 font-black col-nbctn-metric">{row.nbr}</td>}
                                        {printColumns.totalqty && <td className="px-2 font-black bg-slate-900/15 text-slate-100 col-totalqty-metric">{row.totalPcs}</td>}
                                        {printColumns.net && <td className="px-2 font-bold text-teal-400 col-net-metric">{row.netWeightRow.toFixed(2)}</td>}
                                        {printColumns.gross && <td className="px-2 font-bold text-red-400 col-gross-metric">{row.grossWeightRow.toFixed(2)}</td>}
                                        {printColumns.cbm && <td className="px-2 text-slate-400 col-cbm-metric">{row.cbmRow.toFixed(4)}</td>}
                                      </tr>
                                    );
                                  })}

                                  {/* Totals row index */}
                                  <tr className="bg-amber-500/10 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 font-black border-t-2 border-t-amber-500/70 border-b border-dark-900 divide-x divide-slate-800">
                                    {printColumns.ctn && <td colSpan={2} className="py-2.5 px-3 text-center col-ctn-index">TOTALE</td>}
                                    {printColumns.color && <td className="px-2 font-extrabold col-color-lbl">{res.nom}</td>}
                                    {(() => {
                                      const origColor = colors.find(c => c.nom === res.nom);
                                      const showSkuCol = printColumns.sku && !!(origColor && Object.values(origColor.sizes || {}).some((s: any) => s.sku && String(s.sku).trim() !== ''));
                                      return showSkuCol && <td className="px-3 col-sku-lbl">—</td>;
                                    })()}
                                    {printColumns.sizes && activeColorSizes.map(t => (
                                      <td key={t} className="px-2 col-sizes-cells">{res.totals.sizes[t] || 0}</td>
                                    ))}
                                    <td>—</td>
                                    {printColumns.nbctn && <td className="px-2 col-nbctn-metric">{res.totals.c}</td>}
                                    {printColumns.totalqty && <td className="px-2 text-amber-600 dark:text-amber-300 col-totalqty-metric">{res.totals.p}</td>}
                                    {printColumns.net && <td className="px-2 font-black col-net-metric text-[#0e7490] dark:text-[#38bdf8]">{res.totals.n.toFixed(2)}</td>}
                                    {printColumns.gross && <td className="px-2 font-black col-gross-metric text-[#b91c1c] dark:text-[#f87171]">{res.totals.g.toFixed(2)}</td>}
                                    {printColumns.cbm && <td className="px-2 text-slate-400 col-cbm-metric">{res.totals.v.toFixed(4)}</td>}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}

                      {/* COMBINED LEDGER (MULTIPLE COLORS CHOSEN) */}
                      {activeResults.length > 1 && (
                        <div className={`rounded-xl border p-5 print-cpl-card break-inside-avoid shadow-sm ${
                          darkMode ? 'bg-[#161a23] border-slate-805' : 'bg-white border-slate-200'
                        }`}>
                          <div className={`bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 font-bold px-4 py-3 rounded-lg flex items-center gap-3 font-mono text-sm mb-4 ${darkMode ? 'text-white' : 'text-[#4f8ef7]'}`}>
                            📁 COMBINED PACKING LIST — LEDGER GLOBAL TOUTES COULEURS ({activeResults.length})
                          </div>

                          <div className="overflow-x-auto rounded-lg border border-slate-850 bg-slate-900/10">
                            <table className="w-full text-xs text-center border-collapse">
                              <thead>
                                <tr className="bg-slate-900 border-b border-slate-800 font-mono font-bold text-[10px] text-slate-400">
                                  {printColumns.ctn && (
                                    <>
                                      <th className="py-2.5 px-2 uppercase text-center border-r border-slate-800 col-ctn-index">N° DÉBUT</th>
                                      <th className="py-2.5 px-2 uppercase text-center border-r border-slate-800 col-ctn-index">N° FIN</th>
                                    </>
                                  )}
                                  {printColumns.color && <th className="px-2 border-r border-slate-800 col-color-lbl">COULEUR</th>}
                                  {(() => {
                                    const showSkuColCombined = printColumns.sku && colors.some(col => Object.values(col.sizes || {}).some((s: any) => s.sku && String(s.sku).trim() !== ''));
                                    return showSkuColCombined && <th className="px-3 border-r border-slate-800 bg-emerald-500/5 text-emerald-405 col-sku-lbl">SKU</th>;
                                  })()}
                                  {printColumns.sizes && summaryUniqueSizes.map(t => (
                                    <th key={t} className="px-2 border-r border-slate-800 bg-blue-505/5 text-[#4f8ef7] col-sizes-cells">{t}</th>
                                  ))}
                                  <th className="px-2 border-r border-slate-800">PCS/CTN</th>
                                  {printColumns.nbctn && <th className="px-2 border-r border-slate-800 col-nbctn-metric">NB CTN</th>}
                                  {printColumns.totalqty && <th className="px-2 border-r border-slate-800 col-totalqty-metric">TOTAL QTY</th>}
                                  {printColumns.net && <th className="px-2 border-r border-slate-800 text-teal-400 col-net-metric">N.W (KG)</th>}
                                  {printColumns.gross && <th className="px-2 border-r border-slate-800 text-red-400 col-gross-metric">G.W (KG)</th>}
                                  {printColumns.cbm && <th className="px-2 col-cbm-metric">CBM (m³)</th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 font-mono text-left">
                                {(() => {
                                  let seqNum = 1;
                                  const showSkuColCombined = printColumns.sku && colors.some(col => Object.values(col.sizes || {}).some((s: any) => s.sku && String(s.sku).trim() !== ''));
                                  return activeResults.map((res, ci) => {
                                    const origIdx = res.colorIndex ?? ci;
                                    const bgCode = darkMode ? BG_COLORS_DARK[origIdx % PALETTE.length] : BG_COLORS_LIGHT[origIdx % PALETTE.length];
                                    return res.rows.map((row, rIdx) => {
                                      const currentStart = seqNum;
                                      const currentEnd = seqNum + row.nbr - 1;
                                      seqNum += row.nbr;
                                      const rowBg = bgCode;
                                      const rowTextColor = undefined;
                                      return (
                                        <tr
                                          key={`${ci}-${rIdx}`}
                                          className="hover:bg-slate-800/20 divide-x divide-slate-800/40 font-medium"
                                          style={{ backgroundColor: rowBg, color: rowTextColor }}
                                        >
                                          {printColumns.ctn && (
                                            <>
                                              <td className="py-2 px-2 text-center font-bold text-slate-100 col-ctn-index">{currentStart}</td>
                                              <td className="py-2 px-2 text-center font-bold text-slate-100 col-ctn-index">{currentEnd}</td>
                                            </>
                                          )}
                                          {printColumns.color && <td className="px-2 font-bold col-color-lbl" style={{ color: res.color }}>{res.nom}</td>}
                                          {showSkuColCombined && <td className="px-3 truncate max-w-28 text-[11px] text-emerald-500 col-sku-lbl">{row.skus.join('/') || '—'}</td>}
                                          {printColumns.sizes && summaryUniqueSizes.map(t => (
                                            <td key={t} className="px-2 text-center font-bold col-sizes-cells">{row.sizes[t] || ''}</td>
                                          ))}
                                          <td className="px-2 text-center font-bold">{row.pcsPerCarton}</td>
                                          {printColumns.nbctn && <td className="px-2 text-center font-black col-nbctn-metric">{row.nbr}</td>}
                                          {printColumns.totalqty && <td className="px-2 text-center font-black bg-slate-900/10 text-slate-100 col-totalqty-metric">{row.totalPcs}</td>}
                                          {printColumns.net && <td className="px-2 text-center font-bold text-teal-400 col-net-metric">{row.netWeightRow.toFixed(2)}</td>}
                                          {printColumns.gross && <td className="px-2 text-center font-bold text-red-200 col-gross-metric">{row.grossWeightRow.toFixed(2)}</td>}
                                          {printColumns.cbm && <td className="px-2 text-center text-slate-400 col-cbm-metric">{row.cbmRow.toFixed(4)}</td>}
                                        </tr>
                                      );
                                    });
                                  });
                                })()}

                                {/* Global combined total row */}
                                <tr className="bg-amber-500/10 dark:bg-amber-955/30 text-amber-800 dark:text-amber-400 font-extrabold border-t-2 border-t-amber-500/80 divide-x divide-slate-800">
                                  {printColumns.ctn && <td colSpan={2} className="py-2.5 px-3 text-center col-ctn-index">GRAND TOTAL</td>}
                                  {printColumns.color && <td className="px-2 font-extrabold col-color-lbl">ALL</td>}
                                  {(() => {
                                    const showSkuColCombined = printColumns.sku && colors.some(col => Object.values(col.sizes || {}).some((s: any) => s.sku && String(s.sku).trim() !== ''));
                                    return showSkuColCombined && <td className="px-3 col-sku-lbl">—</td>;
                                  })()}
                                  {printColumns.sizes && summaryUniqueSizes.map(t => {
                                    let sumT = 0;
                                    activeResults.forEach(r => { sumT += r.totals.sizes[t] || 0; });
                                    return <td key={t} className="px-2 text-center col-sizes-cells text-amber-600 dark:text-amber-300 font-bold">{sumT}</td>;
                                  })}
                                  <td className="text-center">—</td>
                                  {printColumns.nbctn && <td className="px-2 text-center col-nbctn-metric font-extrabold">{grandTotals.c}</td>}
                                  {printColumns.totalqty && <td className="px-2 text-center text-amber-600 dark:text-amber-300 font-black col-totalqty-metric">{grandTotals.p}</td>}
                                  {printColumns.net && <td className="px-2 text-center font-black col-net-metric text-[#0e7490] dark:text-[#38bdf8]">{grandTotals.n.toFixed(2)}</td>}
                                  {printColumns.gross && <td className="px-2 text-center font-black col-gross-metric text-[#b91c1c] dark:text-[#f87171]">{grandTotals.g.toFixed(2)}</td>}
                                  {printColumns.cbm && <td className="px-2 text-center text-slate-400 col-cbm-metric font-medium">{grandTotals.v.toFixed(4)}</td>}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeInputTab === 'breakdown' && (
                <motion.div
                  key="breakdown-section"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.15 }}
                >
                  {!hasGenerated ? (
                    <div className={`rounded-xl border p-8 text-center space-y-4 ${darkMode ? 'bg-[#161a23] border-slate-800' : 'bg-white border-slate-205'} shadow-sm`}>
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                        <Grid className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h3 className={`text-sm font-bold font-mono uppercase ${darkMode ? 'text-white' : 'text-slate-800'}`}>Breakdown non généré</h3>
                        <p className={`text-xs max-w-md mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Veuillez saisir vos grilles de colisage dans l'onglet <b>⌨️ GRILLE SAISIE</b>, puis cliquez sur le bouton ci-dessous pour calculer le Breakdown résumé.
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateList}
                        className="px-4 py-2 bg-gradient-to-r from-amber-550 to-amber-600 hover:brightness-110 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>GÉNÉRER LE BREAKDOWN</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className={`rounded-xl border p-5 print-bk-table break-inside-avoid shadow-sm ${
                        darkMode ? 'bg-[#161a23] border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                        <div className="bg-[#f6e05e] border border-amber-500/60 font-mono font-bold px-4 py-3 text-slate-900 rounded-lg text-xs mb-4 uppercase">
                          📊 COLOR / SIZE BREAKDOWN COMBINED (Ledger global des colisages)
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-slate-800">
                          <table className="w-full text-xs text-center border-collapse">
                            <thead>
                              <tr className="bg-slate-900 font-mono font-semibold text-slate-400 border-b border-slate-800">
                                <th className="py-2.5 px-3 text-left border-r border-slate-800">COLOR / COULEUR</th>
                                {summaryUniqueSizes.map(t => <th key={t} className="border-r border-slate-800">{t}</th>)}
                                <th>TOTAL PCS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 font-mono font-medium">
                              {activeResults.map((res, ci) => (
                                <tr key={ci} className="hover:bg-slate-800/40 divide-x divide-slate-800/40">
                                  <td className="py-2 px-3 text-left font-bold" style={{ color: res.color }}>{res.nom}</td>
                                  {summaryUniqueSizes.map(t => (
                                    <td key={t} className="font-bold">{res.totals.sizes[t] || ''}</td>
                                  ))}
                                  <td className="font-black text-slate-200">{res.totals.p}</td>
                                </tr>
                              ))}
                              <tr className="bg-amber-500/10 dark:bg-amber-955/30 text-amber-800 dark:text-amber-400 font-extrabold border-t-2 border-t-amber-500/80 divide-x divide-slate-800">
                                <td className="py-2.5 px-3 text-left">TOTAL SHIFT</td>
                                {summaryUniqueSizes.map(t => {
                                  let sumT = 0;
                                  activeResults.forEach(r => { sumT += r.totals.sizes[t] || 0; });
                                  return <td key={t} className="font-extrabold text-amber-600 dark:text-amber-300">{sumT}</td>;
                                })}
                                <td className="font-extrabold text-amber-600 dark:text-amber-300">{grandTotals.p}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 mt-6 border-t border-dashed border-slate-800 print-stats-box break-inside-avoid">
                          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/10">
                            <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Nombre de Pièces :</div>
                            <div className="text-sm font-bold text-amber-500 font-mono mt-0.5">{grandTotals.p.toLocaleString('fr-FR')} PCS</div>
                          </div>
                          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/10">
                            <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Nombre de Cartons :</div>
                            <div className="text-sm font-bold text-slate-350 font-mono mt-0.5">{grandTotals.c} Cartons</div>
                          </div>
                          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/10">
                            <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Poids Net :</div>
                            <div className="text-sm font-bold text-teal-400 font-mono mt-0.5">{grandTotals.n.toFixed(2)} KG</div>
                          </div>
                          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/10">
                            <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Poids Brut :</div>
                            <div className="text-sm font-bold text-red-400 font-mono mt-0.5">{grandTotals.g.toFixed(2)} KG</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeInputTab === 'summary' && (
                <motion.div
                  key="summary-section"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {!hasGenerated ? (
                    <div className={`rounded-xl border p-8 text-center space-y-4 ${darkMode ? 'bg-[#161a23] border-slate-800' : 'bg-white border-slate-205'} shadow-sm`}>
                      <div className="w-12 h-12 bg-blue-500/10 text-[#4f8ef7] rounded-full flex items-center justify-center mx-auto">
                        <PieChart className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h3 className={`text-sm font-bold font-mono uppercase ${darkMode ? 'text-white' : 'text-slate-800'}`}>Récapitulatif non généré</h3>
                        <p className={`text-xs max-w-md mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Veuillez saisir vos grilles de colisage dans l'onglet <b>⌨️ GRILLE SAISIE</b>, puis cliquez sur le bouton ci-dessous pour calculer le tableau de synthèse et les analyses.
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateList}
                        className="px-4 py-2 bg-gradient-to-r from-[#4f8ef7] to-[#9b72f5] hover:brightness-110 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>GÉNÉRER LE RÉCAPITULATIF</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Dashboard Metrics Header */}
                      <div className={`rounded-xl border p-5 shadow-sm ${darkMode ? 'bg-[#111522] border-slate-800/80 shadow-black/20' : 'bg-white border-slate-200'}`}>
                        <div className="bg-[#ff5000]/5 border border-[#ff5000]/20 font-sans font-extrabold px-4 py-3 text-[#ff5000] rounded-lg text-xs mb-6 uppercase flex items-center gap-2 tracking-wider">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5000] animate-pulse" />
                          <span>📊 TABLEAU DE BORD DE SYNTHÈSE DES EXPÉDITIONS</span>
                        </div>

                        {/* 📝 RÉFÉRENCES & COORDONNÉES DE LA COMMANDE (DETAILED ORDER INFO) */}
                        <div className={`mb-6 p-4 rounded-xl border ${darkMode ? 'bg-slate-900/30 border-slate-800/60' : 'bg-[#fcfdfe] border-slate-200 shadow-xs'}`}>
                          <div className={`text-xs font-sans font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            <span className="w-1.5 h-3.5 bg-[#ff5000] rounded-sm" />
                            <span>📝 DÉTAILS DE LA COMMANDE & RÉFÉRENCES (FICHE LOGISTIQUE)</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-bold">Client / Customer</span>
                              <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{meta.customer || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-bold">Commande / Order</span>
                              <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{meta.order || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-bold">PO# Client</span>
                              <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{meta.po || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-bold">Réf Client</span>
                              <span className="text-amber-500 font-bold">{meta.refClient || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-bold">Style N° / Nom</span>
                              <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{(meta.style || meta.styleNumber) ? `${meta.style || ''} ${meta.styleNumber ? `(#${meta.styleNumber})` : ''}` : '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-bold">Facture / Invoice</span>
                              <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{meta.invoice || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-bold">Composition</span>
                              <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{meta.composition || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-bold text-emerald-500">Destination / Pays</span>
                              <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{meta.destination || meta.pays ? `${meta.destination || ''} ${meta.pays ? `(${meta.pays})` : ''}` : '—'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Top Bento Grid of Totals */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className={`p-4 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-slate-900/30 border-slate-800/60' : 'bg-white text-slate-900 border-slate-200 shadow-xs'}`}>
                            <div className={`text-[10px] uppercase font-sans tracking-widest font-extrabold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Pièces</div>
                            <div className={`text-2xl font-black font-mono mt-1 ${darkMode ? 'text-orange-500' : 'text-[#ff5000]'}`}>{grandTotals.p.toLocaleString('fr-FR')}</div>
                            <div className={`text-[9.5px] mt-1 font-mono ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Pcs expédiées</div>
                          </div>

                          <div className={`p-4 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-slate-900/30 border-slate-800/60' : 'bg-white text-slate-900 border-slate-200 shadow-xs'}`}>
                            <div className={`text-[10px] uppercase font-sans tracking-widest font-extrabold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Cartons</div>
                            <div className={`text-2xl font-black font-mono mt-1 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{grandTotals.c}</div>
                            <div className={`text-[9.5px] mt-1 font-mono ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Cartons colisage</div>
                          </div>

                          <div className={`p-4 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-slate-900/30 border-slate-800/60' : 'bg-white text-slate-900 border-slate-200 shadow-xs'}`}>
                            <div className={`text-[10px] uppercase font-sans tracking-widest font-extrabold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Poids Global</div>
                            <div className={`text-2xl font-black font-mono mt-1 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{grandTotals.g.toFixed(1)} KG</div>
                            <div className={`text-[9.5px] mt-1 font-mono ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>N.W: {grandTotals.n.toFixed(1)} KG</div>
                          </div>

                          <div className={`p-4 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-slate-900/30 border-slate-800/60' : 'bg-white text-slate-900 border-slate-200 shadow-xs'}`}>
                            <div className={`text-[10px] uppercase font-sans tracking-widest font-extrabold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Volume Total</div>
                            <div className={`text-2xl font-black font-mono mt-1 ${darkMode ? 'text-rose-450' : 'text-rose-600'}`}>{grandTotals.v.toFixed(3)} m³</div>
                            <div className={`text-[9.5px] mt-1 font-mono ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Cubage estimé</div>
                          </div>
                        </div>

                        {/* Mid Row: Interactive SVG Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Left Visual: Color Qty Distribution */}
                          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/30 border-slate-800/60' : 'bg-slate-50/50 border-slate-200'}`}>
                            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-350 pb-3 border-b border-slate-800/60 flex items-center justify-between">
                              <span>🎨 Répartition Qty par Couleur</span>
                              <span className="text-[10px] text-slate-500 font-mono">Unité: Pcs</span>
                            </h3>
                            <div className="space-y-4 pt-4">
                              {activeResults.map((res, ci) => {
                                const pct = grandTotals.p > 0 ? (res.totals.p / grandTotals.p) * 100 : 0;
                                return (
                                  <div key={ci} className="space-y-1">
                                    <div className="flex justify-between text-xs font-mono">
                                      <span className="font-semibold flex items-center gap-1.5" style={{ color: res.color }}>
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: res.color }} />
                                        {res.nom}
                                      </span>
                                      <span className="text-slate-400">
                                        <b>{res.totals.p} Pcs</b> ({pct.toFixed(1)}%)
                                      </span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                                      <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ backgroundColor: res.color, width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right Visual: Size Qty Distribution */}
                          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/30 border-slate-800/60' : 'bg-slate-50/50 border-slate-200'}`}>
                            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-350 pb-3 border-b border-slate-800/60 flex items-center justify-between">
                              <span>📐 Répartition Qty par Taille</span>
                              <span className="text-[10px] text-slate-500 font-mono">Unité: Pcs</span>
                            </h3>
                            <div className="space-y-3 pt-4 font-mono">
                              {summaryUniqueSizes.map(size => {
                                let sizeSum = 0;
                                activeResults.forEach(r => { sizeSum += r.totals.sizes[size] || 0; });
                                const maxVal = Math.max(...summaryUniqueSizes.map(s => {
                                  let sumS = 0;
                                  activeResults.forEach(r => { sumS += r.totals.sizes[s] || 0; });
                                  return sumS;
                                }), 1);
                                const pctOfMax = (sizeSum / maxVal) * 100;
                                return (
                                  <div key={size} className="flex items-center gap-3">
                                    <span className="w-12 text-xs font-mono font-bold text-slate-300 text-left">{size}</span>
                                    <div className="flex-1 h-5 bg-slate-800/80 rounded border border-slate-800 flex items-center px-1">
                                      <div
                                        className="h-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xs transition-all duration-500 flex items-center justify-end pr-1.5"
                                        style={{ width: `${Math.max(pctOfMax, 4)}%` }}
                                      >
                                        {sizeSum > 0 && <span className="text-[9px] text-white font-mono font-bold">{sizeSum}</span>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                        {/* Bottom Row: Detailed Recap Matrix */}
                        <div className="mt-6 border-t border-slate-800 pt-6">
                          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-350 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-3 bg-teal-400 rounded-sm" />
                            <span>📋 Tableau de Synthèse des totaux par couleur</span>
                          </h3>
                          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/10">
                            <table className="w-full text-xs text-center border-collapse">
                              <thead>
                                <tr className="bg-slate-900 font-mono font-semibold text-slate-400 border-b border-slate-800">
                                  <th className="py-2.5 px-3 text-left">Couleur</th>
                                  <th className="py-2.5">Total Cartons</th>
                                  <th className="py-2.5">Style d'emballage</th>
                                  <th className="py-2.5">Total Pièces</th>
                                  <th className="py-2.5 text-teal-400">Poids Net</th>
                                  <th className="py-2.5 text-red-500 font-bold">Poids Brut</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/65 font-mono">
                                {activeResults.map((res, ci) => (
                                  <tr key={ci} className="hover:bg-slate-800/25">
                                    <td className="py-2.5 px-3 text-left font-bold" style={{ color: res.color }}>{res.nom}</td>
                                    <td className="font-bold text-slate-300">{res.totals.c}</td>
                                    <td className="text-[10px] text-slate-400 font-bold">
                                      {res.mode === 'strict_solide' ? '🔒 SOLID PACK' : '🔀 MIXED PACK'}
                                    </td>
                                    <td className="font-bold text-amber-500">{res.totals.p} Pcs</td>
                                    <td className="text-teal-400 font-semibold">{res.totals.n.toFixed(1)} KG</td>
                                    <td className="text-red-400 font-semibold">{res.totals.g.toFixed(1)} KG</td>
                                  </tr>
                                ))}
                                <tr className="bg-amber-500/10 dark:bg-amber-955/30 text-amber-800 dark:text-amber-400 font-extrabold border-t-2 border-t-amber-500/80">
                                  <td className="py-3 px-3 text-left font-black">TOTAL EXPÉDITION</td>
                                  <td className="font-extrabold">{grandTotals.c}</td>
                                  <td className="text-amber-600 dark:text-amber-500 text-[10px] font-bold">MULTICOLORE / MULTISIZE</td>
                                  <td className="text-amber-600 dark:text-amber-300 font-black">{grandTotals.p} Pcs</td>
                                  <td className="font-bold text-[#0e7490] dark:text-[#38bdf8]">{grandTotals.n.toFixed(1)} KG</td>
                                  <td className="font-bold text-[#b91c1c] dark:text-[#f87171]">{grandTotals.g.toFixed(1)} KG</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 📦 BORDEREAU COMPLET DU PACKING LIST PAR CARTONS */}
                        <div className="mt-8 border-t border-slate-800 pt-6">
                          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-350 mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span className="w-1.5 h-3 bg-emerald-500 rounded-sm" />
                              <span>📦 DÉTAILS COMPLETS DU PACKING LIST PAR CARTONS</span>
                            </span>
                          </h3>
                          <div className="space-y-6">
                            {activeResults.map((res, ci) => {
                              const origIdx = res.colorIndex ?? ci;
                              const activeColorSizes = res.tailles.filter(t => isStandardSizeAlwaysShown(t) || (colors[origIdx]?.sizes[t]?.qtyTot || 0) > 0);
                              return (
                                <div key={ci} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-950/25 border-slate-900/60' : 'bg-slate-50 border-slate-250/60'}`}>
                                  <div className="flex items-center gap-2 border-b border-dashed border-slate-800/20 pb-2 mb-3 text-xs font-mono font-bold uppercase" style={{ color: res.color }}>
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: res.color }} />
                                    <span>Couleur: {res.nom} — {res.mode === 'strict_solide' ? '🔒 Solid Pack' : '🔀 Mixed Pack'}</span>
                                  </div>
                                  <div className={`overflow-x-auto rounded-lg border ${
                                    darkMode ? 'border-slate-800 bg-slate-900/10' : 'border-slate-200 bg-slate-100/10'
                                  }`}>
                                    <table className="w-full text-xs text-center border-collapse">
                                      <thead>
                                        <tr className={`border-b font-mono font-bold text-[10px] ${
                                          darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-750'
                                        }`}>
                                          <th className={`py-2 px-1 uppercase text-center border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Début</th>
                                          <th className={`py-2 px-1 uppercase text-center border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Fin</th>
                                          {activeColorSizes.map(t => (
                                            <th key={t} className={`px-1.5 border-r text-[#4f8ef7] ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>{t}</th>
                                          ))}
                                          <th className={`px-1.5 border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Pcs/Ctn</th>
                                          <th className={`px-1.5 border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Nb Ctn</th>
                                          <th className={`px-1.5 border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Total Qty</th>
                                          <th className={`px-1.5 border-r text-teal-400 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>N.W (KG)</th>
                                          <th className="px-1.5 text-red-400 font-bold">G.W (KG)</th>
                                        </tr>
                                      </thead>
                                      <tbody className={`divide-y font-mono ${darkMode ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
                                        {res.rows.map((row, rIdx) => (
                                          <tr key={rIdx} className={`hover:bg-slate-800/10 divide-x ${darkMode ? 'divide-slate-800/30' : 'divide-slate-200'}`}>
                                            <td className={`py-1.5 px-1 font-bold ${darkMode ? 'text-slate-400' : 'text-slate-800'}`}>{parseCartonRange(row.cartonRange).start}</td>
                                            <td className={`py-1.5 px-1 font-bold ${darkMode ? 'text-slate-400' : 'text-slate-800'}`}>{parseCartonRange(row.cartonRange).end}</td>
                                            {activeColorSizes.map(t => (
                                              <td key={t} className={`px-1.5 font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{row.sizes[t] || ''}</td>
                                            ))}
                                            <td className={`px-1.5 font-bold ${darkMode ? 'bg-slate-900/10 text-slate-200' : 'bg-slate-100/40 text-slate-800'}`}>{row.pcsPerCarton}</td>
                                            <td className={`px-1.5 font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{row.nbr}</td>
                                            <td className={`px-1.5 font-bold ${darkMode ? 'text-slate-300' : 'text-slate-950'}`}>{row.totalPcs}</td>
                                            <td className="px-1.5 text-teal-400 font-semibold">{row.netWeightRow.toFixed(1)}</td>
                                            <td className="px-1.5 text-red-500 font-semibold">{row.grossWeightRow.toFixed(1)}</td>
                                          </tr>
                                        ))}
                                        <tr className={`font-bold border-t divide-x ${
                                          darkMode 
                                            ? 'bg-amber-500/5 text-amber-400 border-slate-800 divide-slate-800' 
                                            : 'bg-amber-500/5 text-amber-850 border-slate-200 divide-slate-200'
                                        }`}>
                                          <td colSpan={2} className="py-1.5 px-2">Total {res.nom}</td>
                                          {activeColorSizes.map(t => (
                                            <td key={t} className={darkMode ? 'text-slate-400' : 'text-slate-700'}>{res.totals.sizes[t] || 0}</td>
                                          ))}
                                          <td>—</td>
                                          <td className="px-1.5">{res.totals.c} ctns</td>
                                          <td className="px-1.5 text-amber-600 dark:text-amber-300">{res.totals.p} pcs</td>
                                          <td className="px-1.5 text-teal-400">{res.totals.n.toFixed(1)} KG</td>
                                          <td className="px-1.5 text-red-500">{res.totals.g.toFixed(1)} KG</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeInputTab === 'saves' && (
                <motion.div
                  key="saves-section"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {/* SAVE CREATOR GRID CONTROL */}
                  <div className={`rounded-xl border p-5 ${darkMode ? 'bg-[#161a23] border-slate-800' : 'bg-white border-slate-200'} space-y-4 shadow-sm`}>
                    <div className="flex items-center justify-between border-b pb-3 border-dashed border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-4 bg-blue-500 rounded-sm" />
                        <h2 className={`text-xs font-mono font-bold tracking-wider ${darkMode ? 'text-slate-100' : 'text-slate-700'} uppercase`}>
                          💾 Sauvegarder la Fiche Actuelle
                        </h2>
                      </div>

                      {/* Autosave Switcher */}
                      <button
                        onClick={() => setIsAutosaveEnabled(!isAutosaveEnabled)}
                        className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                          isAutosaveEnabled
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                        title="Désactiver ou réactiver l'enregistrement automatique sur le navigateur"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isAutosaveEnabled ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                        <span>SAUVEGARDE AUTO : {isAutosaveEnabled ? 'ACTIVE' : 'ASSOUPIE'}</span>
                      </button>
                    </div>

                    <div className="pt-2 space-y-3">
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        L'enregistrement automatique stocke vos modifications en temps réel. 
                        Vous pouvez aussi figer des <strong>instantanés d'étapes nommés</strong> de vos fiches de colisage ci-dessous.
                      </p>

                      <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-1">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={saveNameInput}
                            onChange={(e) => setSaveNameInput(e.target.value)}
                            placeholder="Saisir un nom de sauvegarde personnalisé (vide = auto-génération)"
                            className={`w-full text-xs font-mono rounded-lg border px-3 py-2.5 focus:outline-none transition-all ${
                              darkMode ? 'bg-[#1f2430] border-slate-800 text-white focus:border-blue-500' : 'bg-[#f4f6fb] border-slate-300 text-slate-900 focus:border-[#4f8ef7]'
                            }`}
                          />
                        </div>
                        <button
                          onClick={() => handleSaveCurrentList(saveNameInput)}
                          className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-[#4f8ef7] hover:brightness-110 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10 hover:scale-[1.01] active:scale-[0.99]"
                        >
                          <Save className="w-4 h-4" />
                          <span>CRÉER UN INSTANTANÉ</span>
                        </button>
                      </div>

                      {/* Flash feedback alerts */}
                      <AnimatePresence mode="wait">
                        {savesSuccess && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded-lg font-bold"
                          >
                            {savesSuccess}
                          </motion.div>
                        )}
                        {savesError && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono rounded-lg font-bold"
                          >
                            {savesError}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* SAVED SLOTS GRID */}
                  <div className={`rounded-xl border p-5 ${darkMode ? 'bg-[#161a23] border-slate-800' : 'bg-white border-slate-200'} space-y-4 shadow-sm pb-6`}>
                    <div className="flex items-center justify-between border-b pb-3 border-dashed border-slate-800/60 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-4 bg-purple-500 rounded-sm" />
                        <h2 className={`text-xs font-mono font-bold tracking-wider ${darkMode ? 'text-slate-100' : 'text-slate-700'} uppercase`}>
                          🗄️ Historique & Fiches Enregistrées ({savedLists.length})
                        </h2>
                      </div>
                    </div>

                    {savedLists.length === 0 ? (
                      <div className="text-center py-10 px-4 space-y-3">
                        <div className="w-12 h-12 bg-slate-800/30 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                          <History className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h4 className={`text-xs font-bold font-mono uppercase ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Aucune fiche sauvegardée</h4>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                            Toutes vos fiches de colisage de cartons solides ou mixtes peuvent être archivées localement sur ce navigateur. 
                            Créez-en une en utilisant le module ci-dessus !
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedLists.map((item) => {
                          const isAutosaveEquivalent = meta.order === item.meta.order && meta.customer === item.meta.customer && meta.style === item.meta.style;
                          
                          return (
                            <div
                              key={item.id}
                              className={`p-4 border rounded-xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                                darkMode 
                                  ? isAutosaveEquivalent
                                    ? 'bg-[#18233c]/60 border-blue-500/40 hover:border-blue-500/60 shadow-[#4f8ef7]/5'
                                    : 'bg-[#1e2330]/50 border-slate-800 hover:border-slate-700'
                                  : isAutosaveEquivalent
                                    ? 'bg-[#f4f7fc] border-blue-400/60 hover:border-blue-500/65 shadow-xs'
                                    : 'bg-[#fcfdfe] border-slate-250 hover:border-slate-350'
                              }`}
                            >
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className={`text-xs font-bold font-sans ${darkMode ? 'text-white' : 'text-slate-800'} truncate max-w-xl`}>
                                    {item.name}
                                  </h4>
                                  {isAutosaveEquivalent && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase font-mono bg-blue-500/15 border border-blue-500/30 text-[#4f8ef7]" title="Cette fiche correspond aux en-têtes actuellement ouverts">
                                      Ouvert
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-slate-400">
                                  <span>📅 {new Date(item.savedAt).toLocaleDateString('fr-FR')} {new Date(item.savedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>•</span>
                                  <span>🏭 Client: <strong className={darkMode ? 'text-slate-350': 'text-slate-700'}>{item.meta.customer || '—'}</strong></span>
                                  <span>•</span>
                                  <span>📁 Commande: <strong className={darkMode ? 'text-slate-350' : 'text-slate-700'}>{item.meta.order || '—'}</strong></span>
                                  <span>•</span>
                                  <span className={`px-1 py-px rounded text-[9px] ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                                    {item.colors.length} Couleur{item.colors.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>

                              {/* Button interaction cluster */}
                              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                <button
                                  onClick={() => handleLoadSavedList(item)}
                                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1 border hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                                    darkMode 
                                      ? 'bg-[#1e293b] hover:bg-slate-700 border-slate-700 text-slate-100'
                                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                                  }`}
                                  title="Recharger cette fiche dans l'éditeur de colisage"
                                >
                                  🔌 Restaurer
                                </button>

                                {confirmDeleteId !== item.id ? (
                                  <button
                                    onClick={() => setConfirmDeleteId(item.id)}
                                    className="px-2.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 font-mono text-xs hover:bg-red-500/10 cursor-pointer"
                                    title="Supprimer cette sauvegarde définitivement"
                                  >
                                    🗑️
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/40 p-1 rounded-lg transition-all">
                                    <button
                                      onClick={() => handleDeleteSavedList(item.id, item.name)}
                                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-black rounded text-[10px] cursor-pointer"
                                    >
                                      🚨 CONFIRMER
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className={`px-1.5 py-1 text-slate-300 rounded text-[10px] cursor-pointer ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-300 hover:bg-slate-400'}`}
                                      title="Annuler"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CALCULATION RESULTS DISPLAY PANELS (RENDERED EXCLUSIVELY FOR PRINT VIEW AND HIDDEN ON-SCREEN TO PREVENT TAB CLUTTER) */}
        {hasGenerated && (
          <div className="hidden print:block print:space-y-6">
            
            {/* PRINT INDIVIDUAL COLOR PACKS */}
            {printSections.ind && activeResults.map((res, ci) => {
              const origIdx = res.colorIndex ?? ci;
              const bgClass = darkMode ? BG_COLORS_DARK[origIdx % PALETTE.length] : BG_COLORS_LIGHT[origIdx % PALETTE.length];
              const activeColorSizes = res.tailles.filter(t => isStandardSizeAlwaysShown(t) || (colors[origIdx]?.sizes[t]?.qtyTot || 0) > 0);
              return (
                <div
                  key={ci}
                  className={`rounded-xl border p-5 print-ind-card break-inside-avoid shadow-sm ${
                    darkMode ? 'bg-[#161a23] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Print custom headers */}
                  {printSections.hdr && (
                    <div className="hidden print:block text-center border-b-2 border-red-700 pb-3 mb-4">
                      <h2 className="text-xl font-bold text-red-750">PACKING LIST ({meta.customer})</h2>
                      <div className="mt-2 text-[10px] text-slate-600 grid grid-cols-2 text-left gap-1">
                        <div><b>COMMANDE :</b> {meta.order || '—'}</div>
                        {meta.po && <div><b>PO# :</b> {meta.po}</div>}
                        {meta.invoice && <div><b>INVOICE N° :</b> {meta.invoice}</div>}
                        {meta.refClient && <div><b>REF CLIENT :</b> {meta.refClient}</div>}
                        {meta.style && <div><b>STYLE :</b> {meta.style} {meta.styleNumber ? `(${meta.styleNumber})` : ''}</div>}
                        {meta.destination && <div><b>DESTINATION :</b> {meta.destination} {meta.address ? `(${meta.address})` : ''}</div>}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 bg-[#222636]/10 px-4 py-2.5 rounded-lg border border-slate-800/60 mb-3 text-blue-400 font-mono font-bold uppercase text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: res.color }} />
                    PACKING LIST — COULEUR : {res.nom}
                  </div>

                  {/* Print metadata row */}
                  {printSections.meta && (
                    <div className={`flex flex-wrap gap-4 text-[11px] font-mono pb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <span>COMMANDE: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{meta.order || '—'}</b></span>
                      <span>CLIENT: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{meta.customer || '—'}</b></span>
                      {meta.po && <span>PO: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{meta.po}</b></span>}
                      {meta.invoice && <span>INV: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{meta.invoice}</b></span>}
                      {meta.style && <span>STYLE: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{meta.style}</b></span>}
                      {meta.destination && <span>DESTINATION: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{meta.destination}</b></span>}
                      {meta.portDepart && <span>PORTS: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{meta.portDepart} → {meta.portArrivee}</b></span>}
                    </div>
                  )}

                  {/* Mode strategies hints */}
                  <div className="pb-3 text-xs">
                    {res.mode === 'strict_solide' ? (
                      <span className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold font-mono tracking-wide">
                        🔒 SOLID PACK STRICT
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold font-mono tracking-wide">
                        🔀 MIXED PACK AUTORISÉ (max {maxSizesPerBox} tailles)
                      </span>
                    )}
                  </div>

                  {/* Grid layout */}
                  <div className={`overflow-x-auto rounded-lg border ${
                    darkMode ? 'border-slate-800 bg-slate-900/10' : 'border-slate-200 bg-slate-100/10'
                  }`}>
                    <table className="w-full text-xs text-center border-collapse">
                      <thead>
                        <tr className={`border-b font-mono font-bold text-[10px] ${
                          darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {printColumns.ctn && (
                            <>
                              <th className={`py-2.5 px-2 uppercase text-center col-ctn-index border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>N° DÉBUT</th>
                              <th className={`py-2.5 px-2 uppercase text-center col-ctn-index border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>N° FIN</th>
                            </>
                          )}
                          {printColumns.color && <th className={`px-2 col-color-lbl border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>COULEUR</th>}
                          {(() => {
                            const origColor = colors.find(c => c.nom === res.nom);
                            const showSkuCol = printColumns.sku && !!(origColor && Object.values(origColor.sizes || {}).some((s: any) => s.sku && String(s.sku).trim() !== ''));
                            return showSkuCol && <th className={`px-3 col-sku-lbl bg-emerald-500/5 text-emerald-400 border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>SKU</th>;
                          })()}
                          {printColumns.sizes && activeColorSizes.map(t => (
                            <th key={t} className={`px-2 col-sizes-cells border-r bg-blue-500/5 text-[#4f8ef7] ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>{t}</th>
                          ))}
                          <th className={`px-2 border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>PCS/CTN</th>
                          {printColumns.nbctn && <th className={`px-2 col-nbctn-metric border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>NB CTN</th>}
                          {printColumns.totalqty && <th className={`px-2 col-totalqty-metric border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>TOTAL QTY</th>}
                          {printColumns.net && <th className={`px-2 text-teal-400 col-net-metric border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>N.W (KG)</th>}
                          {printColumns.gross && <th className={`px-2 text-red-400 col-gross-metric border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>G.W (KG)</th>}
                          {printColumns.cbm && <th className="px-2 col-cbm-metric">CBM (m³)</th>}
                        </tr>
                      </thead>
                      <tbody className={`divide-y font-mono font-medium ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                        {res.rows.map((row, rIdx) => {
                          const origColor = colors.find(c => c.nom === res.nom);
                          const showSkuCol = printColumns.sku && !!(origColor && Object.values(origColor.sizes || {}).some((s: any) => s.sku && String(s.sku).trim() !== ''));
                          return (
                            <tr key={rIdx} className={`hover:bg-slate-800/40 divide-x ${darkMode ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
                              {printColumns.ctn && (
                                <>
                                  <td className={`py-2 px-2 text-center font-bold col-ctn-index ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                                    {parseCartonRange(row.cartonRange).start}
                                  </td>
                                  <td className={`py-2 px-2 text-center font-bold col-ctn-index ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                                    {parseCartonRange(row.cartonRange).end}
                                  </td>
                                </>
                              )}
                              {printColumns.color && <td className="px-2 font-bold col-color-lbl" style={{ color: res.color }}>{res.nom}</td>}
                              {showSkuCol && <td className="px-3 truncate max-w-28 text-[11px] text-emerald-500 font-semibold col-sku-lbl">{row.skus.join('/') || '—'}</td>}
                              {printColumns.sizes && activeColorSizes.map(t => (
                                <td key={t} className={`px-2 font-bold col-sizes-cells ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{row.sizes[t] || ''}</td>
                              ))}
                              <td className={`px-2 font-bold bg-slate-900/10 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{row.pcsPerCarton}</td>
                              {printColumns.nbctn && <td className={`px-2 font-black col-nbctn-metric ${darkMode ? 'text-slate-100' : 'text-slate-950'}`}>{row.nbr}</td>}
                              {printColumns.totalqty && <td className={`px-2 font-black bg-slate-900/15 col-totalqty-metric ${darkMode ? 'text-slate-100' : 'text-slate-950'}`}>{row.totalPcs}</td>}
                              {printColumns.net && <td className="px-2 font-bold text-teal-400 col-net-metric">{row.netWeightRow.toFixed(2)}</td>}
                              {printColumns.gross && <td className={`px-2 font-bold col-gross-metric ${darkMode ? 'text-red-300' : 'text-red-650'}`}>{row.grossWeightRow.toFixed(2)}</td>}
                              {printColumns.cbm && <td className={`px-2 col-cbm-metric ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{row.cbmRow.toFixed(4)}</td>}
                            </tr>
                          );
                        })}

                        {/* Totals row index */}
                        <tr className="bg-amber-500/10 dark:bg-amber-955/30 text-amber-800 dark:text-amber-400 font-black border-t-2 border-t-amber-500/70 border-b border-dark-900 divide-x divide-slate-800">
                          {printColumns.ctn && <td colSpan={2} className="py-2.5 px-3 text-center col-ctn-index">TOTALE</td>}
                          {printColumns.color && <td className="px-2 font-extrabold col-color-lbl">{res.nom}</td>}
                          {(() => {
                            const origColor = colors.find(c => c.nom === res.nom);
                            const showSkuCol = printColumns.sku && !!(origColor && Object.values(origColor.sizes || {}).some((s: any) => s.sku && String(s.sku).trim() !== ''));
                            return showSkuCol && <td className="px-3 col-sku-lbl">—</td>;
                          })()}
                          {printColumns.sizes && activeColorSizes.map(t => (
                            <td key={t} className="px-2 col-sizes-cells">{res.totals.sizes[t] || 0}</td>
                          ))}
                          <td>—</td>
                          {printColumns.nbctn && <td className="px-2 col-nbctn-metric">{res.totals.c}</td>}
                          {printColumns.totalqty && <td className="px-2 text-amber-600 dark:text-amber-300 col-totalqty-metric">{res.totals.p}</td>}
                          {printColumns.net && <td className="px-2 font-black col-net-metric text-[#0e7490] dark:text-[#38bdf8]">{res.totals.n.toFixed(2)}</td>}
                          {printColumns.gross && <td className="px-2 font-black col-gross-metric text-[#b91c1c] dark:text-[#f87171]">{res.totals.g.toFixed(2)}</td>}
                          {printColumns.cbm && <td className="px-2 text-slate-400 col-cbm-metric">{res.totals.v.toFixed(4)}</td>}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Print weights templates list */}
                  {printSections.dim && (
                    <div className="mt-4 pt-3 border-t border-dashed border-slate-800 font-mono text-[10px] text-slate-500 space-y-1 print-dim-table">
                      <span className="font-bold uppercase tracking-wider block">GABARIT DE COLIS ET DIRECTIVES DU MODÈLE :</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {activeColorSizes.map(t => {
                          const spec = colors[res.colorIndex ?? ci]?.sizes[t];
                          if (!spec) return null;
                          return (
                            <div key={t} className="p-1.5 rounded bg-slate-900 border border-slate-800 flex flex-col">
                              <span>Taille: <b>{t}</b> SKUs: {spec.sku || '—'}</span>
                              <span>Pce: {spec.wPiece}kg Carton: {spec.wCarton}kg</span>
                              <span>Dim: {spec.dimL}×{spec.diml}×{spec.dimH} cm</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* PRINT COMBINED LEDGER (MULTIPLE COLORS CHOSEN) */}
            {printSections.cpl && activeResults.length > 1 && (
              <div className={`rounded-xl border p-5 print-cpl-card break-inside-avoid shadow-sm ${
                darkMode ? 'bg-[#161a23] border-slate-805' : 'bg-white border-slate-200'
              }`}>
                {/* Print custom headers */}
                {printSections.hdr && (
                  <div className="hidden print:block text-center border-b-2 border-red-700 pb-3 mb-4">
                    <h2 className="text-xl font-bold text-red-750">COMBINED LEDGER ({meta.customer})</h2>
                    <div className="mt-2 text-[10px] text-slate-600 grid grid-cols-2 text-left gap-1">
                      <div><b>COMMANDE :</b> {meta.order || '—'}</div>
                      {meta.po && <div><b>PO# :</b> {meta.po}</div>}
                      {meta.invoice && <div><b>INVOICE N° :</b> {meta.invoice}</div>}
                      {meta.refClient && <div><b>REF CLIENT :</b> {meta.refClient}</div>}
                      {meta.style && <div><b>STYLE :</b> {meta.style} {meta.styleNumber ? `(${meta.styleNumber})` : ''}</div>}
                      {meta.destination && <div><b>DESTINATION :</b> {meta.destination} {meta.address ? `(${meta.address})` : ''}</div>}
                    </div>
                  </div>
                )}

                <div className={`bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 font-bold px-4 py-3 rounded-lg flex items-center gap-3 font-mono text-sm mb-4 ${darkMode ? 'text-white' : 'text-[#4f8ef7]'}`}>
                  📁 COMBINED PACKING LIST — LEDGER GLOBAL TOUTES COULEURS ({results.length})
                </div>

                {printSections.meta && (
                  <div className={`flex flex-wrap gap-4 text-[11px] font-mono pb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>COMMANDE: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{meta.order || '—'}</b></span>
                    <span>CLIENT: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{meta.customer || '—'}</b></span>
                    {meta.po && <span>PO: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{meta.po}</b></span>}
                    {meta.destination && <span>DESTINATION: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{meta.destination}</b></span>}
                    <span>CARTONS TOTAL: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{grandTotals.c}</b></span>
                    <span>QTE TOUTE: <b className={darkMode ? 'text-slate-200' : 'text-slate-900'}>{grandTotals.p.toLocaleString('fr-FR')} PCS</b></span>
                  </div>
                )}

                {/* Legend list indicators */}
                {printSections.leg && (
                  <div className="flex flex-wrap gap-3 pb-4 items-center print-legend">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">LÉGENDE GRAPHES :</span>
                    {results.map((res, ci) => (
                      <div key={ci} className="flex items-center gap-1.5 text-xs font-mono font-bold">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: res.color }} />
                        <span>{res.nom}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={`overflow-x-auto rounded-lg border ${
                  darkMode ? 'border-slate-800 bg-slate-900/10' : 'border-slate-200 bg-slate-100/10'
                }`}>
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className={`border-b font-mono font-bold text-[10px] ${
                        darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        {printColumns.ctn && (
                          <>
                            <th className={`py-2.5 px-2 uppercase text-center col-ctn-index border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>N° DÉBUT</th>
                            <th className={`py-2.5 px-2 uppercase text-center col-ctn-index border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>N° FIN</th>
                          </>
                        )}
                        {printColumns.color && <th className={`px-2 col-color-lbl border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>COULEUR</th>}
                        {(() => {
                          const showSkuColCombined = printColumns.sku && colors.some(col => Object.values(col.sizes || {}).some((s: any) => s.sku && String(s.sku).trim() !== ''));
                          return showSkuColCombined && <th className={`px-3 col-sku-lbl bg-emerald-500/5 text-emerald-400 border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>SKU</th>;
                        })()}
                        {printColumns.sizes && summaryUniqueSizes.map(t => (
                          <th key={t} className={`px-2 col-sizes-cells border-r bg-blue-500/5 text-[#4f8ef7] ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>{t}</th>
                        ))}
                        <th className={`px-2 border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>PCS/CTN</th>
                        {printColumns.nbctn && <th className={`px-2 col-nbctn-metric border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>NB CTN</th>}
                        {printColumns.totalqty && <th className={`px-2 col-totalqty-metric border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>TOTAL QTY</th>}
                        {printColumns.net && <th className={`px-2 text-teal-400 col-net-metric border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>N.W (KG)</th>}
                        {printColumns.gross && <th className={`px-2 text-red-400 col-gross-metric border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>G.W (KG)</th>}
                        {printColumns.cbm && <th className="px-2 col-cbm-metric">CBM (m³)</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-left">
                      {(() => {
                        let rowCount = 0;
                        let seqNum = 1;
                        const showSkuColCombined = printColumns.sku && colors.some(col => Object.values(col.sizes || {}).some((s: any) => s.sku && String(s.sku).trim() !== ''));
                        return results.map((res, ci) => {
                          const bgCode = darkMode ? BG_COLORS_DARK[ci % PALETTE.length] : BG_COLORS_LIGHT[ci % PALETTE.length];
                          return res.rows.map((row, rIdx) => {
                            const currentStart = seqNum;
                            const currentEnd = seqNum + row.nbr - 1;
                            seqNum += row.nbr;
                            rowCount++;
                            return (
                              <tr
                                key={`${ci}-${rIdx}`}
                                className="hover:bg-slate-800/20 divide-x divide-slate-800/40 font-medium"
                                style={{ backgroundColor: bgCode }}
                              >
                                {printColumns.ctn && (
                                  <>
                                    <td className={`py-2 px-2 text-center font-bold col-ctn-index ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{currentStart}</td>
                                    <td className={`py-2 px-2 text-center font-bold col-ctn-index ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{currentEnd}</td>
                                  </>
                                )}
                                {printColumns.color && <td className="px-2 font-bold col-color-lbl" style={{ color: res.color }}>{res.nom}</td>}
                                {showSkuColCombined && <td className="px-3 truncate max-w-28 text-[11px] text-emerald-500 col-sku-lbl">{row.skus.join('/') || '—'}</td>}
                                {printColumns.sizes && summaryUniqueSizes.map(t => (
                                  <td key={t} className={`px-2 text-center font-bold col-sizes-cells ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{row.sizes[t] || ''}</td>
                                ))}
                                <td className={`px-2 text-center font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{row.pcsPerCarton}</td>
                                {printColumns.nbctn && <td className={`px-2 text-center font-black col-nbctn-metric ${darkMode ? 'text-slate-100' : 'text-slate-950'}`}>{row.nbr}</td>}
                                {printColumns.totalqty && <td className={`px-2 text-center font-black bg-slate-900/10 col-totalqty-metric ${darkMode ? 'text-slate-100' : 'text-slate-950'}`}>{row.totalPcs}</td>}
                                {printColumns.net && <td className="px-2 text-center font-bold text-teal-400 col-net-metric">{row.netWeightRow.toFixed(2)}</td>}
                                {printColumns.gross && <td className={`px-2 text-center font-bold col-gross-metric ${darkMode ? 'text-red-300' : 'text-red-650'}`}>{row.grossWeightRow.toFixed(2)}</td>}
                                {printColumns.cbm && <td className={`px-2 text-center col-cbm-metric ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{row.cbmRow.toFixed(4)}</td>}
                              </tr>
                            );
                          });
                        });
                      })()}

                      {/* Global combined total row */}
                      <tr className="bg-[#222636]/40 font-bold border-t border-slate-700 divide-x divide-slate-800">
                        {printColumns.ctn && <td colSpan={2} className="py-2.5 px-3 text-center col-ctn-index">GRAND TOTAL</td>}
                        {printColumns.color && <td className="px-2 col-color-lbl">ALL</td>}
                        {(() => {
                          const showSkuColCombined = printColumns.sku && colors.some(col => Object.values(col.sizes || {}).some((s: any) => s.sku && String(s.sku).trim() !== ''));
                          return showSkuColCombined && <td className="px-3 col-sku-lbl">—</td>;
                        })()}
                        {printColumns.sizes && summaryUniqueSizes.map(t => {
                          let sumT = 0;
                          results.forEach(r => { sumT += r.totals.sizes[t] || 0; });
                          return <td key={t} className="px-2 text-center col-sizes-cells">{sumT}</td>;
                        })}
                        <td className="text-center">—</td>
                        {printColumns.nbctn && <td className="px-2 text-center col-nbctn-metric">{grandTotals.c}</td>}
                        {printColumns.totalqty && <td className="px-2 text-center text-slate-100 col-totalqty-metric">{grandTotals.p}</td>}
                        {printColumns.net && <td className="px-2 text-center text-teal-400 col-net-metric">{grandTotals.n.toFixed(2)}</td>}
                        {printColumns.gross && <td className="px-2 text-center text-red-400 col-gross-metric">{grandTotals.g.toFixed(2)}</td>}
                        {printColumns.cbm && <td className="px-2 text-center text-slate-400 col-cbm-metric">{grandTotals.v.toFixed(4)}</td>}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Color/Size matrices */}
                {printSections.bk && (
                  <div className="mt-6 space-y-3 print-bk-table break-inside-avoid">
                    <div className="bg-[#f6e05e] border border-amber-500/60 font-mono font-bold px-4 py-2 text-slate-900 rounded-lg text-xs">
                      📊 COLOR / SIZE BREAKDOWN COMBINED (Ledger global des colisages)
                    </div>
                    <div className={`overflow-x-auto rounded-lg border ${
                      darkMode ? 'border-slate-800' : 'border-slate-200 bg-white'
                    }`}>
                      <table className="w-full text-xs text-center border-collapse">
                        <thead>
                          <tr className={`font-mono font-semibold border-b ${
                            darkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            <th className={`py-2 px-3 text-left border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>COLOR / COULEUR</th>
                            {summaryUniqueSizes.map(t2 => <th key={t2} className={`border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>{t2}</th>)}
                            <th>TOTAL PCS</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y font-mono font-medium ${darkMode ? 'divide-slate-800 text-slate-200' : 'divide-slate-200 text-slate-800'}`}>
                          {activeResults.map((res, ci) => (
                            <tr key={ci} className={`hover:bg-slate-800/40 divide-x ${darkMode ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
                              <td className="py-2 px-3 text-left font-bold" style={{ color: res.color }}>{res.nom}</td>
                              {summaryUniqueSizes.map(t => (
                                <td key={t} className="font-bold">{res.totals.sizes[t] || ''}</td>
                              ))}
                              <td className={`font-black ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{res.totals.p}</td>
                            </tr>
                          ))}
                          <tr className={`font-extrabold border-t-2 divide-x ${
                            darkMode 
                              ? 'bg-amber-500/10 text-amber-400 border-t-amber-500/80 divide-slate-800' 
                              : 'bg-amber-500/5 text-amber-850 border-t-amber-500/60 divide-slate-200'
                          }`}>
                            <td className="py-2.5 px-3 text-left">TOTAL SHIFT</td>
                            {summaryUniqueSizes.map(t => {
                              let sumT = 0;
                              activeResults.forEach(r => { sumT += r.totals.sizes[t] || 0; });
                              return <td key={t} className="font-extrabold text-amber-600 dark:text-amber-300">{sumT}</td>;
                            })}
                            <td className="font-extrabold text-amber-600 dark:text-amber-300">{grandTotals.p}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Stats recap details cards */}
                {printSections.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-dashed border-slate-800 print-stats-box break-inside-avoid">
                    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/10">
                      <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Nombre de Pièces :</div>
                      <div className="text-lg font-bold text-amber-500 font-mono mt-0.5">{grandTotals.p.toLocaleString('fr-FR')} PCS</div>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/10">
                      <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Nombre de Cartons (CTN) :</div>
                      <div className="text-lg font-bold text-slate-350 font-mono mt-0.5">{grandTotals.c} Cartons</div>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/10">
                      <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Poids Net (N.W) :</div>
                      <div className="text-lg font-bold text-teal-400 font-mono mt-0.5">{grandTotals.n.toFixed(2)} KG</div>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/10">
                      <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Poids Brut (GW) :</div>
                      <div className="text-lg font-bold text-red-400 font-mono mt-0.5">{grandTotals.g.toFixed(2)} KG</div>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/10 col-span-2">
                      <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Volume Total m³ (CBM) :</div>
                      <div className="text-lg font-bold text-blue-400 font-mono mt-0.5">{grandTotals.v.toFixed(4)} m³</div>
                    </div>
                    {meta.yarn && (
                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/10 col-span-2">
                        <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Composition de Fil :</div>
                        <div className="text-xs font-semibold text-slate-20s truncate mt-0.5">{meta.yarn} / {meta.composition}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Standalone Single color Breakdown fallback */}
            {printSections.bk && activeResults.length === 1 && (
              <div className={`rounded-xl border p-5 print-ind-card break-inside-avoid shadow-sm ${
                darkMode ? 'bg-[#161a23] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="bg-[#f6e05e] border border-amber-500/60 font-mono font-bold px-4 py-2 text-slate-900 rounded-lg text-xs mb-3 uppercase">
                  📊 COLOR / SIZE BREAKDOWN SUMMARY
                </div>

                <div className={`overflow-x-auto rounded-lg border ${
                  darkMode ? 'border-slate-800' : 'border-slate-200 bg-white'
                }`}>
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className={`font-mono font-semibold border-b ${
                        darkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        <th className={`py-2 px-3 text-left border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>COLORS / COULEURS</th>
                        {activeResults[0].tailles.filter(t => isStandardSizeAlwaysShown(t) || (colors[activeResults[0].colorIndex ?? 0]?.sizes[t]?.qtyTot || 0) > 0).map(t => (
                          <th key={t} className={`border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>{t}</th>
                        ))}
                        <th>TOTAL QTY</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono font-medium ${darkMode ? 'divide-slate-800 text-slate-200' : 'divide-slate-200 text-slate-800'}`}>
                      <tr className={`divide-x ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                        <td className="py-2 px-3 text-left font-bold" style={{ color: activeResults[0].color }}>{activeResults[0].nom}</td>
                        {activeResults[0].tailles.filter(t => isStandardSizeAlwaysShown(t) || (colors[activeResults[0].colorIndex ?? 0]?.sizes[t]?.qtyTot || 0) > 0).map(t => (
                          <td key={t} className="font-bold">{activeResults[0].totals.sizes[t] || ''}</td>
                        ))}
                        <td className={`font-black ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{activeResults[0].totals.p}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {printSections.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 print-stats-box break-inside-avoid">
                    <div className={`p-3 rounded-lg border bg-slate-900/10 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Cartons :</div>
                      <div className={`text-sm font-bold font-mono mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{activeResults[0].totals.c}</div>
                    </div>
                    <div className={`p-3 rounded-lg border bg-slate-900/10 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Poids Net :</div>
                      <div className="text-sm font-bold font-mono text-teal-500 mt-0.5">{activeResults[0].totals.n.toFixed(2)} KG</div>
                    </div>
                    <div className={`p-3 rounded-lg border bg-slate-900/10 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Poids Brut :</div>
                      <div className="text-sm font-bold font-mono text-red-500 mt-0.5">{activeResults[0].totals.g.toFixed(2)} KG</div>
                    </div>
                    <div className={`p-3 rounded-lg border bg-slate-900/10 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Volume Total :</div>
                      <div className="text-sm font-bold font-mono text-blue-500 mt-0.5">{activeResults[0].totals.v.toFixed(4)} m³</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Screenshot Overlay and Editor Tool Suite */}
      <ScreenshotTool
        isCapturing={isCapturingScreen}
        setIsCapturing={setIsCapturingScreen}
        darkMode={darkMode}
      />

      {/* Dynamic Modern Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[9999]"
          >
            <div className={`px-4.5 py-3 rounded-xl border flex items-center gap-2.5 text-xs font-mono font-bold shadow-xl backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-500/15 border-red-500/40 text-red-500 dark:text-red-400'
                : toast.type === 'info'
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-500 dark:text-blue-400'
                  : 'bg-[#ff5000]/15 border-[#ff5000]/40 text-[#ff5000]'
            }`}>
              <span className="text-sm">{toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✓'}</span>
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
