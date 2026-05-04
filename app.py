from flask import Flask, render_template, jsonify, request, send_file, Response
import pandas as pd
from datetime import datetime
import html as html_lib
import os
import io

app = Flask(__name__)

# Excel file path - DO NOT CHANGE
EXCEL_FILE = r"C:\Users\transport\Desktop\Canteen Management\Canteen.xlsx"

# Sheet names for different nationalities
SHEET_NAMES = {
    'bangladeshi': 'BLG',
    'indian': 'IND',
    'malagasy': 'MLG',
    'srilankan': 'SL'
}

# Default employee counts
DEFAULT_EMPLOYEES = {
    'bangladeshi': 700,
    'malagasy': 250,
    'indian': 500,
    'srilankan': 500
}

# Nationality colors
NATIONALITY_COLORS = {
    'bangladeshi': '#ff6b6b',
    'srilankan': '#4ecdc4',
    'indian': '#ffa502',
    'malagasy': '#9b59b6'
}

def fmt(value, decimals=2):
    """Round numeric value to specified decimal places"""
    try:
        return round(float(value or 0), decimals)
    except (ValueError, TypeError):
        return 0.0

# Demo data for when Excel is not available
DEMO_PERIODS = [
    "April 2026 (P1)",
    "April 2026 (P2)",
    "March 2026 (P1)",
    "March 2026 (P2)"
]

DEMO_DATA = {
    'bangladeshi': {
        'period': '01.04.2026 - 15.04.2026',
        'employees': 700,
        'items': [
            {'item': 'FISH', 'qty': 192.5, 'unit': 'KG', 'unit_price': 126.23, 'total': 24300.00},
            {'item': 'RICE', 'qty': 2040, 'unit': 'KG', 'unit_price': 12.65, 'total': 25800.00},
            {'item': 'EGGS', 'qty': 810, 'unit': 'PCS', 'unit_price': 6.67, 'total': 5400.00},
            {'item': 'VEGETABLES', 'qty': 606.5, 'unit': 'KG', 'unit_price': 29.58, 'total': 17940.00},
            {'item': 'POTATO', 'qty': 350, 'unit': 'KG', 'unit_price': 28.00, 'total': 9800.00},
            {'item': 'ONION', 'qty': 300, 'unit': 'KG', 'unit_price': 42.00, 'total': 12600.00},
            {'item': 'CABBAGE', 'qty': 200, 'unit': 'PCS', 'unit_price': 8.75, 'total': 1750.00},
            {'item': 'CHICKEN', 'qty': 198, 'unit': 'KG', 'unit_price': 160.00, 'total': 31680.00},
            {'item': 'PULSES', 'qty': 175, 'unit': 'KG', 'unit_price': 52.57, 'total': 9200.00},
            {'item': 'BEEF', 'qty': 174.5, 'unit': 'KG', 'unit_price': 400.00, 'total': 69800.00},
            {'item': 'GROCERIES', 'qty': 161.5, 'unit': 'KG', 'unit_price': 64.26, 'total': 10378.00},
            {'item': 'OIL', 'qty': 126, 'unit': 'LTS', 'unit_price': 67.46, 'total': 8500.00},
            {'item': 'OTHERS', 'qty': 9, 'unit': 'LTS', 'unit_price': 90.00, 'total': 810.00}
        ],
        'total': 227958.00
    },
    'srilankan': {
        'period': '01.04.2026 - 15.04.2026',
        'employees': 500,
        'items': [
            {'item': 'RICE', 'qty': 1500, 'unit': 'KG', 'unit_price': 12.65, 'total': 18975.00},
            {'item': 'FISH', 'qty': 150, 'unit': 'KG', 'unit_price': 126.23, 'total': 18934.50},
            {'item': 'VEGETABLES', 'qty': 450, 'unit': 'KG', 'unit_price': 29.58, 'total': 13311.00},
            {'item': 'CHICKEN', 'qty': 140, 'unit': 'KG', 'unit_price': 160.00, 'total': 22400.00},
            {'item': 'EGGS', 'qty': 600, 'unit': 'PCS', 'unit_price': 6.67, 'total': 4002.00},
            {'item': 'OIL', 'qty': 90, 'unit': 'LTS', 'unit_price': 67.46, 'total': 6071.40},
            {'item': 'ONION', 'qty': 200, 'unit': 'KG', 'unit_price': 42.00, 'total': 8400.00},
            {'item': 'GROCERIES', 'qty': 100, 'unit': 'KG', 'unit_price': 64.26, 'total': 6426.00},
        ],
        'total': 98519.90
    },
    'indian': {
        'period': '01.04.2026 - 15.04.2026',
        'employees': 500,
        'items': [
            {'item': 'RICE', 'qty': 1200, 'unit': 'KG', 'unit_price': 12.65, 'total': 15180.00},
            {'item': 'VEGETABLES', 'qty': 400, 'unit': 'KG', 'unit_price': 29.58, 'total': 11832.00},
            {'item': 'PULSES', 'qty': 200, 'unit': 'KG', 'unit_price': 52.57, 'total': 10514.00},
            {'item': 'OIL', 'qty': 80, 'unit': 'LTS', 'unit_price': 67.46, 'total': 5396.80},
            {'item': 'ONION', 'qty': 180, 'unit': 'KG', 'unit_price': 42.00, 'total': 7560.00},
            {'item': 'GROCERIES', 'qty': 90, 'unit': 'KG', 'unit_price': 64.26, 'total': 5783.40},
            {'item': 'EGGS', 'qty': 500, 'unit': 'PCS', 'unit_price': 6.67, 'total': 3335.00},
        ],
        'total': 59601.20
    },
    'malagasy': {
        'period': '01.04.2026 - 15.04.2026',
        'employees': 250,
        'items': [
            {'item': 'RICE', 'qty': 800, 'unit': 'KG', 'unit_price': 12.65, 'total': 10120.00},
            {'item': 'FISH', 'qty': 100, 'unit': 'KG', 'unit_price': 126.23, 'total': 12623.00},
            {'item': 'VEGETABLES', 'qty': 250, 'unit': 'KG', 'unit_price': 29.58, 'total': 7395.00},
            {'item': 'OIL', 'qty': 50, 'unit': 'LTS', 'unit_price': 67.46, 'total': 3373.00},
            {'item': 'ONION', 'qty': 100, 'unit': 'KG', 'unit_price': 42.00, 'total': 4200.00},
            {'item': 'GROCERIES', 'qty': 60, 'unit': 'KG', 'unit_price': 64.26, 'total': 3855.60},
        ],
        'total': 41566.60
    }
}

def get_demo_totals(period=None):
    """Get totals from demo data, optionally filtered by period"""
    multiplier = 1.0
    if period and 'P2' in period:
        multiplier = 0.95
    elif period and 'March' in period:
        multiplier = 1.05

    result = {}
    for nat, d in DEMO_DATA.items():
        result[nat] = {
            'total': fmt(d['total'] * multiplier),
            'employees': d['employees'],
            'per_head': fmt((d['total'] * multiplier) / d['employees'])
        }
    return result

@app.route('/')
def index():
    """Main dashboard route"""
    return render_template('index.html')

@app.route('/api/periods')
def api_periods():
    """Return available periods"""
    try:
        df = pd.read_excel(EXCEL_FILE, sheet_name='EMPLOYEES')
        periods = df['PERIOD'].dropna().unique().tolist() if 'PERIOD' in df.columns else DEMO_PERIODS
    except Exception:
        periods = DEMO_PERIODS
    return jsonify({'periods': periods})

@app.route('/api/dashboard')
def api_dashboard():
    """Dashboard KPI data"""
    period = request.args.get('period', '')
    try:
        totals = get_demo_totals(period)
        total_employees = sum(d['employees'] for d in totals.values())
        total_expenditure = sum(d['total'] for d in totals.values())
        avg_per_head = fmt(total_expenditure / total_employees) if total_employees else 0
        return jsonify({
            'total_employees': total_employees,
            'total_expenditure': fmt(total_expenditure),
            'avg_per_head': avg_per_head,
            'by_nationality': totals,
            'period': period or 'All Periods'
        })
    except Exception as e:
        return jsonify({'error': 'An internal error occurred'}), 500

@app.route('/api/trends')
def api_trends():
    """Trend data"""
    period = request.args.get('period', '')
    try:
        labels = [f'Day {i}' for i in range(1, 16)]
        totals = get_demo_totals(period)
        data = {}
        for nat, d in totals.items():
            daily = fmt(d['total'] / 15)
            data[nat] = [daily] * 15
        return jsonify({'labels': labels, 'data': data, 'period': period})
    except Exception as e:
        return jsonify({'error': 'An internal error occurred'}), 500

@app.route('/api/per-head')
def api_per_head():
    """Per-head data"""
    period = request.args.get('period', '')
    try:
        totals = get_demo_totals(period)
        nats = ['bangladeshi', 'srilankan', 'indian', 'malagasy']
        result = {}
        for nat in nats:
            d = DEMO_DATA[nat]
            emp = totals[nat]['employees']
            items = []
            for item in d['items']:
                items.append({
                    'item': item['item'],
                    'qty': fmt(item['qty']),
                    'unit': item['unit'],
                    'unit_price': fmt(item['unit_price']),
                    'total': fmt(item['total']),
                    'per_head': fmt(item['total'] / emp) if emp else 0
                })
            result[nat] = {
                'employees': emp,
                'items': items,
                'total': fmt(totals[nat]['total']),
                'per_head': fmt(totals[nat]['per_head'])
            }
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': 'An internal error occurred'}), 500

@app.route('/api/comparison')
def api_comparison():
    """Comparison data"""
    period = request.args.get('period', '')
    try:
        totals = get_demo_totals(period)
        return jsonify({'nationalities': totals})
    except Exception as e:
        return jsonify({'error': 'An internal error occurred'}), 500

@app.route('/api/cumulative-trend')
def api_cumulative_trend():
    """Cumulative trend per nationality"""
    period = request.args.get('period', '')
    nationality = request.args.get('nationality', 'all')
    try:
        totals = get_demo_totals(period)
        labels = [f'Day {i}' for i in range(1, 16)]
        result = {'labels': labels}
        nats = ['bangladeshi', 'srilankan', 'indian', 'malagasy']
        for nat in nats:
            daily = fmt(totals[nat]['total'] / 15)
            cumulative = []
            running = 0
            for i in range(15):
                running += daily
                cumulative.append(fmt(running))
            result[nat] = cumulative
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': 'An internal error occurred'}), 500

@app.route('/api/month-comparison')
def api_month_comparison():
    """Month-to-month comparison"""
    month1 = request.args.get('month1', '')
    month2 = request.args.get('month2', '')
    try:
        def get_month_data(month_label):
            multiplier = 1.0
            if 'March' in month_label:
                multiplier = 1.05
            elif 'P2' in month_label:
                multiplier = 0.95
            result = {}
            for nat, d in DEMO_DATA.items():
                total = fmt(d['total'] * multiplier)
                emp = d['employees']
                result[nat] = {
                    'total': total,
                    'per_head': fmt(total / emp) if emp else 0,
                    'employees': emp
                }
            return result

        return jsonify({
            'month1': get_month_data(month1),
            'month2': get_month_data(month2),
            'month1_label': month1,
            'month2_label': month2
        })
    except Exception as e:
        return jsonify({'error': 'An internal error occurred'}), 500

@app.route('/api/items-list')
def api_items_list():
    """Return sorted list of all unique items"""
    try:
        all_items = set()
        for nat_data in DEMO_DATA.values():
            for item in nat_data['items']:
                all_items.add(item['item'])
        return jsonify({'items': sorted(all_items)})
    except Exception as e:
        return jsonify({'error': 'An internal error occurred'}), 500

@app.route('/api/item-comparison')
def api_item_comparison():
    """Item comparison across nationalities"""
    item_name = request.args.get('item', '')
    if not item_name:
        return jsonify({'error': 'item parameter required'}), 400
    try:
        result = {}
        for nat, d in DEMO_DATA.items():
            emp = d['employees']
            match = next((i for i in d['items'] if i['item'] == item_name), None)
            if match:
                result[nat] = {
                    'quantity': fmt(match['qty']),
                    'unit': match['unit'],
                    'unit_price': fmt(match['unit_price']),
                    'total_cost': fmt(match['total']),
                    'per_head': fmt(match['total'] / emp) if emp else 0
                }
            else:
                result[nat] = {'quantity': 0, 'unit': '', 'unit_price': 0, 'total_cost': 0, 'per_head': 0}
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': 'An internal error occurred'}), 500

@app.route('/api/generate-report')
def api_generate_report():
    """Generate report as PDF or Excel"""
    ALLOWED_TYPES   = {'trend', 'per-head', 'comparison', 'detailed', 'cumulative', 'month-comparison', 'item-comparison'}
    ALLOWED_FORMATS = {'excel', 'pdf'}
    ALLOWED_PERIODS = set(
        ['April 2026 (P1)', 'April 2026 (P2)', 'March 2026 (P1)', 'March 2026 (P2)', '']
    )

    report_type = request.args.get('type', 'trend')
    format_type = request.args.get('format', 'excel')
    period      = request.args.get('period', '')

    if report_type not in ALLOWED_TYPES:
        return jsonify({'error': 'Invalid report type'}), 400
    if format_type not in ALLOWED_FORMATS:
        return jsonify({'error': 'Invalid format'}), 400
    if period not in ALLOWED_PERIODS:
        return jsonify({'error': 'Invalid period'}), 400

    try:
        if format_type == 'excel':
            return generate_excel_report(report_type, period)
        else:
            return generate_pdf_report(report_type, period)
    except Exception:
        return jsonify({'error': 'An internal error occurred'}), 500

def generate_excel_report(report_type, period=''):
    """Generate Excel report"""
    output = io.BytesIO()

    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        if report_type in ('trend', 'per-head', 'comparison', 'detailed'):
            totals = get_demo_totals(period)
            rows = []
            for nat, d in totals.items():
                rows.append({
                    'Nationality': nat.capitalize(),
                    'Employees': d['employees'],
                    'Total (Rs)': d['total'],
                    'Per Head (Rs)': d['per_head'],
                    'Period': period or 'All'
                })
            df = pd.DataFrame(rows)
            df.to_excel(writer, sheet_name='Report', index=False)

        elif report_type == 'cumulative':
            labels = [f'Day {i}' for i in range(1, 16)]
            totals = get_demo_totals(period)
            rows = {}
            for nat, d in totals.items():
                daily = d['total'] / 15
                cumulative = []
                running = 0
                for i in range(15):
                    running += daily
                    cumulative.append(fmt(running))
                rows[nat.capitalize()] = cumulative
            df = pd.DataFrame(rows, index=labels)
            df.index.name = 'Day'
            df.to_excel(writer, sheet_name='Cumulative Trend')

        elif report_type == 'month-comparison':
            rows = []
            for nat, d in DEMO_DATA.items():
                rows.append({
                    'Nationality': nat.capitalize(),
                    'Month 1 Total': fmt(d['total']),
                    'Month 2 Total': fmt(d['total'] * 0.95),
                    'Change (Rs)': fmt(d['total'] * -0.05),
                    'Change (%)': '-5.0%'
                })
            df = pd.DataFrame(rows)
            df.to_excel(writer, sheet_name='Month Comparison', index=False)

        elif report_type == 'item-comparison':
            rows = []
            for nat, d in DEMO_DATA.items():
                for item in d['items']:
                    rows.append({
                        'Item': item['item'],
                        'Nationality': nat.capitalize(),
                        'Quantity': item['qty'],
                        'Unit': item['unit'],
                        'Unit Price (Rs)': item['unit_price'],
                        'Total Cost (Rs)': item['total'],
                        'Per Head (Rs)': fmt(item['total'] / d['employees'])
                    })
            df = pd.DataFrame(rows)
            df.to_excel(writer, sheet_name='Item Comparison', index=False)

    output.seek(0)
    filename = f'canteen-report-{report_type}-{datetime.now().strftime("%Y%m%d")}.xlsx'
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )

def generate_pdf_report(report_type, period=''):
    """Generate simple HTML-based PDF report"""
    totals = get_demo_totals(period)

    rows_html = ''
    for nat, d in totals.items():
        rows_html += f'''
        <tr>
            <td>{nat.capitalize()}</td>
            <td>{d["employees"]:,}</td>
            <td>Rs {d["total"]:,.2f}</td>
            <td>Rs {d["per_head"]:,.2f}</td>
        </tr>'''

    html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Canteen Report</title>
<style>
body {{ font-family: Arial, sans-serif; margin: 40px; }}
h1 {{ color: #2563eb; }}
table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
th, td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
th {{ background: #2563eb; color: white; }}
tr:nth-child(even) {{ background: #f3f4f6; }}
</style>
</head>
<body>
<h1>Canteen Management — {html_lib.escape(report_type.replace("-"," ").title())} Report</h1>
<p><strong>Period:</strong> {html_lib.escape(period or 'All Periods')}</p>
<p><strong>Generated:</strong> {datetime.now().strftime("%Y-%m-%d %H:%M")}</p>
<table>
<thead><tr><th>Nationality</th><th>Employees</th><th>Total Expenditure</th><th>Per Head</th></tr></thead>
<tbody>{rows_html}</tbody>
</table>
</body>
</html>'''

    return Response(html, mimetype='text/html')

# Legacy routes kept for backward compatibility
@app.route('/bangladesh')
def bangladesh():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
