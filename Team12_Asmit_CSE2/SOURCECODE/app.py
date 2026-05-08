from flask import Flask, render_template, request, redirect, session, url_for, flash, jsonify
import mysql.connector
from datetime import datetime

app = Flask(__name__)
app.secret_key = "super_secret_college_project_key"


last_query_info = {
    'query_code': None,
    'query_explanation': None,
    'executed_at': None,
    'rows_returned': 0
}

def get_connection():
    return mysql.connector.connect(
        host="localhost", user="root", password="Vkg@1976", database="FarmerMarketplace"
    )

def get_query_explanation(query):
  
    query_upper = query.upper()


def run_query(query, params=None, fetch=True, explanation=None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params or ())
    data = cursor.fetchall() if fetch else None
    if not fetch:
        conn.commit()
    

    global last_query_info
    last_query_info['query_code'] = query
    last_query_info['query_explanation'] = explanation or get_query_explanation(query)
    last_query_info['executed_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    last_query_info['rows_returned'] = len(data) if data else 0
    
    cursor.close()
    conn.close()
    return data



@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        role = request.form['role']
        identifier = request.form.get('identifier') or request.form.get('phone')

        if role == 'admin':
            if identifier == 'admin123':
                session['role'] = 'admin'
                session['user_name'] = 'Administrator'
                return redirect(url_for('admin_dashboard'))
            else:
                flash("Invalid Admin Password.")
                return redirect(url_for('login'))

        elif role == 'farmer':
            user = run_query("SELECT FarmerID, FarmerName FROM Farmer WHERE Phone = %s", (identifier,))
            if user:
                session['user_id'] = user[0]['FarmerID']
                session['user_name'] = user[0]['FarmerName']
                session['role'] = 'farmer'
                return redirect(url_for('farmer_dashboard'))
        
        elif role == 'buyer':
            user = run_query("SELECT BuyerID, BuyerName FROM Buyer WHERE Phone = %s", (identifier,))
            if user:
                session['user_id'] = user[0]['BuyerID']
                session['user_name'] = user[0]['BuyerName']
                session['role'] = 'buyer'
                return redirect(url_for('buyer_dashboard'))

        flash("Invalid Credentials. Please try again.")
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        role = request.form['role']
        name = request.form['name']
        phone = request.form['phone']

        try:
            if role == 'farmer':
                village = request.form.get('village', '')
                state = request.form.get('state', '')
                bank = request.form['bank']
                
                run_query("""
                    INSERT INTO Farmer (FarmerName, Phone, Village, State, BankAccNo) 
                    VALUES (%s, %s, %s, %s, %s)
                """, (name, phone, village, state, bank), fetch=False)
                
            elif role == 'buyer':
                email = request.form.get('email', '')
                address = request.form['address']
                
                run_query("""
                    INSERT INTO Buyer (BuyerName, Phone, Email, Address) 
                    VALUES (%s, %s, %s, %s)
                """, (name, phone, email, address), fetch=False)

            flash("Registration successful! You can now log in.")
            return redirect(url_for('login'))

        except mysql.connector.IntegrityError:
            flash("Error: This phone number is already registered.")
            return redirect(url_for('register'))
        except Exception as e:
            flash(f"An error occurred: {e}")
            return redirect(url_for('register'))

    return render_template('register.html')


def is_admin():
    return 'role' in session and session['role'] == 'admin'

@app.route('/admin')
def admin_dashboard():
    if not is_admin():
        return redirect(url_for('login'))

    return render_template('dashboard.html', 
                           data=None, 
                           is_home=True, 
                           title="Farmer To Buyer Marketplace", 
                           description="Admin hub to manage farmer listings, buyer orders, payments, deliveries, and revenue reports.")

@app.route('/search_farmer')
def search_farmer():
    if not is_admin(): return redirect(url_for('login'))
    
    search_by = request.args.get('search_by')
    query_val = request.args.get('query')
    
    if search_by == 'id':
        q = """SELECT f.FarmerID AS 'Farmer ID', f.FarmerName AS 'Name', f.Phone, 
                      p.ProductID AS 'Product ID', p.ProductName AS 'Product', p.QtyAvailable AS 'Stock (kg)', p.UnitPrice AS 'Price (₹)' 
               FROM Farmer f LEFT JOIN Product p ON f.FarmerID = p.FarmerID 
               WHERE f.FarmerID = %s"""
        data = run_query(q, (query_val,))
    else:
        q = """SELECT f.FarmerID AS 'Farmer ID', f.FarmerName AS 'Name', f.Phone, 
                      p.ProductID AS 'Product ID', p.ProductName AS 'Product', p.QtyAvailable AS 'Stock (kg)', p.UnitPrice AS 'Price (₹)' 
               FROM Farmer f LEFT JOIN Product p ON f.FarmerID = p.FarmerID 
               WHERE f.FarmerName LIKE %s"""
        data = run_query(q, ('%' + query_val + '%',))
        
    return render_template('dashboard.html', data=data, is_home=False, title=f"Farmer Search: '{query_val}'", description="Showing farmer details and their listed items.")


@app.route('/search_buyer')
def search_buyer():
    if not is_admin(): return redirect(url_for('login'))
    
    search_by = request.args.get('search_by')
    query_val = request.args.get('query')
    
    if search_by == 'id':
        q = """SELECT b.BuyerID AS 'Buyer ID', b.BuyerName AS 'Name', b.Phone, 
                      o.OrderID AS 'Order ID', o.OrderDate AS 'Date', o.TotalAmt AS 'Total (₹)', o.OrderStatus AS 'Status'
               FROM Buyer b LEFT JOIN `Order` o ON b.BuyerID = o.BuyerID
               WHERE b.BuyerID = %s"""
        data = run_query(q, (query_val,))
    else:
        q = """SELECT b.BuyerID AS 'Buyer ID', b.BuyerName AS 'Name', b.Phone, 
                      o.OrderID AS 'Order ID', o.OrderDate AS 'Date', o.TotalAmt AS 'Total (₹)', o.OrderStatus AS 'Status'
               FROM Buyer b LEFT JOIN `Order` o ON b.BuyerID = o.BuyerID
               WHERE b.BuyerName LIKE %s"""
        data = run_query(q, ('%' + query_val + '%',))
        
    return render_template('dashboard.html', data=data, is_home=False, title=f"Buyer Search: '{query_val}'", description="Showing buyer details and their order history.")

@app.route('/search_order')
def search_order():
    if not is_admin(): return redirect(url_for('login'))
    
    query_val = request.args.get('query')
    
    q = """
        SELECT o.OrderID AS 'Order ID', b.BuyerName AS 'Buyer', f.FarmerName AS 'Farmer', 
               p.ProductName AS 'Item', oi.QtyOrdered AS 'Qty', o.TotalAmt AS 'Total (₹)', 
               o.OrderStatus AS 'Order Status', d.DeliveryStatus AS 'Delivery', pay.PaymentStatus AS 'Payment'
        FROM `Order` o
        JOIN Buyer b ON o.BuyerID = b.BuyerID
        JOIN OrderItem oi ON o.OrderID = oi.OrderID
        JOIN Product p ON oi.ProductID = p.ProductID
        JOIN Farmer f ON p.FarmerID = f.FarmerID
        LEFT JOIN Delivery d ON o.OrderID = d.OrderID
        LEFT JOIN Payment pay ON o.OrderID = pay.OrderID
        WHERE o.OrderID = %s
    """
    data = run_query(q, (query_val,))
    return render_template('dashboard.html', data=data, is_home=False, title=f"Order Tracking: #{query_val}", description="Complete tracking details for this specific order.")


@app.route('/buyers')
def buyers():
    if not is_admin(): return redirect(url_for('login'))
    query = "SELECT BuyerID AS 'ID', BuyerName AS 'Name', Phone, Email, Address FROM Buyer"
    return render_template('dashboard.html', data=run_query(query), title="Registered Buyers", description="Complete directory of all buyers on the platform.")

@app.route('/farmers')
def farmers():
    if not is_admin(): return redirect(url_for('login'))
    query = "SELECT FarmerID AS 'ID', FarmerName AS 'Name', Phone, Village, State, BankAccNo AS 'Bank Account' FROM Farmer"
    return render_template('dashboard.html', data=run_query(query), title="Registered Farmers", description="Complete directory of all registered farmers and their details.")

@app.route('/products')
def products():
    if not is_admin():
        return redirect(url_for('login'))

    category = request.args.get('category', '')
    farmer = request.args.get('farmer', '')
    min_price = request.args.get('min_price', '')
    max_price = request.args.get('max_price', '')

    query = """
    SELECT p.ProductID AS 'ID', p.ProductName AS 'Product', c.CategoryName AS 'Category', 
           p.UnitPrice AS 'Price (₹)', f.FarmerName AS 'Farmer', p.QtyAvailable AS 'Stock (kg)'
    FROM Product p
    JOIN Farmer f ON p.FarmerID = f.FarmerID
    JOIN Category c ON p.CategoryID = c.CategoryID
    WHERE 1=1
    """
    params = []

    if category:
        query += " AND c.CategoryName = %s"
        params.append(category)
    if farmer:
        query += " AND f.FarmerName LIKE %s"
        params.append('%' + farmer + '%')
    if min_price:
        query += " AND p.UnitPrice >= %s"
        params.append(min_price)
    if max_price:
        query += " AND p.UnitPrice <= %s"
        params.append(max_price)

    query += " ORDER BY p.ProductName ASC"

    categories = run_query("SELECT DISTINCT CategoryName FROM Category ORDER BY CategoryName")
    farmers = run_query("SELECT DISTINCT FarmerName FROM Farmer ORDER BY FarmerName")

    return render_template(
        'dashboard.html',
        data=run_query(query, params if params else None),
        title="Product Inventory",
        description="Shows a list of products, categories, pricing, and stock with filtering options.",
        filters={
            'action': url_for('products'),
            'fields': [
                {'name': 'category', 'label': 'Category', 'type': 'select', 'options': categories, 'value': category, 'option_key': 'CategoryName', 'include_empty': 'All Categories'},
                {'name': 'farmer', 'label': 'Farmer Name', 'type': 'text', 'value': farmer, 'placeholder': 'Partial name...'},
                {'name': 'min_price', 'label': 'Min Price (₹)', 'type': 'number', 'value': min_price, 'step': '0.01'},
                {'name': 'max_price', 'label': 'Max Price (₹)', 'type': 'number', 'value': max_price, 'step': '0.01'}
            ]
        }
    )

@app.route('/orders')
def view_orders():
    if not is_admin(): return redirect(url_for('login'))
    status = request.args.get('status', '')
    buyer = request.args.get('buyer', '')
    date_start = request.args.get('date_start', '')
    date_end = request.args.get('date_end', '')

    query = """
        SELECT o.OrderID, b.BuyerName, o.OrderDate, o.TotalAmt, o.OrderStatus 
        FROM `Order` o
        JOIN Buyer b ON o.BuyerID = b.BuyerID
        WHERE 1=1
    """
    params = []

    if status:
        query += " AND o.OrderStatus = %s"
        params.append(status)
    if buyer:
        query += " AND b.BuyerName LIKE %s"
        params.append('%' + buyer + '%')
    if date_start:
        query += " AND o.OrderDate >= %s"
        params.append(date_start)
    if date_end:
        query += " AND o.OrderDate <= %s"
        params.append(date_end)

    query += " ORDER BY o.OrderDate DESC"

    statuses = run_query("SELECT DISTINCT OrderStatus FROM `Order` ORDER BY OrderStatus")
    buyers = run_query("SELECT DISTINCT BuyerName FROM Buyer ORDER BY BuyerName")

    return render_template(
        'dashboard.html',
        title="All Orders",
        description="Recent transactions with advanced filters.",
        data=run_query(query, params if params else None),
        filters={
            'action': url_for('view_orders'),
            'fields': [
                {'name': 'status', 'label': 'Order Status', 'type': 'select', 'options': statuses, 'value': status, 'option_key': 'OrderStatus'},
                {'name': 'buyer', 'label': 'Buyer Name', 'type': 'text', 'value': buyer, 'placeholder': 'Partial buyer name...'},
                {'name': 'date_start', 'label': 'Start Date', 'type': 'date', 'value': date_start},
                {'name': 'date_end', 'label': 'End Date', 'type': 'date', 'value': date_end}
            ]
        }
    )

@app.route('/sales')
def farmer_sales():
    if not is_admin():
        return redirect(url_for('login'))

    farmer = request.args.get('farmer', '')
    date_start = request.args.get('date_start', '')
    date_end = request.args.get('date_end', '')
    min_sales = request.args.get('min_sales', '')
    max_sales = request.args.get('max_sales', '')

    query = """
        SELECT f.FarmerName, SUM(oi.QtyOrdered * oi.PriceAtPurchase) AS TotalSales
        FROM Farmer f
        JOIN Product p ON f.FarmerID = p.FarmerID
        JOIN OrderItem oi ON p.ProductID = oi.ProductID
        JOIN `Order` o ON oi.OrderID = o.OrderID
        WHERE o.OrderStatus = 'Completed'
    """
    params = []

    if farmer:
        query += " AND f.FarmerName LIKE %s"
        params.append('%' + farmer + '%')
    if date_start:
        query += " AND o.OrderDate >= %s"
        params.append(date_start)
    if date_end:
        query += " AND o.OrderDate <= %s"
        params.append(date_end)

    query += " GROUP BY f.FarmerID"

    having_clauses = []
    if min_sales:
        having_clauses.append("SUM(oi.QtyOrdered * oi.PriceAtPurchase) >= %s")
        params.append(min_sales)
    if max_sales:
        having_clauses.append("SUM(oi.QtyOrdered * oi.PriceAtPurchase) <= %s")
        params.append(max_sales)

    if having_clauses:
        query += " HAVING " + " AND ".join(having_clauses)

    query += " ORDER BY TotalSales DESC"

    farmers = run_query("SELECT DISTINCT FarmerName FROM Farmer ORDER BY FarmerName")

    return render_template(
        'dashboard.html',
        title="Farmer Sales",
        description="Revenue dashboard with filter options for farmers and time range.",
        data=run_query(query, params if params else None),
        filters={
            'action': url_for('farmer_sales'),
            'fields': [
                {'name': 'farmer', 'label': 'Farmer Name', 'type': 'text', 'value': farmer, 'placeholder': 'Partial farmer name...'},
                {'name': 'date_start', 'label': 'Start Date', 'type': 'date', 'value': date_start},
                {'name': 'date_end', 'label': 'End Date', 'type': 'date', 'value': date_end},
                {'name': 'min_sales', 'label': 'Min Revenue (₹)', 'type': 'number', 'value': min_sales, 'step': '0.01'},
                {'name': 'max_sales', 'label': 'Max Revenue (₹)', 'type': 'number', 'value': max_sales, 'step': '0.01'}
            ]
        }
    )

@app.route('/expensive')
def max_price_item():
    if not is_admin():
        return redirect(url_for('login'))
    query = """
        SELECT p.ProductName, p.UnitPrice, f.FarmerName, c.CategoryName
        FROM Product p
        JOIN Farmer f ON p.FarmerID = f.FarmerID
        JOIN Category c ON p.CategoryID = c.CategoryID
        ORDER BY p.UnitPrice DESC
        LIMIT 1
    """
    return render_template('dashboard.html', title="Most Expensive Item", description="Highest priced product.", data=run_query(query))

@app.route('/delivery')
def pending_delivery():
    if not is_admin():
        return redirect(url_for('login'))

    status = request.args.get('status', '')
    partner = request.args.get('partner', '')

    query = """
        SELECT d.DeliveryID, o.OrderID, b.BuyerName, d.DeliveryPartner, d.DeliveryStatus 
        FROM Delivery d
        JOIN `Order` o ON d.OrderID = o.OrderID
        JOIN Buyer b ON o.BuyerID = b.BuyerID
        WHERE 1=1
    """
    params = []

    if status:
        query += " AND d.DeliveryStatus = %s"
        params.append(status)
    else:
        query += " AND d.DeliveryStatus != 'Delivered'"

    if partner:
        query += " AND d.DeliveryPartner LIKE %s"
        params.append('%' + partner + '%')

    query += " ORDER BY d.DeliveryID DESC"

    statuses = run_query("SELECT DISTINCT DeliveryStatus FROM Delivery ORDER BY DeliveryStatus")
    partners = run_query("SELECT DISTINCT DeliveryPartner FROM Delivery ORDER BY DeliveryPartner")

    return render_template(
        'dashboard.html',
        data=run_query(query, params if params else None),
        title="Deliveries",
        description="Delivery records with status and partner filters.",
        filters={
            'action': url_for('pending_delivery'),
            'fields': [
                {'name': 'status', 'label': 'Delivery Status', 'type': 'select', 'options': statuses, 'value': status, 'option_key': 'DeliveryStatus', 'include_empty': 'Pending / All'},
                {'name': 'partner', 'label': 'Delivery Partner', 'type': 'text', 'value': partner, 'placeholder': 'Partial partner name...'}
            ]
        }
    )

@app.route('/payment')
def payments():
    if not is_admin():
        return redirect(url_for('login'))

    payment_status = request.args.get('status', '')
    payment_method = request.args.get('method', '')
    min_amt = request.args.get('min_amt', '')
    max_amt = request.args.get('max_amt', '')

    query = """
        SELECT p.PaymentID, o.OrderID, b.BuyerName, p.Amount, p.PaymentMethod, p.PaymentStatus 
        FROM Payment p
        JOIN `Order` o ON p.OrderID = o.OrderID
        JOIN Buyer b ON o.BuyerID = b.BuyerID
        WHERE 1=1
    """
    params = []

    if payment_status:
        query += " AND p.PaymentStatus = %s"
        params.append(payment_status)
    if payment_method:
        query += " AND p.PaymentMethod = %s"
        params.append(payment_method)
    if min_amt:
        query += " AND p.Amount >= %s"
        params.append(min_amt)
    if max_amt:
        query += " AND p.Amount <= %s"
        params.append(max_amt)

    query += " ORDER BY p.PaymentID DESC"

    statuses = run_query("SELECT DISTINCT PaymentStatus FROM Payment ORDER BY PaymentStatus")
    methods = run_query("SELECT DISTINCT PaymentMethod FROM Payment ORDER BY PaymentMethod")

    return render_template(
        'dashboard.html',
        data=run_query(query, params if params else None),
        title="Payments",
        description="Payment records with status, method, and amount filters.",
        filters={
            'action': url_for('payments'),
            'fields': [
                {'name': 'status', 'label': 'Payment Status', 'type': 'select', 'options': statuses, 'value': payment_status, 'option_key': 'PaymentStatus', 'include_empty': 'All Statuses'},
                {'name': 'method', 'label': 'Payment Method', 'type': 'select', 'options': methods, 'value': payment_method, 'option_key': 'PaymentMethod', 'include_empty': 'All Methods'},
                {'name': 'min_amt', 'label': 'Min Amount (₹)', 'type': 'number', 'value': min_amt, 'step': '0.01'},
                {'name': 'max_amt', 'label': 'Max Amount (₹)', 'type': 'number', 'value': max_amt, 'step': '0.01'}
            ]
        }
    )



@app.route('/farmer', methods=['GET', 'POST'])
def farmer_dashboard():
    if 'role' not in session or session['role'] != 'farmer':
        return redirect(url_for('login'))
    
    farmer_id = session['user_id']

    if request.method == 'POST':
     
        if 'product_name' in request.form:
            name = request.form['product_name']
            qty = request.form['qty']
            price = request.form['price']
            category = request.form['category_id']
            run_query(
                "INSERT INTO Product (FarmerID, CategoryID, ProductName, QtyAvailable, UnitPrice) VALUES (%s, %s, %s, %s, %s)", 
                (farmer_id, category, name, qty, price), fetch=False
            )
            flash("Product added successfully!")

        elif 'mark_shipped_order_id' in request.form:
            order_id = request.form['mark_shipped_order_id']
            run_query("UPDATE `Order` SET OrderStatus = 'Shipped' WHERE OrderID = %s", (order_id,), fetch=False)
            run_query("UPDATE Delivery SET DeliveryStatus = 'Shipped', DispatchDate = CURRENT_DATE() WHERE OrderID = %s", (order_id,), fetch=False)
            flash("Order marked as Shipped!")

        return redirect(url_for('farmer_dashboard'))

    my_products = run_query("SELECT * FROM Product WHERE FarmerID = %s", (farmer_id,))
    my_orders = run_query("""
        SELECT o.OrderID, p.ProductName, oi.QtyOrdered, o.OrderDate, o.OrderStatus 
        FROM OrderItem oi 
        JOIN Product p ON oi.ProductID = p.ProductID 
        JOIN `Order` o ON oi.OrderID = o.OrderID 
        WHERE p.FarmerID = %s ORDER BY o.OrderDate DESC
    """, (farmer_id,))

    return render_template('portal.html', products=my_products, orders=my_orders)



@app.route('/buyer', methods=['GET', 'POST'])
def buyer_dashboard():
    if 'role' not in session or session['role'] != 'buyer':
        return redirect(url_for('login'))
    
    buyer_id = session['user_id']

    if request.method == 'POST':
        
  
        if 'cancel_order_id' in request.form:
            order_id = request.form['cancel_order_id']
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute("SELECT ProductID, QtyOrdered FROM OrderItem WHERE OrderID = %s", (order_id,))
                items = cursor.fetchall()
                for item in items:
                    cursor.execute("UPDATE Product SET QtyAvailable = QtyAvailable + %s WHERE ProductID = %s", (item['QtyOrdered'], item['ProductID']))
                cursor.execute("UPDATE `Order` SET OrderStatus = 'Cancelled' WHERE OrderID = %s", (order_id,))
                conn.commit()
                flash("Order successfully cancelled and stock restored.")
            except Exception as e:
                conn.rollback()
                flash("Error cancelling order.")
            finally:
                cursor.close()
                conn.close()

     
        elif 'mark_delivered_order_id' in request.form:
            order_id = request.form['mark_delivered_order_id']
            run_query("UPDATE `Order` SET OrderStatus = 'Completed' WHERE OrderID = %s", (order_id,), fetch=False)
            run_query("UPDATE Delivery SET DeliveryStatus = 'Delivered', DeliveryDate = CURRENT_DATE() WHERE OrderID = %s", (order_id,), fetch=False)
            flash("Order marked as Delivered!")

       
        elif 'pay_order_id' in request.form:
            order_id = request.form['pay_order_id']
            method = request.form['payment_method']
            status = 'Completed' if method != 'Pay Later' else 'Pending'
         
            if method != 'Pay Later':
                run_query("UPDATE Payment SET PaymentMethod = %s, PaymentStatus = %s, PaymentDate = CURRENT_TIMESTAMP WHERE OrderID = %s", (method, status, order_id), fetch=False)
                flash(f"Payment of {method} was successful!")


        elif 'product_id' in request.form:
            product_id = request.form['product_id']
            qty_to_buy = float(request.form['qty'])
            
            product = run_query("SELECT QtyAvailable, UnitPrice FROM Product WHERE ProductID = %s", (product_id,))[0]
            if product['QtyAvailable'] >= qty_to_buy:
                total_amt = qty_to_buy * float(product['UnitPrice'])
                
                conn = get_connection()
                cursor = conn.cursor()
                try:
                    cursor.execute("INSERT INTO `Order` (BuyerID, TotalAmt) VALUES (%s, %s)", (buyer_id, total_amt))
                    order_id = cursor.lastrowid
                    cursor.execute("INSERT INTO OrderItem (OrderID, ProductID, QtyOrdered, PriceAtPurchase) VALUES (%s, %s, %s, %s)", 
                                   (order_id, product_id, qty_to_buy, product['UnitPrice']))
                    cursor.execute("UPDATE Product SET QtyAvailable = QtyAvailable - %s WHERE ProductID = %s", (qty_to_buy, product_id))
                    
        
                    cursor.execute("INSERT INTO Delivery (OrderID, DeliveryPartner, DeliveryStatus) VALUES (%s, 'Local Transport', 'Processing')", (order_id,))
                    cursor.execute("INSERT INTO Payment (OrderID, Amount, PaymentMethod, PaymentStatus) VALUES (%s, %s, 'Pending', 'Pending')", (order_id, total_amt))
                    
                    conn.commit()
                    flash("Order placed successfully!")
                except Exception as e:
                    conn.rollback()
                    flash("Error placing order.")
                finally:
                    cursor.close()
                    conn.close()
            else:
                flash("Not enough stock available.")
                
        return redirect(url_for('buyer_dashboard'))


    search_query = request.args.get('search', '')
    category_filter = request.args.get('category', '')
    sort_by = request.args.get('sort', 'name')  

    query = """
        SELECT p.ProductID, p.ProductName, p.QtyAvailable, p.UnitPrice, f.FarmerName, c.CategoryName
        FROM Product p 
        JOIN Farmer f ON p.FarmerID = f.FarmerID 
        JOIN Category c ON p.CategoryID = c.CategoryID 
        WHERE p.QtyAvailable > 0
    """
    params = []
    
    if search_query:
        query += " AND (p.ProductName LIKE %s OR f.FarmerName LIKE %s OR c.CategoryName LIKE %s)"
        search_param = f"%{search_query}%"
        params.extend([search_param, search_param, search_param])
    
    if category_filter:
        query += " AND c.CategoryName = %s"
        params.append(category_filter)
    

    if sort_by == 'price_low':
        query += " ORDER BY p.UnitPrice ASC"
    elif sort_by == 'price_high':
        query += " ORDER BY p.UnitPrice DESC"
    else:
        query += " ORDER BY p.ProductName ASC"
    
    available_products = run_query(query, params if params else None)

    categories = run_query("SELECT DISTINCT CategoryName FROM Category ORDER BY CategoryName")
    

    my_history = run_query("""
        SELECT o.OrderID, o.OrderDate, o.TotalAmt, o.OrderStatus, p.ProductName, oi.QtyOrdered,
               pay.PaymentStatus, pay.PaymentMethod
        FROM `Order` o
        JOIN OrderItem oi ON o.OrderID = oi.OrderID 
        JOIN Product p ON oi.ProductID = p.ProductID
        LEFT JOIN Payment pay ON o.OrderID = pay.OrderID
        WHERE o.BuyerID = %s 
        ORDER BY o.OrderDate DESC
    """, (buyer_id,))


    return render_template('portal.html', available_products=available_products, my_history=my_history)



@app.route('/api/query_details')
def get_query_details():
    """API endpoint to retrieve last executed query details"""
    return jsonify(last_query_info)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)