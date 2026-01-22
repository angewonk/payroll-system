# Payroll System

A lightweight React-based payroll UI for entering, reviewing, and printing payslips.

This app focuses on client-side calculations and a clean, printable payslip layout.

Key features
- Editable employee table with live calculations (gross pay, contributions, withholding tax, net pay).
- Custom CSV import: load employee rows at runtime to avoid committing private data.
- Themed and responsive table with a styled horizontal scrollbar and per-column width control.
- Printable payslip view per employee.
- Front-end-only peso symbol and number formatting using Philippine locale.

Getting started
1. Install dependencies and run locally:

```bash
npm install
npm run dev
```

2. Open the app in your browser (Vite serves it by default at `http://localhost:5173`).

CSV import (no private data in repo)
- The repository includes a template at `/public/initial_data_template.csv` — use it to format your employee data.
- In the running app, click **Upload employee data** to select a CSV file matching the template headers. The table will populate from the CSV at runtime.
- The app intentionally does not ship with private `INITIAL_DATA`; instead it loads data from CSV or allows in-browser editing.

Live demo

- A working demo is hosted at: https://angewonk.github.io/payroll-system/
	(Use this link to view the deployed site.)

Forking & Credits

- If you fork or modify this project, please add a short credit line back to the original author: `angewonk`.
- A suggested credit text you can add to your `README.md` or project footer:

	"This project is based on work by angewonk — original source: https://angewonk.github.io/payroll-system/"

	Thank you — credits help track provenance and give proper attribution when others build on this work.

How import works (implementation notes)
- `src/App.jsx` contains a lightweight `parseCSVText` helper that maps CSV headers to the app data shape.
- Loan fields are flattened in CSV (headers: `loans_sssSal`, `loans_sssHouse`, `loans_pagibigSal`, `loans_company`).

Blank row behavior
- On each page load, if the table has no employee rows, the app will add a single blank editable row so you can start entering data immediately. This behavior is implemented in a `useEffect` mount hook in `src/App.jsx`.

Styling and customization
- The app uses `src/App.css` for theming. Column widths are controlled with a `<colgroup>` and `col.col-...` CSS rules for reliable alignment and printable layout.
- A styled upload button replaces the native file input for consistent appearance.

Printing
- Click the print icon on any row to open a printable payslip (`src/Payslip.jsx`) which reads the employee's `position` and other fields from state.

Security & privacy
- Do not commit CSV files containing private employee data into the repo. Use the runtime CSV import instead.

Extending the project
- Integrate PapaParse for robust CSV handling if your CSVs are complex.
- Add server-side storage or authentication if you need persistence beyond the browser.

Files to look at
- `src/App.jsx` — main UI, CSV import, parsing, and calculations.
- `src/App.css` — all styling (table, scrollbar, upload button, byline).
- `src/Payslip.jsx` — printable payslip component.
- `public/initial_data_template.csv` — CSV template to populate and import at runtime.

License
This project has no license specified. Add a LICENSE file if you plan to share it publicly.

