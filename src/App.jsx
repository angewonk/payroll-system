import { useState, useEffect } from 'react';
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

// INITIAL_DATA intentionally empty to avoid committing private data.
const INITIAL_DATA = [];

// --- CSV Parsing Helper ---
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
  const [payslipPeriod, setPayslipPeriod] = useState('December 1 to 31, 2025');
  const [printEmployee, setPrintEmployee] = useState(null);
  const [highlightedRows, setHighlightedRows] = useState([]);

  const handleToggleHighlight = (id) => {
    setHighlightedRows(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      return [...prev, id];
    });
  };

  const handleInputChange = (index, field, value, nestedField = null) => {
    const updatedEmployees = [...employees];
    
    // Handle Input: If empty string, keep as empty string for UI, but treat as 0 for calc
    let val = value;

    if (nestedField) {
      updatedEmployees[index][nestedField][field] = val;
    } else {
      updatedEmployees[index][field] = val;
    }
    
    // Attempt to auto-compute withholding tax for the row if user hasn't provided an override.
    try {
      const safeNum = (v) => parseFloat(v) || 0;
      const emp = updatedEmployees[index];
      
      const basicSalary = safeNum(emp.basicSalary); // UPDATED: Get Real Basic Salary
      const basicForDecl = safeNum(emp.basicForDecl);
      const hrsOT = safeNum(emp.hrsOT);
      const hrsHolidayRegular = safeNum(emp.hrsHolidayRegular);
      const hrsHolidaySpecial = safeNum(emp.hrsHolidaySpecial);
      const sss = safeNum(emp.sss);
      const sssMpf = safeNum(emp.sssMpf);
      const philhealth = safeNum(emp.philhealth);
      const pagibig = safeNum(emp.pagibig);

      // UPDATED: Calculate Rates based on basicSalary (not basicForDecl)
      const dailyRate = calculateDailyRate(basicSalary);
      const otPay = calculateOTPay(basicSalary, hrsOT);
      const regularHolidayPay = hrsHolidayRegular > 0 ? calculateRegularHolidayPay(basicSalary, hrsHolidayRegular) : 0;
      const specialHolidayPay = hrsHolidaySpecial > 0 ? calculateSpecialHolidayPay(basicSalary, hrsHolidaySpecial) : 0;
      const holidayPay = regularHolidayPay + specialHolidayPay;

      const totalContributions = sss + sssMpf + philhealth + pagibig;
      
      // Note: Taxable income still uses basicForDecl as the base component, plus the NEW OT/Holiday amounts
      const taxableIncome = (basicForDecl + otPay + holidayPay) - totalContributions;
      const computedWTax = computeWithholdingTax(taxableIncome > 0 ? taxableIncome : 0);

      // Only populate withholdingTax when it's empty
      if (emp.withholdingTax === undefined || emp.withholdingTax === '') {
        updatedEmployees[index].withholdingTax = Number(computedWTax.toFixed(2));
      }
    } catch (err) {
      // silent fallback
    }

    setEmployees(updatedEmployees);
  };

  const handleAddRow = () => {
    setEmployees(prev => ([...prev, createBlankEmployee()]));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCSVText(ev.target.result || '');
        if (parsed && parsed.length) {
          setEmployees(parsed);
        }
      } catch (err) {
        console.error('CSV parse error', err);
        alert('Failed to parse CSV file. Check file format.');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    setEmployees(prev => (Array.isArray(prev) && prev.length > 0) ? prev : [createBlankEmployee()]);
  }, []);

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
    // repurpose `deduction` input as Tax Refund (will be added to gross)
    const taxRefund = safeNum(emp.deduction);
    const basicForDecl = safeNum(emp.basicForDecl);

    const sss = safeNum(emp.sss);
    const sssMpf = safeNum(emp.sssMpf);
    const philhealth = safeNum(emp.philhealth);
    const pagibig = safeNum(emp.pagibig);

    // 1. Calculations - UPDATED: Use `basicSalary` (Real) for Rates
    const dailyRate = calculateDailyRate(basicSalary);
    const otPay = calculateOTPay(basicSalary, hrsOT);
    
    // UPDATED: Calculate separate holiday pays using `basicSalary`
    const regularHolidayPay = hrsHolidayRegular > 0 ? calculateRegularHolidayPay(basicSalary, hrsHolidayRegular) : 0;
    const specialHolidayPay = hrsHolidaySpecial > 0 ? calculateSpecialHolidayPay(basicSalary, hrsHolidaySpecial) : 0;
    const holidayPay = regularHolidayPay + specialHolidayPay;

    // Gross Pay includes adjustments + computed OT/Holiday and Tax Refund (added)
    const grossPay = basicForDecl + deMinimis + thirteenth + otPay + holidayPay + nonTaxableOther + hmo2 + taxRefund;
    
    const totalContributions = sss + sssMpf + philhealth + pagibig;
    
    // Taxable Income: Basic Declared + (OT & Holiday based on Real Basic) - Contributions
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
        dailyRate,
        otPay,
        regularHolidayPay,
        specialHolidayPay,
        holidayPay,
        grossPay,
        totalContributions,
        taxableIncome,
        wTax,
        totalLoans,
        netPay
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
    setTimeout(() => {
        window.print();
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
                <label style={{display:'block', fontSize:'0.85rem', fontWeight:'600', color:'#64748b', marginBottom:'5px'}}>PAYSLIP PERIOD:</label>
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
            <div>
                <button className="btn-add" onClick={handleAddRow}>Add Row</button>
            </div>
            <div className="import-control">
                <label>Import CSV</label>
                <input id="upload-csv" className="file-input" type="file" accept=".csv,text/csv" onChange={handleFileUpload} />
                <label htmlFor="upload-csv" className="btn-upload" role="button">Upload employee data</label>
                <a className="template-link" href="/initial_data_template.csv" target="_blank" rel="noreferrer">Use the template</a>
            </div>
            <div style={{flex:1}}>
                 <p style={{margin:0, fontSize:'0.9rem', color:'#475569'}}>
                    <strong>Instructions:</strong> Rates (OT/Holiday) are based on <strong>Basic Salary</strong>. Tax Base is <strong>Basic for Declaration</strong>.
                 </p>
            </div>
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

        {printEmployee && <Payslip employee={printEmployee} period={payslipPeriod} />}
    </>
  )
}

export default App;