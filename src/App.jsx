import { useState } from 'react';
import './App.css';
import Payslip from './Payslip';
import { 
  computeWithholdingTax, 
  calculateDailyRate, 
  formatCurrency 
} from './utils';

// CLEAN INITIAL DATA: Fixed info stays, variable info (OT/Holiday) set to 0
const INITIAL_DATA = [
  {
    id: '20240204', name: 'Cerezo, Leslie Jeanne Panado', basicSalary: 40000, 
    hmo1: 1600, hmo2: 1600, basicForDecl: 37000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Special', 
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
    hmo1: 1600, hmo2: 1600, basicForDecl: 31000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular', 
    nonTaxableOther: 1500, deduction: 0,
    sss: 1000, sssMpf: 550, sssEc: 30, philhealth: 775, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240205', name: 'Dela Cruz, Abelardo Angel', basicSalary: 45000, 
    hmo1: 1600, hmo2: 1600, basicForDecl: 42000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Special',
    nonTaxableOther: 1500, deduction: 0,
    sss: 1000, sssMpf: 750, sssEc: 30, philhealth: 1050, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240202', name: 'Rasalan, Kyle Roel Abrigo', basicSalary: 50000, 
    hmo1: 1600, hmo2: 1600, basicForDecl: 47000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular',
    nonTaxableOther: 1500, deduction: 0,
    sss: 1000, sssMpf: 750, sssEc: 30, philhealth: 1175, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240201', name: 'Mallari, Brian Escranda', basicSalary: 55000, 
    hmo1: 1600, hmo2: 1600, basicForDecl: 52000, deMinimis: 3000,
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
    hmo1: 1600, hmo2: 1600, basicForDecl: 25000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular',
    nonTaxableOther: 1500, deduction: 0,
    sss: 1000, sssMpf: 250, sssEc: 30, philhealth: 625, pagibig: 200,
      loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240210', name: 'Panduyos, Romina Joy Dela Cruz', basicSalary: 45000, 
    hmo1: 1600, hmo2: 1600, basicForDecl: 42000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Regular',
    nonTaxableOther: 1500, deduction: 0,
    sss: 1000, sssMpf: 750, sssEc: 30, philhealth: 1050, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  },
  {
    id: '20240212', name: 'Valerozo, Manuel', basicSalary: 30000, 
    hmo1: 1600, hmo2: 1600, basicForDecl: 27000, deMinimis: 3000,
    hrsOT: 0, hrsHoliday: 0, holidayType: 'Special', 
    nonTaxableOther: 1500, deduction: 0,
    sss: 1000, sssMpf: 350, sssEc: 30, philhealth: 675, pagibig: 200,
    loans: { sssSal: 0, sssHouse: 0, pagibigSal: 0, company: 0 }
  }
];

function App() {
  const [employees, setEmployees] = useState(INITIAL_DATA);
  const [payslipPeriod, setPayslipPeriod] = useState('December 1 to 31, 2025');
  const [printEmployee, setPrintEmployee] = useState(null);

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
    setEmployees(updatedEmployees);
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
    const nonTaxableOther = safeNum(emp.nonTaxableOther);
    const deduction = safeNum(emp.deduction);
    const basicForDecl = safeNum(emp.basicForDecl);

    const sss = safeNum(emp.sss);
    const sssMpf = safeNum(emp.sssMpf);
    const philhealth = safeNum(emp.philhealth);
    const pagibig = safeNum(emp.pagibig);

    // 1. Calculations
    const dailyRate = calculateDailyRate(basicSalary);
    const hourlyRate = dailyRate / 8;
    const otPay = hrsOT * (hourlyRate * 1.25);
    
    let holidayPay = 0;
    if (hrsHoliday > 0) {
      if (emp.holidayType === 'Regular') {
          holidayPay = (hourlyRate * 1) * hrsHoliday;
      } else {
          holidayPay = (hourlyRate * 0.3) * hrsHoliday;
      }
    }

    const grossPay = basicSalary + deMinimis + otPay + holidayPay + nonTaxableOther - deduction;
    const totalContributions = sss + sssMpf + philhealth + pagibig;
    const taxableIncome = (basicForDecl + otPay + holidayPay) - totalContributions;
    const wTax = computeWithholdingTax(taxableIncome > 0 ? taxableIncome : 0);
    
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
      <tr key={index}>
        <td style={{textAlign: 'center'}}>
            <button className="btn-print" onClick={() => handlePrint(emp)}>Print</button>
        </td>
        <td><input type="text" value={emp.id} onChange={(e) => handleInputChange(index, 'id', e.target.value)} style={{textAlign: 'center', fontWeight: 'bold'}} /></td>
        
        <td className="text-left"><input type="text" value={emp.name} onChange={(e) => handleInputChange(index, 'name', e.target.value)} /></td>
        <td><input type="number" value={emp.basicSalary} onChange={(e) => handleInputChange(index, 'basicSalary', e.target.value)} /></td>
        
        {/* Variable Inputs */}
        <td><input type="number" value={emp.hrsOT} onChange={(e) => handleInputChange(index, 'hrsOT', e.target.value)} placeholder="0" /></td>
        <td><span className="calculated-cell">{formatCurrency(calculated.otPay)}</span></td>
        <td><input type="number" value={emp.hrsHoliday} onChange={(e) => handleInputChange(index, 'hrsHoliday', e.target.value)} placeholder="0" /></td>
        <td>
            <select value={emp.holidayType} onChange={(e) => handleInputChange(index, 'holidayType', e.target.value)}>
                <option value="Special">Special (30%)</option>
                <option value="Regular">Regular (100%)</option>
            </select>
        </td>
        <td><span className="calculated-cell">{formatCurrency(calculated.holidayPay)}</span></td>

        {/* Adjustments */}
        <td><input type="number" value={emp.deMinimis} onChange={(e) => handleInputChange(index, 'deMinimis', e.target.value)} /></td>
        <td><input type="number" value={emp.nonTaxableOther} onChange={(e) => handleInputChange(index, 'nonTaxableOther', e.target.value)} /></td>
        <td><input type="number" value={emp.deduction} onChange={(e) => handleInputChange(index, 'deduction', e.target.value)} /></td>
        
        <td><span className="calculated-cell" style={{backgroundColor:'#ecfdf5', color:'#047857'}}>{formatCurrency(calculated.grossPay)}</span></td>

        {/* Fixed Contributions (Editable) */}
        <td><input type="number" value={emp.sss} onChange={(e) => handleInputChange(index, 'sss', e.target.value)} /></td>
        <td><input type="number" value={emp.sssMpf} onChange={(e) => handleInputChange(index, 'sssMpf', e.target.value)} /></td>
        <td><input type="number" value={emp.philhealth} onChange={(e) => handleInputChange(index, 'philhealth', e.target.value)} /></td>
        <td><input type="number" value={emp.pagibig} onChange={(e) => handleInputChange(index, 'pagibig', e.target.value)} /></td>
        <td><span className="calculated-cell">{formatCurrency(calculated.totalContributions)}</span></td>

        {/* Tax */}
        <td><span className="calculated-cell" style={{backgroundColor: '#fffbeb', color: '#b45309'}}>{formatCurrency(calculated.taxableIncome)}</span></td>
        <td><span className="calculated-cell" style={{backgroundColor: '#fef2f2', color: '#b91c1c'}}>{formatCurrency(calculated.wTax)}</span></td>

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
            <div style={{flex:1}}>
                 <p style={{margin:0, fontSize:'0.9rem', color:'#475569'}}>
                    <strong>Instructions:</strong> Review fixed contributions. Enter <strong>OT Hours</strong> and <strong>Holiday Hours</strong> for this period.
                 </p>
            </div>
        </div>

        <div className="payroll-table-wrapper">
            <table>
            <thead>
                <tr>
                <th rowSpan="2" style={{zIndex: 20}}>Action</th>
                <th rowSpan="2">ID</th>
                <th rowSpan="2" style={{minWidth:'180px'}}>Employee Name</th>
                <th rowSpan="2">Basic Salary</th>
                <th colSpan="2" className="section-header">Overtime</th>
                <th colSpan="3" className="section-header">Holiday</th>
                <th colSpan="3" className="section-header">Adjustments</th>
                <th rowSpan="2" className="section-header" style={{minWidth:'90px'}}>GROSS PAY</th>
                <th colSpan="5" className="section-header">Contributions (Employee)</th>
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
                <th style={{top: '45px'}}>Type</th>
                <th style={{top: '45px'}}>Amount</th>
                <th style={{top: '45px'}}>De Minimis</th>
                <th style={{top: '45px'}}>Non-Taxable</th>
                <th style={{top: '45px'}}>Deduction</th>
                <th style={{top: '45px'}}>SSS</th>
                <th style={{top: '45px'}}>MPF</th>
                <th style={{top: '45px'}}>PhilHealth</th>
                <th style={{top: '45px'}}>Pag-IBIG</th>
                <th style={{top: '45px'}}>Total</th>
                <th style={{top: '45px'}}>SSS Salary</th>
                <th style={{top: '45px'}}>SSS Housing</th>
                <th style={{top: '45px'}}>PagIBIG</th>
                <th style={{top: '45px'}}>Company</th>
                </tr>
            </thead>
            <tbody>
                {processedEmployees.map((emp, index) => renderRow(emp, index))}
                
                {/* Totals Row */}
                <tr className="totals-row">
                <td colSpan="2" className="text-center">TOTALS</td>
                <td className="text-right"></td>
                <td className="text-right">{formatCurrency(totals.basicSalary)}</td>
                <td colSpan="8"></td>
                <td className="text-right"><span className="calculated-cell">{formatCurrency(totals.grossPay)}</span></td>
                <td colSpan="5"></td>
                <td></td>
                <td className="text-right"><span className="calculated-cell" style={{color:'#f87171'}}>{formatCurrency(totals.wTax)}</span></td>
                <td colSpan="4"></td>
                <td className="text-right"><span className="calculated-cell" style={{color:'#60a5fa', fontSize:'1.2em'}}>{formatCurrency(totals.netPay)}</span></td>
                </tr>
            </tbody>
            </table>
        </div>
        </div>

        {printEmployee && <Payslip employee={printEmployee} period={payslipPeriod} />}
    </>
  )
}

export default App