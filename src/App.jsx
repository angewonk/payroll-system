import { useState } from 'react';
import './App.css';
import Payslip from './Payslip';
import CustomSelect from './CustomSelect';
import { 
  computeWithholdingTax, 
  calculateDailyRate, 
  calculateOTPay,
  formatCurrency,
  formatNumber
} from './utils';

// CLEAN INITIAL DATA: Fixed info stays, variable info (OT/Holiday) set to 0
const INITIAL_DATA = [
  {
    id: '20240204', name: 'Cerezo, Leslie Jeanne Panado', basicSalary: 40000, 
    hmo1: 1600, hmo2: 1600, basicForDecl: 37000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular', 
    nonTaxableOther: 1500, deduction: 0,
      sss: 1000, sssMpf: 750, sssEc: 30, philhealth: 925, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240207', name: 'Villeza, Janus Ureta', basicSalary: 30000, 
    hmo1: 1600, hmo2: 1600, basicForDecl: 27000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular', 
    nonTaxableOther: 1500, deduction: 0,
      sss: 1000, sssMpf: 350, sssEc: 30, philhealth: 675, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240206', name: 'Santiago, Jay R Santos', basicSalary: 34000, 
    hmo1: 1600, hmo2: 0, basicForDecl: 31000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular', 
    nonTaxableOther: 1500, deduction: 0,
      sss: 1000, sssMpf: 550, sssEc: 30, philhealth: 775, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240205', name: 'Dela Cruz, Abelardo Angel', basicSalary: 45000, 
    hmo1: 1600, hmo2: 1600, basicForDecl: 42000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular',
    nonTaxableOther: 1500, deduction: 0,
      sss: 1000, sssMpf: 750, sssEc: 30, philhealth: 1050, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240202', name: 'Rasalan, Kyle Roel Abrigo', basicSalary: 50000, 
    hmo1: 1600, hmo2: 0, basicForDecl: 47000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular',
    nonTaxableOther: 1500, deduction: 0,
      sss: 1000, sssMpf: 750, sssEc: 30, philhealth: 1175, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240201', name: 'Mallari, Brian Escranda', basicSalary: 55000, 
    hmo1: 1600, hmo2: 0, basicForDecl: 52000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular',
    nonTaxableOther: 1500, deduction: 0,
      sss: 3000, sssMpf: 2250, sssEc: 30, philhealth: 1300, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240203', name: 'Nacar, Miguelito Abong', basicSalary: 45000, 
    hmo1: 1600, hmo2: 1600, basicForDecl: 42000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular',
    nonTaxableOther: 1500, deduction: 0,
      sss: 1000, sssMpf: 750, sssEc: 30, philhealth: 1050, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
   id: '20240211', name: 'Dorado, Maria Berlyn Dela Torre', basicSalary: 28000, 
   hmo1: 1600, hmo2: 0, basicForDecl: 25000, deMinimis: 3000,
   hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular',
    nonTaxableOther: 1500, deduction: 0,
      sss: 1000, sssMpf: 250, sssEc: 30, philhealth: 625, pagibig: 200,
      loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240210', name: 'Panduyos, Romina Joy Dela Cruz', basicSalary: 45000, 
    hmo1: 1600, hmo2: 0, basicForDecl: 42000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular',
    nonTaxableOther: 1500, deduction: 0,
      sss: 1000, sssMpf: 750, sssEc: 30, philhealth: 1050, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240212', name: 'Valerozo, Manuel', basicSalary: 30000, 
    hmo1: 1600, hmo2: 3200, basicForDecl: 27000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular', 
    nonTaxableOther: 1500, deduction: 0,
      sss: 1000, sssMpf: 350, sssEc: 30, philhealth: 675, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  }
];

// Factory to create a fresh blank employee object (avoids shared nested objects and provides unique id)
const createBlankEmployee = () => ({
  id: `new-${Date.now()}`, name: '', basicSalary: '',
  hmo1: '', hmo2: '', basicForDecl: '', deMinimis: '',
  hrsOT: '', hrsHoliday: '', holidayType: 'Regular',
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
      // nestedField is the parent key (e.g. 'loans'), field is the child key (e.g. 'sssSal')
      updatedEmployees[index][nestedField][field] = val;
    } else {
      updatedEmployees[index][field] = val;
    }
    // Attempt to auto-compute withholding tax for the row if user hasn't provided an override.
    try {
      const safeNum = (v) => parseFloat(v) || 0;
      const emp = updatedEmployees[index];
      const basicForDecl = safeNum(emp.basicForDecl);
      const hrsOT = safeNum(emp.hrsOT);
      const hrsHoliday = safeNum(emp.hrsHoliday);
      const sss = safeNum(emp.sss);
      const sssMpf = safeNum(emp.sssMpf);
      const philhealth = safeNum(emp.philhealth);
      const pagibig = safeNum(emp.pagibig);

      const dailyRate = calculateDailyRate(basicForDecl);
      const otPay = calculateOTPay(basicForDecl, hrsOT);
      let holidayPay = 0;
      if (hrsHoliday > 0) {
        // Use daily-rate based computation: holidayPay = dailyRate * multiplier * (hours / 8)
        if (emp.holidayType === 'Regular') {
          holidayPay = dailyRate * 1.0 * (hrsHoliday / 8);
        } else {
          holidayPay = dailyRate * 0.3 * (hrsHoliday / 8);
        }
      }

      const totalContributions = sss + sssMpf + philhealth + pagibig;
      const taxableIncome = (basicForDecl + otPay + holidayPay) - totalContributions;
      const computedWTax = computeWithholdingTax(taxableIncome > 0 ? taxableIncome : 0);

      // Only populate withholdingTax when it's empty (user can still override it later)
      if (emp.withholdingTax === undefined || emp.withholdingTax === '') {
        // keep as number rounded to 2 decimals
        updatedEmployees[index].withholdingTax = Number(computedWTax.toFixed(2));
      }
    } catch (err) {
      // silent fallback — don't block UI
    }

    setEmployees(updatedEmployees);
  };

  const handleAddRow = () => {
    setEmployees(prev => ([...prev, createBlankEmployee()]));
  };

  // --- REAL-TIME CALCULATION ---
  // We map over the state to produce derived data for the UI.
  // This ensures that as soon as state changes, calculations update immediately.
  const processedEmployees = employees.map(emp => {
    // Helper to safely parse numbers
    const safeNum = (v) => parseFloat(v) || 0;

    const basicSalary = safeNum(emp.basicSalary);
    const hrsOT = safeNum(emp.hrsOT);
    const hrsHoliday = safeNum(emp.hrsHoliday);
    const deMinimis = safeNum(emp.deMinimis);
    const thirteenth = safeNum(emp.thirteenth);
    const nonTaxableOther = safeNum(emp.nonTaxableOther);
    const deduction = safeNum(emp.deduction);
    const basicForDecl = safeNum(emp.basicForDecl);

    const sss = safeNum(emp.sss);
    const sssMpf = safeNum(emp.sssMpf);
    const philhealth = safeNum(emp.philhealth);
    const pagibig = safeNum(emp.pagibig);

    // 1. Calculations (use `basicForDecl` as the computation base)
    const dailyRate = calculateDailyRate(basicForDecl);
    const otPay = calculateOTPay(basicForDecl, hrsOT);
    
    let holidayPay = 0;
    if (hrsHoliday > 0) {
      // Use daily-rate based computation: holidayPay = dailyRate * multiplier * (hours / 8)
      if (emp.holidayType === 'Regular') {
        holidayPay = dailyRate * 1.0 * (hrsHoliday / 8);
      } else {
        holidayPay = dailyRate * 0.3 * (hrsHoliday / 8);
      }
    }

    const grossPay = basicForDecl + deMinimis + thirteenth + otPay + holidayPay + nonTaxableOther - deduction;
    const totalContributions = sss + sssMpf + philhealth + pagibig;
    const taxableIncome = (basicForDecl + otPay + holidayPay) - totalContributions;
    // Allow manual override of withholding tax via `emp.withholdingTax`.
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
      ...emp, // contains raw input values
      calculated: {
        dailyRate,
        otPay,
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

  // Calculate Totals derived from processedEmployees
  const totals = processedEmployees.reduce((acc, curr) => {
    const safeNum = (v) => parseFloat(v) || 0;
    acc.basicSalary = (acc.basicSalary || 0) + safeNum(curr.basicSalary);
    acc.basicForDecl = (acc.basicForDecl || 0) + safeNum(curr.basicForDecl);
    acc.thirteenth = (acc.thirteenth || 0) + safeNum(curr.thirteenth);
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
        <td className="col-basic-salary"><input type="number" value={emp.basicSalary} onChange={(e) => handleInputChange(index, 'basicSalary', e.target.value)} style={{textAlign:'right'}} /></td>
        <td className="col-basic-decl"><input type="number" value={emp.basicForDecl} onChange={(e) => handleInputChange(index, 'basicForDecl', e.target.value)} style={{textAlign:'right'}} /></td>
        
        {/* Variable Inputs */}
        <td><input type="number" value={emp.hrsOT} onChange={(e) => handleInputChange(index, 'hrsOT', e.target.value)} placeholder="0" /></td>
        <td><span className="calculated-cell">{formatCurrency(calculated.otPay)}</span></td>
        <td><input type="number" value={emp.hrsHoliday} onChange={(e) => handleInputChange(index, 'hrsHoliday', e.target.value)} placeholder="0" /></td>
        <td>
          <CustomSelect
            className="custom-holiday-select"
            value={emp.holidayType}
            onChange={(v) => handleInputChange(index, 'holidayType', v)}
            options={[{ value: 'Regular', label: 'Regular (100%)' }, { value: 'Special', label: 'Special (30%)' }]}
          />
        </td>
        <td><span className="calculated-cell">{formatCurrency(calculated.holidayPay)}</span></td>

        {/* Adjustments */}
        <td className="col-deminimis"><input type="number" value={emp.deMinimis} onChange={(e) => handleInputChange(index, 'deMinimis', e.target.value)} /></td>
        <td><input type="number" value={emp.thirteenth ?? ''} onChange={(e) => handleInputChange(index, 'thirteenth', e.target.value)} style={{textAlign:'right', width: '90px'}} /></td>
        <td><input type="number" value={emp.nonTaxableOther} onChange={(e) => handleInputChange(index, 'nonTaxableOther', e.target.value)} /></td>
        <td className="col-hmo2"><input type="number" value={emp.hmo2 || 0} onChange={(e) => handleInputChange(index, 'hmo2', e.target.value)} style={{textAlign:'right'}} /></td>
        <td><input type="number" value={emp.deduction} onChange={(e) => handleInputChange(index, 'deduction', e.target.value)} /></td>
        
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

        {/* Loans */}
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
        <h1 style={{marginBottom:'20px'}}>Payroll System</h1>
        
        {/* TOP CONTROLS */}
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
            <div style={{flex:1}}>
                 <p style={{margin:0, fontSize:'0.9rem', color:'#475569'}}>
                    <strong>Instructions:</strong> Review fixed contributions. Enter <strong>OT Hours</strong> and <strong>Holiday Hours</strong> for this period.
                 </p>
            </div>
        </div>

        <div className="payroll-table-wrapper">
            <table>
            <colgroup>
              <col />
              <col />
              <col />
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
                <th rowSpan="2" className="col-basic-salary">Basic Salary</th>
                <th rowSpan="2" className="col-basic-decl">Basic Salary for Declaration</th>
                <th colSpan="2" className="section-header">Overtime</th>
                <th colSpan="3" className="section-header">Holiday</th>
                <th colSpan="5" className="section-header">Adjustments</th>
                <th rowSpan="2" className="section-header" style={{minWidth:'90px'}}>GROSS PAY</th>
                <th colSpan="4" className="section-header">Contributions (Employee)</th>
                <th rowSpan="2">Taxable Income</th>
                <th rowSpan="2">Withholding Tax</th>
                <th colSpan="4" className="section-header">Loans</th>
                <th rowSpan="2" className="section-header" style={{minWidth:'100px'}}>NET PAY</th>
                </tr>
                <tr>
                {/* Sub headers */}
                <th style={{top: '45px'}}>Hours</th>
                <th style={{top: '45px'}}>Amount</th>
                <th style={{top: '45px'}}>Hours</th>
                <th style={{top: '45px', width: '160px'}}>Type</th>
                <th style={{top: '45px'}}>Amount</th>
                <th style={{top: '45px'}} className="col-deminimis">De Minimis</th>
                <th style={{top: '45px', width: '80px'}}>13th Month/Benefits</th>
                <th style={{top: '45px'}}>INTERNET</th>
                <th style={{top: '45px'}}>2nd HMO</th>
                <th style={{top: '45px'}}>Deduction</th>
                <th style={{top: '45px'}}>SSS / MPF</th>
                <th style={{top: '45px'}}>PhilHealth</th>
                <th className="col-pagibig" style={{top: '45px', minWidth: '120px'}}>Pag-IBIG</th>
                <th style={{top: '45px'}}>Total</th>
                <th style={{top: '45px'}}>SSS Salary</th>
                <th style={{top: '45px'}}>SSS Housing</th>
                <th style={{top: '45px'}}>PagIBIG</th>
                <th style={{top: '45px'}}>Company</th>
                </tr>
            </thead>
            <tbody>
              {processedEmployees.map((emp, index) => renderRow(emp, index))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
              <td colSpan="3" className="text-center">TOTALS</td> {/* action, id, name */}
              <td className="text-right col-basic-salary">{formatCurrency(totals.basicSalary || 0)}</td> {/* basicSalary */}
              <td className="text-right col-basic-decl">{formatCurrency(totals.basicForDecl || 0)}</td> {/* basicForDecl */}

              {/* Overtime & Holiday columns (6-11) */}
              <td></td> {/* OT hours */}
              <td></td> {/* OT amount */}
              <td></td> {/* Holiday hours */}
              <td></td> {/* Holiday type */}
              <td></td> {/* Holiday amount */}

              {/* Adjustments (11-15) */}
              <td className="col-deminimis"></td> {/* De Minimis */}
              <td className="text-right col-thirteenth">{formatCurrency(totals.thirteenth || 0)}</td> {/* 13th month */}
              <td></td> {/* INTERNET / nonTaxableOther */}
              <td className="col-hmo2"></td> {/* 2nd HMO */}
              <td></td> {/* Deduction */}

              <td className="text-right"><span className="calculated-cell">{formatCurrency(totals.grossPay)}</span></td> {/* Gross Pay (16) */}

              {/* Contributions (17-21) */}
              <td></td> {/* SSS / MPF */}
              <td></td> {/* PhilHealth */}
              <td></td> {/* Pag-IBIG */}
              <td></td> {/* Total contributions */}

              <td></td> {/* Taxable Income */}
              <td className="text-right"><span className="calculated-cell" style={{color:'#f87171'}}>{formatCurrency(totals.wTax)}</span></td> {/* Withholding Tax (22) */}

              {/* Loans (23-26) */}
              <td></td>
              <td></td>
              <td></td>
              <td></td>

              <td className="text-right"><span className="calculated-cell" style={{color:'#60a5fa', fontSize:'1.2em'}}>{formatCurrency(totals.netPay)}</span></td> {/* Net Pay (27) */}
              </tr>
            </tfoot>
            </table>
        </div>
        </div>

        {printEmployee && <Payslip employee={printEmployee} period={payslipPeriod} />}
    </>
  )
}

export default App