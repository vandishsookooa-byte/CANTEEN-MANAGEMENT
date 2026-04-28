from flask import Flask, render_template, jsonify, request
import pandas as pd
import json
import os

app = Flask(__name__)

EXCEL_FILE = r"C:\Users\transport\Desktop\Canteen Management\Canteen.xlsx"

SHEETS = {
    'bangladeshi': 'BLG-BANGLADESH',
    'malagasy':    'MLG-MALAGASY',
    'indian':      'IND-INDIA',
    'srilankan':   'SL- SRI LANKA'
}

COLORS = {
    'bangladeshi': '#ff6b6b',
    'srilankan':   '#4ecdc4',
    'indian':      '#ffa502',
    'malagasy':    '#9b59b6'
}

LABELS = {
    'bangladeshi': 'Bangladeshi',
    'srilankan':   'Sri Lankan',
    'indian':      'Indian',
    'malagasy':    'Malagasy'
}

EMPLOYEES_FILE = os.path.join(os.path.dirname(__file__), 'data', 'employees.json')
DEFAULT_EMPLOYEES = {'bangladeshi': 700, 'srilankan': 500, 'indian': 138, 'malagasy': 250}

CATEGORY_MAP = {
    'rice':       ['RICE'],
    'vegetables': ['VEGETABLES', 'CABBAGE', 'POTATO', 'ONION'],
    'meat':       ['FISH', 'CHICKEN', 'BEEF'],
    'spices':     ['GROCERIES', 'OIL', 'PULSES', 'OTHERS', 'EGGS']
}

UPLOADED_DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'uploaded_data.json')


def get_employees():
    if os.path.exists(EMPLOYEES_FILE):
        with open(EMPLOYEES_FILE) as f:
            return json.load(f)
    return DEFAULT_EMPLOYEES.copy()


def save_employees(data):
    os.makedirs(os.path.dirname(EMPLOYEES_FILE), exist_ok=True)
    with open(EMPLOYEES_FILE, 'w') as f:
        json.dump(data, f)


def read_sheet(nationality):
    """Read a single sheet from the Excel file for a given nationality."""
    try:
        df = pd.read_excel(EXCEL_FILE, sheet_name=SHEETS[nationality])
        df.columns = [str(c).strip().upper() for c in df.columns]
        df = df.dropna(subset=['ITEMS'])
        df['ITEMS'] = df['ITEMS'].astype(str).str.strip().str.upper()
        df = df[df['ITEMS'].str.len() > 0]
        df['TOTAL'] = pd.to_numeric(df['TOTAL'], errors='coerce').fillna(0)
        df['QTY'] = pd.to_numeric(df['QTY'], errors='coerce').fillna(0)
        df['UNIT PRICE'] = pd.to_numeric(df['UNIT PRICE'], errors='coerce').fillna(0)
        return df
    except Exception as e:
        print(f"Error reading {nationality}: {e}")
        return pd.DataFrame()


def read_all_sheets():
    """Read all sheets and return a dict of DataFrames."""
    result = {}
    for nat in SHEETS:
        result[nat] = read_sheet(nat)
    return result


def get_period(all_data=None):
    """Get period string from first available data row."""
    if all_data is None:
        all_data = read_all_sheets()
    for nat, df in all_data.items():
        if not df.empty and 'PERIOD' in df.columns:
            period = df['PERIOD'].dropna().iloc[0] if not df['PERIOD'].dropna().empty else None
            if period:
                return str(period)
    return '01.04.2026 - 15.04.2026'


@app.route('/')
def index():
    return render_template('canteen_dashboard.html')


@app.route('/api/summary')
def api_summary():
    try:
        employees = get_employees()
        total_employees = sum(employees.values())
        all_data = read_all_sheets()

        total_expenditure = 0.0
        excel_available = False
        for nat, df in all_data.items():
            if not df.empty:
                excel_available = True
                total_expenditure += float(df['TOTAL'].sum())

        avg_per_head = round(total_expenditure / total_employees, 2) if total_employees > 0 else 0
        period = get_period(all_data)

        return jsonify({
            'totalEmployees': total_employees,
            'totalExpenditure': round(total_expenditure, 2),
            'avgPerHead': avg_per_head,
            'period': period,
            'employees': employees,
            'excelAvailable': excel_available
        })
    except Exception as e:
        employees = get_employees()
        return jsonify({
            'totalEmployees': sum(employees.values()),
            'totalExpenditure': 0,
            'avgPerHead': 0,
            'period': 'N/A',
            'employees': employees,
            'excelAvailable': False,
            'error': str(e)
        })


@app.route('/api/employees', methods=['GET'])
def api_employees_get():
    employees = get_employees()
    total = sum(employees.values())
    result = {}
    for nat, count in employees.items():
        result[nat] = {
            'count': count,
            'percentage': round((count / total) * 100, 1) if total > 0 else 0
        }
    return jsonify(result)


@app.route('/api/employees', methods=['POST'])
def api_employees_post():
    data = request.get_json()
    nationality = data.get('nationality')
    count = data.get('count')

    if not nationality or count is None:
        return jsonify({'error': 'nationality and count required'}), 400

    employees = get_employees()
    if nationality not in employees:
        return jsonify({'error': 'Invalid nationality'}), 400

    employees[nationality] = int(count)
    save_employees(employees)

    total = sum(employees.values())
    result = {}
    for nat, c in employees.items():
        result[nat] = {
            'count': c,
            'percentage': round((c / total) * 100, 1) if total > 0 else 0
        }
    return jsonify(result)


@app.route('/api/items')
def api_items():
    nationality = request.args.get('nationality', 'all')
    try:
        result = []
        nats_to_read = SHEETS.keys() if nationality == 'all' else [nationality]
        for nat in nats_to_read:
            if nat not in SHEETS:
                continue
            df = read_sheet(nat)
            if df.empty:
                continue
            for _, row in df.iterrows():
                result.append({
                    'nationality': nat,
                    'item': str(row.get('ITEMS', '')),
                    'qty': float(row.get('QTY', 0)),
                    'unit': str(row.get('UNIT', '')),
                    'unitPrice': float(row.get('UNIT PRICE', 0)),
                    'total': float(row.get('TOTAL', 0))
                })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'data': []})


@app.route('/api/comparison')
def api_comparison():
    try:
        employees = get_employees()
        result = []
        for nat in SHEETS:
            df = read_sheet(nat)
            emp_count = employees.get(nat, 0)
            if not df.empty:
                total_exp = float(df['TOTAL'].sum())
                period = get_period({nat: df})
            else:
                total_exp = 0.0
                period = 'N/A'

            per_head = round(total_exp / emp_count, 2) if emp_count > 0 else 0
            per_day = round(total_exp / 15, 2)

            result.append({
                'nationality': nat,
                'label': LABELS[nat],
                'employees': emp_count,
                'totalExpenditure': round(total_exp, 2),
                'perHead': per_head,
                'perDay': per_day,
                'color': COLORS[nat],
                'period': period
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'data': []})


@app.route('/api/perhead')
def api_perhead():
    nationality = request.args.get('nationality', 'all')
    category = request.args.get('category', 'all')
    try:
        employees = get_employees()

        if nationality == 'all':
            total_emp = sum(employees.values())
            nats = list(SHEETS.keys())
        else:
            total_emp = employees.get(nationality, 0)
            nats = [nationality]

        # Aggregate items across selected nationalities
        item_totals = {}
        for nat in nats:
            if nat not in SHEETS:
                continue
            df = read_sheet(nat)
            if df.empty:
                continue
            for _, row in df.iterrows():
                item = str(row.get('ITEMS', ''))
                total = float(row.get('TOTAL', 0))
                item_totals[item] = item_totals.get(item, 0) + total

        # Filter by category
        if category != 'all' and category in CATEGORY_MAP:
            allowed = CATEGORY_MAP[category]
            item_totals = {k: v for k, v in item_totals.items() if k in allowed}

        result = []
        for item, total in sorted(item_totals.items(), key=lambda x: -x[1]):
            result.append({
                'item': item,
                'perHead': round(total / total_emp, 2) if total_emp > 0 else 0,
                'total': round(total, 2)
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'data': []})


@app.route('/api/trends')
def api_trends():
    nationality = request.args.get('nationality', 'all')
    try:
        employees = get_employees()
        nats = list(SHEETS.keys()) if nationality == 'all' else [nationality]

        # Collect all unique items
        all_items_set = set()
        nat_data = {}
        for nat in nats:
            if nat not in SHEETS:
                continue
            df = read_sheet(nat)
            if df.empty:
                nat_data[nat] = {}
                continue
            item_map = {}
            for _, row in df.iterrows():
                item = str(row.get('ITEMS', ''))
                total = float(row.get('TOTAL', 0))
                item_map[item] = item_map.get(item, 0) + total
                all_items_set.add(item)
            nat_data[nat] = item_map

        all_items = sorted(list(all_items_set))

        datasets = []
        for nat in nats:
            if nat not in nat_data:
                continue
            data = [round(nat_data[nat].get(item, 0), 2) for item in all_items]
            datasets.append({
                'nationality': nat,
                'label': LABELS[nat],
                'data': data,
                'color': COLORS[nat]
            })

        return jsonify({
            'items': all_items,
            'datasets': datasets
        })
    except Exception as e:
        return jsonify({'error': str(e), 'items': [], 'datasets': []})


@app.route('/api/upload', methods=['POST'])
def api_upload():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400

        file = request.files['file']
        filename = file.filename.lower()

        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(file)
        elif filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            return jsonify({'success': False, 'error': 'Unsupported file type'}), 400

        df.columns = [str(c).strip().upper() for c in df.columns]
        records = []
        for _, row in df.iterrows():
            record = {k: (v if not pd.isna(v) else None) for k, v in row.items()}
            records.append(record)

        os.makedirs(os.path.dirname(UPLOADED_DATA_FILE), exist_ok=True)
        with open(UPLOADED_DATA_FILE, 'w') as f:
            json.dump(records, f, default=str)

        return jsonify({'success': True, 'records': len(records)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/report/<report_type>')
def api_report(report_type):
    try:
        employees = get_employees()

        if report_type == 'trend':
            rows = []
            for nat in SHEETS:
                df = read_sheet(nat)
                if not df.empty:
                    total = float(df['TOTAL'].sum())
                    per_day = round(total / 15, 2)
                    rows.append({
                        'Nationality': LABELS[nat],
                        'Total Expenditure': round(total, 2),
                        'Per Day': per_day
                    })
            return jsonify({'type': 'trend', 'columns': ['Nationality', 'Total Expenditure', 'Per Day'], 'rows': rows})

        elif report_type == 'per-head':
            rows = []
            total_emp = sum(employees.values())
            item_totals = {}
            for nat in SHEETS:
                df = read_sheet(nat)
                if df.empty:
                    continue
                for _, row in df.iterrows():
                    item = str(row.get('ITEMS', ''))
                    total = float(row.get('TOTAL', 0))
                    qty = float(row.get('QTY', 0))
                    item_totals[item] = item_totals.get(item, {'total': 0, 'qty': 0})
                    item_totals[item]['total'] += total
                    item_totals[item]['qty'] += qty
            for item, vals in sorted(item_totals.items(), key=lambda x: -x[1]['total']):
                rows.append({
                    'Item': item,
                    'Total Qty': round(vals['qty'], 2),
                    'Total Cost': round(vals['total'], 2),
                    'Per Head Cost': round(vals['total'] / total_emp, 2) if total_emp > 0 else 0
                })
            return jsonify({'type': 'per-head', 'columns': ['Item', 'Total Qty', 'Total Cost', 'Per Head Cost'], 'rows': rows})

        elif report_type == 'comparison':
            rows = []
            grand_total = 0
            for nat in SHEETS:
                df = read_sheet(nat)
                total = float(df['TOTAL'].sum()) if not df.empty else 0
                grand_total += total
            for nat in SHEETS:
                df = read_sheet(nat)
                emp_count = employees.get(nat, 0)
                total = float(df['TOTAL'].sum()) if not df.empty else 0
                per_head = round(total / emp_count, 2) if emp_count > 0 else 0
                pct = round((total / grand_total) * 100, 1) if grand_total > 0 else 0
                rows.append({
                    'Nationality': LABELS[nat],
                    'Employees': emp_count,
                    'Total Spend': round(total, 2),
                    'Per Head': per_head,
                    '% of Total': pct
                })
            return jsonify({'type': 'comparison', 'columns': ['Nationality', 'Employees', 'Total Spend', 'Per Head', '% of Total'], 'rows': rows})

        elif report_type == 'detailed':
            rows = []
            for nat in SHEETS:
                df = read_sheet(nat)
                if df.empty:
                    continue
                period = get_period({nat: df})
                for _, row in df.iterrows():
                    rows.append({
                        'Period': period,
                        'Nationality': LABELS[nat],
                        'Item': str(row.get('ITEMS', '')),
                        'Qty': float(row.get('QTY', 0)),
                        'Unit': str(row.get('UNIT', '')),
                        'Unit Price': float(row.get('UNIT PRICE', 0)),
                        'Total': float(row.get('TOTAL', 0))
                    })
            return jsonify({'type': 'detailed', 'columns': ['Period', 'Nationality', 'Item', 'Qty', 'Unit', 'Unit Price', 'Total'], 'rows': rows})

        else:
            return jsonify({'error': 'Unknown report type'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
