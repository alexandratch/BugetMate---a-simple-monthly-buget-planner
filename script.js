const CATEGORIES = ["Food","Shopping","Transport","Entertainment","Gym","Education","Other"];
const CATEGORY_COLORS = ["#d987a7","#d9a2ba","#b9a4d8","#e3b0a5","#a9c6b8","#9ebbd0","#c9b0b9"];

const defaultBudgets = {
    Food: 800,
    Shopping: 500,
    Transport: 300,
    Entertainment: 300,
    Gym: 200,
    Education: 300,
    Other: 200
};

let expenses = JSON.parse(localStorage.getItem("blushExpenses") || "[]");
let incomes = JSON.parse(localStorage.getItem("blushIncome") || "[]");
let budgets = JSON.parse(localStorage.getItem("blushBudgets") || JSON.stringify(defaultBudgets));
let savingsGoal = Number(localStorage.getItem("blushSavingsGoal") || 1000);
let analyticsDate = new Date();

const $ = (id) => document.getElementById(id);

function money(value) {
    return `${Number(value).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})} RON`;
}

function monthKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

function currentMonthKey() {
    return monthKey(new Date());
}

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-GB", {day:"2-digit", month:"short", year:"numeric"});
}

function monthLabel(date) {
    return new Date(date).toLocaleDateString("en-US", {month:"long", year:"numeric"});
}

function save() {
    localStorage.setItem("blushExpenses", JSON.stringify(expenses));
    localStorage.setItem("blushIncome", JSON.stringify(incomes));
    localStorage.setItem("blushBudgets", JSON.stringify(budgets));
    localStorage.setItem("blushSavingsGoal", savingsGoal);
}

function monthExpenses(key = currentMonthKey()) {
    return expenses.filter(e => monthKey(e.date) === key);
}

function monthIncome(key = currentMonthKey()) {
    return incomes.filter(i => monthKey(i.date) === key);
}

function total(arr) {
    return arr.reduce((sum, item) => sum + Number(item.amount), 0);
}

function showToast(message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");
    setTimeout(() => $("toast").classList.remove("show"), 2200);
}

function switchPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    $(id).classList.add("active");
    const nav = document.querySelector(`.nav-item[data-section="${id}"]`);
    if (nav) nav.classList.add("active");
    document.querySelector(".sidebar").classList.remove("mobile-open");
    renderAll();
}

document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => switchPage(btn.dataset.section));
});

document.querySelectorAll("[data-section-link]").forEach(btn => {
    btn.addEventListener("click", () => switchPage(btn.dataset.sectionLink));
});

$("mobileMenuBtn").addEventListener("click", () => $("sidebar").classList.toggle("mobile-open"));

function modal(title, subtitle, body) {
    $("modalContent").innerHTML = `
        <h3>${title}</h3>
        <p class="modal-sub">${subtitle}</p>
        ${body}
    `;
    $("modalOverlay").classList.add("show");
}

function closeModal() {
    $("modalOverlay").classList.remove("show");
}

$("modalClose").addEventListener("click", closeModal);
$("modalOverlay").addEventListener("click", e => {
    if (e.target === $("modalOverlay")) closeModal();
});

function openExpenseModal() {
    modal("Add an expense", "Tell me what you spent and I’ll update everything automatically.", `
        <form id="expenseModalForm">
            <div class="form-group"><label>Amount</label><input class="form-input" id="mExpenseAmount" type="number" min="0" step=".01" required placeholder="50"></div>
            <div class="form-group"><label>Category</label><select class="form-input" id="mExpenseCategory">${CATEGORIES.map(c => `<option>${c}</option>`).join("")}</select></div>
            <div class="form-group"><label>Description</label><input class="form-input" id="mExpenseDescription" required placeholder="Coffee, clothes, groceries..."></div>
            <div class="form-group"><label>Date</label><input class="form-input" id="mExpenseDate" type="date" value="${new Date().toISOString().slice(0,10)}" required></div>
            <div class="modal-actions"><button type="button" class="secondary-btn" id="cancelModal">Cancel</button><button class="primary-btn">Add expense</button></div>
        </form>
    `);
    $("cancelModal").onclick = closeModal;
    $("expenseModalForm").onsubmit = e => {
        e.preventDefault();
        expenses.push({
            id: Date.now(),
            amount: Number($("mExpenseAmount").value),
            category: $("mExpenseCategory").value,
            description: $("mExpenseDescription").value.trim(),
            date: $("mExpenseDate").value
        });
        save(); closeModal(); renderAll(); showToast("Expense added.");
    };
}

function openIncomeModal() {
    modal("Add income", "Record a salary, tutoring payment, gift, or any other income.", `
        <form id="incomeModalForm">
            <div class="form-group">
            <label>Amount</label>
            <input class="form-input" id="mIncomeAmount" type="number" min="0" step=".01" required placeholder="500"></div>
            <div class="form-group">
            <label>Source</label>
            <input class="form-input" id="mIncomeSource" required placeholder="Tutoring"></div>
            <div class="form-group">
            <label>Date</label>
            <input class="form-input" id="mIncomeDate" type="date" value="${new Date().toISOString().slice(0,10)}" required></div>
            <div class="modal-actions">
            <button type="button" class="secondary-btn" id="cancelModal">Cancel</button>
            <button class="primary-btn">Add income</button>
            </div>
        </form>
    `);
    $("cancelModal").onclick = closeModal;
    $("incomeModalForm").onsubmit = e => {
        e.preventDefault();
        incomes.push({
            id: Date.now(),
            amount: Number($("mIncomeAmount").value),
            source: $("mIncomeSource").value.trim(),
            date: $("mIncomeDate").value
        });
        save(); closeModal(); renderAll(); showToast("Income added.");
    };
}

$("quickExpenseBtn").onclick = openExpenseModal;
$("expensesAddBtn").onclick = openExpenseModal;
$("quickIncomeBtn").onclick = openIncomeModal;
$("incomeAddBtn").onclick = openIncomeModal;

function renderDashboard() {
    const key = currentMonthKey();
    const ex = monthExpenses(key);
    const inc = monthIncome(key);
    const spent = total(ex), earned = total(inc), balance = earned - spent;

    $("currentMonthLabel").textContent = monthLabel(new Date());
    $("dashIncome").textContent = money(earned);
    $("dashExpenses").textContent = money(spent);
    $("dashBalance").textContent = money(balance);

    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
    const daysLeft = Math.max(1, lastDay - today.getDate() + 1);
    const daily = Math.max(0, balance) / daysLeft;
    $("dailySpend").textContent = money(daily);
    $("daysLeftText").textContent = `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in this month`;

    renderDashboardCategories(ex);
    renderRecent(ex, inc);
    renderBudgetSummary(ex);
    renderSavings(earned, spent);
}

function renderDashboardCategories(ex) {
    const container = $("dashboardCategories");
    if (!ex.length) {
        container.innerHTML = `<div class="empty-state">No expenses yet this month.</div>`;
        return;
    }
    const values = {};
    ex.forEach(e => values[e.category] = (values[e.category] || 0) + Number(e.amount));
    const sorted = Object.entries(values).sort((a,b) => b[1]-a[1]).slice(0,6);
    const max = sorted[0]?.[1] || 1;
    container.innerHTML = sorted.map(([cat,val]) => `
        <div class="category">
            <div class="category-top"><span>${cat}</span><span>${money(val)}</span></div>
            <div class="category-track"><div class="category-bar" style="width:${Math.max(4,val/max*100)}%"></div></div>
        </div>
    `).join("");
}

function renderRecent(ex, inc) {
    const all = [
        ...ex.map(e => ({...e, type:"expense", label:e.description})),
        ...inc.map(i => ({...i, type:"income", label:i.source}))
    ].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,6);

    $("recentTransactions").innerHTML = all.length ? all.map(t => `
        <div class="transaction">
            <div class="transaction-main">
                <div class="transaction-title">${escapeHTML(t.label)}</div>
                <div class="transaction-sub">${t.type === "expense" ? t.category : "Income"} · ${formatDate(t.date)}</div>
            </div>
            <span class="amount ${t.type}">${t.type === "expense" ? "-" : "+"}${money(t.amount)}</span>
        </div>
    `).join("") : `<div class="empty-state">No transactions yet.</div>`;
}

function renderBudgetSummary(ex) {
    $("dashboardBudget").innerHTML = CATEGORIES.slice(0,4).map(cat => {
        const spent = total(ex.filter(e => e.category === cat));
        const budget = Number(budgets[cat] || 0);
        const pct = budget ? Math.min(100, spent / budget * 100) : 0;
        return `<div class="budget-mini">
            <div class="budget-mini-head"><span>${cat}</span><span>${Math.round(pct)}%</span></div>
            <div class="category-track"><div class="category-bar" style="width:${pct}%"></div></div>
            <small>${money(spent)} of ${money(budget)}</small>
        </div>`;
    }).join("");
}

function renderSavings(earned, spent) {
    const saved = Math.max(0, earned - spent);
    const pct = savingsGoal ? Math.min(100, saved/savingsGoal*100) : 0;
    const deg = pct * 3.6;
    $("savingsPercent").textContent = `${Math.round(pct)}%`;
    $("savingsAmount").textContent = money(saved);
    $("savingsGoalDisplay").textContent = money(savingsGoal);
    $("miniSavingsPercent").textContent = `${Math.round(pct)}%`;
    $("miniSavingsText").textContent = `${money(saved)} saved`;
    $("miniSavingsBar").style.width = `${pct}%`;
    $("savingsPercent").parentElement.parentElement.style.background =
        `conic-gradient(var(--pink) 0deg ${deg}deg, #f5e8ed ${deg}deg 360deg)`;
}

function populateFilters() {
    $("expenseCategoryFilter").innerHTML = `<option value="all">All categories</option>` + CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join("");
}

function renderExpenses() {
    const search = $("expenseSearch").value.toLowerCase();
    const cat = $("expenseCategoryFilter").value;
    const monthFilter = $("expenseMonthFilter").value;
    let list = [...expenses];

    if (monthFilter === "current") list = list.filter(e => monthKey(e.date) === currentMonthKey());
    if (cat !== "all") list = list.filter(e => e.category === cat);
    if (search) list = list.filter(e => `${e.description} ${e.category}`.toLowerCase().includes(search));

    list.sort((a,b) => new Date(b.date)-new Date(a.date));
    $("expensesTable").innerHTML = list.length ? list.map(e => `
        <div class="table-row">
            <span>${escapeHTML(e.description)}</span>
            <span>${e.category}</span>
            <span class="date">${formatDate(e.date)}</span>
            <strong>-${money(e.amount)}</strong>
            <button class="delete-row" onclick="deleteExpense(${e.id})">×</button>
        </div>
    `).join("") : `<div class="empty-state">No expenses match your filters.</div>`;
}

function renderIncome() {
    const list = [...incomes].sort((a,b) => new Date(b.date)-new Date(a.date));
    $("incomeTable").innerHTML = list.length ? list.map(i => `
        <div class="table-row income-row">
            <span>${escapeHTML(i.source)}</span>
            <span class="date">${formatDate(i.date)}</span>
            <strong class="amount income">+${money(i.amount)}</strong>
            <button class="delete-row" onclick="deleteIncome(${i.id})">×</button>
        </div>
    `).join("") : `<div class="empty-state">No income recorded yet.</div>`;
}

function renderBudgets() {
    const ex = monthExpenses();
    $("budgetCards").innerHTML = CATEGORIES.map(cat => {
        const spent = total(ex.filter(e => e.category === cat));
        const budget = Number(budgets[cat] || 0);
        const pct = budget ? Math.min(100, spent/budget*100) : 0;
        const remaining = budget - spent;
        return `<article class="panel budget-card ${remaining < 0 ? "over":""}">
            <div class="budget-card-head"><h3>${cat}</h3><span>${Math.round(pct)}% used</span></div>
            <div class="category-track"><div class="category-bar" style="width:${pct}%"></div></div>
            <div class="budget-amounts"><span class="budget-spent">${money(spent)}</span><span class="budget-limit">of ${money(budget)}</span></div>
            <p class="${remaining < 0 ? "over-text" : "muted"}">${remaining >= 0 ? `${money(remaining)} remaining` : `${money(Math.abs(remaining))} over budget`}</p>
            <button class="edit-budget" onclick="editBudget('${cat}')">Edit budget</button>
        </article>`;
    }).join("");
}

function editBudget(category) {
    modal(`Edit ${category}`, "Set the amount you want to spend in this category this month.", `
        <form id="budgetForm">
            <div class="form-group"><label>Monthly budget</label><input class="form-input" id="budgetValue" type="number" min="0" step="10" value="${budgets[category] || 0}" required></div>
            <div class="modal-actions"><button type="button" class="secondary-btn" id="cancelModal">Cancel</button><button class="primary-btn">Save budget</button></div>
        </form>
    `);
    $("cancelModal").onclick = closeModal;
    $("budgetForm").onsubmit = e => {
        e.preventDefault();
        budgets[category] = Number($("budgetValue").value);
        save(); closeModal(); renderAll(); showToast(`${category} budget updated.`);
    };
}

function renderAnalytics() {
    const key = monthKey(analyticsDate);
    const ex = monthExpenses(key), inc = monthIncome(key);
    $("analyticsMonth").textContent = monthLabel(analyticsDate);
    renderDonut(ex);
    renderBars(inc, ex);
    renderInsight(inc, ex);
}

function renderDonut(ex) {
    const values = {};
    ex.forEach(e => values[e.category] = (values[e.category] || 0) + Number(e.amount));
    const entries = Object.entries(values).sort((a,b)=>b[1]-a[1]);
    const sum = total(ex);
    $("donutTotal").textContent = Math.round(sum).toLocaleString();
    if (!sum) {
        $("donutChart").style.background = "conic-gradient(#f0d5df 0 100%)";
        $("donutLegend").innerHTML = `<span class="muted">Add expenses to see the distribution.</span>`;
        return;
    }
    let start = 0;
    const stops = entries.map(([cat,val],i) => {
        const end = start + val/sum*100;
        const s = `${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} ${start}% ${end}%`;
        start = end;
        return s;
    });
    $("donutChart").style.background = `conic-gradient(${stops.join(",")})`;
    $("donutLegend").innerHTML = entries.map(([cat,val],i) => `
        <div class="legend-item"><span class="legend-dot" style="background:${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}"></span><span>${cat}</span><span class="legend-value">${Math.round(val/sum*100)}%</span></div>
    `).join("");
}

function renderBars(inc, ex) {
    const income = total(inc), expense = total(ex), max = Math.max(income, expense, 1);
    $("barChart").innerHTML = `
        <div class="bar-group">
            <div class="bars"><div class="bar income-bar" style="height:${income/max*180}px"></div><div class="bar expense-bar" style="height:${expense/max*180}px"></div></div>
            <div class="bar-value">${Math.round(income).toLocaleString()} / ${Math.round(expense).toLocaleString()}</div>
            <div class="bar-label">Income / Spent</div>
        </div>
    `;
}

function renderInsight(inc, ex) {
    const earned = total(inc), spent = total(ex), values = {};
    ex.forEach(e => values[e.category] = (values[e.category] || 0) + Number(e.amount));
    const top = Object.entries(values).sort((a,b)=>b[1]-a[1])[0];
    if (!earned && !spent) {
        $("insightTitle").textContent = "Your month at a glance";
        $("insightText").textContent = "Add a few transactions and your spending insight will appear here.";
    } else if (!spent) {
        $("insightTitle").textContent = "No spending recorded yet";
        $("insightText").textContent = `You have recorded ${money(earned)} of income this month.`;
    } else {
        const ratio = earned ? Math.round(spent/earned*100) : 100;
        $("insightTitle").textContent = top ? `${top[0]} is your biggest category` : "Your spending is taking shape";
        $("insightText").textContent = `You spent ${money(spent)} this month, which is ${ratio}% of your recorded income${top ? `. ${top[0]} accounts for ${Math.round(top[1]/spent*100)}% of your spending.` : "."}`;
    }
}

function renderSettings() {
    $("savingsGoalInput").value = savingsGoal;
    $("settingsCategories").innerHTML = CATEGORIES.map(c => `<span class="settings-chip">${c}</span>`).join("");
}

function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    save(); renderAll(); showToast("Expense removed.");
}

function deleteIncome(id) {
    incomes = incomes.filter(i => i.id !== id);
    save(); renderAll(); showToast("Income removed.");
}

function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

$("expenseSearch").addEventListener("input", renderExpenses);
$("expenseCategoryFilter").addEventListener("change", renderExpenses);
$("expenseMonthFilter").addEventListener("change", renderExpenses);

$("prevMonth").onclick = () => { analyticsDate.setMonth(analyticsDate.getMonth()-1); renderAnalytics(); };
$("nextMonth").onclick = () => { analyticsDate.setMonth(analyticsDate.getMonth()+1); renderAnalytics(); };

$("saveSettingsBtn").onclick = () => {
    savingsGoal = Math.max(0, Number($("savingsGoalInput").value));
    save(); renderAll(); showToast("Settings saved.");
};

$("resetDataBtn").onclick = () => {
    if (!confirm("Delete all expenses, income and budgets?")) return;
    expenses = []; incomes = []; budgets = {...defaultBudgets}; savingsGoal = 1000;
    save(); renderAll(); showToast("All data reset.");
};

function renderAll() {
    populateFilters();
    renderDashboard();
    renderExpenses();
    renderIncome();
    renderBudgets();
    renderAnalytics();
    renderSettings();
}

renderAll();
