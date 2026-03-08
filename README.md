# 🏦 LoanTracker - Loan Management System

**Version 1.0.0** | Production-Ready MVP

A secure, user-friendly loan tracking system with commission calculator, data encryption, CSV import/export, and customizable UI themes. Perfect for individuals and small businesses managing loan records.

![LoanTracker](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![FastAPI](https://img.shields.io/badge/fastapi-latest-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Features

### Core Functionality
- ✅ **Create, Read, Update, Delete** loan records with 7 fields
- ✅ **Commission Calculator** - Calculate broker commissions on loan interest
- ✅ **CSV Import/Export** - Import historical data, export reports
- ✅ **Multiple storage options**: CSV (default) or SQLite
- ✅ **Optional encryption** for sensitive data (AES-256)
- ✅ **Historical tracking** with audit trail

### User Interface
- 🎨 **4 Beautiful Themes**: Modern, Classic, Dark, Minimal
- 📱 **Responsive Design**: Works on desktop and tablets
- 🔄 **Real-time Updates**: Instant feedback on operations
- 📊 **Rich Reports**: Statistics by borrower, depositor, status
- 📥 **Export to CSV**: One-click report and commission exports

### Business Features
- 💰 **Commission Calculator**: Calculate commissions by borrower or group
- 📈 **5 Report Types**: Filter by borrower name/group, depositor name/group, due date
- 📁 **Bulk Import**: Upload CSV files with historical loan data
- 📅 **Optional Due Dates**: Default to 1970-01-01 for perpetual loans

### Security & Privacy
- 🔒 **AES-256 Encryption** (optional, gracefully disabled if unavailable)
- 🛡️ **Input Validation** to prevent injection attacks
- 📝 **Audit Logging** for all operations
- 💾 **Local Storage**: Your data stays on your machine

### Deployment
- 🐳 **Docker Support**: One-command deployment
- 📦 **Standalone Package**: Minimal dependencies with graceful fallbacks
- ⚙️ **Configurable**: Easy configuration via .env file
- 🚀 **Production-Ready**: Logging, health checks, error handling

---

## 🚀 Quick Start

Choose your platform:

### **macOS/Linux Users** → See [USER_GUIDE_MAC.md](USER_GUIDE_MAC.md)

### **Windows Users** → See [USER_GUIDE_WINDOWS.md](USER_GUIDE_WINDOWS.md)

### **Docker Users** (All Platforms)

```bash
# 1. Navigate to project directory
cd /path/to/LoanTracker

# 2. Start with Docker Compose
docker-compose up -d

# 3. Access the application
# Open browser: http://localhost:8000
```

---

## 📖 Documentation

### User Guides
- **[Mac/Linux User Guide](USER_GUIDE_MAC.md)** - Setup and usage for macOS/Linux
- **[Windows User Guide](USER_GUIDE_WINDOWS.md)** - Setup and usage for Windows
- **[Demo Instructions](DEMO_GUIDE.md)** - Quick demo walkthrough with sample data

### Technical Documentation (docs/)
- **[01 - Architecture & Models](docs/01-architecture-and-models.md)** - System design, NFRs, dependencies
- **[02 - Coding Patterns & Style](docs/02-coding-patterns-and-style.md)** - Python coding standards
- **[03 - Frontend Architecture](docs/03-frontend-architecture.md)** - UI patterns and design
- **[04 - Business Requirements](docs/04-business-requirements.md)** - Business logic, formulas, reports

### Additional Resources
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

---

## 📊 Sample Data

A sample CSV file is included: **[sample_loans.csv](sample_loans.csv)**

To test the import functionality:
1. Start the application
2. Go to "📥 Import CSV" tab
3. Upload `sample_loans.csv`
4. Preview the data
5. Click "Import Data"

---

## 🛠️ System Requirements

### Minimum Requirements
- **Python**: 3.11 or higher
- **RAM**: 512 MB
- **Disk Space**: 100 MB

### Optional Dependencies
- **cryptography** - For data encryption (gracefully disabled if unavailable)
- **pandas** - For better CSV performance (built-in fallback if unavailable)

**Note**: The system works perfectly without optional dependencies using built-in Python libraries.

---

## 🎯 Commission Calculator

Calculate broker commissions on loan interest:

### Formula
```
Monthly Interest = Loan Amount × (Interest Rate / 12)
Commission = Monthly Interest × Commission Rate × Number of Months
```

### Example
```
Loan: $10,000
Interest Rate: 12% per annum
Commission Rate: 10%
Period: 12 months

Monthly Interest = $10,000 × (12% / 12) = $100
Commission/Month = $100 × 10% = $10
Total Commission (12 months) = $10 × 12 = $120
```

### Features
- Calculate for individual borrowers or groups
- Supports multiple loans per borrower
- Excludes paid-off loans automatically
- Export commission reports to CSV

---

## 📁 Data Model

### Loan Record Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `borrower_name` | String | Yes | - | Name of borrower |
| `amount` | Decimal | Yes | - | Loan amount (USD) |
| `depositor_name` | String | Yes | - | Name of lender |
| `giving_date` | Date | Yes | - | Loan disbursement date |
| `due_date` | Date | **No** | 1970-01-01 | Repayment due date (optional) |
| `borrower_group` | String | No | null | Borrower category (e.g., "Family") |
| `depositor_group` | String | No | null | Lender category (e.g., "Bank") |
| `status` | Enum | Auto | active | active, paid_off, or overdue |

---

## 🏗️ Architecture Highlights

### Dependency Strategy (Multi-Tier)
```
TIER 1 - REQUIRED (Always Works)
├─ fastapi, uvicorn, pydantic, structlog
└─ Built-in: csv, json, datetime

TIER 2 - OPTIONAL (Graceful Fallback)
├─ cryptography → Encryption disabled if unavailable
└─ pandas → Built-in CSV module used if unavailable

RESULT: Zero-friction installation, always functional
```

### User Experience Priorities
- ✅ Zero-friction installation - Works immediately
- ✅ Graceful degradation - Optional features don't break core
- ✅ Clear error messages - Actionable fix suggestions
- ✅ Configuration validation - Fail fast with guidance

---

## 🔧 Configuration

### .env File
```env
# Storage
STORAGE_TYPE=csv
CSV_OUTPUT_DIR=./engine_output
CSV_FILENAME=loan_records.csv

# Encryption (optional - leave empty to disable)
ENCRYPTION_KEY=

# Server
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
LOG_LEVEL=INFO
```

**Important**: Leave `ENCRYPTION_KEY` empty if cryptography is not installed.

---

## 📈 Reports & Filtering

### 5 Report Types
1. **Filter by Borrower Name** - Partial match, case-insensitive
2. **Filter by Borrower Group** - Exact match
3. **Filter by Depositor Name** - Partial match, case-insensitive
4. **Filter by Depositor Group** - Exact match
5. **Filter by Due Date Range** - Inclusive range

### Export Options
- 📥 **Export Report as CSV** - Complete statistics and loan details
- 📥 **Export Commission Report as CSV** - Commission calculations and breakdown

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pytest tests/ -v
```

### Manual Testing with Sample Data
1. Use provided `sample_loans.csv` (10 test records)
2. Import via UI (Import CSV tab)
3. Test commission calculator
4. Export reports

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port in .env
BACKEND_PORT=8080
```

### Cryptography Import Error
```bash
# Option 1: Install cryptography
pip install cryptography

# Option 2: Disable encryption
# In .env file, set: ENCRYPTION_KEY=
```

### CSV Import Not Working
- Check CSV format matches `sample_loans.csv`
- Ensure required fields: borrower_name, amount, depositor_name, giving_date
- Due date can be empty (defaults to 1970-01-01)

For more issues, see **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

---

## 📞 Support

### Issues & Bug Reports
- GitHub Issues: [Report a bug](https://github.com/yourusername/LoanTracker/issues)
- Check logs: `logs/loantracker.log`

### Documentation
- Start with user guide for your platform
- Review business requirements for formulas
- Check architecture docs for technical details

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🎯 Project Status

**✅ Production Ready** - All MVP1 requirements met

| Feature | Status | Notes |
|---------|--------|-------|
| Data entry (7 fields) | ✅ Complete | Including optional due_date |
| Delete records | ✅ Complete | Soft delete implemented |
| Generate reports | ✅ Complete | 5 filter types |
| Commission calculator | ✅ Complete | With CSV export |
| CSV import | ✅ Complete | Handles missing fields |
| 4 UI themes | ✅ Complete | Modern, Classic, Dark, Minimal |
| CSV export | ✅ Complete | Reports and commission |
| Docker deployment | ✅ Complete | docker-compose ready |
| Encryption (optional) | ✅ Complete | Graceful fallback |
| User guides | ✅ Complete | Mac, Windows, Demo |
| Unit tests | 🔄 In Progress | Core functionality covered |

---

**Built with ❤️ for small businesses and individuals managing loans**
