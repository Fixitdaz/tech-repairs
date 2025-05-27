// Tech Repairs - SQLite Database Handler
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        this.dbPath = path.join(dataDir, 'techrepairs.db');
        this.db = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            const tables = [
                `CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT,
                    phone TEXT,
                    address TEXT,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                
                `CREATE TABLE IF NOT EXISTS tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER,
                    device_type TEXT NOT NULL,
                    device_model TEXT,
                    issue_description TEXT NOT NULL,
                    status TEXT DEFAULT 'Open',
                    priority TEXT DEFAULT 'Medium',
                    estimated_cost REAL,
                    actual_cost REAL,
                    technician TEXT,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    completed_at DATETIME,
                    FOREIGN KEY (customer_id) REFERENCES customers (id)
                )`,
                
                `CREATE TABLE IF NOT EXISTS inventory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    category TEXT,
                    description TEXT,
                    sku TEXT UNIQUE,
                    quantity INTEGER DEFAULT 0,
                    min_quantity INTEGER DEFAULT 5,
                    cost_price REAL,
                    sell_price REAL,
                    supplier TEXT,
                    location TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                
                `CREATE TABLE IF NOT EXISTS invoices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id INTEGER,
                    customer_id INTEGER,
                    invoice_number TEXT UNIQUE,
                    amount REAL NOT NULL,
                    tax_amount REAL DEFAULT 0,
                    total_amount REAL NOT NULL,
                    status TEXT DEFAULT 'Pending',
                    due_date DATE,
                    paid_date DATE,
                    payment_method TEXT,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (ticket_id) REFERENCES tickets (id),
                    FOREIGN KEY (customer_id) REFERENCES customers (id)
                )`,
                
                `CREATE TABLE IF NOT EXISTS invoice_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    invoice_id INTEGER,
                    description TEXT NOT NULL,
                    quantity INTEGER DEFAULT 1,
                    unit_price REAL NOT NULL,
                    total_price REAL NOT NULL,
                    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
                )`,
                
                `CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,

                `CREATE TABLE IF NOT EXISTS ticket_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id INTEGER,
                    status_from TEXT,
                    status_to TEXT,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (ticket_id) REFERENCES tickets (id)
                )`
            ];

            let completed = 0;
            const total = tables.length;

            tables.forEach(tableSQL => {
                this.db.run(tableSQL, (err) => {
                    if (err) {
                        console.error('Error creating table:', err);
                        reject(err);
                        return;
                    }
                    
                    completed++;
                    if (completed === total) {
                        this.insertDefaultSettings().then(() => {
                            console.log('Database tables created successfully');
                            resolve();
                        }).catch(reject);
                    }
                });
            });
        });
    }

    insertDefaultSettings() {
        return new Promise((resolve, reject) => {
            const defaultSettings = [
                ['company_name', 'Tech Repairs'],
                ['company_address', '123 Main St, City, State 12345'],
                ['company_phone', '(555) 123-4567'],
                ['company_email', 'info@techrepairs.com'],
                ['tax_rate', '8.5'],
                ['currency', 'USD'],
                ['invoice_prefix', 'INV-'],
                ['ticket_prefix', 'TKT-']
            ];

            let completed = 0;
            const total = defaultSettings.length;

            defaultSettings.forEach(([key, value]) => {
                this.db.run(
                    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
                    [key, value],
                    (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        completed++;
                        if (completed === total) {
                            resolve();
                        }
                    }
                );
            });
        });
    }

    // Generic query methods
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Database run error:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Database get error:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Customer methods
    async getCustomers() {
        return this.query(`
            SELECT c.*, 
                   COUNT(t.id) as ticket_count,
                   COALESCE(SUM(CASE WHEN i.status = 'Paid' THEN i.total_amount ELSE 0 END), 0) as total_spent
            FROM customers c
            LEFT JOIN tickets t ON c.id = t.customer_id
            LEFT JOIN invoices i ON c.id = i.customer_id
            GROUP BY c.id
            ORDER BY c.name
        `);
    }

    async getCustomerById(id) {
        return this.get('SELECT * FROM customers WHERE id = ?', [id]);
    }

    async addCustomer(customer) {
        const { name, email, phone, address, notes } = customer;
        return this.run(
            'INSERT INTO customers (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, address, notes]
        );
    }

    async updateCustomer(id, customer) {
        const { name, email, phone, address, notes } = customer;
        return this.run(
            'UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, email, phone, address, notes, id]
        );
    }

    async deleteCustomer(id) {
        // Check if customer has tickets
        const tickets = await this.query('SELECT id FROM tickets WHERE customer_id = ?', [id]);
        if (tickets.length > 0) {
            throw new Error('Cannot delete customer with existing tickets');
        }
        return this.run('DELETE FROM customers WHERE id = ?', [id]);
    }

    // Ticket methods
    async getTickets() {
        return this.query(`
            SELECT t.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
            FROM tickets t
            LEFT JOIN customers c ON t.customer_id = c.id
            ORDER BY t.created_at DESC
        `);
    }

    async getTicketById(id) {
        return this.get(`
            SELECT t.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
            FROM tickets t
            LEFT JOIN customers c ON t.customer_id = c.id
            WHERE t.id = ?
        `, [id]);
    }

    async getTicketsByCustomer(customerId) {
        return this.query('SELECT * FROM tickets WHERE customer_id = ? ORDER BY created_at DESC', [customerId]);
    }

    async addTicket(ticket) {
        const { customer_id, device_type, device_model, issue_description, priority, estimated_cost, technician, notes } = ticket;
        return this.run(`
            INSERT INTO tickets 
            (customer_id, device_type, device_model, issue_description, priority, estimated_cost, technician, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [customer_id, device_type, device_model, issue_description, priority, estimated_cost, technician, notes]);
    }

    async updateTicket(id, ticket) {
        const { device_type, device_model, issue_description, status, priority, estimated_cost, actual_cost, technician, notes } = ticket;
        
        // Get current ticket for history
        const currentTicket = await this.getTicketById(id);
        
        const result = await this.run(`
            UPDATE tickets SET 
            device_type = ?, device_model = ?, issue_description = ?, status = ?, priority = ?, 
            estimated_cost = ?, actual_cost = ?, technician = ?, notes = ?, 
            updated_at = CURRENT_TIMESTAMP,
            completed_at = CASE WHEN ? = 'Completed' AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END
            WHERE id = ?
        `, [device_type, device_model, issue_description, status, priority, estimated_cost, actual_cost, technician, notes, status, id]);

        // Add to history if status changed
        if (currentTicket && currentTicket.status !== status) {
            await this.addTicketHistory(id, currentTicket.status, status, `Status changed by system`);
        }

        return result;
    }

    async addTicketHistory(ticketId, statusFrom, statusTo, notes) {
        return this.run(
            'INSERT INTO ticket_history (ticket_id, status_from, status_to, notes) VALUES (?, ?, ?, ?)',
            [ticketId, statusFrom, statusTo, notes]
        );
    }

    async getTicketHistory(ticketId) {
        return this.query(
            'SELECT * FROM ticket_history WHERE ticket_id = ? ORDER BY created_at DESC',
            [ticketId]
        );
    }

    // Inventory methods
    async getInventory() {
        return this.query('SELECT * FROM inventory ORDER BY name');
    }

    async getInventoryById(id) {
        return this.get('SELECT * FROM inventory WHERE id = ?', [id]);
    }

    async getLowStockItems() {
        return this.query('SELECT * FROM inventory WHERE quantity <= min_quantity ORDER BY quantity');
    }

    async addInventoryItem(item) {
        const { name, category, description, sku, quantity, min_quantity, cost_price, sell_price, supplier, location } = item;
        return this.run(`
            INSERT INTO inventory 
            (name, category, description, sku, quantity, min_quantity, cost_price, sell_price, supplier, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, category, description, sku, quantity, min_quantity, cost_price, sell_price, supplier, location]);
    }

    async updateInventoryItem(id, item) {
        const { name, category, description, sku, quantity, min_quantity, cost_price, sell_price, supplier, location } = item;
        return this.run(`
            UPDATE inventory SET 
            name = ?, category = ?, description = ?, sku = ?, quantity = ?, min_quantity = ?,
            cost_price = ?, sell_price = ?, supplier = ?, location = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [name, category, description, sku, quantity, min_quantity, cost_price, sell_price, supplier, location, id]);
    }

    async adjustInventoryStock(id, quantityChange, reason = 'Manual adjustment') {
        const item = await this.getInventoryById(id);
        if (!item) throw new Error('Item not found');
        
        const newQuantity = item.quantity + quantityChange;
        if (newQuantity < 0) throw new Error('Insufficient stock');
        
        return this.run(
            'UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newQuantity, id]
        );
    }

    async deleteInventoryItem(id) {
        return this.run('DELETE FROM inventory WHERE id = ?', [id]);
    }

    // Invoice methods
    async getInvoices() {
        return this.query(`
            SELECT i.*, c.name as customer_name, c.email as customer_email
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            ORDER BY i.created_at DESC
        `);
    }

    async getInvoiceById(id) {
        return this.get(`
            SELECT i.*, c.name as customer_name, c.email as customer_email, c.address as customer_address
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            WHERE i.id = ?
        `, [id]);
    }

    async getInvoiceItems(invoiceId) {
        return this.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
    }

    async addInvoice(invoice) {
        const { ticket_id, customer_id, amount, tax_amount, total_amount, due_date, notes } = invoice;
        
        // Generate invoice number
        const invoiceNumber = await this.generateInvoiceNumber();
        
        return this.run(`
            INSERT INTO invoices 
            (ticket_id, customer_id, invoice_number, amount, tax_amount, total_amount, due_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [ticket_id, customer_id, invoiceNumber, amount, tax_amount, total_amount, due_date, notes]);
    }

    async updateInvoice(id, invoice) {
        const { amount, tax_amount, total_amount, status, due_date, paid_date, payment_method, notes } = invoice;
        return this.run(`
            UPDATE invoices SET 
            amount = ?, tax_amount = ?, total_amount = ?, status = ?, due_date = ?, 
            paid_date = ?, payment_method = ?, notes = ?
            WHERE id = ?
        `, [amount, tax_amount, total_amount, status, due_date, paid_date, payment_method, notes, id]);
    }

    async addInvoiceItem(invoiceId, item) {
        const { description, quantity, unit_price, total_price } = item;
        return this.run(
            'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
            [invoiceId, description, quantity, unit_price, total_price]
        );
    }

    async generateInvoiceNumber() {
        const settings = await this.getSettings();
        const prefix = settings.invoice_prefix || 'INV-';
        const lastInvoice = await this.get('SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1');
        
        let number = 1;
        if (lastInvoice && lastInvoice.invoice_number) {
            const lastNumber = parseInt(lastInvoice.invoice_number.replace(prefix, ''));
            number = lastNumber + 1;
        }
        
        return prefix + number.toString().padStart(4, '0');
    }

    // Settings methods
    async getSettings() {
        const rows = await this.query('SELECT key, value FROM settings');
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    }

    async getSetting(key) {
        const row = await this.get('SELECT value FROM settings WHERE key = ?', [key]);
        return row ? row.value : null;
    }

    async setSetting(key, value) {
        return this.run(
            'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            [key, value]
        );
    }

    // Reporting methods
    async getDashboardStats() {
        const stats = {};
        
        // Total revenue
        const revenueResult = await this.get(`
            SELECT COALESCE(SUM(total_amount), 0) as total_revenue 
            FROM invoices WHERE status = 'Paid'
        `);
        stats.totalRevenue = revenueResult.total_revenue;
        
        // Active tickets
        const activeTicketsResult = await this.get(`
            SELECT COUNT(*) as active_tickets 
            FROM tickets WHERE status != 'Completed'
        `);
        stats.activeTickets = activeTicketsResult.active_tickets;
        
        // Total customers
        const customersResult = await this.get('SELECT COUNT(*) as total_customers FROM customers');
        stats.totalCustomers = customersResult.total_customers;
        
        // Completed today
        const completedTodayResult = await this.get(`
            SELECT COUNT(*) as completed_today 
            FROM tickets 
            WHERE status = 'Completed' AND DATE(completed_at) = DATE('now')
        `);
        stats.completedToday = completedTodayResult.completed_today;
        
        return stats;
    }

    async getRevenueByMonth(year) {
        return this.query(`
            SELECT 
                strftime('%m', created_at) as month,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM invoices 
            WHERE status = 'Paid' AND strftime('%Y', created_at) = ?
            GROUP BY strftime('%m', created_at)
            ORDER BY month
        `, [year.toString()]);
    }

    async getTopCustomersByRevenue(limit = 10) {
        return this.query(`
            SELECT 
                c.id, c.name, c.email,
                COALESCE(SUM(i.total_amount), 0) as total_spent,
                COUNT(t.id) as ticket_count
            FROM customers c
            LEFT JOIN invoices i ON c.id = i.customer_id AND i.status = 'Paid'
            LEFT JOIN tickets t ON c.id = t.customer_id
            GROUP BY c.id
            ORDER BY total_spent DESC
            LIMIT ?
        `, [limit]);
    }

    // Backup and restore
    async backup(filePath) {
        // This would implement a full database backup
        // For now, we'll export key data as JSON
        const backup = {
            customers: await this.getCustomers(),
            tickets: await this.getTickets(),
            inventory: await this.getInventory(),
            invoices: await this.getInvoices(),
            settings: await this.getSettings(),
            timestamp: new Date().toISOString()
        };
        
        require('fs').writeFileSync(filePath, JSON.stringify(backup, null, 2));
        return backup;
    }

    async restore(filePath) {
        // This would implement a full database restore
        // Implementation would depend on backup format
        const backupData = JSON.parse(require('fs').readFileSync(filePath, 'utf8'));
        
        // Clear existing data (with confirmation)
        await this.run('DELETE FROM invoice_items');
        await this.run('DELETE FROM invoices');
        await this.run('DELETE FROM ticket_history');
        await this.run('DELETE FROM tickets');
        await this.run('DELETE FROM inventory');
        await this.run('DELETE FROM customers');
        
        // Restore data
        for (const customer of backupData.customers) {
            await this.addCustomer(customer);
        }
        
        for (const ticket of backupData.tickets) {
            await this.addTicket(ticket);
        }
        
        for (const item of backupData.inventory) {
            await this.addInventoryItem(item);
        }
        
        for (const invoice of backupData.invoices) {
            await this.addInvoice(invoice);
        }
        
        return true;
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;