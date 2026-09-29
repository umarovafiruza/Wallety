// ===================================================
// OILA XARAJATLARI VA BUDJETI - JAVASCRIPT KODI
// ===================================================

const STORAGE_KEY = 'oila_xarajatlari_malika_v2';
const BUDGET_KEY = 'oila_budjeti_malika_v2';

// Oylar ro'yxati (O'zbek tilida)
const MONTH_NAMES = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
];

// Chiqim (Xarajat) kategoriyalari
const EXPENSE_CATEGORIES = {
  "Oziq-ovqat":  { code: "cat-oziq-ovqat", label: "OQ", color: "#ea580c" },
  "Salomatlik":  { code: "cat-salomatlik", label: "SL", color: "#e11d48" },
  "Kommunal":    { code: "cat-kommunal",   label: "KM", color: "#059669" },
  "Ta'lim":      { code: "cat-talim",      label: "TL", color: "#7e22ce" },
  "Transport":   { code: "cat-transport",   label: "TR", color: "#0284c7" },
  "Kredit":      { code: "cat-kredit",      label: "KR", color: "#dc2626" },
  "Boshqa":      { code: "cat-boshqa",      label: "B",  color: "#475569" }
};

// Kirim (Daromad) kategoriyalari
const INCOME_CATEGORIES = {
  "Oylik maosh":     { code: "cat-maosh",        label: "OM", color: "#15803d" },
  "Pensiya":         { code: "cat-pensiya",      label: "PS", color: "#a16207" },
  "Savdo / Biznes":  { code: "cat-biznes",       label: "SB", color: "#6d28d9" },
  "Boshqa kirim":    { code: "cat-kirim-boshqa", label: "BK", color: "#0f766e" }
};

// Holat (State)
let transactions = [];
let budgetData = {
  defaultBudget: 0,
  monthly: {} // Masalan: { "2026-09": 3000000 }
};

// Hozirgi tanlangan yil va oy
const now = new Date();
let selectedYear = now.getFullYear();
let selectedMonth = now.getMonth(); // 0-11

// Hozirgi forma turi ('expense' yoki 'income')
let currentFormType = 'expense';

// Grafik turi ('expense' yoki 'income')
let chartMode = 'expense';

// DOM Elementlari
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const currentMonthDisplay = document.getElementById('current-month-display');
const monthSubtitle = document.getElementById('month-subtitle');
const analyticsMonthSubtitle = document.getElementById('analytics-month-subtitle');

// Karta ko'rsatkichlari
const netBalanceAmount = document.getElementById('net-balance-amount');
const cardTotalIncome = document.getElementById('card-total-income');
const cardTotalExpense = document.getElementById('card-total-expense');
const budgetStatusText = document.getElementById('budget-status-text');
const budgetPercentageText = document.getElementById('budget-percentage-text');
const cardBudgetBarFill = document.getElementById('card-budget-bar-fill');

// Ro'yxat va Tablar
const transactionsListContainer = document.getElementById('transactions-list');
const txCountBadge = document.getElementById('tx-count-badge');
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');

// Forma elementlari
const formErrorAlert = document.getElementById('form-error-alert');
const btnTypeExpense = document.getElementById('btn-type-expense');
const btnTypeIncome = document.getElementById('btn-type-income');
const txNameLabel = document.getElementById('tx-name-label');
const txAmountInput = document.getElementById('tx-amount');
const txNameInput = document.getElementById('tx-name');
const txDateInput = document.getElementById('tx-date');
const categoryChipsContainer = document.getElementById('category-chips-container');
const selectedCategoryValue = document.getElementById('selected-category-value');
const transactionForm = document.getElementById('transaction-form');
const saveTxBtn = document.getElementById('save-tx-btn');

// Tahlil va Statistika elementlari
const statsInsightBanner = document.getElementById('stats-insight-banner');
const insightTitle = document.getElementById('insight-title');
const insightDesc = document.getElementById('insight-desc');
const chartViewport = document.getElementById('chart-viewport');
const chartLegend = document.getElementById('chart-legend');
const btnChartExpense = document.getElementById('btn-chart-expense');
const btnChartIncome = document.getElementById('btn-chart-income');

const kpiDailyAvg = document.getElementById('kpi-daily-avg');
const kpiHighestExpense = document.getElementById('kpi-highest-expense');
const kpiHighestExpenseName = document.getElementById('kpi-highest-expense-name');
const kpiSavingsRate = document.getElementById('kpi-savings-rate');
const kpiTopCategory = document.getElementById('kpi-top-category');
const kpiTopCategoryPercent = document.getElementById('kpi-top-category-percent');

const analyticsBudgetAmount = document.getElementById('analytics-budget-amount');
const analyticsBudgetSub = document.getElementById('analytics-budget-sub');
const analyticsBudgetBarFill = document.getElementById('analytics-budget-bar-fill');
const expenseCategoryBreakdown = document.getElementById('expense-category-breakdown');
const incomeCategoryBreakdown = document.getElementById('income-category-breakdown');

// Modal elementlari
const budgetModal = document.getElementById('budget-modal');
const openBudgetModalBtn = document.getElementById('open-budget-modal-btn');
const analyticsChangeBudgetBtn = document.getElementById('analytics-change-budget-btn');
const closeBudgetModalBtn = document.getElementById('close-budget-modal-btn');
const cancelBudgetBtn = document.getElementById('cancel-budget-btn');
const budgetForm = document.getElementById('budget-form');
const monthlyBudgetInput = document.getElementById('monthly-budget-input');

// ---------------------------------------------------
// 1. MA'LUMOTLARNI YUKLASH VA SAQLASH
// ---------------------------------------------------

function loadData() {
  // Tranzaksiyalarni o'qish
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        transactions = parsed.map(item => {
          const cleanAmount = typeof item.amount === 'number'
            ? item.amount
            : parseFloat(String(item.amount).replace(/,/g, '')) || 0;

          return {
            id: item.id || (Date.now() + Math.random()).toString(),
            type: item.type || 'expense',
            name: item.name || 'Nomsiz',
            amount: cleanAmount,
            category: item.category || 'Boshqa',
            date: item.date || (item.timestamp ? item.timestamp.split('T')[0] : getTodayDateString())
          };
        });
      }
    }
  } catch (e) {
    console.error("Tranzaksiyalarni yuklashda xatolik:", e);
    transactions = [];
  }

  // Budjet ma'lumotlarini o'qish
  try {
    const rawBudget = localStorage.getItem(BUDGET_KEY);
    if (rawBudget) {
      const parsed = JSON.parse(rawBudget);
      if (typeof parsed === 'number') {
        budgetData = { defaultBudget: parsed, monthly: {} };
      } else if (parsed && typeof parsed === 'object') {
        budgetData = {
          defaultBudget: Number(parsed.defaultBudget) || 0,
          monthly: parsed.monthly || {}
        };
      }
    } else {
      // Eski oddiy budjet kalitini ham tekshiramiz
      const oldBudget = localStorage.getItem('oila_budjeti_malika');
      if (oldBudget) {
        const num = parseFloat(String(oldBudget).replace(/,/g, '')) || 0;
        budgetData = { defaultBudget: num, monthly: {} };
      }
    }
  } catch (e) {
    budgetData = { defaultBudget: 0, monthly: {} };
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgetData));
  } catch (e) {
    console.error("Ma'lumotlarni saqlashda xatolik:", e);
  }
}

// Tanlangan oy uchun oylik budjetni olish
function getCurrentMonthBudget() {
  const key = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  if (budgetData.monthly && budgetData.monthly[key] !== undefined) {
    return Number(budgetData.monthly[key]) || 0;
  }
  return Number(budgetData.defaultBudget) || 0;
}

// Tanlangan oy uchun oylik budjetni saqlash
function setCurrentMonthBudget(amount) {
  const key = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  if (!budgetData.monthly) budgetData.monthly = {};
  budgetData.monthly[key] = amount;
  budgetData.defaultBudget = amount; // Keyingi oylarga ham odatiy qilamiz
  saveData();
}

// ---------------------------------------------------
// 2. YORDAMCHI FORMATLASH FUNKSIYALARI
// ---------------------------------------------------

// Pul summasini vergul bilan formatlash: 3,000,000 so'm
function formatCurrency(amount) {
  const rounded = Math.round(Number(amount)) || 0;
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${formatted} so'm`;
}

// Sonlarni vergul bilan ajratish: 3,000,000
function formatNumberWithCommas(val) {
  if (val === undefined || val === null || val === '') return '';
  const clean = val.toString().replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Grafik uchun ixcham format: 450k so'm, 1.5M so'm
function formatCompactCurrency(amount) {
  const num = Math.round(Number(amount)) || 0;
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.0', '') + 'M so\'m';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'k so\'m';
  }
  return num + ' so\'m';
}

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const mIndex = parseInt(parts[1], 10) - 1;
  const mName = MONTH_NAMES[mIndex] ? MONTH_NAMES[mIndex].toLowerCase() : '';
  return `${day}-${mName}`;
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// ---------------------------------------------------
// 3. OY TANLAGICH VA OYMA-OY O'TISH
// ---------------------------------------------------

function updateMonthDisplay() {
  currentMonthDisplay.textContent = `${selectedYear}-yil, ${MONTH_NAMES[selectedMonth]}`;
  const subText = `${MONTH_NAMES[selectedMonth]} oyi`;
  monthSubtitle.textContent = subText;
  analyticsMonthSubtitle.textContent = subText;
}

// Forma ichidagi sanani tanlangan oyga moslash
function syncFormDateWithSelectedMonth() {
  const today = new Date();
  let day;
  if (today.getFullYear() === selectedYear && today.getMonth() === selectedMonth) {
    day = String(today.getDate()).padStart(2, '0');
  } else {
    day = "01";
  }
  const m = String(selectedMonth + 1).padStart(2, '0');
  txDateInput.value = `${selectedYear}-${m}-${day}`;
}

prevMonthBtn.addEventListener('click', () => {
  selectedMonth--;
  if (selectedMonth < 0) {
    selectedMonth = 11;
    selectedYear--;
  }
  updateMonthDisplay();
  syncFormDateWithSelectedMonth();
  render();
});

nextMonthBtn.addEventListener('click', () => {
  selectedMonth++;
  if (selectedMonth > 11) {
    selectedMonth = 0;
    selectedYear++;
  }
  updateMonthDisplay();
  syncFormDateWithSelectedMonth();
  render();
});

// ---------------------------------------------------
// 4. STATISTIKANI HISOBLASH (BUDJET, KIRIM VA CHIQIM MUTANOSIBLIGI)
// ---------------------------------------------------

function calculateMonthStats() {
  const targetPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const monthTx = transactions.filter(t => t.date && t.date.startsWith(targetPrefix));

  let addedIncome = 0;
  let totalExpense = 0;

  const expenseCategoryMap = {};
  const incomeCategoryMap = {};

  monthTx.forEach(t => {
    const amt = typeof t.amount === 'number'
      ? t.amount
      : parseFloat(String(t.amount).replace(/,/g, '')) || 0;

    if (t.type === 'income') {
      addedIncome += amt;
      incomeCategoryMap[t.category] = (incomeCategoryMap[t.category] || 0) + amt;
    } else {
      totalExpense += amt;
      expenseCategoryMap[t.category] = (expenseCategoryMap[t.category] || 0) + amt;
    }
  });

  // Oylik budjet
  const monthBudget = getCurrentMonthBudget();

  // JAMI MAVJUD MABLAG' (Budjet + Kirimlar)
  // Agar boshlang'ich budjet kiritilgan bo'lsa, u umumiy tushumga qo'shiladi
  let totalAvailable = 0;
  if (monthBudget > 0) {
    totalAvailable = monthBudget + addedIncome;
  } else {
    totalAvailable = addedIncome;
  }

  // SOF BALANS / OILANING QOLDIQ PULI
  // Qoldiq = (Boshlang'ich Budjet + Kirimlar) - Chiqimlar
  const netBalance = totalAvailable - totalExpense;

  // Chiqim kategoriyalari
  const activeExpenseCategories = [];
  for (const [cat, sum] of Object.entries(expenseCategoryMap)) {
    if (sum > 0) {
      const percentage = totalExpense > 0 ? Math.round((sum / totalExpense) * 100) : 0;
      activeExpenseCategories.push({
        category: cat,
        amount: sum,
        percentage,
        config: EXPENSE_CATEGORIES[cat] || { code: "cat-boshqa", label: "B", color: "#64748b" }
      });
    }
  }
  activeExpenseCategories.sort((a, b) => b.amount - a.amount);

  // Kirim kategoriyalari
  const activeIncomeCategories = [];
  for (const [cat, sum] of Object.entries(incomeCategoryMap)) {
    if (sum > 0) {
      const percentage = addedIncome > 0 ? Math.round((sum / addedIncome) * 100) : 0;
      activeIncomeCategories.push({
        category: cat,
        amount: sum,
        percentage,
        config: INCOME_CATEGORIES[cat] || { code: "cat-kirim-boshqa", label: "BK", color: "#0f766e" }
      });
    }
  }
  activeIncomeCategories.sort((a, b) => b.amount - a.amount);

  return {
    monthTx,
    monthBudget,
    addedIncome,
    totalAvailable,
    totalExpense,
    netBalance,
    activeExpenseCategories,
    activeIncomeCategories
  };
}

// ---------------------------------------------------
// 5. DINAMIK SVG GRAFIK CHIZISH (TREND CHART)
// ---------------------------------------------------

btnChartExpense.addEventListener('click', () => {
  chartMode = 'expense';
  btnChartExpense.classList.add('active');
  btnChartIncome.classList.remove('active');
  renderChart();
});

btnChartIncome.addEventListener('click', () => {
  chartMode = 'income';
  btnChartIncome.classList.add('active');
  btnChartExpense.classList.remove('active');
  renderChart();
});

function renderChart() {
  chartViewport.textContent = '';

  const targetPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const filteredTx = transactions.filter(t => t.date && t.date.startsWith(targetPrefix) && t.type === chartMode);

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const dailySums = new Array(daysInMonth + 1).fill(0);

  filteredTx.forEach(t => {
    const day = parseInt(t.date.split('-')[2], 10);
    const amt = typeof t.amount === 'number'
      ? t.amount
      : parseFloat(String(t.amount).replace(/,/g, '')) || 0;

    if (day >= 1 && day <= daysInMonth) {
      dailySums[day] += amt;
    }
  });

  const totalSum = dailySums.reduce((acc, v) => acc + v, 0);

  if (totalSum === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-subtext';
    emptyMsg.style.textAlign = 'center';
    emptyMsg.textContent = `Ushbu oyda hali ${chartMode === 'expense' ? 'chiqim' : 'kirim'} amalga oshirilmagan`;
    chartViewport.appendChild(emptyMsg);
    return;
  }

  const svgWidth = 360;
  const svgHeight = 175;
  const padLeft = 25;
  const padRight = 25;
  const padTop = 38;
  const padBottom = 28;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxVal = Math.max(...dailySums) || 1;

  const points = [];
  let peakDay = 1;
  let peakVal = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const x = padLeft + ((day - 1) / (daysInMonth - 1)) * chartW;
    const y = padTop + chartH - (dailySums[day] / maxVal) * chartH;
    points.push({ day, val: dailySums[day], x, y });

    if (dailySums[day] > peakVal) {
      peakVal = dailySums[day];
      peakDay = day;
    }
  }

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;
  const strokeColor = chartMode === 'income' ? '#10b981' : '#111216';
  const gradientId = `chartGrad_${chartMode}`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
  svg.setAttribute("class", "chart-svg");

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const linearGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  linearGrad.setAttribute("id", gradientId);
  linearGrad.setAttribute("x1", "0");
  linearGrad.setAttribute("y1", "0");
  linearGrad.setAttribute("x2", "0");
  linearGrad.setAttribute("y2", "1");

  const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", strokeColor);
  stop1.setAttribute("stop-opacity", chartMode === 'income' ? "0.3" : "0.15");

  const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop2.setAttribute("offset", "100%");
  stop2.setAttribute("stop-color", strokeColor);
  stop2.setAttribute("stop-opacity", "0");

  linearGrad.appendChild(stop1);
  linearGrad.appendChild(stop2);
  defs.appendChild(linearGrad);
  svg.appendChild(defs);

  [0, 0.5, 1].forEach(ratio => {
    const lineY = padTop + chartH * (1 - ratio);
    const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gridLine.setAttribute("x1", padLeft);
    gridLine.setAttribute("y1", lineY);
    gridLine.setAttribute("x2", padLeft + chartW);
    gridLine.setAttribute("y2", lineY);
    gridLine.setAttribute("stroke", "#f1f3f6");
    gridLine.setAttribute("stroke-dasharray", "4,4");
    gridLine.setAttribute("stroke-width", "1");
    svg.appendChild(gridLine);
  });

  const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  areaPath.setAttribute("d", areaD);
  areaPath.setAttribute("fill", `url(#${gradientId})`);
  svg.appendChild(areaPath);

  const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  linePath.setAttribute("d", pathD);
  linePath.setAttribute("fill", "none");
  linePath.setAttribute("stroke", strokeColor);
  linePath.setAttribute("stroke-width", "2.6");
  linePath.setAttribute("stroke-linecap", "round");
  linePath.setAttribute("stroke-linejoin", "round");
  svg.appendChild(linePath);

  const peakPt = points.find(p => p.day === peakDay);
  if (peakPt && peakVal > 0) {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", peakPt.x);
    dot.setAttribute("cy", peakPt.y);
    dot.setAttribute("r", "5");
    dot.setAttribute("fill", "#ffffff");
    dot.setAttribute("stroke", strokeColor);
    dot.setAttribute("stroke-width", "2.5");
    svg.appendChild(dot);

    const textStr = formatCompactCurrency(peakVal);
    const boxW = Math.max(textStr.length * 7.5 + 16, 68);
    const boxH = 22;
    const boxX = Math.min(Math.max(peakPt.x - boxW / 2, padLeft), padLeft + chartW - boxW);
    const boxY = Math.max(peakPt.y - boxH - 8, 4);

    const tagBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tagBg.setAttribute("x", boxX);
    tagBg.setAttribute("y", boxY);
    tagBg.setAttribute("width", boxW);
    tagBg.setAttribute("height", boxH);
    tagBg.setAttribute("rx", "11");
    tagBg.setAttribute("fill", "#111216");
    svg.appendChild(tagBg);

    const tagText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tagText.setAttribute("x", boxX + boxW / 2);
    tagText.setAttribute("y", boxY + 15);
    tagText.setAttribute("text-anchor", "middle");
    tagText.setAttribute("fill", "#ffffff");
    tagText.setAttribute("font-size", "10");
    tagText.setAttribute("font-weight", "700");
    tagText.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
    tagText.textContent = textStr;
    svg.appendChild(tagText);
  }

  const labelDays = [1, Math.round(daysInMonth / 3), Math.round((daysInMonth * 2) / 3), daysInMonth];
  labelDays.forEach(d => {
    const pt = points.find(p => p.day === d);
    if (pt) {
      const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      lbl.setAttribute("x", pt.x);
      lbl.setAttribute("y", padTop + chartH + 18);
      lbl.setAttribute("text-anchor", "middle");
      lbl.setAttribute("fill", "#94a3b8");
      lbl.setAttribute("font-size", "10");
      lbl.setAttribute("font-weight", "600");
      lbl.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
      lbl.textContent = `${d}-kun`;
      svg.appendChild(lbl);
    }
  });

  chartViewport.appendChild(svg);
}

// ---------------------------------------------------
// 6. EKRANGA CHIQARISH (RENDER)
// ---------------------------------------------------

// 1. Qora kartadagi ma'lumotlar
function renderHeroCard(stats) {
  // Oila qoldig'i (Mavjud sof pul miqdori)
  if (stats.netBalance >= 0) {
    netBalanceAmount.textContent = formatCurrency(stats.netBalance);
    netBalanceAmount.style.color = '#ffffff';
  } else {
    netBalanceAmount.textContent = `- ${formatCurrency(Math.abs(stats.netBalance))}`;
    netBalanceAmount.style.color = '#fca5a5';
  }

  // Kirim va Budjet ko'rsatkichi
  const incomeStatTitle = document.querySelector('.stat-income .stat-title');
  if (stats.monthBudget > 0 && stats.addedIncome > 0) {
    if (incomeStatTitle) incomeStatTitle.textContent = "Budjet + Kirim";
    cardTotalIncome.textContent = `+ ${formatCurrency(stats.totalAvailable)}`;
  } else if (stats.monthBudget > 0) {
    if (incomeStatTitle) incomeStatTitle.textContent = "Oylik Budjet";
    cardTotalIncome.textContent = `+ ${formatCurrency(stats.monthBudget)}`;
  } else {
    if (incomeStatTitle) incomeStatTitle.textContent = "Jami Kirim";
    cardTotalIncome.textContent = `+ ${formatCurrency(stats.addedIncome)}`;
  }

  // Chiqim ko'rsatkichi
  cardTotalExpense.textContent = `- ${formatCurrency(stats.totalExpense)}`;

  // Budjet holati va progress chizig'i
  if (stats.totalAvailable > 0) {
    const percent = Math.round((stats.totalExpense / stats.totalAvailable) * 100);
    cardBudgetBarFill.style.width = `${Math.min(percent, 100)}%`;

    if (percent > 100) {
      const over = stats.totalExpense - stats.totalAvailable;
      budgetStatusText.textContent = `Budjetdan oshdi: ${formatCurrency(over)}`;
      budgetPercentageText.textContent = `${percent}%`;
      cardBudgetBarFill.style.background = '#ef4444';
    } else {
      const remaining = stats.totalAvailable - stats.totalExpense;
      budgetStatusText.textContent = `Sarflandi: ${formatCurrency(stats.totalExpense)} • Qoldiq: ${formatCurrency(remaining)}`;
      budgetPercentageText.textContent = `${percent}%`;
      cardBudgetBarFill.style.background = '#38bdf8';
    }
  } else {
    budgetStatusText.textContent = "Budjet belgilanmagan";
    budgetPercentageText.textContent = "0%";
    cardBudgetBarFill.style.width = "0%";
  }
}

// 2. Tranzaksiyalar ro'yxati (Bosh sahifa)
function renderTransactionsList(monthTx) {
  transactionsListContainer.textContent = '';
  txCountBadge.textContent = `${monthTx.length} ta`;

  if (monthTx.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    const pill = document.createElement('div');
    pill.className = 'empty-pill';
    pill.textContent = "Ushbu oyda amallar yo'q";

    const subtext = document.createElement('p');
    subtext.className = 'empty-subtext';
    subtext.textContent = 'Pastdagi "+" (Qo\'shish) tugmasi orqali kirim yoki chiqim kiriting';

    emptyState.appendChild(pill);
    emptyState.appendChild(subtext);
    transactionsListContainer.appendChild(emptyState);
    return;
  }

  monthTx.forEach(item => {
    const card = document.createElement('div');
    card.className = 'transaction-card';

    const leftEl = document.createElement('div');
    leftEl.className = 'tx-left';

    const badgeIcon = document.createElement('div');
    let cfg;
    if (item.type === 'income') {
      cfg = INCOME_CATEGORIES[item.category] || { code: "cat-kirim-boshqa", label: "BK" };
    } else {
      cfg = EXPENSE_CATEGORIES[item.category] || { code: "cat-boshqa", label: "B" };
    }
    badgeIcon.className = `category-badge-icon ${cfg.code}`;
    badgeIcon.textContent = cfg.label;

    const detailsEl = document.createElement('div');
    detailsEl.className = 'tx-details';

    const titleEl = document.createElement('div');
    titleEl.className = 'tx-title';
    titleEl.textContent = item.name;

    const metaEl = document.createElement('span');
    metaEl.className = 'tx-meta';
    metaEl.textContent = `${item.category} • ${formatDisplayDate(item.date)}`;

    detailsEl.appendChild(titleEl);
    detailsEl.appendChild(metaEl);

    leftEl.appendChild(badgeIcon);
    leftEl.appendChild(detailsEl);

    const rightEl = document.createElement('div');
    rightEl.className = 'tx-right';

    const amountEl = document.createElement('span');
    if (item.type === 'income') {
      amountEl.className = 'tx-amount amount-income';
      amountEl.textContent = `+ ${formatCurrency(item.amount)}`;
    } else {
      amountEl.className = 'tx-amount amount-expense';
      amountEl.textContent = `- ${formatCurrency(item.amount)}`;
    }

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-delete-tx';
    delBtn.textContent = "O'chirish";
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTransaction(item.id);
    });

    rightEl.appendChild(amountEl);
    rightEl.appendChild(delBtn);

    card.appendChild(leftEl);
    card.appendChild(rightEl);

    transactionsListContainer.appendChild(card);
  });
}

// 3. Statistika va Tahlil sahifasi
function renderAnalyticsAndStats(stats) {
  // Insight banner
  if (stats.totalExpense === 0 && stats.totalAvailable === 0) {
    insightTitle.textContent = "Oylik tahlil";
    insightDesc.textContent = "Ushbu oyda hali xarajat yoki daromad kiritilmagan.";
  } else if (stats.totalAvailable > 0 && stats.totalExpense > stats.totalAvailable) {
    const over = stats.totalExpense - stats.totalAvailable;
    insightTitle.textContent = "Diqqat: Budjet chegarasidan oshdi!";
    insightDesc.textContent = `Ushbu oyda xarajatlar mavjud mablag'dan ${formatCurrency(over)} ga oshib ketdi.`;
  } else if (stats.netBalance > 0) {
    insightTitle.textContent = "Ajoyib natija! (Ijobiy o'sish)";
    insightDesc.textContent = `Ushbu oyda sarf-xarajatlardan so'ng oila budjetida ${formatCurrency(stats.netBalance)} sof qoldiq saqlandi.`;
  } else {
    insightTitle.textContent = "Xarajatlar monitoringi";
    insightDesc.textContent = `Ushbu oyda sarf-xarajatlar ${formatCurrency(stats.totalExpense)} ni tashkil qildi.`;
  }

  // Grafikni chizish
  renderChart();

  // 4 ta KPI ko'rsatkichlari
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const dailyAvg = stats.totalExpense > 0 ? Math.round(stats.totalExpense / daysInMonth) : 0;
  kpiDailyAvg.textContent = formatCurrency(dailyAvg);

  const expenseTx = stats.monthTx.filter(t => t.type === 'expense');
  if (expenseTx.length > 0) {
    const highest = expenseTx.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), expenseTx[0]);
    kpiHighestExpense.textContent = formatCurrency(highest.amount);
    kpiHighestExpenseName.textContent = highest.name;
  } else {
    kpiHighestExpense.textContent = "0 so'm";
    kpiHighestExpenseName.textContent = "—";
  }

  // Jamg'arma ulushi (Tejamkorlik)
  if (stats.totalAvailable > 0) {
    const savings = stats.totalAvailable - stats.totalExpense;
    const rate = Math.round((savings / stats.totalAvailable) * 100);
    kpiSavingsRate.textContent = rate > 0 ? `${rate}%` : '0%';
  } else {
    kpiSavingsRate.textContent = '0%';
  }

  // Asosiy kategoriya
  if (stats.activeExpenseCategories.length > 0) {
    const topCat = stats.activeExpenseCategories[0];
    kpiTopCategory.textContent = topCat.category;
    kpiTopCategoryPercent.textContent = `${topCat.percentage}% ulush`;
  } else {
    kpiTopCategory.textContent = "—";
    kpiTopCategoryPercent.textContent = "xarajat yo'q";
  }

  // Budjet bloki
  if (stats.totalAvailable > 0) {
    analyticsBudgetAmount.textContent = formatCurrency(stats.totalAvailable);
    const percent = Math.round((stats.totalExpense / stats.totalAvailable) * 100);
    analyticsBudgetBarFill.style.width = `${Math.min(percent, 100)}%`;

    if (percent > 100) {
      analyticsBudgetSub.textContent = `Sarflandi: ${formatCurrency(stats.totalExpense)} (${percent}% - limitdan oshdi!)`;
      analyticsBudgetBarFill.style.backgroundColor = '#ef4444';
    } else {
      const remaining = stats.totalAvailable - stats.totalExpense;
      analyticsBudgetSub.textContent = `Sarflandi: ${formatCurrency(stats.totalExpense)} (${percent}%). Qoldi: ${formatCurrency(remaining)}`;
      analyticsBudgetBarFill.style.backgroundColor = '#10b981';
    }
  } else {
    analyticsBudgetAmount.textContent = "Belgilanmagan";
    analyticsBudgetSub.textContent = "Budjet belgilash uchun 'O'zgartirish' tugmasini bosing";
    analyticsBudgetBarFill.style.width = "0%";
  }

  // Kategoriyalar
  renderCategoryBreakdownList(expenseCategoryBreakdown, stats.activeExpenseCategories, "Ushbu oyda chiqim yo'q");
  renderCategoryBreakdownList(incomeCategoryBreakdown, stats.activeIncomeCategories, "Ushbu oyda kirim yo'q");
}

function renderCategoryBreakdownList(container, list, emptyText) {
  container.textContent = '';

  if (list.length === 0) {
    const p = document.createElement('p');
    p.style.fontSize = '0.86rem';
    p.style.color = '#94a3b8';
    p.style.padding = '8px 4px';
    p.textContent = emptyText;
    container.appendChild(p);
    return;
  }

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'cat-analytics-card';

    const topRow = document.createElement('div');
    topRow.className = 'cat-analytics-top';

    const left = document.createElement('div');
    left.className = 'cat-analytics-left';

    const icon = document.createElement('div');
    icon.className = `category-badge-icon ${item.config.code}`;
    icon.style.width = '32px';
    icon.style.height = '32px';
    icon.style.borderRadius = '10px';
    icon.style.fontSize = '0.78rem';
    icon.textContent = item.config.label;

    const name = document.createElement('span');
    name.className = 'cat-analytics-name';
    name.textContent = item.category;

    left.appendChild(icon);
    left.appendChild(name);

    const right = document.createElement('div');
    right.style.textAlign = 'right';

    const sum = document.createElement('div');
    sum.className = 'cat-analytics-sum';
    sum.textContent = formatCurrency(item.amount);

    const percent = document.createElement('span');
    percent.className = 'cat-analytics-percent';
    percent.textContent = `${item.percentage}% ulush`;

    right.appendChild(sum);
    right.appendChild(percent);

    topRow.appendChild(left);
    topRow.appendChild(right);

    const track = document.createElement('div');
    track.className = 'cat-progress-track';

    const fill = document.createElement('div');
    fill.className = 'cat-progress-fill';
    fill.style.width = `${Math.min(item.percentage, 100)}%`;
    fill.style.backgroundColor = item.config.color;

    track.appendChild(fill);

    card.appendChild(topRow);
    card.appendChild(track);

    container.appendChild(card);
  });
}

function render() {
  const stats = calculateMonthStats();
  renderHeroCard(stats);
  renderTransactionsList(stats.monthTx);
  renderAnalyticsAndStats(stats);
}

// ---------------------------------------------------
// 7. FORMA: JONLI VERGUL, CHIPLAR VA SWITCHER
// ---------------------------------------------------

function attachLiveCommaFormatter(inputEl) {
  inputEl.addEventListener('input', () => {
    const rawDigits = inputEl.value.replace(/\D/g, '');
    if (!rawDigits) {
      inputEl.value = '';
      return;
    }
    inputEl.value = rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  });
}

attachLiveCommaFormatter(txAmountInput);
attachLiveCommaFormatter(monthlyBudgetInput);

function setupCategoryChips(type) {
  categoryChipsContainer.textContent = '';
  const categoriesObj = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const catNames = Object.keys(categoriesObj);

  catNames.forEach((catName, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip-btn ${idx === 0 ? 'active' : ''}`;
    btn.textContent = catName;

    btn.addEventListener('click', () => {
      categoryChipsContainer.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCategoryValue.value = catName;
    });

    categoryChipsContainer.appendChild(btn);
  });

  selectedCategoryValue.value = catNames[0];
}

function setFormType(type) {
  currentFormType = type;

  if (type === 'income') {
    btnTypeIncome.classList.add('active');
    btnTypeExpense.classList.remove('active');
    txNameLabel.textContent = "Kirim manbasi nima?";
    txNameInput.placeholder = "Masalan: Oylik maosh, Pensiya, Savdo...";
    saveTxBtn.textContent = "Kirimni saqlash";
  } else {
    btnTypeExpense.classList.add('active');
    btnTypeIncome.classList.remove('active');
    txNameLabel.textContent = "Xarajat nima uchun qilindi?";
    txNameInput.placeholder = "Masalan: Bozorlik, Dori-darmon, Go'sht...";
    saveTxBtn.textContent = "Xarajatni saqlash";
  }

  setupCategoryChips(type);
}

btnTypeExpense.addEventListener('click', () => setFormType('expense'));
btnTypeIncome.addEventListener('click', () => setFormType('income'));

// ---------------------------------------------------
// 8. TRANZAKSIYA QO'SHISH VA O'CHIRISH
// ---------------------------------------------------

function showFormError(msg) {
  formErrorAlert.textContent = msg;
  formErrorAlert.style.display = 'block';
}

function hideFormError() {
  formErrorAlert.textContent = '';
  formErrorAlert.style.display = 'none';
}

transactionForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const rawAmountStr = txAmountInput.value.replace(/,/g, '').trim();
  const amount = parseFloat(rawAmountStr);
  const name = txNameInput.value.trim();
  const category = selectedCategoryValue.value;
  const dateVal = txDateInput.value || getTodayDateString();

  if (isNaN(amount) || amount <= 0) {
    showFormError("Iltimos, 0 dan katta bo'lgan to'g'ri summani kiriting.");
    txAmountInput.focus();
    return;
  }

  if (!name) {
    showFormError("Iltimos, nom yoki izohni yozing.");
    txNameInput.focus();
    return;
  }

  hideFormError();

  const newTx = {
    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
    type: currentFormType,
    name,
    amount,
    category,
    date: dateVal,
    timestamp: Date.now()
  };

  transactions.unshift(newTx);
  saveData();

  // Kiritilgan sana boshqa oy bo'lsa, o'sha oyga o'tish
  const txParts = dateVal.split('-');
  if (txParts.length >= 2) {
    selectedYear = parseInt(txParts[0], 10);
    selectedMonth = parseInt(txParts[1], 10) - 1;
    updateMonthDisplay();
  }

  render();

  txAmountInput.value = '';
  txNameInput.value = '';
  syncFormDateWithSelectedMonth();
  setupCategoryChips(currentFormType);

  switchTab('tab-home');
});

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  render();
}

// ---------------------------------------------------
// 9. BUDJETNI SOZLASH MODALI
// ---------------------------------------------------

function openBudgetModal() {
  const curBudget = getCurrentMonthBudget();
  monthlyBudgetInput.value = curBudget > 0 ? formatNumberWithCommas(curBudget) : '';
  budgetModal.style.display = 'flex';
  monthlyBudgetInput.focus();
}

function closeBudgetModal() {
  budgetModal.style.display = 'none';
}

openBudgetModalBtn.addEventListener('click', openBudgetModal);
analyticsChangeBudgetBtn.addEventListener('click', openBudgetModal);
closeBudgetModalBtn.addEventListener('click', closeBudgetModal);
cancelBudgetBtn.addEventListener('click', closeBudgetModal);

budgetModal.addEventListener('click', (e) => {
  if (e.target === budgetModal) {
    closeBudgetModal();
  }
});

budgetForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const rawBudgetStr = monthlyBudgetInput.value.replace(/,/g, '').trim();
  const val = parseFloat(rawBudgetStr);
  const validBudget = !isNaN(val) && val >= 0 ? val : 0;

  setCurrentMonthBudget(validBudget);
  render();
  closeBudgetModal();
});

// ---------------------------------------------------
// 10. TABLAR O'RTASIDA O'TISH
// ---------------------------------------------------

function switchTab(targetTabId) {
  tabPanes.forEach(pane => pane.classList.remove('active'));
  const targetPane = document.getElementById(targetTabId);
  if (targetPane) targetPane.classList.add('active');

  navItems.forEach(btn => {
    if (btn.getAttribute('data-tab') === targetTabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (targetTabId === 'tab-analytics') {
    renderChart();
  } else if (targetTabId === 'tab-add') {
    syncFormDateWithSelectedMonth();
  }
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabId = item.getAttribute('data-tab');
    if (tabId) switchTab(tabId);
  });
});

// ---------------------------------------------------
// 11. BOSHLANG'ICH YUKLANISH
// ---------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateMonthDisplay();
  syncFormDateWithSelectedMonth();
  setupCategoryChips('expense');
  render();
});
