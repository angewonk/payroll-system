import React, { useState } from 'react';
import { formatCurrency, formatNumber } from './utils';
import logo from './assets/logo.png';

const Payslip = ({ employee, period, signature, businessOwner: initialOwner = 'Brian E. Mallari' }) => {
  if (!employee) return null;

  const { calculated, loans } = employee;

  // Business owner (approver) editable input
  const [businessOwner, setBusinessOwner] = useState(initialOwner);

  // Safe numeric helpers - state inputs may be strings, parse to numbers
  const safeNum = (v) => parseFloat(v) || 0;

  // computed values
  // `calculated.grossPay` in App.jsx already includes tax refund (employee.deduction).
  // For display, `calculated.grossPay` is the total earnings for the period.
  const earningsTotal = safeNum(calculated.grossPay);

  const totalDeductions = safeNum(calculated.totalContributions) + safeNum(calculated.wTax) + safeNum(calculated.totalLoans);

  return (
    <div className="payslip-container">
      <div className="payslip-box">
        
        {/* Header Section */}
        <div className="payslip-header">
          <div className="company-name">BEMTECH IT SOLUTIONS</div>
          <div className="payslip-title">P A Y S L I P</div>
          <div className="logo-area">
            <img src={logo} alt="Company logo" className="payslip-logo" />
          </div>
        </div>

        {/* Employee Details */}
        <div className="employee-info">
          <div className="info-row">
            <span className="label">Period:</span>
            <span className="value">{period}</span>
            <input
              className="owner-input"
              value={businessOwner}
              onChange={(e) => setBusinessOwner(e.target.value)}
              placeholder="Business owner"
              aria-label="Business owner name"
            />
          </div>
          <div className="info-row"><span className="label">ID No.</span> <span className="value">{employee.id}</span></div>
          <div className="info-row"><span className="label">Name:</span> <span className="value bold">{employee.name}</span></div>
          <div className="info-row"><span className="label">Position</span> <span className="value">{employee.position || ''}</span></div>
        </div>

        {/* Earnings & Deductions Table */}
        <div className="details-grid">
          
          {/* Earnings Column */}
          <div className="column earnings">
            <div className="col-header">
              <span>EARNINGS</span>
              <span>Amount</span>
            </div>
            <div className="row">
              <span>Basic</span>
              <span>{formatNumber(Number(employee.basicForDecl) || 0)}</span>
            </div>
            <div className="row">
              <span>Overtime ({employee.hrsOT} hrs).....</span>
              <span>{employee.hrsOT > 0 ? formatCurrency(calculated.otPay).replace('₱', '') : '0.00'}</span>
            </div>
            <div className="row">
              <span>Regular Holiday ({employee.hrsHolidayRegular || 0} hrs)</span>
              <span>{(employee.hrsHolidayRegular > 0) ? formatCurrency(calculated.regularHolidayPay).replace('₱', '') : '0.00'}</span>
            </div>
            <div className="row">
              <span>Special Holiday ({employee.hrsHolidaySpecial || 0} hrs)</span>
              <span>{(employee.hrsHolidaySpecial > 0) ? formatCurrency(calculated.specialHolidayPay).replace('₱', '') : '0.00'}</span>
            </div>
            <div className="row">
              <span>Tax Refund................</span>
              <span>{formatCurrency(employee.deduction).replace('₱', '')}</span>
            </div>
            <div className="row">
              <span>De Minimis.................</span>
              <span>{formatCurrency(employee.deMinimis).replace('₱', '')}</span>
            </div>
            <div className="row">
              <span>13th Month/Benefits..</span>
              <span>{formatCurrency(Number(employee.thirteenth) || 0).replace('₱', '')}</span>
            </div>
            <div className="row">
              <span>Others ({employee.nonTaxableOther > 0 ? 'Non-Tax' : ''})</span>
              <span>{formatCurrency(employee.nonTaxableOther).replace('₱', '')}</span>
            </div>
            
            <div className="spacer"></div>

            <div className="row total-row">
              <span>TOTAL PAY</span>
              <span>{formatCurrency(earningsTotal).replace('₱', '')}</span>
            </div>
            
            <div className="row net-pay-row">
              <span className="bold">NET PAY</span>
              <span className="bold">{formatCurrency(calculated.netPay).replace('₱', '')}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="column deductions">
            <div className="col-header">
              <span>DEDUCTIONS</span>
            </div>
            <div className="row">
              <span>SSS / MPF</span>
              <span>{formatCurrency(safeNum(employee.sss) + safeNum(employee.sssMpf)).replace('₱', '')}</span>
            </div>
            <div className="row">
              <span>Philhealth...................</span>
              <span>{formatCurrency(safeNum(employee.philhealth)).replace('₱', '')}</span>
            </div>
            <div className="row">
              <span>Pagibig.......................</span>
              <span>{formatCurrency(safeNum(employee.pagibig)).replace('₱', '')}</span>
            </div>
            <div className="row">
              <span>Tax Withheld..............</span>
              <span>{formatCurrency(calculated.wTax).replace('₱', '')}</span>
            </div>
            <div className="row subheader">
              <span className="label bold">LOANS</span>
              <span></span>
            </div>
            <div className="row">
              <span>SSS Sal. Loan.............</span>
              <span>{formatCurrency(safeNum(loans.sssSal)).replace('₱', '')}</span>
            </div>
            <div className="row">
              <span>SSS Hsng Loan...........</span>
              <span>{formatCurrency(safeNum(loans.sssHouse)).replace('₱', '')}</span>
            </div>
            <div className="row">
              <span>Pagibig Sal Loan.........</span>
              <span>{formatCurrency(safeNum(loans.pagibigSal)).replace('₱', '')}</span>
            </div>
            <div className="row">
              <span>Others........</span>
              <span>{formatCurrency(safeNum(loans.company)).replace('₱', '')}</span>
            </div>
            <div className="row">
              <span>Absent/Tardy..............</span>
              <span>{formatCurrency(0).replace('₱', '')}</span>
            </div>

            <div className="spacer"></div>

            <div className="row total-row">
              <span>TOTAL PAY</span>
              <span>{formatCurrency(totalDeductions).replace('₱', '')}</span>
            </div>
            
            <div className="approval-section">
              <div className="approved-label">Approved :</div>
                <div className="signature-area">
                  {signature ? (
                    <img src={signature} alt="Signature" style={{maxWidth:'220px', maxHeight:'80px', objectFit:'contain'}} />
                  ) : (
                    <div style={{height:'60px'}}></div>
                  )}
                </div>
              <div className="approver-name">{businessOwner}</div>
              <div className="approver-title">Business Owner</div>
            </div>
          </div>
        </div>

        <div className="payslip-footer">
          <p>I hereby certify that I have received the amount stated above in payment and consideration for services rendered for the above stated period.</p>
          <div className="employee-sign-line">
            Signature
          </div>
        </div>

      </div>
    </div>
  );
};

export default Payslip;