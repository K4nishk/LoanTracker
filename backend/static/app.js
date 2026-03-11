// LoanTracker Frontend JavaScript
const API_BASE = '/api/v1';
let allLoans = []; // Cache for commission calculator

// Generate Serial Number in YYYY/xxx format
function generateSNo(index, givingDate) {
    const year = new Date(givingDate).getFullYear();
    const counter = String(index + 1).padStart(3, '0');
    return `${year}/${counter}`;
}

// Initialize application
window.addEventListener('DOMContentLoaded', () => {
    // Set today's date as default for giving_date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('giving_date').value = today;

    // Load initial data
    loadLoans();
    loadStatistics();
    loadConfig();
    loadBorrowerOptions(); // For commission calculator
});

// Tab Management - FIXED: Proper tab switching
function showTab(tabName) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    // Remove active from all tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    // Show selected tab content
    const selectedContent = document.getElementById(tabName);
    if (selectedContent) {
        selectedContent.classList.add('active');
        selectedContent.style.display = 'block';
        
        // Scroll to top of content
        selectedContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Mark tab as active
    event.target.classList.add('active');

    // Reload data when switching tabs
    if (tabName === 'view-loans') loadLoans();
    if (tabName === 'reports') loadStatistics();
    if (tabName === 'config') loadConfig();
    if (tabName === 'commission') loadBorrowerOptions();
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API request failed');
        }

        return await response.json();
    } catch (error) {
        showError(error.message);
        throw error;
    }
}

// Create Loan - FIXED: Handle optional due_date, currency hardcoded to INR
async function createLoan(event) {
    event.preventDefault();

    const dueDateValue = document.getElementById('due_date').value;

    const formData = {
        borrower_name: document.getElementById('borrower_name').value,
        amount: parseFloat(document.getElementById('amount').value),
        currency: 'INR', // Always INR per business requirements
        depositor_name: document.getElementById('depositor_name').value,
        giving_date: document.getElementById('giving_date').value,
        due_date: dueDateValue || '1970-01-01', // Default to 1970-01-01 if empty
        borrower_group: document.getElementById('borrower_group').value || null,
        depositor_group: document.getElementById('depositor_group').value || null
    };

    try {
        await apiCall('/loans/', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        showSuccess('Loan created successfully!');
        document.getElementById('loan-form').reset();

        // Reset giving_date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('giving_date').value = today;

        // Reload data
        loadLoans();
        loadBorrowerOptions();
    } catch (error) {
        console.error('Failed to create loan:', error);
    }
}

// Load Loans
async function loadLoans() {
    try {
        const loans = await apiCall('/loans/');
        allLoans = loans; // Cache for commission calculator
        displayLoans(loans);
    } catch (error) {
        console.error('Failed to load loans:', error);
    }
}

// Display Loans Table
function displayLoans(loans) {
    const container = document.getElementById('loans-table-container');

    if (loans.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No loans found</h3><p>Create your first loan using the Data Entry tab</p></div>';
        return;
    }

    let html = '<div class="table-container"><table><thead><tr>';
    html += '<th>SNo</th><th>Borrower</th><th>Amount</th><th>Currency</th><th>Depositor</th>';
    html += '<th>Giving Date</th><th>Due Date</th><th>Status</th><th>Actions</th>';
    html += '</tr></thead><tbody>';

    loans.forEach((loan, index) => {
        const sno = generateSNo(index, loan.giving_date);
        const currencySymbol = '₹'; // Always INR
        html += '<tr>';
        html += `<td>${sno}</td>`;
        html += `<td>${loan.borrower_name}</td>`;
        html += `<td>${currencySymbol}${parseFloat(loan.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>`;
        html += `<td><span class="currency-badge">${loan.currency || 'INR'}</span></td>`;
        html += `<td>${loan.depositor_name}</td>`;
        html += `<td>${formatDate(loan.giving_date)}</td>`;
        html += `<td>${formatDueDate(loan.due_date)}</td>`;
        html += `<td><span class="status-badge status-${loan.status}">${loan.status.toUpperCase()}</span></td>`;
        html += '<td>';
        html += `<select onchange="updateLoanStatus('${loan.id}', this.value)" class="icon-button">`;
        html += `<option value="${loan.status}" selected>${loan.status}</option>`;
        html += `<option value="active">Active</option>`;
        html += `<option value="paid_off">Paid Off</option>`;
        html += `<option value="overdue">Overdue</option>`;
        html += '</select>';
        html += ` <button class="icon-button button-danger" onclick="deleteLoan('${loan.id}')">Delete</button>`;
        html += '</td>';
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Update Loan Status
async function updateLoanStatus(loanId, newStatus) {
    try {
        await apiCall(`/loans/${loanId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        });
        showSuccess('Loan status updated!');
        loadLoans();
    } catch (error) {
        console.error('Failed to update loan:', error);
    }
}

// Update Loan Due Dates (batch update)
async function updateLoanDueDates(loansToUpdate) {
    let successCount = 0;
    let errorCount = 0;

    for (const loan of loansToUpdate) {
        try {
            await apiCall(`/loans/${loan.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ due_date: loan.due_date })
            });
            successCount++;
        } catch (error) {
            console.error(`Failed to update loan ${loan.id}:`, error);
            errorCount++;
        }
    }

    if (successCount > 0) {
        showSuccess(`Updated ${successCount} loan(s) with calculated due dates`);
    }
    if (errorCount > 0) {
        showError(`Failed to update ${errorCount} loan(s)`);
    }

    // Reload loans to reflect changes
    loadLoans();
    loadBorrowerOptions();
}

// Delete Loan
async function deleteLoan(loanId) {
    if (!confirm('Are you sure you want to delete this loan?')) return;

    try {
        await apiCall(`/loans/${loanId}`, { method: 'DELETE' });
        showSuccess('Loan deleted successfully!');
        loadLoans();
        loadBorrowerOptions(); // Refresh commission dropdown
    } catch (error) {
        console.error('Failed to delete loan:', error);
    }
}

// Load Statistics
async function loadStatistics() {
    try {
        const stats = await apiCall('/reports/statistics');
        displayStatistics(stats);
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

// Display Statistics - FIXED: Add CSV Export
function displayStatistics(stats) {
    const container = document.getElementById('stats-container');

    let html = '<div class="action-buttons" style="margin-bottom: 20px;">';
    html += '<button class="button button-primary" onclick="exportReportCSV()">📥 Export Report as CSV</button>';
    html += '</div>';

    html += '<div class="stats-grid">';
    html += `<div class="stat-card"><div class="stat-label">Total Loans</div><div class="stat-value">${stats.total_loans}</div></div>`;
    html += `<div class="stat-card"><div class="stat-label">Total Amount</div><div class="stat-value">$${stats.total_amount.toFixed(2)}</div></div>`;
    html += `<div class="stat-card"><div class="stat-label">Active Loans</div><div class="stat-value">${stats.active_loans}</div></div>`;
    html += `<div class="stat-card"><div class="stat-label">Paid Off</div><div class="stat-value">${stats.paid_off_loans}</div></div>`;
    html += `<div class="stat-card"><div class="stat-label">Overdue</div><div class="stat-value">${stats.overdue_loans}</div></div>`;
    html += '</div>';

    // By Borrower
    html += '<div class="card" style="margin-top: 20px;"><h3>Summary by Borrower</h3>';
    html += '<div class="table-container"><table><thead><tr><th>Borrower</th><th>Loans</th><th>Total Amount</th></tr></thead><tbody>';
    for (const [borrower, data] of Object.entries(stats.by_borrower)) {
        html += `<tr><td>${borrower}</td><td>${data.count}</td><td>$${data.sum.toFixed(2)}</td></tr>`;
    }
    html += '</tbody></table></div></div>';

    // By Depositor
    html += '<div class="card" style="margin-top: 20px;"><h3>Summary by Depositor</h3>';
    html += '<div class="table-container"><table><thead><tr><th>Depositor</th><th>Loans</th><th>Total Amount</th></tr></thead><tbody>';
    for (const [depositor, data] of Object.entries(stats.by_depositor)) {
        html += `<tr><td>${depositor}</td><td>${data.count}</td><td>$${data.sum.toFixed(2)}</td></tr>`;
    }
    html += '</tbody></table></div></div>';

    container.innerHTML = html;
}

// Export Report as CSV
async function exportReportCSV() {
    try {
        const stats = await apiCall('/reports/statistics');
        const loans = allLoans.length > 0 ? allLoans : await apiCall('/loans/');

        let csv = 'LoanTracker Report\n\n';
        csv += 'Summary Statistics\n';
        csv += `Total Loans,${stats.total_loans}\n`;
        csv += `Total Amount,$${stats.total_amount.toFixed(2)}\n`;
        csv += `Active Loans,${stats.active_loans}\n`;
        csv += `Paid Off Loans,${stats.paid_off_loans}\n`;
        csv += `Overdue Loans,${stats.overdue_loans}\n\n`;

        csv += 'Summary by Borrower\n';
        csv += 'Borrower,Loans,Total Amount\n';
        for (const [borrower, data] of Object.entries(stats.by_borrower)) {
            csv += `"${borrower}",${data.count},$${data.sum.toFixed(2)}\n`;
        }

        csv += '\nSummary by Depositor\n';
        csv += 'Depositor,Loans,Total Amount\n';
        for (const [depositor, data] of Object.entries(stats.by_depositor)) {
            csv += `"${depositor}",${data.count},$${data.sum.toFixed(2)}\n`;
        }

        csv += '\nAll Loans Detail\n';
        csv += 'ID,Borrower,Amount,Depositor,Giving Date,Due Date,Status,Borrower Group,Depositor Group\n';
        loans.forEach(loan => {
            csv += `"${loan.id}","${loan.borrower_name}",$${loan.amount},"${loan.depositor_name}",${loan.giving_date},${loan.due_date},${loan.status},"${loan.borrower_group || ''}","${loan.depositor_group || ''}"\n`;
        });

        downloadCSV(csv, `loantracker_report_${new Date().toISOString().split('T')[0]}.csv`);
        showSuccess('Report exported successfully!');
    } catch (error) {
        console.error('Failed to export report:', error);
    }
}

// Load Borrower Options - FIXED: Populate dropdown with actual data
async function loadBorrowerOptions() {
    try {
        const loans = allLoans.length > 0 ? allLoans : await apiCall('/loans/');
        
        // Get unique borrower names and groups
        const borrowerNames = [...new Set(loans.map(l => l.borrower_name))].sort();
        const borrowerGroups = [...new Set(loans.map(l => l.borrower_group).filter(g => g))].sort();

        const select = document.getElementById('comm_borrower');
        select.innerHTML = '<option value="">-- Select --</option>';

        // Add optgroups for better organization
        if (borrowerNames.length > 0) {
            const nameGroup = document.createElement('optgroup');
            nameGroup.label = 'By Borrower Name';
            borrowerNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.dataset.type = 'name';
                option.textContent = name;
                nameGroup.appendChild(option);
            });
            select.appendChild(nameGroup);
        }

        if (borrowerGroups.length > 0) {
            const groupGroup = document.createElement('optgroup');
            groupGroup.label = 'By Borrower Group';
            borrowerGroups.forEach(group => {
                const option = document.createElement('option');
                option.value = group;
                option.dataset.type = 'group';
                option.textContent = `${group} (Group)`;
                groupGroup.appendChild(option);
            });
            select.appendChild(groupGroup);
        }

        if (borrowerNames.length === 0 && borrowerGroups.length === 0) {
            select.innerHTML = '<option value="">-- No borrowers found --</option>';
        }
    } catch (error) {
        console.error('Failed to load borrower options:', error);
    }
}

// Update commission type based on selection
function updateCommissionType() {
    const select = document.getElementById('comm_borrower');
    const selectedOption = select.options[select.selectedIndex];
    const typeSelect = document.getElementById('comm_type');
    
    if (selectedOption && selectedOption.dataset.type) {
        typeSelect.value = selectedOption.dataset.type;
    }
}

// Calculate Commission
async function calculateCommission(event) {
    event.preventDefault();

    const borrowerValue = document.getElementById('comm_borrower').value;
    const filterType = document.getElementById('comm_type').value;
    const interestRate = parseFloat(document.getElementById('interest_rate').value) / 100; // Convert to decimal
    const commissionRate = parseFloat(document.getElementById('commission_rate').value) / 100;
    const periodCount = parseInt(document.getElementById('period_count').value);
    const periodUnit = document.getElementById('period_unit').value; // 'months' or 'days'

    // Validation
    if (commissionRate >= interestRate) {
        showError('Commission rate must be less than interest rate!');
        return;
    }

    try {
        const loans = allLoans.length > 0 ? allLoans : await apiCall('/loans/');
        
        // Filter loans based on selection
        let filteredLoans;
        if (filterType === 'name') {
            filteredLoans = loans.filter(l => l.borrower_name === borrowerValue && l.status !== 'paid_off');
        } else {
            filteredLoans = loans.filter(l => l.borrower_group === borrowerValue && l.status !== 'paid_off');
        }

        if (filteredLoans.length === 0) {
            showError('No active loans found for selected borrower/group');
            return;
        }

        // Track loans that need due_date updates
        const loansToUpdate = [];

        // Calculate commission for each loan
        const results = filteredLoans.map((loan, index) => {
            const amount = parseFloat(loan.amount);

            // Calculate interest based on unit (days or months)
            let periodInterest, totalInterest, totalCommission;
            if (periodUnit === 'days') {
                // Daily interest calculation
                const dailyInterest = amount * (interestRate / 365);
                periodInterest = dailyInterest;
                totalInterest = dailyInterest * periodCount;
                totalCommission = totalInterest * commissionRate;
            } else {
                // Monthly interest calculation (default)
                const monthlyInterest = amount * (interestRate / 12);
                periodInterest = monthlyInterest;
                totalInterest = monthlyInterest * periodCount;
                totalCommission = totalInterest * commissionRate;
            }

            // Calculate or use existing loan period
            let loanPeriodValue, calculatedDueDate, needsUpdate = false;
            const givingDate = new Date(loan.giving_date);

            if (loan.due_date === '1970-01-01') {
                // No due date exists - calculate from period
                loanPeriodValue = periodCount;
                calculatedDueDate = new Date(givingDate);

                if (periodUnit === 'days') {
                    calculatedDueDate.setDate(calculatedDueDate.getDate() + periodCount);
                } else {
                    calculatedDueDate.setMonth(calculatedDueDate.getMonth() + periodCount);
                }
                calculatedDueDate = calculatedDueDate.toISOString().split('T')[0];
                needsUpdate = true;

                // Queue this loan for update
                loansToUpdate.push({
                    id: loan.id,
                    due_date: calculatedDueDate
                });
            } else {
                // Due date exists - calculate actual period
                const loanPeriodDays = calculateLoanPeriodDays(loan.giving_date, loan.due_date);
                if (periodUnit === 'days') {
                    loanPeriodValue = loanPeriodDays;
                } else {
                    // Convert days to approximate months (30 days per month)
                    loanPeriodValue = Math.round(loanPeriodDays / 30);
                }
                calculatedDueDate = loan.due_date;
            }

            return {
                sno: generateSNo(index, loan.giving_date),
                borrower: loan.borrower_name,
                depositor: loan.depositor_name,
                givingDate: loan.giving_date,
                dueDate: calculatedDueDate,
                originalDueDate: loan.due_date,
                amount: amount,
                periodInterest: periodInterest,
                totalInterest: totalInterest,
                totalCommission: totalCommission,
                periodCount: periodCount,
                periodUnit: periodUnit,
                loanPeriodValue: loanPeriodValue,
                needsUpdate: needsUpdate,
                loanId: loan.id
            };
        });

        // Update loan records if needed
        if (loansToUpdate.length > 0) {
            await updateLoanDueDates(loansToUpdate);
        }

        // Calculate totals
        const totalAmount = results.reduce((sum, r) => sum + r.amount, 0);
        const totalInterest = results.reduce((sum, r) => sum + r.totalInterest, 0);
        const totalCommission = results.reduce((sum, r) => sum + r.totalCommission, 0);

        displayCommissionResults(results, {
            borrowerValue,
            filterType,
            interestRate: interestRate * 100,
            commissionRate: commissionRate * 100,
            periodCount,
            periodUnit,
            totalAmount,
            totalInterest,
            totalCommission
        });

    } catch (error) {
        console.error('Failed to calculate commission:', error);
    }
}

// Display Interest Calculator Results
function displayCommissionResults(results, summary) {
    const container = document.getElementById('commission-results');

    let html = '<div class="card">';
    html += '<h3>Interest Calculator Report</h3>';

    // Borrower/Group Header
    html += `<h4>${summary.borrowerValue}</h4>`;

    html += `<p><strong>Interest Rate:</strong> ${summary.interestRate.toFixed(2)}% per annum</p>`;
    html += `<p><strong>Commission Rate:</strong> ${summary.commissionRate.toFixed(2)}%</p>`;
    html += `<p><strong>Period:</strong> ${summary.periodCount} ${summary.periodUnit}</p>`;

    html += '<div style="margin: 20px 0;">';
    html += '<button class="button button-primary" onclick="exportCommissionCSV()">📥 Export Interest Report as CSV</button>';
    html += '</div>';

    // Enhanced table with detailed breakdown
    html += '<div class="table-container"><table>';
    html += '<thead><tr>';
    html += '<th>SNo</th><th>Amount</th><th>Giving Date</th><th>Depositor</th>';
    html += `<th>LoanPeriod(${summary.periodUnit === 'days' ? 'Days' : 'Months'})</th><th>Due Date</th><th>Interest Amount</th><th>Commission</th>`;
    html += '</tr></thead>';
    html += '<tbody>';

    results.forEach(r => {
        const loanPeriodDisplay = r.loanPeriodValue === 'N/A' ? 'N/A' : `${r.loanPeriodValue} ${r.periodUnit}`;
        const dueDateDisplay = r.originalDueDate === '1970-01-01'
            ? `${formatDate(r.dueDate)} <span style="color: var(--success-color); font-size: 0.85em;">✓ updated</span>`
            : formatDueDate(r.dueDate);
        html += '<tr>';
        html += `<td>${r.sno}</td>`;
        html += `<td>₹${r.amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>`;
        html += `<td>${formatDate(r.givingDate)}</td>`;
        html += `<td>${r.depositor}</td>`;
        html += `<td>${loanPeriodDisplay}</td>`;
        html += `<td>${dueDateDisplay}</td>`;
        html += `<td>₹${r.totalInterest.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>`;
        html += `<td>₹${r.totalCommission.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table></div>';

    // Summary section
    html += '<div style="margin-top: 30px; padding: 20px; background: var(--card-bg); border-radius: 8px;">';
    html += '<h4>Summary</h4>';
    html += '<div class="stats-grid">';
    html += `<div class="stat-card"><div class="stat-label">Total Loans</div><div class="stat-value">${results.length}</div></div>`;
    html += `<div class="stat-card"><div class="stat-label">Total Amount</div><div class="stat-value">₹${summary.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div></div>`;
    html += `<div class="stat-card"><div class="stat-label">Total Interest</div><div class="stat-value">₹${summary.totalInterest.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div></div>`;
    html += `<div class="stat-card"><div class="stat-label">Total Commission</div><div class="stat-value" style="color: var(--success-color);">₹${summary.totalCommission.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div></div>`;
    html += '</div>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;

    // Store for CSV export
    window.lastCommissionResults = { results, summary };
}

// Export Commission Report as CSV
function exportCommissionCSV() {
    if (!window.lastCommissionResults) {
        showError('No interest results to export');
        return;
    }

    const { results, summary } = window.lastCommissionResults;

    let csv = 'LoanTracker Interest Calculator Report\n\n';
    csv += `Borrower/Group: ${summary.borrowerValue}\n`;
    csv += `Interest Rate: ${summary.interestRate.toFixed(2)}% per annum\n`;
    csv += `Commission Rate: ${summary.commissionRate.toFixed(2)}%\n`;
    csv += `Period: ${summary.periodCount} ${summary.periodUnit}\n\n`;

    const periodUnitLabel = summary.periodUnit === 'days' ? 'Days' : 'Months';
    csv += `SNo,Amount,Giving Date,Depositor,LoanPeriod(${periodUnitLabel}),Due Date,Interest Amount,Commission\n`;
    results.forEach(r => {
        const loanPeriodDisplay = r.loanPeriodValue === 'N/A' ? 'N/A' : `${r.loanPeriodValue} ${r.periodUnit}`;
        const dueDateDisplay = r.originalDueDate === '1970-01-01' ? `${r.dueDate} (calculated)` : r.dueDate;
        csv += `${r.sno},₹${r.amount.toFixed(2)},${r.givingDate},"${r.depositor}",${loanPeriodDisplay},${dueDateDisplay},₹${r.totalInterest.toFixed(2)},₹${r.totalCommission.toFixed(2)}\n`;
    });

    csv += '\nSummary\n';
    csv += `Total Loans,${results.length}\n`;
    csv += `Total Amount,₹${summary.totalAmount.toFixed(2)}\n`;
    csv += `Total Interest,₹${summary.totalInterest.toFixed(2)}\n`;
    csv += `Total Commission,₹${summary.totalCommission.toFixed(2)}\n`;

    downloadCSV(csv, `interest_report_${summary.borrowerValue}_${new Date().toISOString().split('T')[0]}.csv`);
    showSuccess('Interest report exported successfully!');
}

// CSV Import functions
let csvData = [];

function previewCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            showError('CSV file is empty or invalid');
            return;
        }

        // Parse CSV
        csvData = parseCSV(text);
        
        // Show preview
        const container = document.getElementById('csv-preview');
        let html = '<h4>Preview (first 5 rows)</h4>';
        html += '<div class="table-container"><table><thead><tr>';
        html += '<th>Borrower</th><th>Amount</th><th>Depositor</th><th>Giving Date</th><th>Due Date</th><th>Status</th>';
        html += '</tr></thead><tbody>';

        csvData.slice(0, 5).forEach(row => {
            html += '<tr>';
            html += `<td>${row.borrower_name || ''}</td>`;
            html += `<td>$${row.amount || '0'}</td>`;
            html += `<td>${row.depositor_name || ''}</td>`;
            html += `<td>${row.giving_date || ''}</td>`;
            html += `<td>${row.due_date || '1970-01-01'}</td>`;
            html += `<td><span class="info-badge">Will auto-calculate</span></td>`;
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        html += `<p><strong>Total rows to import:</strong> ${csvData.length}</p>`;
        container.innerHTML = html;

        document.getElementById('import-btn').style.display = 'block';
    };

    reader.readAsText(file);
}

function parseCSV(text) {
    // Remove BOM if present
    text = text.replace(/^\uFEFF/, '');

    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) continue; // Skip empty lines

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        // Handle missing due_date
        if (!row.due_date || row.due_date === '') {
            row.due_date = '1970-01-01';
        }

        // Only add rows with required fields
        if (row.borrower_name && row.amount && row.depositor_name && row.giving_date) {
            data.push(row);
        }
    }

    return data;
}

// Helper function to parse a CSV line properly (handles quoted fields)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Add last field
    result.push(current.trim());

    return result;
}

async function importCSV() {
    if (csvData.length === 0) {
        showError('No data to import');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const row of csvData) {
        try {
            await apiCall('/loans/', {
                method: 'POST',
                body: JSON.stringify({
                    borrower_name: row.borrower_name,
                    amount: parseFloat(row.amount),
                    depositor_name: row.depositor_name,
                    giving_date: row.giving_date,
                    due_date: row.due_date || '1970-01-01',
                    borrower_group: row.borrower_group || null,
                    depositor_group: row.depositor_group || null
                })
            });
            successCount++;
        } catch (error) {
            errorCount++;
            console.error('Failed to import row:', row, error);
        }
    }

    showSuccess(`Import complete! ${successCount} loans imported, ${errorCount} failed.`);
    loadLoans();
    loadBorrowerOptions();
    document.getElementById('csv_file').value = '';
    document.getElementById('csv-preview').innerHTML = '';
    document.getElementById('import-btn').style.display = 'none';
}

// Load System Config
async function loadConfig() {
    try {
        const config = await apiCall('/config/');
        displayConfig(config);
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

// Display Config
function displayConfig(config) {
    const container = document.getElementById('config-container');

    let html = '<div class="table-container"><table>';
    html += '<thead><tr><th>Setting</th><th>Value</th></tr></thead><tbody>';
    html += `<tr><td>Storage Type</td><td><span class="info-badge">${config.storage_type}</span></td></tr>`;
    html += `<tr><td>Encryption</td><td><span class="info-badge">${config.encryption_enabled ? 'Enabled ✅' : 'Disabled ⚠️'}</span></td></tr>`;
    html += `<tr><td>CSV Output Directory</td><td>${config.csv_output_dir}</td></tr>`;
    html += `<tr><td>App Version</td><td>${config.app_version}</td></tr>`;
    html += '</tbody></table></div>';

    html += '<div style="margin-top: 20px; padding: 15px; background: var(--bg-primary); border-radius: 8px;">';
    html += '<h3>Data Locations</h3>';
    html += `<p><strong>Historical Data CSV:</strong> ${config.csv_output_dir}/loan_records.csv</p>`;
    html += `<p><strong>Reports Folder:</strong> reports/ (in downloads)</p>`;
    html += '<p>You can open CSV files directly in Excel or any spreadsheet application.</p>';
    html += '</div>';

    container.innerHTML = html;
}

// Utility Functions
function calculateLoanPeriodDays(givingDate, dueDate) {
    // Handle special case: 1970-01-01 means no due date
    if (dueDate === '1970-01-01') {
        return 'N/A';
    }

    const startDate = new Date(givingDate);
    const endDate = new Date(dueDate);

    // Calculate difference in milliseconds, then convert to days
    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDueDate(dateString) {
    if (dateString === '1970-01-01') {
        return 'No due date';
    }
    return formatDate(dateString);
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = type;
    notification.textContent = message;
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; padding: 15px 20px; border-radius: 6px; animation: slideIn 0.3s ease;';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
}
`;
document.head.appendChild(style);
