// Tech Repairs - Application JavaScript

class TechRepairsApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.data = {
            customers: [
                { id: 1, name: 'John Smith', email: 'john@email.com', phone: '(555) 123-4567', address: '123 Main St', totalSpent: 450, ticketCount: 3 },
                { id: 2, name: 'Sarah Johnson', email: 'sarah@email.com', phone: '(555) 987-6543', address: '456 Oak Ave', totalSpent: 150, ticketCount: 1 },
                { id: 3, name: 'Mike Davis', email: 'mike@email.com', phone: '(555) 456-7890', address: '789 Pine St', totalSpent: 320, ticketCount: 2 },
                { id: 4, name: 'Lisa Wilson', email: 'lisa@email.com', phone: '(555) 321-9876', address: '321 Elm St', totalSpent: 275, ticketCount: 1 },
                { id: 5, name: 'Tom Brown', email: 'tom@email.com', phone: '(555) 654-3210', address: '654 Maple Dr', totalSpent: 180, ticketCount: 2 }
            ],
            tickets: [
                { id: 1001, customerId: 1, customerName: 'John Smith', device: 'iPhone 14 Pro', issue: 'Cracked screen replacement', status: 'In Progress', priority: 'High', estimatedCost: 280, createdDate: '2025-05-20' },
                { id: 1002, customerId: 2, customerName: 'Sarah Johnson', device: 'MacBook Air', issue: 'Battery replacement', status: 'Waiting for Parts', priority: 'Medium', estimatedCost: 150, createdDate: '2025-05-18' },
                { id: 1003, customerId: 3, customerName: 'Mike Davis', device: 'Samsung Galaxy S24', issue: 'Water damage repair', status: 'Completed', priority: 'High', estimatedCost: 320, createdDate: '2025-05-15' },
                { id: 1004, customerId: 1, customerName: 'John Smith', device: 'iPad Air', issue: 'Home button not working', status: 'Open', priority: 'Low', estimatedCost: 80, createdDate: '2025-05-22' },
                { id: 1005, customerId: 4, customerName: 'Lisa Wilson', device: 'MacBook Pro', issue: 'Keyboard replacement', status: 'In Progress', priority: 'Medium', estimatedCost: 275, createdDate: '2025-05-19' }
            ],
            inventory: [
                { id: 1, name: 'iPhone 14 Pro Screen', category: 'Screens', stock: 12, minStock: 5, costPrice: 150, sellPrice: 280, supplier: 'TechParts Inc' },
                { id: 2, name: 'MacBook Battery A2389', category: 'Batteries', stock: 3, minStock: 5, costPrice: 60, sellPrice: 150, supplier: 'Apple Parts Co' },
                { id: 3, name: 'Samsung Galaxy S24 Screen', category: 'Screens', stock: 8, minStock: 3, costPrice: 180, sellPrice: 320, supplier: 'Mobile Fix Supply' },
                { id: 4, name: 'iPad Home Button', category: 'Components', stock: 15, minStock: 10, costPrice: 25, sellPrice: 80, supplier: 'Repair Parts Ltd' },
                { id: 5, name: 'MacBook Keyboard', category: 'Components', stock: 2, minStock: 5, costPrice: 120, sellPrice: 275, supplier: 'Apple Parts Co' }
            ],
            invoices: [
                { id: 2001, customerId: 3, customerName: 'Mike Davis', amount: 320, status: 'Paid', date: '2025-05-15', dueDate: '2025-05-30' },
                { id: 2002, customerId: 1, customerName: 'John Smith', amount: 280, status: 'Pending', date: '2025-05-20', dueDate: '2025-06-05' },
                { id: 2003, customerId: 2, customerName: 'Sarah Johnson', amount: 150, status: 'Overdue', date: '2025-05-10', dueDate: '2025-05-25' },
                { id: 2004, customerId: 4, customerName: 'Lisa Wilson', amount: 275, status: 'Paid', date: '2025-05-19', dueDate: '2025-06-03' }
            ]
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboardStats();
        this.renderCustomersTable();
        this.loadSettings();
        
        // Listen for menu events from main process
        if (typeof require !== 'undefined') {
            const { ipcRenderer } = require('electron');
            
            ipcRenderer.on('menu-new-customer', () => {
                this.showModal('new-customer');
            });
            
            ipcRenderer.on('menu-new-ticket', () => {
                this.showModal('new-ticket');
            });
            
            ipcRenderer.on('menu-navigate', (event, page) => {
                this.navigate(page);
            });
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigate(page);
            });
        });

        // Search functionality
        const customerSearch = document.getElementById('customer-search');
        if (customerSearch) {
            customerSearch.addEventListener('input', (e) => {
                this.searchCustomers(e.target.value);
            });
        }

        // Modal close on overlay click
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideModal();
            }
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    navigate(page) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(page).classList.add('active');

        this.currentPage = page;

        // Load page-specific data
        switch(page) {
            case 'dashboard':
                this.updateDashboardStats();
                break;
            case 'customers':
                this.renderCustomersTable();
                break;
            case 'tickets':
                this.renderTicketsTable();
                break;
            case 'inventory':
                this.renderInventoryTable();
                break;
            case 'invoices':
                this.renderInvoicesTable();
                break;
            case 'reports':
                this.generateReports();
                break;
        }
    }

    updateDashboardStats() {
        // Calculate stats
        const totalRevenue = this.data.invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0);
        
        const activeTickets = this.data.tickets
            .filter(ticket => ticket.status !== 'Completed').length;
        
        const totalCustomers = this.data.customers.length;
        
        const completedToday = this.data.tickets
            .filter(ticket => ticket.status === 'Completed' && 
                this.isToday(new Date(ticket.createdDate))).length;

        // Update DOM
        document.getElementById('total-revenue').textContent = `$${totalRevenue.toLocaleString()}`;
        document.getElementById('active-tickets').textContent = activeTickets;
        document.getElementById('total-customers').textContent = totalCustomers;
        document.getElementById('completed-tickets').textContent = completedToday;
    }

    renderCustomersTable() {
        const tbody = document.getElementById('customers-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.data.customers.map(customer => `
            <tr>
                <td><strong>${customer.name}</strong></td>
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
                <td>${customer.ticketCount}</td>
                <td>$${customer.totalSpent}</td>
                <td>
                    <button class="btn-icon" title="View" onclick="app.viewCustomer(${customer.id})">👁</button>
                    <button class="btn-icon" title="Edit" onclick="app.editCustomer(${customer.id})">✏️</button>
                    <button class="btn-icon" title="Delete" onclick="app.deleteCustomer(${customer.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    renderTicketsTable() {
        const page = document.getElementById('tickets');
        const existingTable = page.querySelector('.table-container');
        if (existingTable) {
            existingTable.remove();
        }

        const tableHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Ticket #</th>
                            <th>Customer</th>
                            <th>Device</th>
                            <th>Issue</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Cost</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.data.tickets.map(ticket => `
                            <tr>
                                <td><strong>#${ticket.id}</strong></td>
                                <td>${ticket.customerName}</td>
                                <td>${ticket.device}</td>
                                <td>${ticket.issue}</td>
                                <td><span class="status status-${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span></td>
                                <td><span class="status ${this.getPriorityClass(ticket.priority)}">${ticket.priority}</span></td>
                                <td>$${ticket.estimatedCost}</td>
                                <td>${this.formatDate(ticket.createdDate)}</td>
                                <td>
                                    <button class="btn-icon" title="View" onclick="app.viewTicket(${ticket.id})">👁</button>
                                    <button class="btn-icon" title="Edit" onclick="app.editTicket(${ticket.id})">✏️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        page.insertAdjacentHTML('beforeend', tableHTML);
    }

    renderInventoryTable() {
        const page = document.getElementById('inventory');
        const existingTable = page.querySelector('.table-container');
        if (existingTable) {
            existingTable.remove();
        }

        const tableHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Stock</th>
                            <th>Min Stock</th>
                            <th>Cost Price</th>
                            <th>Sell Price</th>
                            <th>Supplier</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.data.inventory.map(item => `
                            <tr ${item.stock <= item.minStock ? 'style="background-color: #fef2f2;"' : ''}>
                                <td><strong>${item.name}</strong></td>
                                <td>${item.category}</td>
                                <td>
                                    <span style="color: ${item.stock <= item.minStock ? '#dc2626' : '#059669'}; font-weight: 600;">
                                        ${item.stock}
                                    </span>
                                </td>
                                <td>${item.minStock}</td>
                                <td>$${item.costPrice}</td>
                                <td>$${item.sellPrice}</td>
                                <td>${item.supplier}</td>
                                <td>
                                    <button class="btn-icon" title="Edit" onclick="app.editInventoryItem(${item.id})">✏️</button>
                                    <button class="btn-icon" title="Reorder" onclick="app.reorderItem(${item.id})">📦</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        page.insertAdjacentHTML('beforeend', tableHTML);
    }

    renderInvoicesTable() {
        const page = document.getElementById('invoices');
        const existingTable = page.querySelector('.table-container');
        if (existingTable) {
            existingTable.remove();
        }

        const tableHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Due Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.data.invoices.map(invoice => `
                            <tr>
                                <td><strong>#${invoice.id}</strong></td>
                                <td>${invoice.customerName}</td>
                                <td>${invoice.amount}</td>
                                <td><span class="status status-${invoice.status.toLowerCase()}">${invoice.status}</span></td>
                                <td>${this.formatDate(invoice.date)}</td>
                                <td>${this.formatDate(invoice.dueDate)}</td>
                                <td>
                                    <button class="btn-icon" title="View" onclick="app.viewInvoice(${invoice.id})">👁</button>
                                    <button class="btn-icon" title="Edit" onclick="app.editInvoice(${invoice.id})">✏️</button>
                                    <button class="btn-icon" title="Print" onclick="app.printInvoice(${invoice.id})">🖨️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        page.insertAdjacentHTML('beforeend', tableHTML);
    }

    // Modal Management
    showModal(type, data = null) {
        const modal = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const content = document.getElementById('modal-content');

        let modalContent = '';
        let modalTitle = '';

        switch(type) {
            case 'new-customer':
                modalTitle = 'Add New Customer';
                modalContent = this.getCustomerFormHTML();
                break;
            case 'edit-customer':
                modalTitle = 'Edit Customer';
                modalContent = this.getCustomerFormHTML(data);
                break;
            case 'new-ticket':
                modalTitle = 'Create New Ticket';
                modalContent = this.getTicketFormHTML();
                break;
            case 'edit-ticket':
                modalTitle = 'Edit Ticket';
                modalContent = this.getTicketFormHTML(data);
                break;
            case 'new-invoice':
                modalTitle = 'Create New Invoice';
                modalContent = this.getInvoiceFormHTML();
                break;
            case 'new-item':
                modalTitle = 'Add Inventory Item';
                modalContent = this.getInventoryFormHTML();
                break;
            case 'quick-add':
                modalTitle = 'Quick Add';
                modalContent = this.getQuickAddHTML();
                break;
            default:
                modalTitle = 'Modal';
                modalContent = '<p>Modal content not implemented yet.</p>';
        }

        title.textContent = modalTitle;
        content.innerHTML = modalContent;
        modal.classList.add('active');
    }

    hideModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }

    showQuickAdd() {
        this.showModal('quick-add');
    }

    getCustomerFormHTML(customer = null) {
        return `
            <form onsubmit="app.saveCustomer(event)" id="customer-form">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="name" value="${customer?.name || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value="${customer?.email || ''}">
                    </div>
                    <div class="form-group">
                        <label>Phone *</label>
                        <input type="tel" name="phone" value="${customer?.phone || ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <textarea name="address" rows="3">${customer?.address || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes" rows="3">${customer?.notes || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="app.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        ${customer ? 'Update' : 'Save'} Customer
                    </button>
                </div>
                ${customer ? `<input type="hidden" name="id" value="${customer.id}">` : ''}
            </form>
        `;
    }

    getTicketFormHTML(ticket = null) {
        const customerOptions = this.data.customers.map(c => 
            `<option value="${c.id}" ${ticket?.customerId === c.id ? 'selected' : ''}>${c.name}</option>`
        ).join('');

        return `
            <form onsubmit="app.saveTicket(event)" id="ticket-form">
                <div class="form-group">
                    <label>Customer *</label>
                    <select name="customerId" required>
                        <option value="">Select Customer</option>
                        ${customerOptions}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Device Type *</label>
                        <input type="text" name="device" value="${ticket?.device || ''}" placeholder="e.g., iPhone 14 Pro" required>
                    </div>
                    <div class="form-group">
                        <label>Priority</label>
                        <select name="priority">
                            <option value="Low" ${ticket?.priority === 'Low' ? 'selected' : ''}>Low</option>
                            <option value="Medium" ${ticket?.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                            <option value="High" ${ticket?.priority === 'High' ? 'selected' : ''}>High</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Issue Description *</label>
                    <textarea name="issue" rows="3" required placeholder="Describe the problem...">${ticket?.issue || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Estimated Cost</label>
                        <input type="number" name="estimatedCost" step="0.01" value="${ticket?.estimatedCost || ''}" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status">
                            <option value="Open" ${ticket?.status === 'Open' ? 'selected' : ''}>Open</option>
                            <option value="In Progress" ${ticket?.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Waiting for Parts" ${ticket?.status === 'Waiting for Parts' ? 'selected' : ''}>Waiting for Parts</option>
                            <option value="Completed" ${ticket?.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes" rows="3" placeholder="Additional notes...">${ticket?.notes || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="app.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        ${ticket ? 'Update' : 'Create'} Ticket
                    </button>
                </div>
                ${ticket ? `<input type="hidden" name="id" value="${ticket.id}">` : ''}
            </form>
        `;
    }

    getInvoiceFormHTML(invoice = null) {
        const customerOptions = this.data.customers.map(c => 
            `<option value="${c.id}" ${invoice?.customerId === c.id ? 'selected' : ''}>${c.name}</option>`
        ).join('');

        return `
            <form onsubmit="app.saveInvoice(event)" id="invoice-form">
                <div class="form-group">
                    <label>Customer *</label>
                    <select name="customerId" required>
                        <option value="">Select Customer</option>
                        ${customerOptions}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Amount *</label>
                        <input type="number" name="amount" step="0.01" value="${invoice?.amount || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Due Date</label>
                        <input type="date" name="dueDate" value="${invoice?.dueDate || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" rows="3" placeholder="Invoice description...">${invoice?.description || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="app.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        ${invoice ? 'Update' : 'Create'} Invoice
                    </button>
                </div>
                ${invoice ? `<input type="hidden" name="id" value="${invoice.id}">` : ''}
            </form>
        `;
    }

    getInventoryFormHTML(item = null) {
        return `
            <form onsubmit="app.saveInventoryItem(event)" id="inventory-form">
                <div class="form-group">
                    <label>Item Name *</label>
                    <input type="text" name="name" value="${item?.name || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Category</label>
                        <select name="category">
                            <option value="Screens" ${item?.category === 'Screens' ? 'selected' : ''}>Screens</option>
                            <option value="Batteries" ${item?.category === 'Batteries' ? 'selected' : ''}>Batteries</option>
                            <option value="Components" ${item?.category === 'Components' ? 'selected' : ''}>Components</option>
                            <option value="Accessories" ${item?.category === 'Accessories' ? 'selected' : ''}>Accessories</option>
                            <option value="Tools" ${item?.category === 'Tools' ? 'selected' : ''}>Tools</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Supplier</label>
                        <input type="text" name="supplier" value="${item?.supplier || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Current Stock</label>
                        <input type="number" name="stock" value="${item?.stock || ''}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Minimum Stock</label>
                        <input type="number" name="minStock" value="${item?.minStock || '5'}" min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Cost Price</label>
                        <input type="number" name="costPrice" step="0.01" value="${item?.costPrice || ''}">
                    </div>
                    <div class="form-group">
                        <label>Sell Price</label>
                        <input type="number" name="sellPrice" step="0.01" value="${item?.sellPrice || ''}">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="app.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        ${item ? 'Update' : 'Add'} Item
                    </button>
                </div>
                ${item ? `<input type="hidden" name="id" value="${item.id}">` : ''}
            </form>
        `;
    }

    getQuickAddHTML() {
        return `
            <div class="quick-add-options">
                <button class="btn btn-outline" onclick="app.hideModal(); app.showModal('new-customer')" style="width: 100%; margin-bottom: 12px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                    Add New Customer
                </button>
                <button class="btn btn-outline" onclick="app.hideModal(); app.showModal('new-ticket')" style="width: 100%; margin-bottom: 12px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                    Create New Ticket
                </button>
                <button class="btn btn-outline" onclick="app.hideModal(); app.showModal('new-invoice')" style="width: 100%; margin-bottom: 12px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                    </svg>
                    Create Invoice
                </button>
                <button class="btn btn-outline" onclick="app.hideModal(); app.showModal('new-item')" style="width: 100%;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                    Add Inventory Item
                </button>
            </div>
        `;
    }

    // Form Handlers
    saveCustomer(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const customer = Object.fromEntries(formData);
        
        if (customer.id) {
            // Update existing customer
            const index = this.data.customers.findIndex(c => c.id == customer.id);
            if (index !== -1) {
                this.data.customers[index] = { ...this.data.customers[index], ...customer };
                this.showNotification('Customer updated successfully!', 'success');
            }
        } else {
            // Add new customer
            customer.id = Math.max(...this.data.customers.map(c => c.id)) + 1;
            customer.totalSpent = 0;
            customer.ticketCount = 0;
            this.data.customers.push(customer);
            this.showNotification('Customer added successfully!', 'success');
        }
        
        this.hideModal();
        this.renderCustomersTable();
        this.updateDashboardStats();
    }

    saveTicket(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const ticket = Object.fromEntries(formData);
        
        // Find customer name
        const customer = this.data.customers.find(c => c.id == ticket.customerId);
        ticket.customerName = customer?.name || 'Unknown';
        
        if (ticket.id) {
            // Update existing ticket
            const index = this.data.tickets.findIndex(t => t.id == ticket.id);
            if (index !== -1) {
                this.data.tickets[index] = { ...this.data.tickets[index], ...ticket };
                this.showNotification('Ticket updated successfully!', 'success');
            }
        } else {
            // Add new ticket
            ticket.id = Math.max(...this.data.tickets.map(t => t.id)) + 1;
            ticket.createdDate = new Date().toISOString().split('T')[0];
            this.data.tickets.push(ticket);
            this.showNotification('Ticket created successfully!', 'success');
        }
        
        this.hideModal();
        this.updateDashboardStats();
        if (this.currentPage === 'tickets') {
            this.renderTicketsTable();
        }
    }

    saveInvoice(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const invoice = Object.fromEntries(formData);
        
        // Find customer name
        const customer = this.data.customers.find(c => c.id == invoice.customerId);
        invoice.customerName = customer?.name || 'Unknown';
        
        if (invoice.id) {
            // Update existing invoice
            const index = this.data.invoices.findIndex(i => i.id == invoice.id);
            if (index !== -1) {
                this.data.invoices[index] = { ...this.data.invoices[index], ...invoice };
                this.showNotification('Invoice updated successfully!', 'success');
            }
        } else {
            // Add new invoice
            invoice.id = Math.max(...this.data.invoices.map(i => i.id)) + 1;
            invoice.date = new Date().toISOString().split('T')[0];
            invoice.status = 'Pending';
            this.data.invoices.push(invoice);
            this.showNotification('Invoice created successfully!', 'success');
        }
        
        this.hideModal();
        this.updateDashboardStats();
        if (this.currentPage === 'invoices') {
            this.renderInvoicesTable();
        }
    }

    saveInventoryItem(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const item = Object.fromEntries(formData);
        
        if (item.id) {
            // Update existing item
            const index = this.data.inventory.findIndex(i => i.id == item.id);
            if (index !== -1) {
                this.data.inventory[index] = { ...this.data.inventory[index], ...item };
                this.showNotification('Item updated successfully!', 'success');
            }
        } else {
            // Add new item
            item.id = Math.max(...this.data.inventory.map(i => i.id)) + 1;
            this.data.inventory.push(item);
            this.showNotification('Item added successfully!', 'success');
        }
        
        this.hideModal();
        if (this.currentPage === 'inventory') {
            this.renderInventoryTable();
        }
    }

    // Action Methods
    viewCustomer(id) {
        const customer = this.data.customers.find(c => c.id === id);
        alert(`Customer: ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone}`);
    }

    editCustomer(id) {
        const customer = this.data.customers.find(c => c.id === id);
        this.showModal('edit-customer', customer);
    }

    deleteCustomer(id) {
        if (confirm('Are you sure you want to delete this customer?')) {
            this.data.customers = this.data.customers.filter(c => c.id !== id);
            this.renderCustomersTable();
            this.updateDashboardStats();
            this.showNotification('Customer deleted successfully!', 'success');
        }
    }

    viewTicket(id) {
        const ticket = this.data.tickets.find(t => t.id === id);
        alert(`Ticket #${ticket.id}\nCustomer: ${ticket.customerName}\nDevice: ${ticket.device}\nIssue: ${ticket.issue}\nStatus: ${ticket.status}`);
    }

    editTicket(id) {
        const ticket = this.data.tickets.find(t => t.id === id);
        this.showModal('edit-ticket', ticket);
    }

    viewInvoice(id) {
        const invoice = this.data.invoices.find(i => i.id === id);
        alert(`Invoice #${invoice.id}\nCustomer: ${invoice.customerName}\nAmount: ${invoice.amount}\nStatus: ${invoice.status}`);
    }

    editInvoice(id) {
        const invoice = this.data.invoices.find(i => i.id === id);
        this.showModal('edit-invoice', invoice);
    }

    printInvoice(id) {
        alert('Print functionality would be implemented here');
    }

    editInventoryItem(id) {
        const item = this.data.inventory.find(i => i.id === id);
        this.showModal('edit-item', item);
    }

    reorderItem(id) {
        const item = this.data.inventory.find(i => i.id === id);
        const quantity = prompt(`How many ${item.name} would you like to reorder?`, '10');
        if (quantity && !isNaN(quantity)) {
            item.stock += parseInt(quantity);
            this.renderInventoryTable();
            this.showNotification(`Added ${quantity} ${item.name} to inventory`, 'success');
        }
    }

    // Search and Filter
    searchCustomers(term) {
        const tbody = document.getElementById('customers-table-body');
        if (!tbody) return;

        const filteredCustomers = this.data.customers.filter(customer =>
            customer.name.toLowerCase().includes(term.toLowerCase()) ||
            customer.email.toLowerCase().includes(term.toLowerCase()) ||
            customer.phone.includes(term)
        );

        tbody.innerHTML = filteredCustomers.map(customer => `
            <tr>
                <td><strong>${customer.name}</strong></td>
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
                <td>${customer.ticketCount}</td>
                <td>${customer.totalSpent}</td>
                <td>
                    <button class="btn-icon" title="View" onclick="app.viewCustomer(${customer.id})">👁</button>
                    <button class="btn-icon" title="Edit" onclick="app.editCustomer(${customer.id})">✏️</button>
                    <button class="btn-icon" title="Delete" onclick="app.deleteCustomer(${customer.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    // Reports
    generateReports() {
        const page = document.getElementById('reports');
        const existingContent = page.querySelector('.reports-content');
        if (existingContent) {
            existingContent.remove();
        }

        const reportsHTML = `
            <div class="reports-content">
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Monthly Revenue</h3>
                        <p style="font-size: 24px; font-weight: bold; color: #059669;">
                            ${this.data.invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0)}
                        </p>
                    </div>
                    <div class="stat-card">
                        <h3>Pending Invoices</h3>
                        <p style="font-size: 24px; font-weight: bold; color: #dc2626;">
                            ${this.data.invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0)}
                        </p>
                    </div>
                    <div class="stat-card">
                        <h3>Low Stock Items</h3>
                        <p style="font-size: 24px; font-weight: bold; color: #d97706;">
                            ${this.data.inventory.filter(i => i.stock <= i.minStock).length}
                        </p>
                    </div>
                    <div class="stat-card">
                        <h3>Completion Rate</h3>
                        <p style="font-size: 24px; font-weight: bold; color: #2563eb;">
                            ${Math.round((this.data.tickets.filter(t => t.status === 'Completed').length / this.data.tickets.length) * 100)}%
                        </p>
                    </div>
                </div>
                <div class="dashboard-card" style="margin-top: 24px;">
                    <div class="card-header">
                        <h3>Top Customers by Revenue</h3>
                    </div>
                    <div class="card-content">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Total Spent</th>
                                    <th>Tickets</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.data.customers
                                    .sort((a, b) => b.totalSpent - a.totalSpent)
                                    .slice(0, 5)
                                    .map(customer => `
                                        <tr>
                                            <td><strong>${customer.name}</strong></td>
                                            <td>${customer.totalSpent}</td>
                                            <td>${customer.ticketCount}</td>
                                        </tr>
                                    `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        page.insertAdjacentHTML('beforeend', reportsHTML);
    }

    // Utility Methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    getPriorityClass(priority) {
        switch(priority) {
            case 'High': return 'status-high';
            case 'Medium': return 'status-medium';
            case 'Low': return 'status-low';
            default: return '';
        }
    }

    showNotification(message, type = 'info') {
        // Simple alert for now - could be enhanced with toast notifications
        alert(message);
    }

    loadSettings() {
        // Load settings from localStorage or database
        // This would be implemented with actual data persistence
    }

    saveSettings(settings) {
        // Save settings to localStorage or database
        // This would be implemented with actual data persistence
    }
}

// Initialize the application
const app = new TechRepairsApp();