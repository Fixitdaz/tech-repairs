# Tech Repairs - Repair Shop Management System

A complete local desktop application for managing repair shops, built with Electron and SQLite.

## Features

✅ **Customer Management**
- Add, edit, and delete customers
- Track customer history and spending
- Search and filter customers

✅ **Repair Ticket System**
- Create and manage repair tickets
- Track repair status and priority
- Assign tickets to technicians
- Complete ticket history

✅ **Inventory Management**
- Track parts and supplies
- Low stock alerts
- Supplier management
- Cost and pricing tracking

✅ **Invoicing & Billing**
- Generate professional invoices
- Track payments and due dates
- Payment method tracking
- Invoice numbering system

✅ **Dashboard & Reports**
- Real-time business metrics
- Revenue tracking
- Customer analytics
- Inventory reports

✅ **Local Data Storage**
- SQLite database - no cloud required
- Complete data privacy
- Backup and restore functionality
- Offline operation

## Installation

### Prerequisites
- Windows 10/11
- Node.js (Download from https://nodejs.org)

### Setup Steps

1. **Download Node.js**
   - Go to https://nodejs.org
   - Download and install the LTS version
   - Restart your computer after installation

2. **Create Project Folder**
   ```cmd
   mkdir tech-repairs
   cd tech-repairs
   ```

3. **Save the Application Files**
   - Copy all the provided files into your `tech-repairs` folder:
     - `package.json`
     - `main.js`
     - `index.html`
     - `styles.css`
     - `app.js`
     - `database.js`

4. **Install Dependencies**
   ```cmd
   npm install
   ```

5. **Start the Application**
   ```cmd
   npm start
   ```

## File Structure

```
tech-repairs/
├── package.json          # Project configuration
├── main.js               # Electron main process
├── index.html            # User interface
├── styles.css            # Application styling
├── app.js                # Frontend logic
├── database.js           # SQLite database handler
├── data/                 # Database storage folder
│   └── techrepairs.db    # SQLite database file
└── node_modules/         # Dependencies
```

## Building an Executable

To create a standalone .exe file:

```cmd
npm run build
```

The executable will be created in the `dist` folder.

## Usage

### First Time Setup
1. Launch the application
2. Go to Settings to configure your company information
3. Start adding customers and creating tickets

### Daily Operations
1. **Dashboard** - View daily metrics and quick actions
2. **Customers** - Manage customer database
3. **Tickets** - Track all repair jobs
4. **Inventory** - Monitor parts and supplies
5. **Invoices** - Generate and track billing
6. **Reports** - Analyze business performance

### Keyboard Shortcuts
- `Ctrl+N` - New Customer
- `Ctrl+T` - New Ticket
- `Ctrl+1` - Dashboard
- `Ctrl+2` - Customers
- `Ctrl+3` - Tickets
- `Ctrl+4` - Inventory
- `F12` - Developer Tools

## Data Management

### Backup
Your data is stored locally in `data/techrepairs.db`. To backup:
1. Copy the entire `data` folder
2. Or use File > Export Data from the menu

### Restore
1. Replace the `data` folder with your backup
2. Or use File > Import Data from the menu

## Troubleshooting

### Common Issues

**"npm is not recognized"**
- Install Node.js from https://nodejs.org
- Restart Command Prompt after installation

**"Cannot find module 'electron'"**
- Run `npm install` in the project folder

**Database errors**
- Delete the `data` folder and restart the app
- The database will be recreated automatically

**Application won't start**
- Check that all files are in the correct location
- Run `npm install` again
- Try `npm start` from the project folder

### Getting Help
- Check the error messages in the console
- Verify all files are present and correctly named
- Ensure Node.js is properly installed

## Technical Details

- **Framework**: Electron.js for cross-platform desktop apps
- **Database**: SQLite for local data storage
- **UI**: Modern HTML5/CSS3 with responsive design
- **Platform**: Windows, Mac, Linux compatible

## Security & Privacy

- ✅ All data stored locally on your computer
- ✅ No internet connection required
- ✅ No data sent to external servers
- ✅ Complete control over your business data

## License

MIT License - Free for commercial and personal use.

---

**Tech Repairs** - Built for local repair shops who value privacy and control over their data.