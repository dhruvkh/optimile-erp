import React from 'react';
import { numberToWords } from '../utils';

// ── Print Styles (landscape A4) ────────────────────────────
const PRINT_STYLE = `
@media print {
  @page { size: A4 landscape; margin: 6mm; }
  body * { visibility: hidden; }
  #optimile-invoice, #optimile-invoice * { visibility: visible; }
  #optimile-invoice { position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
}
`;

const dash = (v?: string | number | null) =>
  v !== undefined && v !== null && v !== '' && v !== 0 ? String(v) : '–';

// ── Column headers for the trip detail table ───────────────
const COLS: [string, string][] = [
  ['Sr. No',                    '3%' ],
  ['Bkg ID',                    '8%' ],
  ['Shipping Date',             '7%' ],
  ['Delivery Date',             '7%' ],
  ['Truck No',                  '8%' ],
  ['Place of Origin',           '9%' ],
  ['Place of Destination',      '9%' ],
  ['LR No.',                    '7%' ],
  ['Qty',                       '3%' ],
  ['Freight',                   '7%' ],
  ['Advance',                   '5%' ],
  ['Detention\nCharges',        '6%' ],
  ['Loading &\nUnloading',      '7%' ],
  ['Other',                     '4%' ],
  ['Freight\nCost',             '6%' ],
];

// ── Main Component ─────────────────────────────────────────
export const InvoiceTemplate: React.FC<{ data: any; total?: number; tax?: number; id?: string }> = ({
  data, total, tax, id,
}) => {
  const lineItems: any[] = data.lineItems || [];

  // Taxable subtotal = sum of all per-line amounts
  const subTotal = lineItems.reduce((acc: number, item: any) => {
    const base      = item.unitPrice        || 0;
    const detention = item.detentionCharges || 0;
    const loading   = item.loadingCharges   || 0;
    const other     = item.otherCharges     || 0;
    const advance   = item.advanceReceived  || 0;
    return acc + base + detention + loading + other - advance;
  }, 0);

  // Tax
  const cgstAmt  = data.cgstAmount  ?? 0;
  const sgstAmt  = data.sgstAmount  ?? 0;
  const igstAmt  = data.igstAmount  ?? (tax !== undefined ? tax : subTotal * 0.18);
  const calcTax  = tax  ?? (cgstAmt + sgstAmt + igstAmt);
  const calcTotal = total ?? (subTotal + calcTax - (data.discount || 0));
  const inWords  = numberToWords(calcTotal);

  const company = {
    gstin: data.companyGstin || 'XXXXXXXXXXXXXX',
    pan:   data.companyPan   || 'XXXXXXXXXX',
    address: '161, Basavanagar Main Rd, above Reliance Trends, Vignan Nagar, Doddanekkundi Road, Bengaluru, Karnataka - 560037.',
  };

  const TH = ({ label }: { label: string }) => (
    <th
      className="border border-blue-500 px-0.5 py-1 text-center align-middle leading-tight"
      style={{ fontSize: '7.5px', fontWeight: 700, whiteSpace: 'pre-line' }}
    >
      {label}
    </th>
  );

  const TD = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
    <td
      className={`border border-gray-300 px-0.5 py-0.5 align-middle ${right ? 'text-right' : 'text-center'}`}
      style={{ fontSize: '8px' }}
    >
      {children}
    </td>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLE }} />

      <div
        id={id || 'optimile-invoice'}
        className="bg-white text-gray-900 font-sans"
        style={{ width: '100%', fontSize: '9px', lineHeight: 1.25 }}
      >
        <table className="w-full" style={{ borderCollapse: 'collapse', border: '1.5px solid #374151' }}>
          <tbody>

            {/* ══ ROW 1 — Letterhead ══════════════════════════════════════ */}
            <tr>
              {/* Left: Company identity */}
              <td
                colSpan={3}
                className="border border-gray-500 p-2 align-top"
                style={{ width: '54%' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p style={{ fontSize: '20px', fontWeight: 900, lineHeight: 1 }}>Optimile pvt. Ltd</p>
                    <p className="text-gray-600 mt-0.5" style={{ fontSize: '8px' }}>{company.address}</p>
                    <p className="font-semibold mt-0.5" style={{ fontSize: '8px' }}>
                      GST No.&nbsp;<strong>{company.gstin}</strong>&nbsp;|&nbsp;PAN No. -&nbsp;<strong>{company.pan}</strong>
                    </p>
                  </div>
                  <div className="ml-3 text-right shrink-0">
                    <span style={{ fontSize: '18px', fontWeight: 900, fontStyle: 'italic', color: '#1f2937' }}>
                      Optimile<span style={{ color: '#2563eb' }}>.</span>
                    </span>
                  </div>
                </div>
              </td>

              {/* Right: Invoice header grid */}
              <td colSpan={2} className="border border-gray-500 p-0 align-top" style={{ width: '46%' }}>
                <div className="bg-blue-700 text-white text-center font-bold py-0.5 tracking-widest" style={{ fontSize: '10px' }}>
                  INVOICE
                </div>
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['Invoice No.',      data.invoiceNumber],
                      ['Bill Date',        data.date],
                      ['Delivery Note',    data.deliveryNoteNo   || ''],
                      ['Terms Of Payment', data.paymentTermsLabel || '30 Days'],
                      ['Customer Code',    data.customerCode     || data.customerId || ''],
                      ['Other References', data.otherReferences  || ''],
                    ].map(([lbl, val]) => (
                      <tr key={lbl}>
                        <td className="border border-gray-300 px-1.5 py-0.5 bg-gray-50 font-semibold" style={{ fontSize: '8px', width: '48%' }}>{lbl}:</td>
                        <td className="border border-gray-300 px-1.5 py-0.5 font-medium" style={{ fontSize: '8px' }}>{dash(val as string)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ ROW 2 — Bill To / Client Details / More Meta ══════════ */}
            <tr>
              {/* Bill To */}
              <td className="border border-gray-500 p-2 align-top" style={{ width: '32%' }}>
                <p className="font-bold uppercase text-gray-500 mb-0.5" style={{ fontSize: '8px' }}>Bill To :</p>
                <p className="font-bold text-gray-900" style={{ fontSize: '10px' }}>{data.customerName}</p>
                <p className="text-gray-700 mt-0.5 whitespace-pre-wrap" style={{ fontSize: '8px' }}>{data.customerAddress || ''}</p>
                {data.customerTaxId && (
                  <p className="text-gray-700 mt-0.5" style={{ fontSize: '8px' }}>
                    GSTIN: <strong>{data.customerTaxId}</strong>
                  </p>
                )}
              </td>

              {/* Client Details placeholder */}
              <td colSpan={2} className="border border-gray-500 p-2 align-middle text-center" style={{ width: '22%' }}>
                <p className="font-bold text-gray-500 uppercase mb-1" style={{ fontSize: '8px' }}>Client Details</p>
                <p className="text-gray-400 italic" style={{ fontSize: '8px' }}>Address Including GSTN details</p>
              </td>

              {/* Additional logistics meta */}
              <td colSpan={2} className="border border-gray-500 p-0 align-top" style={{ width: '46%' }}>
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['Buyer\'s Order No.',  data.buyerOrderNo     || ''],
                      ['Due Date',            data.dueDate],
                      ['Dispatch Doc No.',    data.dispatchDocNo    || ''],
                      ['Delivery Note Date',  data.deliveryNoteDate || ''],
                      ['Dispatch Through',    data.dispatchThrough  || ''],
                      ['Destination',         lineItems[0]?.placeOfDestination || ''],
                      ['Origin',              lineItems[0]?.placeOfOrigin      || ''],
                      ['Terms of Delivery',   data.termsOfDelivery || 'Door Delivery'],
                    ].map(([lbl, val]) => (
                      <tr key={lbl}>
                        <td className="border border-gray-300 px-1.5 py-0.5 bg-gray-50 font-semibold" style={{ fontSize: '8px', width: '48%' }}>{lbl}:</td>
                        <td className="border border-gray-300 px-1.5 py-0.5" style={{ fontSize: '8px' }}>{dash(val as string)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ ROW 3 — Trip Detail Table ══════════════════════════════ */}
            <tr>
              <td colSpan={5} className="border border-gray-500 p-0">
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="bg-blue-700 text-white">
                      {COLS.map(([label, w]) => (
                        <TH key={label} label={label} />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item: any, idx: number) => {
                      const base      = item.unitPrice        || 0;
                      const detention = item.detentionCharges || 0;
                      const loading   = item.loadingCharges   || 0;
                      const other     = item.otherCharges     || 0;
                      const advance   = item.advanceReceived  || 0;
                      const freightCost = base + detention + loading + other - advance;

                      return (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                          <TD>{idx + 1}</TD>
                          <TD><span className="font-semibold text-blue-700">{item.bkgId || item.id}</span></TD>
                          <TD>{item.shippingDate || '–'}</TD>
                          <TD>{item.deliveryDate  || '–'}</TD>
                          <TD><span className="font-medium">{item.truckNo || '–'}</span></TD>
                          <TD right>{item.placeOfOrigin      || '–'}</TD>
                          <TD right>{item.placeOfDestination || '–'}</TD>
                          <TD>{item.lrNumber || '–'}</TD>
                          <TD>{item.quantity ?? 1}</TD>
                          <TD right>{base > 0 ? base.toLocaleString('en-IN') : '–'}</TD>
                          <TD right>{advance > 0 ? advance.toLocaleString('en-IN') : '0'}</TD>
                          <TD right>{detention > 0 ? detention.toLocaleString('en-IN') : '0'}</TD>
                          <TD right>{loading > 0 ? loading.toLocaleString('en-IN') : '0'}</TD>
                          <TD right>{other > 0 ? other.toLocaleString('en-IN') : '0'}</TD>
                          <TD right><strong>{freightCost.toLocaleString('en-IN')}</strong></TD>
                        </tr>
                      );
                    })}

                    {/* Padding rows (min 4 visible rows) */}
                    {lineItems.length < 4 && Array.from({ length: 4 - lineItems.length }).map((_, i) => (
                      <tr key={`pad-${i}`} style={{ height: '18px' }}>
                        {Array.from({ length: 15 }).map((__, j) => (
                          <td key={j} className="border border-gray-200" style={{ fontSize: '8px' }}>&nbsp;</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ ROW 4 — In Words + Tax Summary ════════════════════════ */}
            <tr>
              {/* In Words */}
              <td colSpan={3} className="border border-gray-500 px-2 py-1 align-top" style={{ width: '54%' }}>
                <span className="font-bold text-gray-600" style={{ fontSize: '8.5px' }}>In Words: </span>
                <span className="font-semibold text-gray-900" style={{ fontSize: '8.5px' }}>{inWords}</span>
                {data.expectedTds > 0 && (
                  <p className="text-gray-400 mt-1" style={{ fontSize: '7.5px' }}>
                    * TDS @ {data.tdsRate}% applicable: ₹{data.expectedTds.toLocaleString('en-IN')} will be deducted at payment.
                  </p>
                )}
              </td>

              {/* Tax summary */}
              <td colSpan={2} className="border border-gray-500 p-0 align-top">
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-0.5 bg-gray-50 font-semibold" style={{ fontSize: '8px' }}>Taxable Value</td>
                      <td className="border border-gray-300 px-2 py-0.5 text-right font-semibold" style={{ fontSize: '8px' }}>{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    {igstAmt > 0 ? (
                      <tr>
                        <td className="border border-gray-300 px-2 py-0.5 bg-gray-50" style={{ fontSize: '8px' }}>IGST @ 18%</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-right" style={{ fontSize: '8px' }}>{igstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="border border-gray-300 px-2 py-0.5 bg-gray-50 text-gray-400" style={{ fontSize: '8px' }}>IGST @ 18%</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-right text-gray-400" style={{ fontSize: '8px' }}>–</td>
                      </tr>
                    )}
                    {cgstAmt > 0 ? (
                      <tr>
                        <td className="border border-gray-300 px-2 py-0.5 bg-gray-50" style={{ fontSize: '8px' }}>CGST @ 9%</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-right" style={{ fontSize: '8px' }}>{cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="border border-gray-300 px-2 py-0.5 bg-gray-50 text-gray-400" style={{ fontSize: '8px' }}>CGST @ 6%</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-right text-gray-400" style={{ fontSize: '8px' }}>–</td>
                      </tr>
                    )}
                    {sgstAmt > 0 ? (
                      <tr>
                        <td className="border border-gray-300 px-2 py-0.5 bg-gray-50" style={{ fontSize: '8px' }}>SGST @ 9%</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-right" style={{ fontSize: '8px' }}>{sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="border border-gray-300 px-2 py-0.5 bg-gray-50 text-gray-400" style={{ fontSize: '8px' }}>SGST @ 6%</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-right text-gray-400" style={{ fontSize: '8px' }}>–</td>
                      </tr>
                    )}
                    {data.discount > 0 && (
                      <tr>
                        <td className="border border-gray-300 px-2 py-0.5 bg-gray-50 text-green-700" style={{ fontSize: '8px' }}>Discount</td>
                        <td className="border border-gray-300 px-2 py-0.5 text-right text-green-700" style={{ fontSize: '8px' }}>–{data.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                    <tr className="bg-blue-50">
                      <td className="border border-gray-400 px-2 py-1 font-black" style={{ fontSize: '9px' }}>Total Invoice Value</td>
                      <td className="border border-gray-400 px-2 py-1 text-right font-black" style={{ fontSize: '9px' }}>{calcTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ ROW 5 — Bank Details + Signatory ══════════════════════ */}
            <tr>
              <td colSpan={3} className="border border-gray-500 p-2 align-top" style={{ width: '54%' }}>
                <p className="font-bold text-gray-700 mb-1" style={{ fontSize: '8.5px' }}>Bank Details:</p>
                <table style={{ fontSize: '8px', width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['Account Holder Name', 'Optimile Private Limited'],
                      ['Account Number',       data.bankAccount   || '–'],
                      ['Bank Branch',          data.bankBranch    || '–'],
                      ['IFSC',                 data.bankIfsc      || '–'],
                      ['Type of Account',      'Current'],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td className="text-gray-500 pr-4 py-0.5" style={{ width: '38%' }}>{k}:</td>
                        <td className="font-medium py-0.5">{v}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-200">
                      <td className="text-gray-500 pr-4 pt-1">Make all Cheques payable to:</td>
                      <td className="font-semibold pt-1">Optimile Private Limited</td>
                    </tr>
                  </tbody>
                </table>
              </td>

              <td colSpan={2} className="border border-gray-500 p-2 align-top text-right" style={{ width: '46%' }}>
                <p className="text-gray-600 mb-1" style={{ fontSize: '8.5px' }}>
                  For <strong>Optimile Private Limited:</strong>
                </p>

                {data.eInvoiceDetails && (
                  <div className="text-left mb-2">
                    {/* QR code placeholder */}
                    <div
                      className="inline-block border border-gray-400 bg-gray-100 mb-1"
                      style={{ width: 52, height: 52 }}
                    >
                      <div
                        style={{
                          width: '100%', height: '100%', opacity: 0.55,
                          backgroundImage: 'repeating-conic-gradient(#555 0% 25%, transparent 0% 50%)',
                          backgroundSize: '6px 6px',
                        }}
                      />
                    </div>
                    <p className="text-gray-500 leading-tight" style={{ fontSize: '7px' }}>IRN: {data.eInvoiceDetails.irn.substring(0, 24)}…</p>
                    <p className="text-gray-500" style={{ fontSize: '7px' }}>Ack No: {data.eInvoiceDetails.ackNo}</p>
                    <p className="text-gray-500" style={{ fontSize: '7px' }}>
                      Ack Date: {new Date(data.eInvoiceDetails.ackDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                )}

                <div className="mt-6 pt-3 border-t border-gray-300">
                  <p className="text-gray-500" style={{ fontSize: '8px' }}>(Authorised Signatory)</p>
                </div>
              </td>
            </tr>

            {/* ══ ROW 6 — Declaration ════════════════════════════════════ */}
            <tr>
              <td colSpan={5} className="border border-gray-500 bg-blue-700 text-white text-center py-0.5">
                <span className="font-bold tracking-widest" style={{ fontSize: '9px' }}>DECLARATION</span>
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="border border-gray-500 px-3 py-1.5">
                <ol className="list-decimal list-inside space-y-0.5 text-gray-700" style={{ fontSize: '7.5px' }}>
                  <li>No credit is available unless confirmed in writing by our Authorised Signatory.</li>
                  <li>Interest @ 18% per annum will be charged on delayed payments past the due date.</li>
                  <li>Any discrepancies in the invoice should be informed in writing within 7 days of submission, otherwise the invoice will be considered as accepted.</li>
                </ol>
                <p className="text-center text-gray-500 mt-1 pt-1 border-t border-gray-200" style={{ fontSize: '7px' }}>
                  Optimile Pvt.Ltd. (CIN NO: XXXXXXXXXXXXXXXXXXXXXX) {company.address}
                </p>
                <p className="text-center text-gray-400 font-medium mt-0.5" style={{ fontSize: '7.5px' }}>
                  This is a Computer Generated Invoice
                </p>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </>
  );
};
