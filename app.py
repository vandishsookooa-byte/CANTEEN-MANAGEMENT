from flask import Flask, render_template
import pandas as pd
from datetime import datetime
import os

app = Flask(__name__)

# Excel file path
EXCEL_FILE = r"C:\Users\transport\Desktop\Canteen Management\Canteen.xlsx"

# Sheet names for different nationalities
SHEET_NAMES = {
    'BLG': 'BANGLADESH',
    'INDIA': 'INDIA',
    'MGL': 'MALAGASY',
    'SL': 'SRI LANKA'
}

def read_excel_data():
    """Read data from Excel file and organize it by sheets"""
    data = {}
    try:
        for sheet_key, sheet_name in SHEET_NAMES.items():
            try:
                df = pd.read_excel(EXCEL_FILE, sheet_name=sheet_name)
                data[sheet_key] = {
                    'name': sheet_name,
                    'dataframe': df,
                    'html_table': df.to_html(classes='table table-striped', index=False)
                }
            except Exception as e:
                print(f"Error reading sheet {sheet_name}: {e}")
    except Exception as e:
        print(f"Error reading Excel file: {e}")
    
    return data

def prepare_dashboard_data():
    """Prepare data for dashboard display"""
    dashboard_data = {
        'bangladeshi': {
            'period': '01.04.2026 - 15.04.2026',
            'statistics': {
                'number_of_people': 335,
                'non_veg': 335,
                'veg': 0,
                'male': 248,
                'female': 87
            },
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
        }
    }
    return dashboard_data

@app.route('/')
def index():
    """Main dashboard route"""
    dashboard_data = prepare_dashboard_data()
    return render_template('dashboard.html', data=dashboard_data)

@app.route('/bangladesh')
def bangladesh():
    """Bangladesh specific view"""
    dashboard_data = prepare_dashboard_data()
    return render_template('bangladesh.html', data=dashboard_data['bangladeshi'])

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
