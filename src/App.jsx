import { useState, useEffect } from 'react';
import XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import './App.css';
import Payslip from './Payslip';
import { 
  computeWithholdingTax, 
  calculateDailyRate, 
  calculateRegularHolidayPay,
  calculateSpecialHolidayPay,
  calculateOTPay,
  formatCurrency
} from './utils';

// INITIAL_DATA intentionally empty.
const INITIAL_DATA = [];

// --- CSV Parsing Helper (Legacy) ---
const parseCSVText = (text) => {
  const splitLine = (line) => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(s => s.replace(/^\"|\"$/g, '').trim());
  const rows = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (rows.length === 0) return [];
  const headers = splitLine(rows.shift()).map(h => h.trim());
  return rows.map(line => {
    const cols = splitLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cols[i] !== undefined) ? cols[i] : ''; });
    const toNum = (v) => (v === '' || v === null || v === undefined) ? '' : Number(v);
    return {
      id: obj.id || `new-${Date.now()}`,
      name: obj.name || '',
      position: obj.position || '',
      basicSalary: toNum(obj.basicSalary),
      hmo1: toNum(obj.hmo1),
      hmo2: toNum(obj.hmo2),
      basicForDecl: toNum(obj.basicForDecl),
      deMinimis: toNum(obj.deMinimis),
      hrsOT: toNum(obj.hrsOT),
      hrsHolidayRegular: toNum(obj.hrsHolidayRegular),
      hrsHolidaySpecial: toNum(obj.hrsHolidaySpecial),
      nonTaxableOther: toNum(obj.nonTaxableOther),
      deduction: toNum(obj.deduction),
      thirteenth: toNum(obj.thirteenth),
      sss: toNum(obj.sss),
      sssMpf: toNum(obj.sssMpf),
      sssEc: toNum(obj.sssEc),
      philhealth: toNum(obj.philhealth),
      pagibig: toNum(obj.pagibig),
      withholdingTax: obj.withholdingTax !== undefined && obj.withholdingTax !== '' ? toNum(obj.withholdingTax) : '',
      loans: {
        sssSal: toNum(obj.loans_sssSal),
        sssHouse: toNum(obj.loans_sssHouse),
        pagibigSal: toNum(obj.loans_pagibigSal),
        company: toNum(obj.loans_company)
      }
    };
  });
};

const createBlankEmployee = () => ({
  id: `new-${Date.now()}`, name: '', basicSalary: '',
  position: '',
  hmo1: '', hmo2: '', basicForDecl: '', deMinimis: '',
  hrsOT: '', hrsHolidayRegular: '', hrsHolidaySpecial: '',
  nonTaxableOther: '', deduction: '', thirteenth: '',
  sss: '', sssMpf: '', sssEc: '', philhealth: '', pagibig: '',
  withholdingTax: '',
  loans: { sssSal: '', sssHouse: '', pagibigSal: '', company: '' }
});

function App() {
  const [employees, setEmployees] = useState(INITIAL_DATA);
  const [payslipPeriod, setPayslipPeriod] = useState(null);
  const [printEmployee, setPrintEmployee] = useState(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [businessOwner, setBusinessOwner] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [highlightedRows, setHighlightedRows] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleToggleHighlight = (id) => {
    setHighlightedRows(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      return [...prev, id];
    });
  };

  const handleInputChange = (index, field, value, nestedField = null) => {
    const updatedEmployees = [...employees];
    let val = value;
    if (nestedField) {
      updatedEmployees[index][nestedField][field] = val;
    } else {
      updatedEmployees[index][field] = val;
    }
    
    // Auto-compute withholding tax
    try {
      const safeNum = (v) => parseFloat(v) || 0;
      const emp = updatedEmployees[index];
      
      const basicSalary = safeNum(emp.basicSalary);
      const basicForDecl = safeNum(emp.basicForDecl);
      const hrsOT = safeNum(emp.hrsOT);
      const hrsHolidayRegular = safeNum(emp.hrsHolidayRegular);
      const hrsHolidaySpecial = safeNum(emp.hrsHolidaySpecial);
      const sss = safeNum(emp.sss);
      const sssMpf = safeNum(emp.sssMpf);
      const philhealth = safeNum(emp.philhealth);
      const pagibig = safeNum(emp.pagibig);

      const dailyRate = calculateDailyRate(basicSalary);
      const otPay = calculateOTPay(basicSalary, hrsOT);
      const regularHolidayPay = hrsHolidayRegular > 0 ? calculateRegularHolidayPay(basicSalary, hrsHolidayRegular) : 0;
      const specialHolidayPay = hrsHolidaySpecial > 0 ? calculateSpecialHolidayPay(basicSalary, hrsHolidaySpecial) : 0;
      const holidayPay = regularHolidayPay + specialHolidayPay;

      const totalContributions = sss + sssMpf + philhealth + pagibig;
      const taxableIncome = (basicForDecl + otPay + holidayPay) - totalContributions;
      const computedWTax = computeWithholdingTax(taxableIncome > 0 ? taxableIncome : 0);

      if (emp.withholdingTax === undefined || emp.withholdingTax === '') {
        updatedEmployees[index].withholdingTax = Number(computedWTax.toFixed(2));
      }
    } catch (err) {}

    setEmployees(updatedEmployees);
  };

  const handleAddRow = () => {
    setEmployees(prev => ([...prev, createBlankEmployee()]));
  };

  // --- CSV UPLOAD (Legacy) ---
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCSVText(ev.target.result || '');
        if (parsed && parsed.length) setEmployees(parsed);
      } catch (err) {
        alert('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    setEmployees(prev => (Array.isArray(prev) && prev.length > 0) ? prev : [createBlankEmployee()]);

    // First-run initialization: on first load, keep logo, signature and owner blank.
    try {
      const initialized = localStorage.getItem('payslip_initialized');
      if (!initialized) {
        setBusinessOwner('');
        setSignatureDataUrl(null);
        setShowLogo(false);
        localStorage.setItem('payslip_initialized', '1');
      } else {
        const stored = localStorage.getItem('payslipSignature');
        if (stored) setSignatureDataUrl(stored);
      }
    } catch (e) {}
  }, []);

  const handleSignatureUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setSignatureDataUrl(ev.target.result);
        localStorage.setItem('payslipSignature', ev.target.result);
      } catch (err) {}
    };
    reader.readAsDataURL(file);
  };

  const handleClearSignature = () => {
    setSignatureDataUrl(null);
    try { localStorage.removeItem('payslipSignature'); } catch (e) {}
  };

  // --- REAL-TIME CALCULATION ---
  const processedEmployees = employees.map(emp => {
    const safeNum = (v) => parseFloat(v) || 0;

    const basicSalary = safeNum(emp.basicSalary);
    const hrsOT = safeNum(emp.hrsOT);
    const hrsHolidayRegular = safeNum(emp.hrsHolidayRegular);
    const hrsHolidaySpecial = safeNum(emp.hrsHolidaySpecial);
    const deMinimis = safeNum(emp.deMinimis);
    const thirteenth = safeNum(emp.thirteenth);
    const nonTaxableOther = safeNum(emp.nonTaxableOther);
    const hmo2 = safeNum(emp.hmo2);
    const taxRefund = safeNum(emp.deduction);
    const basicForDecl = safeNum(emp.basicForDecl);

    const sss = safeNum(emp.sss);
    const sssMpf = safeNum(emp.sssMpf);
    const philhealth = safeNum(emp.philhealth);
    const pagibig = safeNum(emp.pagibig);

    const dailyRate = calculateDailyRate(basicSalary);
    const otPay = calculateOTPay(basicSalary, hrsOT);
    const regularHolidayPay = hrsHolidayRegular > 0 ? calculateRegularHolidayPay(basicSalary, hrsHolidayRegular) : 0;
    const specialHolidayPay = hrsHolidaySpecial > 0 ? calculateSpecialHolidayPay(basicSalary, hrsHolidaySpecial) : 0;
    const holidayPay = regularHolidayPay + specialHolidayPay;

    const grossPay = basicForDecl + deMinimis + thirteenth + otPay + holidayPay + nonTaxableOther + hmo2 + taxRefund;
    const totalContributions = sss + sssMpf + philhealth + pagibig;
    const taxableIncome = (basicForDecl + otPay + holidayPay) - totalContributions;
    
    const overrideWTax = (emp.withholdingTax !== undefined && emp.withholdingTax !== '') ? safeNum(emp.withholdingTax) : null;
    const computedWTax = computeWithholdingTax(taxableIncome > 0 ? taxableIncome : 0);
    const wTax = overrideWTax !== null ? overrideWTax : computedWTax;
    
    const loans = {
        sssSal: safeNum(emp.loans.sssSal),
        sssHouse: safeNum(emp.loans.sssHouse),
        pagibigSal: safeNum(emp.loans.pagibigSal),
        company: safeNum(emp.loans.company)
    };
    const totalLoans = loans.sssSal + loans.sssHouse + loans.pagibigSal + loans.company;
    const netPay = grossPay - totalContributions - wTax - totalLoans;

    return {
      ...emp, 
      calculated: {
        dailyRate, otPay, regularHolidayPay, specialHolidayPay, holidayPay,
        grossPay, totalContributions, taxableIncome, wTax, totalLoans, netPay
      }
    };
  });

  const totals = processedEmployees.reduce((acc, curr) => {
    const safeNum = (v) => parseFloat(v) || 0;
    acc.basicSalary = (acc.basicSalary || 0) + safeNum(curr.basicSalary);
    acc.basicForDecl = (acc.basicForDecl || 0) + safeNum(curr.basicForDecl);
    acc.thirteenth = (acc.thirteenth || 0) + safeNum(curr.thirteenth);
    acc.hmo2 = (acc.hmo2 || 0) + safeNum(curr.hmo2);
    acc.taxRefund = (acc.taxRefund || 0) + safeNum(curr.deduction);
    acc.grossPay = (acc.grossPay || 0) + curr.calculated.grossPay;
    acc.wTax = (acc.wTax || 0) + curr.calculated.wTax;
    acc.netPay = (acc.netPay || 0) + curr.calculated.netPay;
    return acc;
  }, {});

  const handlePrint = (emp) => {
    setPrintEmployee(emp);
    setTimeout(() => { window.print(); }, 100);
  };

  // --- IMPORT EXCEL HANDLER (FIXED) ---
  const handleImportExcel = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = new Uint8Array(ev.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const sheetName = workbook.SheetNames.includes("Payroll Table") ? "Payroll Table" : workbook.SheetNames[0];
            const ws = workbook.Sheets[sheetName];

            // 1. Get Date Period from Cell B1 (Row 1)
            const periodCell = ws['B1'];
            if(periodCell && periodCell.v) {
                setPayslipPeriod(periodCell.v);
            }

            // 2. Read Table Data (Starting from Row 3)
            const rawData = XLSX.utils.sheet_to_json(ws, { range: 2 });

            if (!rawData || rawData.length === 0) {
                alert("No data found in the Excel file.");
                return;
            }

            // 3. Map Excel Columns back to App State
            const importedEmployees = rawData
                .filter(row => row['ID'] && row['ID'] !== 'TOTALS')
                .map(row => {
                    // FIXED: Properly handle '0' values. Previous code treated 0 as false and returned empty string.
                    const toNum = (k) => (row[k] !== undefined && row[k] !== null) ? Number(row[k]) : '';
                    
                    return {
                        id: row['ID'] || `new-${Date.now()}`,
                        name: row['Name'] || '',
                        position: row['Position'] || '',
                        basicSalary: toNum('Basic Salary'),
                        basicForDecl: toNum('Basic For Declaration'),
                        
                        hrsOT: toNum('OT Hours'),
                        hrsHolidayRegular: toNum('Reg Hol Hrs'),
                        hrsHolidaySpecial: toNum('Spec Hol Hrs'),

                        deMinimis: toNum('De Minimis'),
                        thirteenth: toNum('13th Month'),
                        nonTaxableOther: toNum('INTERNET'),
                        hmo2: toNum('2nd HMO'),
                        deduction: toNum('Tax Refund'), 

                        sss: toNum('SSS/MPF'), 
                        sssMpf: 0, 
                        philhealth: toNum('PhilHealth'),
                        pagibig: toNum('Pag-IBIG'),
                        withholdingTax: toNum('Withholding Tax'),

                        loans: {
                            sssSal: toNum('SSS Sal Loan'),
                            sssHouse: toNum('SSS House Loan'),
                            pagibigSal: toNum('PagIBIG Sal Loan'),
                            company: toNum('Company Loan')
                        }
                    };
                });

            if (importedEmployees.length > 0) {
                setEmployees(importedEmployees);
                alert("Import successful!");
            }

        } catch (err) {
            console.error("Import Error:", err);
            alert("Failed to import Excel file. Ensure it matches the export format.");
        }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- EXPORT TO EXCEL HANDLER ---
  const handleExportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const wb = XLSX.utils.book_new();
        const safeNum = (v) => parseFloat(v) || 0;

        // 1. Prepare Main Payroll Table
        const tableHeaders = [
          "ID", "Name", "Position", 
          "Basic Salary", "Basic For Declaration", 
          "OT Hours", "OT Amount", 
          "Reg Hol Hrs", "Reg Hol Amt", 
          "Spec Hol Hrs", "Spec Hol Amt", 
          "De Minimis", "13th Month", "INTERNET", "2nd HMO", "Tax Refund",
          "GROSS PAY", 
          "SSS/MPF", "PhilHealth", "Pag-IBIG", "Total Contrib",
          "Taxable Income", "Withholding Tax",
          "SSS Sal Loan", "SSS House Loan", "PagIBIG Sal Loan", "Company Loan",
          "NET PAY"
        ];

        const tableData = processedEmployees.map(emp => {
          const c = emp.calculated;
          const l = emp.loans;
          return [
            emp.id, emp.name, emp.position,
            safeNum(emp.basicSalary), safeNum(emp.basicForDecl),
            safeNum(emp.hrsOT), c.otPay,
            safeNum(emp.hrsHolidayRegular), c.regularHolidayPay,
            safeNum(emp.hrsHolidaySpecial), c.specialHolidayPay,
            safeNum(emp.deMinimis), safeNum(emp.thirteenth), safeNum(emp.nonTaxableOther), safeNum(emp.hmo2), safeNum(emp.deduction),
            c.grossPay,
            safeNum(emp.sss) + safeNum(emp.sssMpf), safeNum(emp.philhealth), safeNum(emp.pagibig), c.totalContributions,
            c.taxableIncome, c.wTax,
            l.sssSal, l.sssHouse, l.pagibigSal, l.company,
            c.netPay
          ];
        });

        // Add Period at the very top (Row 1), Spacer (Row 2), Headers (Row 3)
        const periodRow = ["Period:", payslipPeriod];
        const spacerRow = []; 
        const totalsRow = [
          "TOTALS", "", "",
          totals.basicSalary, totals.basicForDecl,
          "", "", "", "", "", "",
          "", totals.thirteenth, "", totals.hmo2, totals.taxRefund,
          totals.grossPay,
          "", "", "", "",
          "", totals.wTax,
          "", "", "", "",
          totals.netPay
        ];

        const wsData = [
            periodRow,
            spacerRow,
            tableHeaders,
            ...tableData,
            totalsRow
        ];

        const wsTable = XLSX.utils.aoa_to_sheet(wsData);

        // --- STYLING (Headers & Colors) ---
        wsTable['!cols'] = tableHeaders.map(() => ({ wch: 15 }));

        // Header Style (Row 3 -> index 2)
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "545B5A" } }, // Dark Gray/Green from Palette
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            }
        };

        const range = XLSX.utils.decode_range(wsTable['!ref']);
        // Apply to Header Row (Index 2)
        for(let C = range.s.c; C <= range.e.c; ++C) {
            const addr = XLSX.utils.encode_cell({ r: 2, c: C });
            if(!wsTable[addr]) continue;
            wsTable[addr].s = headerStyle;
        }

        // Bold the "Period" label (A1) and Value (B1)
        if(wsTable['A1']) wsTable['A1'].s = { font: { bold: true } };
        if(wsTable['B1']) wsTable['B1'].s = { font: { bold: true } };

        XLSX.utils.book_append_sheet(wb, wsTable, "Payroll Table");

        // 2. Prepare Per-Employee Payslip Sheets
        processedEmployees.forEach((emp, index) => {
            if (!emp.name && !emp.id.toString().startsWith('new')) return; 
            
            const c = emp.calculated;
            const l = emp.loans;
            const safeN = (v) => Number((parseFloat(v) || 0).toFixed(2));
            
            // FIXED: Added type safety to formatC to prevent crash on 'undefined' or string values from bad import
            const formatC = (v) => {
               if(typeof v !== 'number' || isNaN(v)) return "0.00";
               return v === 0 ? "0.00" : Number(v.toFixed(2));
            };

            const earnings = [
                ["Basic", safeN(emp.basicForDecl)],
                [`Overtime (${safeN(emp.hrsOT)} hrs)`, formatC(c.otPay)],
                [`Regular Holiday (${safeN(emp.hrsHolidayRegular)} hrs)`, formatC(c.regularHolidayPay)],
                [`Special Holiday (${safeN(emp.hrsHolidaySpecial)} hrs)`, formatC(c.specialHolidayPay)],
                ["Tax Refund", formatC(safeN(emp.deduction))],
                ["De Minimis", formatC(safeN(emp.deMinimis))],
                ["13th Month/Benefits", formatC(safeN(emp.thirteenth))],
                [`Others ${safeN(emp.nonTaxableOther) > 0 ? '(Non-Tax)' : ''}`, formatC(safeN(emp.nonTaxableOther))]
            ];

            const deductions = [
                ["SSS / MPF", safeN(emp.sss) + safeN(emp.sssMpf)],
                ["Philhealth", safeN(emp.philhealth)],
                ["Pagibig", safeN(emp.pagibig)],
                ["Tax Withheld", formatC(c.wTax)],
                ["LOANS", ""],
                ["SSS Sal. Loan", formatC(l.sssSal)],
                ["SSS Hsng Loan", formatC(l.sssHouse)],
                ["Pagibig Sal Loan", formatC(l.pagibigSal)],
                ["Others (Company)", formatC(l.company)],
                ["Absent/Tardy", "0.00"]
            ];

            const maxRows = Math.max(earnings.length, deductions.length);
            const payslipRows = [];
            for (let i = 0; i < maxRows; i++) {
                const earn = earnings[i] || ["", ""];
                const ded = deductions[i] || ["", ""];
                payslipRows.push([earn[0], earn[1], "", ded[0], ded[1]]);
            }

            const wsDataSheet = [
                ["BEMTECH IT SOLUTIONS"], ["P A Y S L I P"], [],
                ["Period:", payslipPeriod], ["ID No.:", emp.id], ["Name:", emp.name], ["Position:", emp.position], [],
                ["EARNINGS", "Amount", "", "DEDUCTIONS", "Amount"],
                ...payslipRows, [],
                ["TOTAL PAY", formatC(c.grossPay), "", "TOTAL DEDUCTIONS", formatC(c.totalContributions + c.wTax + c.totalLoans)],
                ["NET PAY", formatC(c.netPay)]
            ];

            const ws = XLSX.utils.aoa_to_sheet(wsDataSheet);
            ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }];
            ws['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 5 }, { wch: 25 }, { wch: 12 }];

            let sheetName = `${emp.id}-${emp.name}`.replace(/[\\/?*[\]]/g, "_").substring(0, 30);
            if(!sheetName) sheetName = `Emp-${index}`;
            let uniqueName = sheetName;
            let counter = 1;
            while(wb.Sheets[uniqueName]) { uniqueName = `${sheetName.substring(0,27)}(${counter})`; counter++; }
            XLSX.utils.book_append_sheet(wb, ws, uniqueName);
        });

        // Use Payslip Period as Filename
        const safeFilename = payslipPeriod.trim().replace(/[\\/:*?"<>|]/g, "_");
        XLSX.writeFile(wb, `${safeFilename}.xlsx`);

      } catch (err) {
        console.error("Export failed", err);
        alert("Failed to export Excel file.");
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const renderRow = (emp, index) => {
    const { calculated } = emp;

      return (
        <tr key={emp.id || `r-${index}`} className={highlightedRows.includes(emp.id) ? 'row-highlight' : ''}>
        <td style={{textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center'}}>
            <button className="btn-icon btn-print" onClick={() => handlePrint(emp)} title="Print">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 9V3h12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="6" y="13" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn-icon btn-highlight" onClick={() => handleToggleHighlight(emp.id)} title="Toggle highlight row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 18v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.2 4.2l2.8 2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 10a5 5 0 1 1-10 0 5 5 0 0 1 10 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
        </td>
        <td className="col-id"><input type="text" value={emp.id} onChange={(e) => handleInputChange(index, 'id', e.target.value)} style={{textAlign: 'center', fontWeight: 'bold'}} /></td>
        
        <td className="text-left"><input type="text" value={emp.name} onChange={(e) => handleInputChange(index, 'name', e.target.value)} /></td>
        <td className="text-left"><input type="text" value={emp.position ?? ''} placeholder="" onChange={(e) => handleInputChange(index, 'position', e.target.value)} /></td>
        <td className="col-basic-salary"><input type="number" value={emp.basicSalary} onChange={(e) => handleInputChange(index, 'basicSalary', e.target.value)} style={{textAlign:'right'}} /></td>
        <td className="col-basic-decl"><input type="number" value={emp.basicForDecl} onChange={(e) => handleInputChange(index, 'basicForDecl', e.target.value)} style={{textAlign:'right'}} /></td>
        
        {/* Variable Inputs */}
        <td><input type="number" value={emp.hrsOT} onChange={(e) => handleInputChange(index, 'hrsOT', e.target.value)} placeholder="0" /></td>
        <td><span className="calculated-cell">{formatCurrency(calculated.otPay)}</span></td>
        <td><input type="number" title="Regular holiday hours" value={emp.hrsHolidayRegular || ''} onChange={(e) => handleInputChange(index, 'hrsHolidayRegular', e.target.value)} placeholder="0" /></td>
        <td><span className="calculated-cell" title="Regular holiday amount">{formatCurrency(calculated.regularHolidayPay)}</span></td>
        <td><input type="number" title="Special holiday hours" value={emp.hrsHolidaySpecial || ''} onChange={(e) => handleInputChange(index, 'hrsHolidaySpecial', e.target.value)} placeholder="0" /></td>
        <td><span className="calculated-cell" title="Special holiday amount">{formatCurrency(calculated.specialHolidayPay)}</span></td>

        {/* Adjustments */}
        <td className="col-deminimis"><input type="number" value={emp.deMinimis} onChange={(e) => handleInputChange(index, 'deMinimis', e.target.value)} /></td>
        <td><input type="number" value={emp.thirteenth ?? ''} onChange={(e) => handleInputChange(index, 'thirteenth', e.target.value)} style={{textAlign:'right', width: '90px'}} /></td>
        <td><input type="number" value={emp.nonTaxableOther} onChange={(e) => handleInputChange(index, 'nonTaxableOther', e.target.value)} /></td>
        <td className="col-hmo2"><input type="number" value={emp.hmo2 || 0} onChange={(e) => handleInputChange(index, 'hmo2', e.target.value)} style={{textAlign:'right'}} /></td>
        <td><input type="number" title="Tax Refund (adds to Gross Pay)" value={emp.deduction} onChange={(e) => handleInputChange(index, 'deduction', e.target.value)} /></td>
        
        <td><span className="calculated-cell" style={{backgroundColor:'#ecfdf5', color:'#047857'}}>{formatCurrency(calculated.grossPay)}</span></td>
        <td><span className="calculated-cell">{formatCurrency((parseFloat(emp.sss)||0) + (parseFloat(emp.sssMpf)||0))}</span></td>
        <td><input type="number" value={emp.philhealth} onChange={(e) => handleInputChange(index, 'philhealth', e.target.value)} /></td>
        <td className="col-pagibig"><input type="number" value={emp.pagibig} onChange={(e) => handleInputChange(index, 'pagibig', e.target.value)} /></td>
        <td><span className="calculated-cell">{formatCurrency(calculated.totalContributions)}</span></td>

        {/* Tax */}
        <td><span className="calculated-cell" style={{backgroundColor: '#fffbeb', color: '#b45309'}}>{formatCurrency(calculated.taxableIncome)}</span></td>
        <td>
          <input
            type="number"
            value={(emp.withholdingTax !== undefined && emp.withholdingTax !== '') ? emp.withholdingTax : calculated.wTax}
            onChange={(e) => handleInputChange(index, 'withholdingTax', e.target.value)}
            style={{textAlign:'right', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid transparent', padding: '6px'}}
          />
        </td>

        {/* Others */}
        <td><input type="number" value={emp.loans.sssSal} onChange={(e) => handleInputChange(index, 'sssSal', e.target.value, 'loans')} /></td>
        <td><input type="number" value={emp.loans.sssHouse} onChange={(e) => handleInputChange(index, 'sssHouse', e.target.value, 'loans')} /></td>
        <td><input type="number" value={emp.loans.pagibigSal} onChange={(e) => handleInputChange(index, 'pagibigSal', e.target.value, 'loans')} /></td>
        <td><input type="number" value={emp.loans.company} onChange={(e) => handleInputChange(index, 'company', e.target.value, 'loans')} /></td>

        {/* NET PAY */}
        <td><span className="calculated-cell" style={{backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize:'1.1em', fontWeight:'bold'}}>{formatCurrency(calculated.netPay)}</span></td>
      </tr>
    );
  };

  return (
    <>
        <div className="container">
        <h1 style={{marginBottom:'20px'}}>Payroll System <span className="byline">by angewonk</span></h1>
        
        <div style={{display:'flex', gap:'20px', alignItems:'center', marginBottom:'20px', backgroundColor:'#f8fafc', padding:'15px', borderRadius:'10px', border:'1px solid #e2e8f0'}}>
            <div>
                <label style={{display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#64748b', marginBottom:'5px'}}>Payslip Period:</label>
                <input 
                    type="text" 
                    value={payslipPeriod} 
                    onChange={(e) => setPayslipPeriod(e.target.value)} 
                    style={{
                        padding:'8px 12px', 
                        borderRadius:'6px', 
                        border:'1px solid #cbd5e1', 
                        fontSize:'1rem', 
                        width:'300px',
                        fontWeight: '500'
                    }}
                />
            </div>
            <div className="import-control">
              <label style={{display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#64748b', marginBottom:'5px'}}>Business Owner:</label>
              <input 
                type="text" 
                value={businessOwner} 
                onChange={(e) => setBusinessOwner(e.target.value)} 
                style={{
                  padding:'8px 12px', 
                  borderRadius:'6px', 
                  border:'1px solid #cbd5e1', 
                  fontSize:'1rem', 
                  width:'220px',
                  fontWeight: '500'
                }}
              />
            </div>

            <div className="import-control">
              <label>&nbsp;</label>
              <button className="btn-add" onClick={handleAddRow} style={{marginTop: '4px'}}>Add Row</button>
            </div>

            {/* Signature Uploader */}
            <div className="import-control">
                <label>Signature (PNG)</label>
                <input id="upload-signature" className="file-input" type="file" accept="image/*" onChange={handleSignatureUpload} />
                <label htmlFor="upload-signature" className="btn-upload" role="button">Upload Signature</label>
                {signatureDataUrl && (
                    <span 
                      className="template-link" 
                      onClick={handleClearSignature} 
                      style={{cursor: 'pointer', color: '#ef4444'}}
                    >
                        Clear Signature
                    </span>
                )}
            </div>

            {/* Excel Controls */}
            <div className="import-control">
               <label>Export</label>
               <button 
                  className="btn-upload" 
                  onClick={handleExportExcel} 
                  disabled={isExporting}
                  style={{
                      marginTop: '4px',
                      background: isExporting ? '#9ca3af' : 'linear-gradient(180deg, #107c41 0%, #0c5e31 100%)',
                      color: 'white',
                      border: 'none',
                      cursor: isExporting ? 'not-allowed' : 'pointer'
                  }}
               >
                  {isExporting ? 'Exporting...' : 'Export to Excel'}
               </button>
            </div>

            <div className="import-control">
                <label>Import Excel</label>
                <input id="upload-excel" className="file-input" type="file" accept=".xlsx" onChange={handleImportExcel} />
                <label htmlFor="upload-excel" className="btn-upload" role="button" style={{background: 'linear-gradient(180deg, #107c41 0%, #0c5e31 100%)'}}>Import Excel</label>
            </div>

            <div className="import-control">
                <label>Import CSV</label>
                <input id="upload-csv" className="file-input" type="file" accept=".csv,text/csv" onChange={handleFileUpload} />
                <label htmlFor="upload-csv" className="btn-upload" role="button">Upload CSV</label>
            </div>
        </div>
        
        <div style={{marginBottom:'20px'}}>
            <p style={{margin:0, fontSize:'0.9rem', color:'#475569'}}>
            <strong>Instructions:</strong> Rates (OT/Holiday) are based on <strong>Basic Salary</strong>. Tax Base is <strong>Basic for Declaration</strong>.
            </p>
        </div>

        <div className="payroll-table-wrapper">
            <table>
            <colgroup>
              <col />
              <col />
              <col />
              <col className="col-position" />
              <col className="col-basic-salary" />
              <col className="col-basic-decl" />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col className="col-deminimis" />
              <col />
              <col />
              <col className="col-hmo2" />
              <col />
              <col />
              <col />
              <col />
              <col className="col-pagibig" />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
                <tr>
                <th rowSpan="2" style={{zIndex: 20}}>Action</th>
                <th rowSpan="2" className="col-id">ID</th>
                <th rowSpan="2" style={{minWidth:'180px'}}>Employee Name</th>
                <th rowSpan="2" style={{minWidth:'220px'}}>Position</th>
                <th rowSpan="2" className="col-basic-salary">Basic Salary</th>
                <th rowSpan="2" className="col-basic-decl">Basic Salary for Declaration</th>
                <th colSpan="2" className="section-header">Overtime</th>
                <th colSpan="4" className="section-header">Holiday</th>
                <th colSpan="5" className="section-header">Adjustments</th>
                <th rowSpan="2" className="section-header" style={{minWidth:'90px'}}>GROSS PAY</th>
                <th colSpan="4" className="section-header">Contributions (Employee)</th>
                <th rowSpan="2">Taxable Income</th>
                <th rowSpan="2">Withholding Tax</th>
                <th colSpan="4" className="section-header">Loans</th>
                <th rowSpan="2" className="section-header" style={{minWidth:'100px'}}>NET PAY</th>
                </tr>
                <tr>
                <th style={{top: '45px'}}>OT Hours</th>
                <th style={{top: '45px'}}>OT Amount</th>
                <th style={{top: '45px'}}>Reg Hours</th>
                <th style={{top: '45px'}}>Reg Amount</th>
                <th style={{top: '45px'}}>Spec Hours</th>
                <th style={{top: '45px'}}>Spec Amount</th>
                <th style={{top: '45px'}} className="col-deminimis">De Minimis</th>
                <th style={{top: '45px', width: '80px'}}>13th Month/Benefits</th>
                <th style={{top: '45px'}}>INTERNET</th>
                <th style={{top: '45px'}}>2nd HMO</th>
                <th style={{top: '45px'}}>Tax Refund</th>
                <th style={{top: '45px'}}>SSS / MPF</th>
                <th style={{top: '45px'}}>PhilHealth</th>
                <th className="col-pagibig" style={{top: '45px', minWidth: '120px'}}>Pag-IBIG</th>
                <th style={{top: '45px'}}>Total</th>
                <th style={{top: '45px'}}>SSS Salary</th>
                <th style={{top: '45px'}}>SSS Housing</th>
                <th style={{top: '45px'}}>PagIBIG</th>
                <th style={{top: '45px'}}>Others</th>
                </tr>
            </thead>
            <tbody>
              {processedEmployees.map((emp, index) => renderRow(emp, index))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
              <td colSpan="4" className="text-center">TOTALS</td>
              <td className="text-right col-basic-salary">{formatCurrency(totals.basicSalary || 0)}</td>
              <td className="text-right col-basic-decl">{formatCurrency(totals.basicForDecl || 0)}</td>
              <td></td> <td></td> <td></td> <td></td> <td></td> <td></td>
              <td className="col-deminimis"></td>
              <td className="text-right col-thirteenth">{formatCurrency(totals.thirteenth || 0)}</td>
              <td></td>
              <td className="col-hmo2">{formatCurrency(totals.hmo2 || 0)}</td>
              <td></td>
              <td className="text-right"><span className="calculated-cell">{formatCurrency(totals.grossPay)}</span></td>
              <td></td> <td></td> <td></td> <td></td> <td></td>
              <td className="text-right"><span className="calculated-cell" style={{color:'#f87171'}}>{formatCurrency(totals.wTax)}</span></td>
              <td></td> <td></td> <td></td> <td></td>
              <td className="text-right"><span className="calculated-cell" style={{color:'#60a5fa', fontSize:'1.2em'}}>{formatCurrency(totals.netPay)}</span></td>
              </tr>
            </tfoot>
            </table>
        </div>
        </div>

        {printEmployee && <Payslip employee={printEmployee} period={payslipPeriod} signature={signatureDataUrl} businessOwner={businessOwner} showLogo={showLogo} />}
    </>
  )
}

export default App;