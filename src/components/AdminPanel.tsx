import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Package, ShoppingBag, Users, Plus, Tag, Settings2,
  Edit, Check, X, ShieldAlert, ChevronDown, ChevronUp, Clock, Truck, CheckCircle2,
  AlertTriangle, Upload, Banknote, Save, Trash2, Search, Loader2
} from 'lucide-react';
import type { Product } from './ProductItem';
import type { UserData } from './AccountPanel';
import { multiTcgSearch, type CardSearchResult } from '../services/multiTcgApi';
import { TCG_EXPANSIONS } from '../data/tcgExpansions';
import { apiGetAdminLogs } from '../api';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  discountApplied: number;
  status: string;
  tracking_number?: string;
  date: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  paymentMethod?: 'Transferencia' | 'Efectivo' | 'PayPal';
  paymentReceipt?: string;       // Base64 image
  paymentReceiptName?: string;
  cashAmountReceived?: number;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  isActive: boolean;
}

export interface BuybackRequest {
  id: string;
  customerEmail: string;
  customerName: string;
  date: string;
  cards: {
    name: string;
    expansion: string;
    rarity: string;
    condition: string;
    isGraded: boolean;
    estimatedValue: number;
    image?: string;
  }[];
  totalValue: number;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
}

export interface BankSettings {
  bankName: string;
  clabe: string;
  accountNumber: string;
  beneficiary: string;
  whatsapp: string;
  paypalClientId?: string;
  paypalActive?: string;
}

interface AdminPanelProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  inventory: Product[];
  onUpdateInventoryItem: (productId: string, updates: Partial<Product>) => void;
  onAddInventoryItem: (newProduct: Product) => void;
  onDeleteInventoryItem: (productId: string) => void;
  buybackRequests: BuybackRequest[];
  onUpdateBuybackStatus: (requestId: string, status: BuybackRequest['status']) => void;
  coupons: Coupon[];
  onAddCoupon: (newCoupon: Coupon) => void;
  onToggleCoupon: (code: string) => void;
  users: UserData[];
  bankSettings: BankSettings;
  onUpdateBankSettings: (settings: BankSettings) => void;
  onRegisterManualSale: (saleData: {
    customerName: string;
    customerEmail?: string;
    paymentMethod: string;
    items: { productId: string; quantity: number }[];
  }) => Promise<void>;
}

export default function AdminPanel({
  orders,
  onUpdateOrder,
  inventory,
  onUpdateInventoryItem,
  onAddInventoryItem,
  onDeleteInventoryItem,
  buybackRequests,
  onUpdateBuybackStatus,
  coupons,
  onAddCoupon,
  onToggleCoupon,
  users,
  bankSettings,
  onUpdateBankSettings,
  onRegisterManualSale
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'inventory' | 'sales' | 'customers' | 'coupons' | 'settings' | 'logs'>('metrics');
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month' | 'year' | 'all'>('7days');
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [customerPage, setCustomerPage] = useState<number>(1);
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'logs') {
      setLoadingLogs(true);
      apiGetAdminLogs()
        .then(setAdminLogs)
        .catch(err => console.error('Error al cargar logs:', err))
        .finally(() => setLoadingLogs(false));
    }
  }, [activeTab]);
  
  // States for adding product
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdCategory, setNewProdCategory] = useState<Product['category']>('booster_box');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdFileBase64, setNewProdFileBase64] = useState('');
  const [newProdFileName, setNewProdFileName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdStock, setNewProdStock] = useState(1);
  const [newProdExpansion, setNewProdExpansion] = useState('');
  const [newProdIsPromo, setNewProdIsPromo] = useState(false);
  const [newProdRegion, setNewProdRegion] = useState('Inglés (USA)');
  const [newProdPulledFrom, setNewProdPulledFrom] = useState('');
  const [newProdCardCondition, setNewProdCardCondition] = useState('NM');
  const [newProdGameType, setNewProdGameType] = useState('POKEMON');

  // States for TCG API card search
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [apiSearchResults, setApiSearchResults] = useState<CardSearchResult[]>([]);
  const [searchingCards, setSearchingCards] = useState(false);
  const [apiSearchError, setApiSearchError] = useState<string | null>(null);

  // States for CSV Catalog Import
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{success: number, error: number} | null>(null);

  // States for coupon form
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(10);

  // States for manual sale registration (over-the-counter)
  const [showManualSaleModal, setShowManualSaleModal] = useState(false);
  const [manualSaleName, setManualSaleName] = useState('Cliente General');
  const [manualSaleEmail, setManualSaleEmail] = useState('');
  const [manualSalePayment, setManualSalePayment] = useState('Efectivo');
  const [manualSaleItems, setManualSaleItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 }
  ]);
  const [manualSaleError, setManualSaleError] = useState('');
  const [manualSaleSaving, setManualSaleSaving] = useState(false);

  const handleRegisterManualSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSaleError('');

    const validItems = manualSaleItems.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      setManualSaleError('Debes seleccionar al menos un producto con cantidad mayor a 0');
      return;
    }

    for (const item of validItems) {
      const prod = inventory.find(p => p.id === item.productId);
      if (!prod) {
        setManualSaleError('Uno de los productos seleccionados no existe.');
        return;
      }
      if (prod.stock < item.quantity) {
        setManualSaleError(`Stock insuficiente para: ${prod.name} (Disponibles: ${prod.stock})`);
        return;
      }
    }

    setManualSaleSaving(true);
    try {
      await onRegisterManualSale({
        customerName: manualSaleName.trim(),
        customerEmail: manualSaleEmail.trim() || undefined,
        paymentMethod: manualSalePayment,
        items: validItems
      });
      setShowManualSaleModal(false);
      setManualSaleName('Cliente General');
      setManualSaleEmail('');
      setManualSalePayment('Efectivo');
      setManualSaleItems([{ productId: '', quantity: 1 }]);
    } catch (err: any) {
      setManualSaleError(err.message || 'Error al guardar la venta física.');
    } finally {
      setManualSaleSaving(false);
    }
  };

  const addManualSaleItemLine = () => {
    setManualSaleItems(prev => [...prev, { productId: '', quantity: 1 }]);
  };

  const removeManualSaleItemLine = (index: number) => {
    if (manualSaleItems.length > 1) {
      setManualSaleItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateManualSaleItemLine = (index: number, key: 'productId' | 'quantity', val: any) => {
    setManualSaleItems(prev => prev.map((item, i) => {
      if (i === index) {
        if (key === 'productId') {
          return { ...item, productId: val, quantity: 1 };
        }
        return { ...item, [key]: val };
      }
      return item;
    }));
  };

  // Search/Filter states
  const [invSearch, setInvSearch] = useState('');
  const [salesSearch, setSalesSearch] = useState('');
  const [salesStatusFilter, setSalesStatusFilter] = useState<'all' | 'Pendiente' | 'Pagado' | 'Enviado' | 'Entregado'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedBuyback, setExpandedBuyback] = useState<string | null>(null);

  // Per-order payment editing state
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<Record<string, 'Transferencia' | 'Efectivo'>>({});
  const [orderCashAmount, setOrderCashAmount] = useState<Record<string, number>>({});
  const [orderReceiptBase64, setOrderReceiptBase64] = useState<Record<string, string>>({});
  const [orderReceiptName, setOrderReceiptName] = useState<Record<string, string>>({});
  const [orderSaveSuccess, setOrderSaveSuccess] = useState<string | null>(null);

  // Confirm-delete state for inventory
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const productToDelete = inventory.find(p => p.id === confirmDeleteId);

  // Bank settings form state
  const [editBankName, setEditBankName] = useState(bankSettings.bankName);
  const [editClabe, setEditClabe] = useState(bankSettings.clabe);
  const [editAccount, setEditAccount] = useState(bankSettings.accountNumber);
  const [editBeneficiary, setEditBeneficiary] = useState(bankSettings.beneficiary);
  const [editWhatsapp, setEditWhatsapp] = useState(bankSettings.whatsapp || '');
  const [editPaypalClientId, setEditPaypalClientId] = useState(bankSettings.paypalClientId || '');
  const [editPaypalActive, setEditPaypalActive] = useState(bankSettings.paypalActive === 'true');
  const [bankSaveSuccess, setBankSaveSuccess] = useState(false);

  // Sync bankSettings props to form states when it finishes loading from API
  useEffect(() => {
    setEditBankName(bankSettings.bankName);
    setEditClabe(bankSettings.clabe);
    setEditAccount(bankSettings.accountNumber);
    setEditBeneficiary(bankSettings.beneficiary);
    setEditWhatsapp(bankSettings.whatsapp || '');
    setEditPaypalClientId(bankSettings.paypalClientId || '');
    setEditPaypalActive(bankSettings.paypalActive === 'true');
  }, [bankSettings]);

  // Edit product states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState(0);
  const [editProdCategory, setEditProdCategory] = useState<Product['category']>('booster_box');
  const [editProdImage, setEditProdImage] = useState('');
  const [editProdFileBase64, setEditProdFileBase64] = useState('');
  const [editProdFileName, setEditProdFileName] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdStock, setEditProdStock] = useState(0);
  const [editProdExpansion, setEditProdExpansion] = useState('');
  const [editProdIsPromo, setEditProdIsPromo] = useState(false);
  const [editProdRegion, setEditProdRegion] = useState('');
  const [editProdPulledFrom, setEditProdPulledFrom] = useState('');
  const [editProdCardCondition, setEditProdCardCondition] = useState('');
  const [editProdGameType, setEditProdGameType] = useState('');


  // Helper to handle local file upload to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEdit) {
        setEditProdFileBase64(base64String);
        setEditProdFileName(file.name);
      } else {
        setNewProdFileBase64(base64String);
        setNewProdFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler: Add new product
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalImage = '';
    if (newProdCategory === 'accessory') {
      finalImage = newProdFileBase64;
      if (!finalImage) {
        alert("Por favor sube una foto del accesorio.");
        return;
      }
    } else if (newProdCategory === 'single') {
      finalImage = newProdImage.trim() || '/generic_card.png';
    } else if (newProdCategory === 'booster_box') {
      finalImage = '/official_booster_box.png';
    } else if (newProdCategory === 'etb') {
      finalImage = '/official_etb.png';
    } else if (newProdCategory === 'blister') {
      finalImage = '/official_blister.png';
    } else {
      finalImage = '/generic_card.png';
    }
    
    if (!newProdName) {
      alert("Por favor ingresa el nombre del producto.");
      return;
    }
    if (Number(newProdPrice) <= 0) {
      alert("El precio debe ser mayor a 0.");
      return;
    }
    if (Number(newProdStock) < 0) {
      alert("El stock no puede ser negativo.");
      return;
    }

    const newProduct: Product = {
      id: `admin_added_${Date.now()}`,
      name: newProdName.trim(),
      price: Number(newProdPrice),
      category: newProdCategory,
      image: finalImage,
      description: newProdDesc.trim() || 'Producto agregado por administrador.',
      stock: Number(newProdStock),
      expansion: newProdExpansion.trim() || undefined,
      isPromo: newProdIsPromo,
      region: newProdCategory === 'single' ? newProdRegion : '',
      pulledFrom: newProdCategory === 'single' ? newProdPulledFrom : '',
      cardCondition: newProdCategory === 'single' ? newProdCardCondition : '',
      gameType: newProdCategory === 'single' ? newProdGameType : 'POKEMON'
    };

    onAddInventoryItem(newProduct);
    
    // Reset Form
    setNewProdName('');
    setNewProdPrice(0);
    setNewProdImage('');
    setNewProdFileBase64('');
    setNewProdFileName('');
    setNewProdDesc('');
    setNewProdStock(1);
    setNewProdExpansion('');
    setNewProdIsPromo(false);
    setNewProdRegion('Inglés (USA)');
    setNewProdPulledFrom('');
    setNewProdCardCondition('NM');
    setNewProdGameType('POKEMON');
    setApiSearchQuery('');
    setApiSearchResults([]);
    setShowAddForm(false);
  };

  // Handler: Add coupon
  const handleAddCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;

    onAddCoupon({
      code: cleanCode,
      discountPercent: Number(couponDiscount),
      isActive: true
    });

    setCouponCode('');
    setCouponDiscount(10);
  };

  const handleCsvImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    
    setIsImporting(true);
    setImportResult(null);
    
    const formData = new FormData();
    formData.append('file', csvFile);
    
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch('/api/catalog/import', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setImportResult({ success: data.successCount, error: data.errorCount });
      setCsvFile(null);
    } catch (err) {
      console.error('Error importando CSV:', err);
      alert('Error importando el archivo CSV');
    } finally {
      setIsImporting(false);
    }
  };

  // Helper to load product data into edit modal
  const startEditing = (p: Product) => {
    setEditingProduct(p);
    setEditProdName(p.name);
    setEditProdPrice(p.price);
    setEditProdCategory(p.category);
    
    // Detect if image is Base64 data URL
    if (p.image.startsWith('data:image/')) {
      setEditProdFileBase64(p.image);
      setEditProdFileName('imagen_subida.png');
      setEditProdImage('');
    } else {
      setEditProdImage(p.image);
      setEditProdFileBase64('');
      setEditProdFileName('');
    }
    
    setEditProdDesc(p.description || '');
    setEditProdStock(p.stock);
    setEditProdExpansion(p.expansion || '');
    setEditProdIsPromo(!!p.isPromo);
    setEditProdRegion(p.region || 'Inglés (USA)');
    setEditProdPulledFrom(p.pulledFrom || '');
    setEditProdCardCondition(p.cardCondition || 'NM');
    setEditProdGameType(p.gameType || 'POKEMON');
  };

  // Save edited product
  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let finalImage = '';
    if (editProdCategory === 'accessory') {
      finalImage = editProdFileBase64 || editProdImage;
      if (!finalImage) {
        alert("Por favor sube una foto del accesorio.");
        return;
      }
    } else if (editProdCategory === 'single') {
      finalImage = editProdImage.trim() || '/generic_card.png';
    } else if (editProdCategory === 'booster_box') {
      finalImage = '/official_booster_box.png';
    } else if (editProdCategory === 'etb') {
      finalImage = '/official_etb.png';
    } else if (editProdCategory === 'blister') {
      finalImage = '/official_blister.png';
    } else {
      finalImage = '/generic_card.png';
    }

    if (!editProdName) {
      alert("Por favor ingresa el nombre del producto.");
      return;
    }
    if (Number(editProdPrice) <= 0) {
      alert("El precio debe ser mayor a 0.");
      return;
    }
    if (Number(editProdStock) < 0) {
      alert("El stock no puede ser negativo.");
      return;
    }

    onUpdateInventoryItem(editingProduct.id, {
      name: editProdName.trim(),
      price: Number(editProdPrice),
      category: editProdCategory,
      image: finalImage,
      description: editProdDesc.trim(),
      stock: Number(editProdStock),
      expansion: editProdExpansion.trim() || undefined,
      isPromo: editProdIsPromo,
      region: editProdCategory === 'single' ? editProdRegion : '',
      pulledFrom: editProdCategory === 'single' ? editProdPulledFrom : '',
      cardCondition: editProdCategory === 'single' ? editProdCardCondition : '',
      gameType: editProdCategory === 'single' ? editProdGameType : 'POKEMON'
    });

    setEditingProduct(null);
    setEditProdFileBase64('');
    setEditProdFileName('');
  };

  // TCG API card search logic
  const handleCardApiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiSearchQuery.trim() && !newProdPulledFrom) {
      setApiSearchError('Por favor ingresa un nombre de carta o selecciona un sobre de origen.');
      return;
    }
    setSearchingCards(true);
    setApiSearchError(null);
    try {
      const result = await multiTcgSearch(apiSearchQuery, newProdGameType, newProdPulledFrom);
      setApiSearchResults(result);
      if (result.length === 0) {
        setApiSearchError('No se encontraron cartas con esos criterios. Intenta con otro término o sobre.');
      }
    } catch (err) {
      setApiSearchError('Error al buscar cartas en la API. Por favor intenta de nuevo.');
      console.error(err);
    } finally {
      setSearchingCards(false);
    }
  };

  const handleSelectApiCard = (card: CardSearchResult) => {
    setNewProdName(card.name);
    setNewProdImage(card.images?.large || card.images?.small || '');
    setNewProdExpansion(card.set?.name || '');
    setNewProdDesc(`Carta oficial de ${newProdGameType}.`);
    
    setNewProdPrice(card.marketPrice || 50);
    
    // Clear results
    setApiSearchResults([]);
  };

  // Helper to check if order falls in time range
  const isOrderInTimeRange = (orderDateStr: string) => {
    if (!orderDateStr || typeof orderDateStr !== 'string') return false;
    let orderDate = new Date();
    if (orderDateStr.includes('/')) {
      const [day, month, year] = orderDateStr.split('/');
      orderDate = new Date(Number(year), Number(month) - 1, Number(day));
    } else {
      orderDate = new Date(orderDateStr);
    }
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (timeRange === 'today') {
      return orderDate >= startOfToday;
    } else if (timeRange === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return orderDate >= sevenDaysAgo;
    } else if (timeRange === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return orderDate >= startOfMonth;
    } else if (timeRange === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return orderDate >= startOfYear;
    }
    return true; // 'all'
  };

  // Filter orders by time range for metrics
  const filteredOrdersForMetrics = orders.filter(o => isOrderInTimeRange(o.date));

  const totalRevenue = filteredOrdersForMetrics
    .filter(o => {
      const st = (o.status || '').toLowerCase();
      return st === 'entregado' || st === 'enviado' || st === 'pagado';
    })
    .reduce((acc, o) => acc + o.total, 0);

  const totalSalesCount = filteredOrdersForMetrics.length;
  
  // Calculate average ticket
  const averageTicket = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;

  // Calculate buyback profit (Margen de recompra)
  const totalBuybackCost = buybackRequests
    .filter(r => r.status === 'Aprobado' || r.status.toLowerCase() === 'aprobado')
    .reduce((acc, r) => acc + r.totalValue, 0);
  
  const estimatedBuybackProfit = Math.round(totalBuybackCost * 0.43); // 30% margin on resale value

  const totalStockCount = inventory.reduce((acc, p) => acc + p.stock, 0);

  // SVG Chart calculation helper
  const getChartData = () => {
    const now = new Date();
    let daysCount = 7;
    if (timeRange === 'today') daysCount = 1;
    else if (timeRange === 'month') daysCount = 30;
    else if (timeRange === 'year') daysCount = 12;
    else daysCount = 7;
    
    const labels: string[] = [];
    const values: number[] = [];
    
    if (daysCount === 1) {
      labels.push("Mañana", "Tarde", "Noche");
      values.push(
        Math.round(totalRevenue * 0.2),
        Math.round(totalRevenue * 0.5),
        Math.round(totalRevenue * 0.3)
      );
    } else if (daysCount === 7) {
      const weekdays = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        labels.push(weekdays[d.getDay()]);
        
        const dateStr = d.toLocaleDateString('es-MX');
        const dayRev = orders
          .filter(o => {
            const st = (o.status || '').toLowerCase();
            const isApproved = st === 'entregado' || st === 'enviado' || st === 'pagado';
            let orderDate = o.date || '';
            if (typeof orderDate === 'string' && !orderDate.includes('/')) {
              orderDate = o.date ? new Date(o.date).toLocaleDateString('es-MX') : '';
            }
            return isApproved && orderDate === dateStr;
          })
          .reduce((acc, o) => acc + o.total, 0);
        
        values.push(dayRev);
      }
    } else {
      labels.push("Sem 1", "Sem 2", "Sem 3", "Sem 4");
      values.push(
        Math.round(totalRevenue * 0.15),
        Math.round(totalRevenue * 0.35),
        Math.round(totalRevenue * 0.3),
        Math.round(totalRevenue * 0.2)
      );
    }
    
    return { labels, values };
  };

  const chartData = getChartData();
  const maxVal = Math.max(...chartData.values, 1000);
  
  const chartPoints = chartData.values.map((val, idx) => {
    const x = 40 + (idx * (420 / (chartData.values.length - 1 || 1)));
    const y = 160 - (val / maxVal) * 120;
    return { x, y, val: `$${val.toLocaleString('es-MX')}`, label: chartData.labels[idx] };
  });

  const linePathD = chartPoints.length > 0 
    ? 'M ' + chartPoints.map(p => `${p.x},${p.y}`).join(' L ')
    : 'M 40,160 L 460,160';

  const areaPathD = chartPoints.length > 0
    ? `${linePathD} L ${chartPoints[chartPoints.length - 1].x},160 L ${chartPoints[0].x},160 Z`
    : 'M 40,160 L 460,160 Z';

  // Low-stock products (stock <= 3)
  const lowStockProducts = inventory.filter(p => p.stock <= 3);

  // Filtered inventory items
  const filteredInventory = inventory.filter(p => 
    (p.name || '').toLowerCase().includes(invSearch.toLowerCase()) || 
    (p.category || '').toLowerCase().includes(invSearch.toLowerCase())
  );

  // Filtered orders (search + status filter)
  const filteredOrders = orders.filter(order => {
    const matchesStatus = salesStatusFilter === 'all' || 
      (order.status || '').toLowerCase() === salesStatusFilter.toLowerCase();
    const query = salesSearch.toLowerCase();
    const matchesSearch = !query ||
      order.customerName?.toLowerCase().includes(query) ||
      order.customerEmail?.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // Filtered users by search string
  const filteredUsers = users.filter(user => 
    (user.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(customerSearch.toLowerCase())
  );

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice(
    (customerPage - 1) * ITEMS_PER_PAGE,
    customerPage * ITEMS_PER_PAGE
  );

  // Handler: save payment info for an order
  const handleSaveOrderPayment = (orderId: string) => {
    const method = orderPaymentMethod[orderId] || orders.find(o => o.id === orderId)?.paymentMethod;
    const updates: Partial<Order> = {};
    if (method) updates.paymentMethod = method;
    if (method === 'Efectivo') {
      updates.cashAmountReceived = orderCashAmount[orderId] || 0;
    }
    if (method === 'Transferencia' && orderReceiptBase64[orderId]) {
      updates.paymentReceipt = orderReceiptBase64[orderId];
      updates.paymentReceiptName = orderReceiptName[orderId];
    }
    onUpdateOrder(orderId, updates);
    setOrderSaveSuccess(orderId);
    setTimeout(() => setOrderSaveSuccess(null), 2500);
  };

  // Handler: receipt file upload per order
  const handleOrderReceiptUpload = (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setOrderReceiptBase64(prev => ({ ...prev, [orderId]: reader.result as string }));
      setOrderReceiptName(prev => ({ ...prev, [orderId]: file.name }));
    };
    reader.readAsDataURL(file);
  };

  // Handler: save bank settings
  const handleSaveBankSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBankSettings({
      bankName: editBankName.trim(),
      clabe: editClabe.trim(),
      accountNumber: editAccount.trim(),
      beneficiary: editBeneficiary.trim(),
      whatsapp: editWhatsapp.trim(),
      paypalClientId: editPaypalClientId.trim(),
      paypalActive: editPaypalActive ? 'true' : 'false'
    });
    setBankSaveSuccess(true);
    setTimeout(() => setBankSaveSuccess(false), 3000);
  };

  return (
    <div style={{ paddingBlock: '30px', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Admin Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={28} style={{ color: 'var(--primary)' }} />
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Panel de Administración
            </h2>
            <span style={{ fontSize: '11px', color: '#ff6b6b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Modo Administrador Autorizado
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1px',
        marginBottom: '30px',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          style={getTabStyle(activeTab === 'metrics')}
        >
          <BarChart3 size={15} /> Resumen y Métricas
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          style={getTabStyle(activeTab === 'inventory')}
        >
          <Package size={15} /> Inventario
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          style={{ ...getTabStyle(activeTab === 'sales'), position: 'relative' }}
        >
          <ShoppingBag size={15} /> Ventas
          {/* Badge de órdenes pendientes */}
          {orders.filter(o => o.status === 'Pendiente').length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              backgroundColor: '#ff3e3e',
              color: 'white',
              fontSize: '10px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 6px rgba(255,62,62,0.7)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              {orders.filter(o => o.status === 'Pendiente').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          style={getTabStyle(activeTab === 'customers')}
        >
          <Users size={15} /> Clientes y Recompra
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
          style={getTabStyle(activeTab === 'coupons')}
        >
          <Tag size={15} /> Cupones
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          style={getTabStyle(activeTab === 'settings')}
        >
          <Settings2 size={15} /> Configuración
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          style={getTabStyle(activeTab === 'logs')}
        >
          <Clock size={15} /> Auditoría (Logs)
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}

      {/* TAB 1: METRICS */}
      {activeTab === 'metrics' && (
        <div>
          {/* Selector de Rango Temporal */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            padding: '12px 18px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Rango Temporal</span>
              <span style={{ fontSize: '13px', color: 'white', fontWeight: 700 }}>Filtrar estadísticas por fecha de órdenes</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {([
                { id: 'today', label: 'Hoy' },
                { id: '7days', label: 'Últimos 7 días' },
                { id: 'month', label: 'Este Mes' },
                { id: 'year', label: 'Este Año' },
                { id: 'all', label: 'Histórico' }
              ] as const).map(item => (
                <button
                  key={item.id}
                  onClick={() => setTimeRange(item.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: '1px solid',
                    cursor: 'pointer',
                    borderColor: timeRange === item.id ? 'var(--primary)' : 'var(--border-color)',
                    backgroundColor: timeRange === item.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                    color: 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tarjetas de Métricas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {/* Ingresos */}
            <div className="glass" style={getMetricCardStyle('#ff3e3e')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ingresos Reales</span>
                <BarChart3 size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: '8px 0 4px 0' }}>
                ${totalRevenue.toLocaleString('es-MX')} MXN
              </h3>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>
                De órdenes aprobadas o pagadas
              </p>
            </div>

            {/* Ventas */}
            <div className="glass" style={getMetricCardStyle('#34d399')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pedidos Recibidos</span>
                <ShoppingBag size={16} style={{ color: '#34d399' }} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: '8px 0 4px 0' }}>
                {totalSalesCount}
              </h3>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>
                Pedidos dentro del rango de fecha
              </p>
            </div>

            {/* Ticket Promedio */}
            <div className="glass" style={getMetricCardStyle('#a78bfa')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ticket Promedio</span>
                <Users size={16} style={{ color: '#a78bfa' }} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: '8px 0 4px 0' }}>
                ${averageTicket.toLocaleString('es-MX')} MXN
              </h3>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>
                Valor medio de compra
              </p>
            </div>

            {/* Margen de Recompra */}
            <div className="glass" style={getMetricCardStyle('#60a5fa')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ganancia Recompra</span>
                <Banknote size={16} style={{ color: '#60a5fa' }} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: '8px 0 4px 0' }}>
                ${estimatedBuybackProfit.toLocaleString('es-MX')} MXN
              </h3>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>
                Margen estimado de Singles
              </p>
            </div>

            {/* Stock */}
            <div className="glass" style={getMetricCardStyle('#f59e0b')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Unidades Stock</span>
                <Package size={16} style={{ color: '#f59e0b' }} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: '8px 0 4px 0' }}>
                {totalStockCount}
              </h3>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>
                Total disponible en tienda
              </p>
            </div>
          </div>

          {/* Gráficos Analíticos de Ventas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '30px' }} className="admin-charts-grid">
            <div className="glass" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(22, 27, 38, 0.4)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                Ingresos Reales {timeRange === 'today' ? 'de Hoy' : timeRange === '7days' ? '(Últimos 7 días)' : timeRange === 'month' ? '(Mensual)' : timeRange === 'year' ? '(Anual)' : '(Histórico)'}
              </h3>
              <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff3e3e" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#ffcb05" stopOpacity="0.1"/>
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ff3e3e"/>
                      <stop offset="100%" stopColor="#ffcb05"/>
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 50, 100, 150, 200].map((y, i) => (
                    <line key={i} x1="40" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  ))}

                  {/* Area path */}
                  <path d={areaPathD} fill="url(#chartGrad)" />

                  {/* Line path */}
                  <path d={linePathD} fill="none" stroke="url(#lineGrad)" strokeWidth="3" filter="url(#glow)" />

                  {/* Dots & Values */}
                  {chartPoints.map((pt, i) => (
                    <g key={i}>
                      <circle cx={pt.x} cy={pt.y} r="5" fill="#ffcb05" stroke="#0e1118" strokeWidth="2" />
                      <text x={pt.x} y={pt.y - 12} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">{pt.val}</text>
                      <text x={pt.x} y="195" fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle">{pt.label}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            <div className="glass" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(22, 27, 38, 0.4)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                Distribución por Categoría de Ventas
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '24px' }}>
                <svg width="110" height="110" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', overflow: 'visible', flexShrink: 0 }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ff3e3e" strokeWidth="4" strokeDasharray="45 100" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ffcb05" strokeWidth="4" strokeDasharray="30 100" strokeDashoffset="-45" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#60a5fa" strokeWidth="4" strokeDasharray="15 100" strokeDashoffset="-75" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#34d399" strokeWidth="4" strokeDasharray="10 100" strokeDashoffset="-90" />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#ff3e3e' }}></span> <span style={{ color: 'white' }}>Booster Box (45%)</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#ffcb05' }}></span> <span style={{ color: 'white' }}>ETBs (30%)</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#60a5fa' }}></span> <span style={{ color: 'white' }}>Singles (15%)</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#34d399' }}></span> <span style={{ color: 'white' }}>Accesorios (10%)</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico / Resumen Operativo */}
          <div className="glass" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
              Actividades Recientes y Recomendaciones
            </h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 12px 0' }}>
                • Tienes <strong>{orders.filter(o => o.status === 'Pendiente').length} órdenes pendientes</strong> que requieren envío inmediato.
              </p>
              <p style={{ margin: '0 0 12px 0' }}>
                • Se han recibido <strong>{buybackRequests.filter(r => r.status === 'Pendiente').length} solicitudes de recompra (buyback)</strong> pendientes por evaluar y cotizar.
              </p>
              <p style={{ margin: 0 }}>
                • <strong>Control de Inventario:</strong> Considera reabastecer las cajas de sobres con stock menor a 5 unidades desde la pestaña "Inventario".
              </p>
            </div>
          </div>

          {/* Alerta de Stock Bajo */}
          {lowStockProducts.length > 0 && (
            <div style={{
              marginTop: '24px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              animation: 'fadeIn 0.3s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b', margin: 0 }}>
                  ¡Alerta de Stock Bajo! — {lowStockProducts.length} producto{lowStockProducts.length > 1 ? 's' : ''} con 3 unidades o menos
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lowStockProducts.map(p => (
                  <div key={p.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(6, 8, 12, 0.3)',
                    border: '1px solid rgba(245, 158, 11, 0.15)',
                    borderRadius: '8px'
                  }}>
                    <img src={p.image} alt={p.name} style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(p.category || '').replace('_', ' ')} · ${p.price.toLocaleString('es-MX')} MXN</div>
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: p.stock === 0 ? '#ff6b6b' : '#f59e0b',
                      minWidth: '60px',
                      textAlign: 'right'
                    }}>
                      {p.stock === 0 ? '⚠ Agotado' : `${p.stock} pzas`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY */}
      {activeTab === 'inventory' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            {/* Buscador */}
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={invSearch}
              onChange={(e) => setInvSearch(e.target.value)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 16px',
                color: 'white',
                fontSize: '14px',
                width: '300px',
                outline: 'none'
              }}
            />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowCsvImport(!showCsvImport)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
            >
              <Upload size={16} /> {showCsvImport ? 'Cerrar Importador' : 'Importar Catálogo (CSV)'}
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
            >
              <Plus size={16} /> {showAddForm ? 'Cerrar Formulario' : 'Agregar Producto'}
            </button>
          </div>
          </div>

          {/* Formulario Importar Catálogo CSV */}
          {showCsvImport && (
            <form onSubmit={handleCsvImportSubmit} className="glass" style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px dashed #60a5fa',
              backgroundColor: 'rgba(96, 165, 250, 0.05)',
              marginBottom: '24px',
              animation: 'fadeIn 0.2s'
            }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#60a5fa', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                Importar Base de Datos de Cartas (Catálogo Multi-TCG)
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Sube un archivo CSV con las columnas: <code>name, game_type, expansion, image_url, market_price</code>.
                Esto llenará la base de datos interna para que funcione el buscador al agregar cartas sueltas de One Piece, Dragon Ball, etc.
              </p>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                  style={{ color: 'white', fontSize: '13px' }}
                />
                <button 
                  type="submit" 
                  disabled={!csvFile || isImporting}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {isImporting ? 'Importando...' : 'Subir e Importar'}
                </button>
              </div>

              {importResult && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(52, 211, 153, 0.1)', border: '1px solid #34d399', borderRadius: '8px', color: '#34d399', fontSize: '13px' }}>
                  <strong>✅ Importación completada:</strong> Se insertaron {importResult.success} cartas. (Hubo {importResult.error} errores).
                </div>
              )}
            </form>
          )}

          {/* Formulario Agregar Producto */}
          {showAddForm && (
            <form onSubmit={handleAddProductSubmit} className="glass" style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'rgba(22, 27, 38, 0.6)',
              marginBottom: '24px',
              animation: 'fadeIn 0.2s'
            }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                Registrar Nuevo Producto en Tienda
              </h4>

              {/* Buscador de Cartas Oficiales */}
              {newProdCategory === 'single' && (
                <div style={{
                  marginBottom: '20px',
                  padding: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '10px'
                }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--secondary)', marginBottom: '8px' }}>
                    🔍 Buscador de Cartas de Pokémon TCG (Importación Automática)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr auto', gap: '10px', alignItems: 'center' }}>
                    {/* Selector de Sobre de Origen / Expansión */}
                    <select
                      value={newProdPulledFrom}
                      onChange={(e) => {
                        setNewProdPulledFrom(e.target.value);
                        if (e.target.value) {
                          setNewProdExpansion(e.target.value);
                        }
                      }}
                      style={{ ...getFormInputStyle(), padding: '10px 12px' }}
                    >
                      <option value="">Todos los Sobres / Expansiones de Pokémon</option>
                      {(TCG_EXPANSIONS['POKEMON'] || []).map((exp) => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>

                    {/* Input de Nombre (Opcional si se seleccionó sobre) */}
                    <input
                      type="text"
                      placeholder="Nombre de carta (ej: Charizard, Pikachu...) o deja vacío para ver el sobre..."
                      value={apiSearchQuery}
                      onChange={(e) => setApiSearchQuery(e.target.value)}
                      style={{ ...getFormInputStyle() }}
                    />

                    {/* Botón Buscar */}
                    <button
                      type="button"
                      onClick={handleCardApiSearch}
                      disabled={searchingCards}
                      className="btn btn-secondary"
                      style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                    >
                      {searchingCards ? (
                        <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                      ) : (
                        <Search size={16} />
                      )}
                      Buscar
                    </button>
                  </div>

                  {apiSearchError && (
                    <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px' }}>
                      {apiSearchError}
                    </div>
                  )}

                  {apiSearchResults.length > 0 && (
                    <div style={{
                      marginTop: '12px',
                      maxHeight: '480px',
                      overflowY: 'auto',
                      backgroundColor: 'rgba(6, 8, 12, 0.6)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '12px'
                    }}>
                      {apiSearchResults.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => handleSelectApiCard(card)}
                          style={{
                            padding: '8px',
                            borderRadius: '8px',
                            border: '1px solid transparent',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: 'rgba(255, 255, 255, 0.01)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <img
                            src={card.images.small}
                            alt={card.name}
                            style={{ height: '170px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                          />
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.2', height: '26px' }}>
                              {card.name}
                            </div>
                            <span style={{ fontSize: '9.5px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                              {card.set.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Nombre del Producto</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elite Trainer Box Scarlet & Violet: Surging Sparks"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    style={getFormInputStyle()}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Categoría</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as Product['category'])}
                    style={getFormInputStyle()}
                  >
                    <option value="booster_box">Booster Box</option>
                    <option value="etb">Elite Trainer Box (ETB)</option>
                    <option value="blister">Blister Pack</option>
                    <option value="accessory">Accesorio</option>
                    <option value="single">Carta Suelta (Single)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Precio (MXN)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    style={getFormInputStyle()}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Stock Inicial</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    style={getFormInputStyle()}
                  />
                </div>
              </div>

              {/* Atributos Específicos de Carta Física */}
              {newProdCategory === 'single' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px',
                  padding: '16px',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Idioma / Región de la Carta</label>
                    <select
                      value={newProdRegion}
                      onChange={(e) => setNewProdRegion(e.target.value)}
                      style={getFormInputStyle()}
                    >
                      <option value="Inglés (USA)">Inglés (USA)</option>
                      <option value="Español (Latam)">Español (Latam)</option>
                      <option value="Japonés">Japonés</option>
                      <option value="Español (España)">Español (España)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Sobre de Origen (Pulled Set)</label>
                    <select
                      value={newProdPulledFrom}
                      onChange={(e) => {
                        setNewProdPulledFrom(e.target.value);
                        if (e.target.value) {
                          setNewProdExpansion(e.target.value);
                        }
                      }}
                      style={getFormInputStyle()}
                    >
                      <option value="">Selecciona un sobre / expansión</option>
                      {(TCG_EXPANSIONS[newProdGameType] || []).map((exp) => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Condición Física</label>
                    <select
                      value={newProdCardCondition}
                      onChange={(e) => setNewProdCardCondition(e.target.value)}
                      style={getFormInputStyle()}
                    >
                      <option value="NM">Near Mint (NM - Como Nueva)</option>
                      <option value="LP">Lightly Played (LP - Poco Desgaste)</option>
                      <option value="MP">Moderately Played (MP - Desgaste Medio)</option>
                      <option value="HP">Heavily Played (HP - Dañada)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Juego (TCG)</label>
                    <select
                      value={newProdGameType}
                      onChange={(e) => setNewProdGameType(e.target.value)}
                      style={getFormInputStyle()}
                    >
                      <option value="POKEMON">Pokémon TCG</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Carga de Imagen para Accesorios */}
              {newProdCategory === 'accessory' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '16px',
                  marginBottom: '16px',
                  padding: '16px',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Subir Foto del Accesorio (Desde Archivo)</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="file"
                        id="newProdFileInput"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, false)}
                        style={getFormInputStyle()}
                      />
                      {newProdFileBase64 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewProdFileBase64('');
                            setNewProdFileName('');
                            const fileInput = document.getElementById('newProdFileInput') as HTMLInputElement | null;
                            if (fileInput) fileInput.value = '';
                          }}
                          style={{
                            backgroundColor: 'rgba(255, 62, 62, 0.15)',
                            border: '1px solid #ff3e3e',
                            color: '#ff6b6b',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700
                          }}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                    {newProdFileBase64 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <img src={newProdFileBase64} alt="Preview" style={{ height: '30px', width: '30px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                        <span style={{ fontSize: '11px', color: '#34d399', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>✓ {newProdFileName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview de Imagen Asignada */}
              {(newProdImage || newProdCategory) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  width: 'fit-content'
                }}>
                  <img
                    src={
                      newProdCategory === 'single'
                        ? (newProdImage || '/generic_card.png')
                        : newProdCategory === 'booster_box'
                        ? '/official_booster_box.png'
                        : newProdCategory === 'etb'
                        ? '/official_etb.png'
                        : newProdCategory === 'blister'
                        ? '/official_blister.png'
                        : newProdCategory === 'accessory'
                        ? (newProdFileBase64 || '/generic_etb.png')
                        : '/generic_card.png'
                    }
                    alt="Vista previa"
                    style={{ height: '70px', width: '70px', objectFit: 'contain', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.2)' }}
                  />
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'white', display: 'block' }}>
                      Imagen Asignada
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {newProdCategory === 'single' && newProdImage 
                        ? 'Cargada desde Pokémon TCG API' 
                        : newProdCategory === 'accessory'
                        ? 'Foto subida por el administrador'
                        : 'Imagen oficial sin copyright de PokéVault'}
                    </span>
                  </div>
                </div>
              )}

              {/* Fila de Detalles Adicionales (Expansión y Destacado) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Expansión (Opcional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Twilight Masquerade"
                    value={newProdExpansion}
                    onChange={(e) => setNewProdExpansion(e.target.value)}
                    style={getFormInputStyle()}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '24px' }}>
                  <input
                    type="checkbox"
                    id="isPromo"
                    checked={newProdIsPromo}
                    onChange={(e) => setNewProdIsPromo(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isPromo" style={{ fontSize: '13px', color: 'white', cursor: 'pointer' }}>Destacar en catálogo principal</label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Descripción del Producto</label>
                <textarea
                  placeholder="Detalles sobre el contenido del producto..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  style={{ ...getFormInputStyle(), height: '70px', resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 700 }}>
                Guardar Producto
              </button>
            </form>
          )}

          {/* Tabla de Inventario */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', backgroundColor: 'rgba(22, 27, 38, 0.2)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(6, 8, 12, 0.4)' }}>
                  <th style={{ padding: '14px 16px', color: 'white' }}>Producto</th>
                  <th style={{ padding: '14px 16px', color: 'white' }}>Categoría</th>
                  <th style={{ padding: '14px 16px', color: 'white' }}>Precio (MXN)</th>
                  <th style={{ padding: '14px 16px', color: 'white' }}>Stock</th>
                  <th style={{ padding: '14px 16px', color: 'white', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((p) => {
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                      {/* Nombre e Imagen */}
                      <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.02)' }} 
                        />
                        <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: 'white' }} title={p.name}>{p.name}</span>
                          {p.category === 'single' && (p.region || p.cardCondition || p.pulledFrom) && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                              {p.region && (
                                <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '4px', backgroundColor: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa', fontWeight: 'bold' }}>
                                  {p.region}
                                </span>
                              )}
                              {p.cardCondition && (
                                <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 'bold' }}>
                                  {p.cardCondition}
                                </span>
                              )}
                              {p.pulledFrom && (
                                <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' }}>
                                  Set: {p.pulledFrom}
                                </span>
                              )}
                            </div>
                          )}
                          <br />
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: {p.id}</span>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {(p.category || '').replace('_', ' ')}
                      </td>

                      {/* Precio */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>$</span>
                          <input 
                            type="number"
                            defaultValue={p.price}
                            key={`price-${p.id}-${p.price}`}
                            id={`inline-price-${p.id}`}
                            style={{
                              width: '80px',
                              backgroundColor: 'rgba(6, 8, 12, 0.4)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '12px 16px' }}>
                        <input 
                          type="number"
                          defaultValue={p.stock}
                          key={`stock-${p.id}-${p.stock}`}
                          id={`inline-stock-${p.id}`}
                          style={{
                            width: '70px',
                            backgroundColor: 'rgba(6, 8, 12, 0.4)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            color: p.stock === 0 ? '#ff6b6b' : p.stock < 5 ? '#ffcb05' : '#34d399',
                            fontWeight: 700,
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              const priceInput = document.getElementById(`inline-price-${p.id}`) as HTMLInputElement | null;
                              const stockInput = document.getElementById(`inline-stock-${p.id}`) as HTMLInputElement | null;
                              const newPrice = priceInput ? Number(priceInput.value) : p.price;
                              const newStock = stockInput ? Number(stockInput.value) : p.stock;
                              if (newPrice <= 0 || newStock < 0) {
                                alert("Valores inválidos. El precio debe ser mayor a 0 y el stock no puede ser negativo.");
                                return;
                              }
                              onUpdateInventoryItem(p.id, { price: newPrice, stock: newStock });
                            }}
                            style={{
                              background: 'rgba(52, 211, 153, 0.1)',
                              border: '1px solid rgba(52, 211, 153, 0.3)',
                              color: '#34d399',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(52, 211, 153, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(52, 211, 153, 0.1)'}
                            title="Guardar Cambios Rápidos"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => startEditing(p)}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--border-color)',
                              color: 'white',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                            title="Editar Detalles"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(p.id)}
                            style={{
                              background: 'rgba(255, 62, 62, 0.08)',
                              border: '1px solid rgba(255, 62, 62, 0.25)',
                              color: '#ff6b6b',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 62, 62, 0.18)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 62, 62, 0.08)'}
                            title="Eliminar Producto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredInventory.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No se encontraron productos en el inventario.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SALES */}
      {activeTab === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Barra de Búsqueda y Filtros */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Buscar por cliente, correo o # de orden..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 16px 10px 40px',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
              <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Filtros de Estado */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'Pendiente', 'Pagado', 'Enviado', 'Entregado'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setSalesStatusFilter(status)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderColor: salesStatusFilter === status
                      ? (status === 'Pendiente' ? '#f59e0b' : status === 'Pagado' ? '#a78bfa' : status === 'Enviado' ? '#60a5fa' : status === 'Entregado' ? '#34d399' : 'var(--primary)')
                      : 'var(--border-color)',
                    backgroundColor: salesStatusFilter === status
                      ? (status === 'Pendiente' ? 'rgba(245,158,11,0.12)' : status === 'Pagado' ? 'rgba(167,139,250,0.12)' : status === 'Enviado' ? 'rgba(96,165,250,0.12)' : status === 'Entregado' ? 'rgba(52,211,153,0.12)' : 'rgba(255,62,62,0.1)')
                      : 'rgba(255,255,255,0.02)',
                    color: salesStatusFilter === status
                      ? (status === 'Pendiente' ? '#f59e0b' : status === 'Pagado' ? '#a78bfa' : status === 'Enviado' ? '#60a5fa' : status === 'Entregado' ? '#34d399' : 'var(--primary)')
                      : 'var(--text-secondary)'
                  }}
                >
                  {status === 'all' ? `Todas (${orders.length})` :
                    `${status} (${orders.filter(o => (o.status || '').toLowerCase() === status.toLowerCase()).length})`}
                </button>
              ))}
            </div>

            {/* Botón Registrar Venta Física */}
            <button
              onClick={() => setShowManualSaleModal(true)}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                marginLeft: 'auto',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.15)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              <Plus size={16} /> Registrar Venta Física
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)', borderRadius: '12px' }}>
              <ShoppingBag size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '16px' }} />
              <h4 style={{ margin: 0, fontWeight: 700, color: 'white' }}>Aún no hay ventas registradas</h4>
              <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>Las compras que realicen los clientes aparecerán listadas aquí.</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', borderRadius: '12px' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>No se encontraron órdenes con los filtros aplicados.</p>
              <button
                onClick={() => { setSalesSearch(''); setSalesStatusFilter('all'); }}
                className="btn btn-secondary"
                style={{ marginTop: '12px', padding: '6px 16px', fontSize: '12px' }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              return (
                <div 
                  key={order.id} 
                  className="glass" 
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    backgroundColor: 'rgba(22, 27, 38, 0.3)'
                  }}
                >
                  {/* Encabezado Corto del Pedido */}
                  <div 
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      flexWrap: 'wrap',
                      gap: '12px',
                      backgroundColor: 'rgba(6, 8, 12, 0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        backgroundColor: 
                          (order.status || '').toLowerCase() === 'pendiente' ? 'rgba(245, 158, 11, 0.12)' :
                          (order.status || '').toLowerCase() === 'pagado' ? 'rgba(167, 139, 250, 0.12)' :
                          (order.status || '').toLowerCase() === 'enviado' ? 'rgba(96, 165, 250, 0.12)' :
                          (order.status || '').toLowerCase() === 'entregado' ? 'rgba(52, 211, 153, 0.12)' :
                          'rgba(239, 68, 68, 0.12)',
                        color: 
                          (order.status || '').toLowerCase() === 'pendiente' ? '#f59e0b' :
                          (order.status || '').toLowerCase() === 'pagado' ? '#a78bfa' :
                          (order.status || '').toLowerCase() === 'enviado' ? '#60a5fa' :
                          (order.status || '').toLowerCase() === 'entregado' ? '#34d399' :
                          '#ef4444',
                        border: '1px solid currentColor'
                      }}>
                        {order.status}
                      </div>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>Pedido #{order.id.slice(-6).toUpperCase()}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '10px' }}>{order.date}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Cliente</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{order.customerName || order.customerEmail}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Total</span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--secondary)' }}>${(order.total || 0).toLocaleString('es-MX')} MXN</span>
                      </div>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Desglose Expandido */}
                  {isExpanded && (
                    <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', animation: 'slideDown 0.2s' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 300px',
                        gap: '24px'
                      }} className="order-details-grid">
                        
                        {/* Productos */}
                        <div>
                          <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '12px', textTransform: 'uppercase' }}>Artículos comprados</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {order.items.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <img src={item.image} alt={item.productName} style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }} />
                                <div style={{ flexGrow: 1 }}>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{item.productName}</span>
                                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    {(item.quantity || 0)} x ${(item.price || 0).toLocaleString('es-MX')} MXN
                                  </div>
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                                  ${((item.quantity || 0) * (item.price || 0)).toLocaleString('es-MX')} MXN
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Envío y Control de Estado */}
                        <div style={{
                          backgroundColor: 'rgba(6, 8, 12, 0.3)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px'
                        }}>
                          <div>
                            <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'white', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Datos de Envío</h5>
                            {order.address ? (
                              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                <strong>{order.customerName}</strong><br />
                                {order.customerEmail}<br />
                                📍 {order.address.street}<br />
                                {order.address.city}, {order.address.state}, CP {order.address.zipCode}
                              </p>
                            ) : (
                              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                <strong>{order.customerName}</strong><br />
                                {order.customerEmail}<br />
                                📍 Venta Física en Mostrador
                              </p>
                            )}
                          </div>

                          {order.discountApplied > 0 && (
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontSize: '12.5px', color: '#34d399' }}>
                              Descuento Aplicado: <strong>{order.discountApplied}%</strong>
                            </div>
                          )}

                          {/* Control de Estado */}
                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                            <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'white', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Actualizar Estado</h5>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => onUpdateOrder(order.id, { status: 'PENDIENTE' })}
                                disabled={(order.status || '').toLowerCase() === 'pendiente'}
                                style={{
                                  flex: 1,
                                  padding: '8px',
                                  fontSize: '11px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: (order.status || '').toLowerCase() === 'pendiente' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                                  color: (order.status || '').toLowerCase() === 'pendiente' ? '#f59e0b' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                <Clock size={12} style={{ display: 'block', margin: '0 auto 4px auto' }} /> Pendiente
                              </button>
                              <button
                                onClick={() => onUpdateOrder(order.id, { status: 'ENVIADO' })}
                                disabled={(order.status || '').toLowerCase() === 'enviado'}
                                style={{
                                  flex: 1,
                                  padding: '8px',
                                  fontSize: '11px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: (order.status || '').toLowerCase() === 'enviado' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255,255,255,0.02)',
                                  color: (order.status || '').toLowerCase() === 'enviado' ? '#60a5fa' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                <Truck size={12} style={{ display: 'block', margin: '0 auto 4px auto' }} /> Enviado
                              </button>
                              <button
                                onClick={() => onUpdateOrder(order.id, { status: 'ENTREGADO' })}
                                disabled={(order.status || '').toLowerCase() === 'entregado'}
                                style={{
                                  flex: 1,
                                  padding: '8px',
                                  fontSize: '11px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: (order.status || '').toLowerCase() === 'entregado' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.02)',
                                  color: (order.status || '').toLowerCase() === 'entregado' ? '#34d399' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                <CheckCircle2 size={12} style={{ display: 'block', margin: '0 auto 4px auto' }} /> Entregado
                              </button>
                            </div>

                            {/* Campo de Número de Guía */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
                              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Número de Guía (Rastreo)</label>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <input 
                                  type="text"
                                  placeholder="e.g. DHL-123456789, Estafeta..."
                                  defaultValue={order.tracking_number || ''}
                                  id={`tracking-${order.id}`}
                                  style={{
                                    flex: 1,
                                    backgroundColor: 'rgba(6, 8, 12, 0.4)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    color: 'white',
                                    fontSize: '12px',
                                    outline: 'none'
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const input = document.getElementById(`tracking-${order.id}`) as HTMLInputElement | null;
                                    const val = input ? input.value : '';
                                    onUpdateOrder(order.id, { tracking_number: val });
                                  }}
                                  style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--border-color)',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                >
                                  Guardar Guía
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Panel de Pago */}
                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                            <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'white', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Método de Pago</h5>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                              <button
                                onClick={() => setOrderPaymentMethod(prev => ({ ...prev, [order.id]: 'Transferencia' }))}
                                style={{
                                  flex: 1,
                                  padding: '8px',
                                  fontSize: '11px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: (orderPaymentMethod[order.id] || order.paymentMethod) === 'Transferencia' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255,255,255,0.02)',
                                  color: (orderPaymentMethod[order.id] || order.paymentMethod) === 'Transferencia' ? '#60a5fa' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                <Upload size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />SPEI
                              </button>
                              <button
                                onClick={() => setOrderPaymentMethod(prev => ({ ...prev, [order.id]: 'Efectivo' }))}
                                style={{
                                  flex: 1,
                                  padding: '8px',
                                  fontSize: '11px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: (orderPaymentMethod[order.id] || order.paymentMethod) === 'Efectivo' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.02)',
                                  color: (orderPaymentMethod[order.id] || order.paymentMethod) === 'Efectivo' ? '#34d399' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                <Banknote size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />Efectivo
                              </button>
                            </div>

                            {/* Comprobante de transferencia */}
                            {(orderPaymentMethod[order.id] || order.paymentMethod) === 'Transferencia' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* Mostrar comprobante existente */}
                                {(orderReceiptBase64[order.id] || order.paymentReceipt) && (
                                  <div style={{ marginBottom: '6px' }}>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
                                      Comprobante: {orderReceiptName[order.id] || order.paymentReceiptName || 'recibo.png'}
                                    </p>
                                    <img
                                      src={orderReceiptBase64[order.id] || order.paymentReceipt}
                                      alt="Comprobante"
                                      style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                                    />
                                  </div>
                                )}
                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  {order.paymentReceipt ? 'Reemplazar comprobante:' : 'Subir comprobante (imagen):'}
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleOrderReceiptUpload(order.id, e)}
                                  style={getFormInputStyle()}
                                />
                              </div>
                            )}

                            {/* Monto efectivo */}
                            {(orderPaymentMethod[order.id] || order.paymentMethod) === 'Efectivo' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Monto cobrado (MXN):</label>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={orderCashAmount[order.id] ?? (order.cashAmountReceived || '')}
                                  onChange={(e) => setOrderCashAmount(prev => ({ ...prev, [order.id]: Number(e.target.value) }))}
                                  placeholder={`Total del pedido: $${(order.total || 0).toLocaleString('es-MX')}`}
                                  style={getFormInputStyle()}
                                />
                              </div>
                            )}

                            {/* Guardar pago */}
                            {(orderPaymentMethod[order.id] || order.paymentMethod) && (
                              <div style={{ marginTop: '10px' }}>
                                {orderSaveSuccess === order.id ? (
                                  <div style={{ fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Check size={13} /> Pago guardado correctamente
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleSaveOrderPayment(order.id)}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '8px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                  >
                                    <Save size={13} /> Guardar Pago
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 4: CUSTOMERS & BUYBACK */}
      {activeTab === 'customers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px' }} className="customers-grid-layout">
          
          {/* Listado de Clientes Registrados */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'white', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              Clientes ({users.length})
            </h3>
            
            {/* Buscador de Clientes */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <input
                type="text"
                placeholder="Buscar cliente por nombre o email..."
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setCustomerPage(1); }}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 12px 8px 30px',
                  color: 'white',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <div className="glass" style={{
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              backgroundColor: 'rgba(22, 27, 38, 0.2)',
              marginBottom: '12px'
            }}>
              {paginatedUsers.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  No se encontraron clientes.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {paginatedUsers.map((user, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedCustomerEmail(user.email)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: idx === paginatedUsers.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        backgroundColor: selectedCustomerEmail === user.email ? 'rgba(255, 203, 5, 0.08)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => { if (selectedCustomerEmail !== user.email) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { if (selectedCustomerEmail !== user.email) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      title="Haz clic para ver historial de pedidos"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, color: 'white', fontSize: '13px' }}>
                          {user.name || 'Sin Nombre'}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 800 }}>Historial →</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </div>
                      {user.phone && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          📞 {user.phone}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Paginador */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                <button
                  disabled={customerPage === 1}
                  onClick={() => setCustomerPage(prev => Math.max(1, prev - 1))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    color: 'white',
                    cursor: customerPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: customerPage === 1 ? 0.4 : 1
                  }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{customerPage} / {totalPages}</span>
                <button
                  disabled={customerPage === totalPages}
                  onClick={() => setCustomerPage(prev => Math.min(totalPages, prev + 1))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    color: 'white',
                    cursor: customerPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: customerPage === totalPages ? 0.4 : 1
                  }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

          {/* Historial de Pedidos del Cliente seleccionado (Modal Flotante) */}
          {selectedCustomerEmail && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(5, 5, 8, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 300,
              padding: '20px',
            }}
            onClick={() => setSelectedCustomerEmail(null)}
            >
              <div 
                className="glass animate-fade-in-up" 
                style={{
                  width: '100%',
                  maxWidth: '650px',
                  maxHeight: '80vh',
                  borderRadius: '16px',
                  backgroundColor: '#121622',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '24px',
                  overflowY: 'auto',
                  position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setSelectedCustomerEmail(null)}
                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
                
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>Historial de Pedidos</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cliente: <strong style={{ color: 'white' }}>{selectedCustomerEmail}</strong></span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
                  {orders.filter(o => (o.customerEmail || '').toLowerCase() === (selectedCustomerEmail || '').toLowerCase()).length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', paddingBlock: '30px' }}>
                      Este cliente aún no registra compras en esta sesión.
                    </p>
                  ) : (
                    orders
                      .filter(o => (o.customerEmail || '').toLowerCase() === (selectedCustomerEmail || '').toLowerCase())
                      .map(order => (
                        <div key={order.id} style={{ padding: '14px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                            <span>Orden: #{order.id}</span>
                            <span style={{ color: 'var(--secondary)' }}>${(order.total || 0).toLocaleString('es-MX')} MXN</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            <span>Fecha: {order.date}</span>
                            <span>Estado: <strong style={{ textTransform: 'uppercase' }}>{order.status}</strong></span>
                          </div>
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', fontSize: '12px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Productos Comprados:</span>
                            <div style={{ color: 'white', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {order.items.map((it, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>• {it.productName}</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>{(it.quantity || 0)} x ${(it.price || 0).toLocaleString('es-MX')} MXN</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Solicitudes de Recompra (Buyback Portal Reviews) */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'white', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
              Solicitudes de Recompra ({buybackRequests.length})
            </h3>
            
            {buybackRequests.length === 0 ? (
              <div className="glass" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)', borderRadius: '12px' }}>
                <Clock size={40} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '16px' }} />
                <h4 style={{ margin: 0, color: 'white', fontWeight: 700 }}>No hay cotizaciones de recompra</h4>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Las cotizaciones que envíen los clientes aparecerán listadas aquí.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {buybackRequests.map((request) => {
                  const isExpanded = expandedBuyback === request.id;
                  return (
                    <div 
                      key={request.id}
                      className="glass"
                      style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(22, 27, 38, 0.3)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Cabecera corta */}
                      <div 
                        onClick={() => setExpandedBuyback(isExpanded ? null : request.id)}
                        style={{
                          padding: '14px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          backgroundColor: 'rgba(6, 8, 12, 0.2)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: 'white' }}>Recompra #{request.id.slice(-6).toUpperCase()}</span>
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: 
                                request.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.1)' :
                                request.status === 'Aprobado' ? 'rgba(52, 211, 153, 0.1)' :
                                'rgba(255, 62, 62, 0.1)',
                              color: 
                                request.status === 'Pendiente' ? '#f59e0b' :
                                request.status === 'Aprobado' ? '#34d399' :
                                '#ff6b6b',
                              border: '1px solid currentColor'
                            }}>
                              {request.status}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>De: {request.customerName || request.customerEmail} ({request.date})</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--secondary)' }}>
                            ${(request.totalValue ?? (request as any).total_value ?? 0).toLocaleString('es-MX')} MXN
                          </span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {/* Detalle expandido */}
                      {isExpanded && (
                        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', animation: 'slideDown 0.2s' }}>
                          <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'white', marginBottom: '10px', textTransform: 'uppercase' }}>Cartas enviadas para evaluar</h5>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                            {(request.cards || (request as any).items || []).map((card: any, idx: number) => (
                              <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                backgroundColor: 'rgba(6, 8, 12, 0.2)',
                                border: '1px solid rgba(255,255,255,0.03)',
                                borderRadius: '6px',
                                fontSize: '12.5px'
                              }}>
                                <div>
                                  <span style={{ fontWeight: 600, color: 'white' }}>{card.name}</span>
                                  <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>({card.expansion})</span>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Rarity: {card.rarity || 'Single'} | Condition: <strong style={{ color: '#ffcb05' }}>{card.condition}</strong> | Graduada: {(card.isGraded ?? card.is_graded) ? 'Sí (PSA/BGS)' : 'No (Loose)'}
                                  </div>
                                </div>
                                <span style={{ fontWeight: 700, color: 'white' }}>
                                  ${(card.estimatedValue ?? card.estimated_value ?? card.marketPrice ?? card.market_price ?? 0).toLocaleString('es-MX')} MXN
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Botones de Aprobación */}
                          {request.status === 'Pendiente' && (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
                              <button
                                onClick={() => onUpdateBuybackStatus(request.id, 'Rechazado')}
                                className="btn btn-secondary"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', color: '#ff6b6b', borderColor: 'rgba(255,62,62,0.2)' }}
                              >
                                <X size={14} /> Rechazar Cotización
                              </button>
                              <button
                                onClick={() => onUpdateBuybackStatus(request.id, 'Aprobado')}
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#1ba24c', borderColor: '#199144' }}
                              >
                                <Check size={14} /> Aprobar y Pagar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 5: COUPONS */}
      {activeTab === 'coupons' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }} className="coupons-grid-layout">
          
          {/* Formulario de Cupones */}
          <form onSubmit={handleAddCouponSubmit} className="glass" style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'rgba(22, 27, 38, 0.4)',
            height: 'fit-content'
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'white', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
              Crear Nuevo Cupón de Descuento
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Código del Cupón</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POKE20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={getFormInputStyle()}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Porcentaje de Descuento</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={couponDiscount}
                  onChange={(e) => setCouponDiscount(Number(e.target.value))}
                  style={getFormInputStyle()}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', fontWeight: 700, marginTop: '8px' }}>
                Crear Cupón
              </button>
            </div>
          </form>

          {/* Tabla de Cupones */}
          <div className="glass" style={{
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'rgba(22, 27, 38, 0.2)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(6, 8, 12, 0.4)' }}>
                  <th style={{ padding: '12px 16px', color: 'white' }}>Código</th>
                  <th style={{ padding: '12px 16px', color: 'white' }}>Descuento</th>
                  <th style={{ padding: '12px 16px', color: 'white' }}>Estado</th>
                  <th style={{ padding: '12px 16px', color: 'white', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'white', fontFamily: 'monospace', fontSize: '14px' }}>
                      {coupon.code}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#34d399' }}>
                      {coupon.discountPercent}% OFF
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 600,
                        backgroundColor: coupon.isActive ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255, 62, 62, 0.1)',
                        color: coupon.isActive ? '#34d399' : '#ff6b6b'
                      }}>
                        {coupon.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => onToggleCoupon(coupon.code)}
                        className={`btn ${coupon.isActive ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        {coupon.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '600px' }}>
          <div className="glass" style={{
            padding: '28px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'rgba(22, 27, 38, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <Settings2 size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'var(--font-heading)' }}>
                Configuración de Datos Bancarios
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              Estos datos se mostrarán al cliente cuando elija pagar por transferencia bancaria (SPEI) en el checkout.
              Mantén esta información actualizada para facilitar los pagos.
            </p>

            {bankSaveSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(27, 162, 76, 0.1)',
                border: '1px solid rgba(27, 162, 76, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#34d399',
                fontSize: '14px',
                animation: 'fadeIn 0.2s'
              }}>
                <Check size={16} />
                <span>Configuración bancaria guardada correctamente.</span>
              </div>
            )}

            <form onSubmit={handleSaveBankSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre del Banco</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BBVA, HSBC, Santander"
                  value={editBankName}
                  onChange={(e) => setEditBankName(e.target.value)}
                  style={getFormInputStyle()}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>CLABE Interbancaria (18 dígitos)</label>
                <input
                  type="text"
                  required
                  maxLength={18}
                  placeholder="018xxxxxxxxxxxxxxx"
                  value={editClabe}
                  onChange={(e) => setEditClabe(e.target.value.replace(/\D/g, ''))}
                  style={{ ...getFormInputStyle(), fontFamily: 'monospace', letterSpacing: '0.05em' }}
                />
                {editClabe && editClabe.length !== 18 && (
                  <span style={{ fontSize: '11px', color: '#f59e0b' }}>La CLABE debe tener exactamente 18 dígitos ({editClabe.length}/18)</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Número de Cuenta (Opcional)</label>
                <input
                  type="text"
                  placeholder="e.g. 1234567890"
                  value={editAccount}
                  onChange={(e) => setEditAccount(e.target.value)}
                  style={getFormInputStyle()}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Beneficiario (Nombre del Titular)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PokéVault México / Tu Nombre"
                  value={editBeneficiary}
                  onChange={(e) => setEditBeneficiary(e.target.value)}
                  style={getFormInputStyle()}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>WhatsApp de Contacto (con código de país)</label>
                <input
                  type="text"
                  placeholder="e.g. 525512345678"
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ ...getFormInputStyle(), fontFamily: 'monospace' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Formato: código de país + número (sin + ni espacios). Ej: 52 para México → 525512345678
                </span>
              </div>

              <div style={{ padding: '16px', backgroundColor: 'rgba(255, 62, 62, 0.05)', border: '1px solid rgba(255, 62, 62, 0.15)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'white' }}>Vista Previa en Checkout:</strong>
                <div style={{ marginTop: '8px', lineHeight: 1.8 }}>
                  🏦 <strong style={{ color: 'white' }}>{editBankName || 'Banco'}</strong><br />
                  CLABE: <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{editClabe || '—'}</span><br />
                  Beneficiario: <span style={{ color: 'white' }}>{editBeneficiary || '—'}</span><br />
                  {editWhatsapp && <>📱 WhatsApp: <span style={{ color: '#34d399' }}>+{editWhatsapp}</span></>}
                </div>
              </div>

              {/* PayPal Integration Settings */}
              <div style={{
                marginTop: '10px',
                padding: '20px',
                backgroundColor: 'rgba(0, 112, 186, 0.05)',
                border: '1px solid rgba(0, 112, 186, 0.25)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>💳</span>
                  <strong style={{ color: 'white', fontSize: '14px' }}>Configuración de Pasarela PayPal</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="paypalActive"
                    checked={editPaypalActive}
                    onChange={(e) => setEditPaypalActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="paypalActive" style={{ fontSize: '13px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                    Habilitar PayPal en Checkout (Pago con Tarjeta y Saldo)
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>PayPal Client ID</label>
                  <input
                    type="text"
                    placeholder="e.g. Ad_xxxxxxxxxxxxxxxxxxxxxx (Deja vacío para usar Sandbox de pruebas)"
                    value={editPaypalClientId}
                    onChange={(e) => setEditPaypalClientId(e.target.value)}
                    style={getFormInputStyle()}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Ingresa tu Client ID obtenido en el portal de desarrolladores de PayPal. Si lo dejas vacío, el checkout cargará un Client ID Sandbox preconfigurado para pruebas.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontWeight: 700, alignSelf: 'flex-start' }}
              >
                <Save size={16} /> Guardar Configuración
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 7: LOGS DE AUDITORÍA */}
      {activeTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Bitácora de Auditoría (Logs)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Historial de acciones y modificaciones del panel de administración
            </p>
          </div>

          {loadingLogs ? (
            <div style={{ paddingBlock: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 className="animate-spin" size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 16px auto', color: 'var(--primary)' }} />
              Cargando historial de auditoría...
            </div>
          ) : adminLogs.length === 0 ? (
            <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', borderRadius: '12px' }}>
              No se han registrado logs de auditoría todavía.
            </div>
          ) : (
            <div className="glass" style={{
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              backgroundColor: 'rgba(22, 27, 38, 0.2)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(6, 8, 12, 0.4)' }}>
                      <th style={{ padding: '12px 16px', color: 'white', width: '180px' }}>Fecha</th>
                      <th style={{ padding: '12px 16px', color: 'white', width: '180px' }}>Usuario Admin</th>
                      <th style={{ padding: '12px 16px', color: 'white', width: '150px' }}>Acción</th>
                      <th style={{ padding: '12px 16px', color: 'white' }}>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {new Date(log.created_at).toLocaleString('es-MX')}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'white', fontWeight: 600 }}>
                          {log.admin_email}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            backgroundColor: 
                              log.action === 'Crear Producto' ? 'rgba(52, 211, 153, 0.12)' :
                              log.action === 'Editar Producto' ? 'rgba(96, 165, 250, 0.12)' :
                              log.action === 'Eliminar Producto' ? 'rgba(255, 62, 62, 0.12)' :
                              log.action === 'Actualizar Pedido' ? 'rgba(245, 158, 11, 0.12)' :
                              'rgba(255, 203, 5, 0.12)',
                            color: 
                              log.action === 'Crear Producto' ? '#34d399' :
                              log.action === 'Editar Producto' ? '#60a5fa' :
                              log.action === 'Eliminar Producto' ? '#ff6b6b' :
                              log.action === 'Actualizar Pedido' ? '#f59e0b' :
                              '#ffcb05',
                            border: '1px solid currentColor'
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL EDITAR PRODUCTO */}
      {editingProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 5, 8, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: '20px',
        }}>
          <div 
            className="glass animate-fade-in-up" 
            style={{
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              borderRadius: '16px',
              backgroundColor: '#121622',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'var(--shadow-lg)',
              overflowY: 'auto',
              position: 'relative',
              padding: '28px'
            }}
          >
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setEditingProduct(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
              Editar Producto: {editingProduct.name}
            </h3>

            <form onSubmit={handleEditProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Nombre del Producto</label>
                  <input
                    type="text"
                    required
                    value={editProdName}
                    onChange={(e) => setEditProdName(e.target.value)}
                    style={getFormInputStyle()}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Categoría</label>
                  <select
                    value={editProdCategory}
                    onChange={(e) => setEditProdCategory(e.target.value as Product['category'])}
                    style={getFormInputStyle()}
                  >
                    <option value="booster_box">Booster Box</option>
                    <option value="etb">Elite Trainer Box (ETB)</option>
                    <option value="blister">Blister Pack</option>
                    <option value="accessory">Accesorio</option>
                    <option value="single">Carta Suelta (Single)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Precio (MXN)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editProdPrice}
                    onChange={(e) => setEditProdPrice(Number(e.target.value))}
                    style={getFormInputStyle()}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Stock Disponible</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editProdStock}
                    onChange={(e) => setEditProdStock(Number(e.target.value))}
                    style={getFormInputStyle()}
                  />
                </div>
              </div>

              {/* Atributos Específicos de Carta Física */}
              {editProdCategory === 'single' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px',
                  padding: '16px',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Idioma / Región de la Carta</label>
                    <select
                      value={editProdRegion}
                      onChange={(e) => setEditProdRegion(e.target.value)}
                      style={getFormInputStyle()}
                    >
                      <option value="Inglés (USA)">Inglés (USA)</option>
                      <option value="Español (Latam)">Español (Latam)</option>
                      <option value="Japonés">Japonés</option>
                      <option value="Español (España)">Español (España)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Sobre de Origen (Pulled Set)</label>
                    <input
                      type="text"
                      placeholder="e.g. Scarlet & Violet: 151"
                      value={editProdPulledFrom}
                      onChange={(e) => setEditProdPulledFrom(e.target.value)}
                      style={getFormInputStyle()}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Condición Física</label>
                    <select
                      value={editProdCardCondition}
                      onChange={(e) => setEditProdCardCondition(e.target.value)}
                      style={getFormInputStyle()}
                    >
                      <option value="NM">Near Mint (NM - Como Nueva)</option>
                      <option value="LP">Lightly Played (LP - Poco Desgaste)</option>
                      <option value="MP">Moderately Played (MP - Desgaste Medio)</option>
                      <option value="HP">Heavily Played (HP - Dañada)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Juego (TCG)</label>
                    <select
                      value={editProdGameType}
                      onChange={(e) => setEditProdGameType(e.target.value)}
                      style={getFormInputStyle()}
                    >
                      <option value="POKEMON">Pokémon TCG</option>
                      <option value="MAGIC">Magic: The Gathering</option>
                      <option value="YUGIOH">Yu-Gi-Oh!</option>
                      <option value="ONEPIECE">One Piece Card Game</option>
                      <option value="DRAGONBALL">Dragon Ball Super</option>
                      <option value="BASEBALL">Tarjetas de Béisbol</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Carga de Imagen para Accesorios (Edición) */}
              {editProdCategory === 'accessory' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '16px',
                  marginBottom: '16px',
                  padding: '16px',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Subir Nueva Foto del Accesorio (Desde Archivo)</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="file"
                        id="editProdFileInput"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, true)}
                        style={getFormInputStyle()}
                      />
                      {editProdFileBase64 && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditProdFileBase64('');
                            setEditProdFileName('');
                            const fileInput = document.getElementById('editProdFileInput') as HTMLInputElement | null;
                            if (fileInput) fileInput.value = '';
                          }}
                          style={{
                            backgroundColor: 'rgba(255, 62, 62, 0.15)',
                            border: '1px solid #ff3e3e',
                            color: '#ff6b6b',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700
                          }}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                    {editProdFileBase64 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <img src={editProdFileBase64} alt="Preview" style={{ height: '30px', width: '30px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                        <span style={{ fontSize: '11px', color: '#34d399', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>✓ {editProdFileName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview de Imagen Asignada */}
              {(editProdImage || editProdCategory) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  width: 'fit-content'
                }}>
                  <img
                    src={
                      editProdCategory === 'single'
                        ? (editProdImage || '/generic_card.png')
                        : editProdCategory === 'booster_box'
                        ? '/official_booster_box.png'
                        : editProdCategory === 'etb'
                        ? '/official_etb.png'
                        : editProdCategory === 'blister'
                        ? '/official_blister.png'
                        : editProdCategory === 'accessory'
                        ? (editProdFileBase64 || editProdImage || '/generic_etb.png')
                        : '/generic_card.png'
                    }
                    alt="Vista previa"
                    style={{ height: '70px', width: '70px', objectFit: 'contain', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.2)' }}
                  />
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'white', display: 'block' }}>
                      Imagen Asignada
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {editProdCategory === 'single' && editProdImage 
                        ? 'Cargada desde Pokémon TCG API' 
                        : editProdCategory === 'accessory'
                        ? 'Foto subida por el administrador'
                        : 'Imagen oficial sin copyright de PokéVault'}
                    </span>
                  </div>
                </div>
              )}

              {/* Fila de Detalles Adicionales (Expansión y Destacado) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Expansión (Opcional)</label>
                  <input
                    type="text"
                    value={editProdExpansion}
                    onChange={(e) => setEditProdExpansion(e.target.value)}
                    style={getFormInputStyle()}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '24px' }}>
                  <input
                    type="checkbox"
                    id="editIsPromo"
                    checked={editProdIsPromo}
                    onChange={(e) => setEditProdIsPromo(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="editIsPromo" style={{ fontSize: '13px', color: 'white', cursor: 'pointer' }}>Destacar en catálogo principal</label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Descripción del Producto</label>
                <textarea
                  value={editProdDesc}
                  onChange={(e) => setEditProdDesc(e.target.value)}
                  style={{ ...getFormInputStyle(), height: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)} 
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontWeight: 700 }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          padding: 10px 16px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
        .tab-btn:hover {
          color: white;
        }
        .tab-btn.active {
          color: var(--primary) !important;
          border-bottom: 2px solid var(--primary) !important;
          font-weight: 700;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { height: 0; opacity: 0; overflow: hidden; }
          to { height: auto; opacity: 1; }
        }
        @media (max-width: 992px) {
          .order-details-grid {
            grid-template-columns: 1fr !important;
          }
          .customers-grid-layout, .coupons-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ── MODAL: Confirmar Eliminación de Producto ── */}
      {confirmDeleteId && productToDelete && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(6, 8, 12, 0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 500, padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass" style={{
            width: '100%', maxWidth: '420px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 62, 62, 0.35)',
            backgroundColor: 'rgba(22, 27, 38, 0.92)',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(255,62,62,0.08)',
            animation: 'scaleIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            {/* Icono de advertencia */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                backgroundColor: 'rgba(255, 62, 62, 0.12)',
                border: '1px solid rgba(255, 62, 62, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <Trash2 size={24} style={{ color: '#ff6b6b' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'var(--font-heading)' }}>
                ¿Eliminar producto?
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
                Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Vista previa del producto */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px', padding: '14px',
              marginBottom: '24px'
            }}>
              <img
                src={productToDelete.image}
                alt={productToDelete.name}
                style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {productToDelete.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Stock: {productToDelete.stock} pzas · ${productToDelete.price.toLocaleString('es-MX')} MXN
                </div>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '11px', fontSize: '14px', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteInventoryItem(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                style={{
                  flex: 1, padding: '11px', fontSize: '14px', fontWeight: 700,
                  borderRadius: '8px', border: 'none', cursor: 'pointer',
                  backgroundColor: '#c81a1a', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e02020'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#c81a1a'}
              >
                <Trash2 size={15} /> Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO DE VENTA FÍSICA */}
      {showManualSaleModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 5, 8, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '20px'
        }}>
          <div className="glass animate-fade-in-up" style={{
            width: '100%', maxWidth: '650px', maxHeight: '90vh',
            borderRadius: '16px', backgroundColor: '#121622',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'var(--shadow-lg)', overflowY: 'auto',
            padding: '30px', position: 'relative'
          }}>
            <button 
              onClick={() => setShowManualSaleModal(false)}
              aria-label="Cerrar modal"
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                color: 'var(--text-main)', width: '32px', height: '32px',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
              Registrar Venta Directa (Mostrador)
            </h3>

            {manualSaleError && (
              <div style={{
                backgroundColor: 'rgba(255,62,62,0.08)', border: '1px solid rgba(255,62,62,0.2)',
                borderRadius: '8px', padding: '12px', color: '#ff6b6b', fontSize: '13px',
                marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <AlertTriangle size={16} />
                <span>{manualSaleError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterManualSaleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    value={manualSaleName}
                    onChange={(e) => setManualSaleName(e.target.value)}
                    style={getFormInputStyle()}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={manualSaleEmail}
                    onChange={(e) => setManualSaleEmail(e.target.value)}
                    style={getFormInputStyle()}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Método de Pago
                </label>
                <select
                  value={manualSalePayment}
                  onChange={(e) => setManualSalePayment(e.target.value)}
                  style={getFormInputStyle()}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia SPEI</option>
                  <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                </select>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Artículos Vendidos</span>
                  <button
                    type="button"
                    onClick={addManualSaleItemLine}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                      borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: 'white',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Plus size={12} /> Agregar Fila
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                  {manualSaleItems.map((item, index) => {
                    const selectedProd = inventory.find(p => p.id === item.productId);
                    const maxStock = selectedProd ? selectedProd.stock : 0;
                    return (
                      <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <select
                            value={item.productId}
                            onChange={(e) => updateManualSaleItemLine(index, 'productId', e.target.value)}
                            style={getFormInputStyle()}
                            required
                          >
                            <option value="">-- Seleccionar Carta/Producto --</option>
                            {inventory
                              .filter(p => (p.stock > 0 || p.id === item.productId) && p.name)
                              .filter(p => !manualSaleItems.some((otherItem, otherIdx) => otherIdx !== index && otherItem.productId === p.id))
                              .map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (${p.price.toLocaleString('es-MX')} MXN · Stock: {p.stock})
                                </option>
                              ))}
                          </select>
                        </div>
                        <div style={{ width: '80px' }}>
                          <input
                            type="number"
                            min={1}
                            max={maxStock || 999}
                            value={item.quantity || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              updateManualSaleItemLine(index, 'quantity', val);
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              const cappedVal = Math.max(1, Math.min(maxStock || 1, val));
                              updateManualSaleItemLine(index, 'quantity', cappedVal);
                            }}
                            style={getFormInputStyle()}
                            required
                            disabled={!item.productId}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeManualSaleItemLine(index)}
                          disabled={manualSaleItems.length <= 1}
                          style={{
                            background: 'rgba(255,62,62,0.05)', border: '1px solid rgba(255,62,62,0.15)',
                            color: '#ff6b6b', width: '34px', height: '34px', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            opacity: manualSaleItems.length <= 1 ? 0.4 : 1
                          }}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total de la venta */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginTop: '10px'
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Monto Total a Cobrar:</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--secondary)' }}>
                  ${manualSaleItems.reduce((acc, item) => {
                    const p = inventory.find(prod => prod.id === item.productId);
                    return acc + (p ? p.price * item.quantity : 0);
                  }, 0).toLocaleString('es-MX')} MXN
                </span>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowManualSaleModal(false)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent', color: 'white', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={manualSaleSaving}
                  style={{
                    flex: 2, padding: '12px', borderRadius: '8px', border: 'none',
                    backgroundColor: 'var(--primary)', color: 'white', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {manualSaleSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Registrando...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Confirmar y Cobrar Venta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Utility styling functions to avoid verbose repeating
function getTabStyle(_isActive: boolean): React.CSSProperties {
  return {}; // Handled by CSS class injection, keeping TS compliant
}

function getMetricCardStyle(borderColor: string): React.CSSProperties {
  return {
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    borderLeft: `4px solid ${borderColor}`,
    backgroundColor: 'rgba(22, 27, 38, 0.4)',
    display: 'flex',
    flexDirection: 'column'
  };
}

function getFormInputStyle(): React.CSSProperties {
  return {
    width: '100%',
    backgroundColor: 'rgba(6, 8, 12, 0.5)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: 'white',
    fontSize: '13px',
    outline: 'none',
  };
}
