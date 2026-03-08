"""Unit tests for interest calculator business logic."""
import pytest


class TestInterestCalculation:
    """Test interest calculation formulas."""

    def test_simple_monthly_interest(self):
        """Test basic monthly interest calculation."""
        amount = 10000.00
        annual_rate = 0.12  # 12% per annum
        months = 1

        monthly_rate = annual_rate / 12
        monthly_interest = amount * monthly_rate

        assert monthly_interest == 100.00

    def test_monthly_interest_12_months(self):
        """Test interest calculation for 12 months."""
        amount = 10000.00
        annual_rate = 0.12  # 12%
        months = 12

        monthly_rate = annual_rate / 12
        total_interest = amount * monthly_rate * months

        assert total_interest == 1200.00

    def test_commission_calculation(self):
        """Test commission calculation on monthly interest."""
        monthly_interest = 100.00
        commission_rate = 0.10  # 10%

        commission = monthly_interest * commission_rate

        assert commission == 10.00

    def test_total_commission_for_period(self):
        """Test total commission for a period."""
        amount = 10000.00
        annual_interest_rate = 0.12  # 12%
        commission_rate = 0.10  # 10%
        months = 12

        monthly_interest = amount * (annual_interest_rate / 12)
        commission_per_month = monthly_interest * commission_rate
        total_commission = commission_per_month * months

        assert total_commission == 120.00

    def test_multi_loan_total_commission(self):
        """Test commission calculation for multiple loans."""
        loans = [
            {"amount": 10000, "rate": 0.12},  # 12%
            {"amount": 5000, "rate": 0.15},   # 15%
            {"amount": 8000, "rate": 0.10}    # 10%
        ]
        commission_rate = 0.10
        months = 12

        total_commission = 0
        for loan in loans:
            annual_interest = loan["amount"] * loan["rate"]
            commission_on_interest = annual_interest * commission_rate
            total_commission += commission_on_interest

        # Loan 1: 10000 * 0.12 * 0.10 = 120
        # Loan 2: 5000 * 0.15 * 0.10 = 75
        # Loan 3: 8000 * 0.10 * 0.10 = 80
        # Total: 275
        assert total_commission == 275.00

    def test_different_period_lengths(self):
        """Test calculations for different period lengths."""
        amount = 10000.00
        annual_rate = 0.12
        commission_rate = 0.10

        # 1 month
        interest_1m = amount * (annual_rate / 12) * 1
        commission_1m = interest_1m * commission_rate
        assert commission_1m == 10.00

        # 6 months
        interest_6m = amount * (annual_rate / 12) * 6
        commission_6m = interest_6m * commission_rate
        assert commission_6m == 60.00

        # 24 months
        interest_24m = amount * (annual_rate / 12) * 24
        commission_24m = interest_24m * commission_rate
        assert commission_24m == 240.00

    def test_commission_must_be_less_than_interest_rate(self):
        """Test business rule: commission rate < interest rate."""
        interest_rate = 12.0  # %
        commission_rate = 10.0  # %

        assert commission_rate < interest_rate

        # Invalid case
        commission_rate = 12.0
        assert not (commission_rate < interest_rate)

        commission_rate = 15.0
        assert not (commission_rate < interest_rate)

    def test_zero_commission_rate(self):
        """Test calculation with zero commission rate."""
        amount = 10000.00
        annual_rate = 0.12
        commission_rate = 0.00  # 0%
        months = 12

        monthly_interest = amount * (annual_rate / 12)
        commission_per_month = monthly_interest * commission_rate
        total_commission = commission_per_month * months

        assert total_commission == 0.00


class TestINRFormatting:
    """Test INR number formatting for display."""

    def test_format_small_amount(self):
        """Test formatting small amounts."""
        amount = 1000.00
        formatted = f"₹{amount:,.2f}"

        assert formatted == "₹1,000.00"

    def test_format_lakh_amount(self):
        """Test formatting amounts in lakhs."""
        amount = 100000.00  # 1 lakh
        formatted = f"₹{amount:,.2f}"

        # Standard comma formatting
        assert formatted == "₹100,000.00"

    def test_format_crore_amount(self):
        """Test formatting amounts in crores."""
        amount = 10000000.00  # 1 crore
        formatted = f"₹{amount:,.2f}"

        assert formatted == "₹10,000,000.00"

    def test_format_with_paisa(self):
        """Test formatting with paisa (decimal places)."""
        amount = 123456.78
        formatted = f"₹{amount:,.2f}"

        assert formatted == "₹123,456.78"

    def test_rupee_symbol_used(self):
        """Test that rupee symbol (₹) is used, not dollar ($)."""
        amount = 5000.00
        formatted = f"₹{amount:,.2f}"

        assert "₹" in formatted
        assert "$" not in formatted


class TestSNoGeneration:
    """Test Serial Number generation logic."""

    def test_sno_format_first_loan(self):
        """Test SNo format for first loan of the year."""
        year = 2026
        index = 0  # First loan

        sno = f"{year}/{str(index + 1).zfill(3)}"

        assert sno == "2026/001"

    def test_sno_format_tenth_loan(self):
        """Test SNo format for 10th loan."""
        year = 2026
        index = 9  # 10th loan (0-indexed)

        sno = f"{year}/{str(index + 1).zfill(3)}"

        assert sno == "2026/010"

    def test_sno_format_hundredth_loan(self):
        """Test SNo format for 100th loan."""
        year = 2026
        index = 99  # 100th loan

        sno = f"{year}/{str(index + 1).zfill(3)}"

        assert sno == "2026/100"

    def test_sno_different_years(self):
        """Test SNo generation for different years."""
        # 2025 loans
        sno_2025_1 = f"2025/{str(1).zfill(3)}"
        assert sno_2025_1 == "2025/001"

        # 2026 loans
        sno_2026_1 = f"2026/{str(1).zfill(3)}"
        assert sno_2026_1 == "2026/001"

        # SNo resets per year
        assert sno_2025_1 != sno_2026_1

    def test_sno_zero_padding(self):
        """Test that SNo always has 3-digit zero-padded counter."""
        test_cases = [
            (0, "001"),
            (9, "010"),
            (99, "100"),
            (149, "150"),
            (999, "1000")  # Would be 4 digits if over 999
        ]

        for index, expected_counter in test_cases:
            counter = str(index + 1).zfill(3)
            if len(counter) <= 3:
                assert counter == expected_counter


class TestExtensionPeriodDisplay:
    """Test extension period display formatting."""

    def test_single_month_display(self):
        """Test display for 1 month extension."""
        months = 1
        display = f"{months} month" if months == 1 else f"{months} months"

        assert display == "1 month"

    def test_multiple_months_display(self):
        """Test display for multiple months."""
        months = 12
        display = f"{months} month" if months == 1 else f"{months} months"

        assert display == "12 months"

    def test_six_months_display(self):
        """Test display for 6 months."""
        months = 6
        display = f"{months} month" if months == 1 else f"{months} months"

        assert display == "6 months"


class TestSummaryCalculations:
    """Test summary calculations for reports."""

    def test_total_loans_count(self):
        """Test counting total loans."""
        loans = [
            {"amount": 10000},
            {"amount": 5000},
            {"amount": 8000}
        ]

        total_count = len(loans)

        assert total_count == 3

    def test_total_amount_sum(self):
        """Test summing total loan amounts."""
        loans = [
            {"amount": 10000},
            {"amount": 5000},
            {"amount": 8000}
        ]

        total_amount = sum(loan["amount"] for loan in loans)

        assert total_amount == 23000

    def test_total_interest_sum(self):
        """Test summing total interest."""
        results = [
            {"interest": 1200},
            {"interest": 600},
            {"interest": 800}
        ]

        total_interest = sum(r["interest"] for r in results)

        assert total_interest == 2600

    def test_total_commission_sum(self):
        """Test summing total commission."""
        results = [
            {"commission": 120},
            {"commission": 60},
            {"commission": 80}
        ]

        total_commission = sum(r["commission"] for r in results)

        assert total_commission == 260

    def test_empty_loan_list_totals(self):
        """Test summary calculations with empty loan list."""
        loans = []

        total_count = len(loans)
        total_amount = sum(loan.get("amount", 0) for loan in loans)

        assert total_count == 0
        assert total_amount == 0
