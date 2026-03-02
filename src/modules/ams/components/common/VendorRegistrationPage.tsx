import React, { useMemo, useState } from 'react';
import { vendorManagement, VENDOR_COLORS, VendorDocument } from '../../services/vendorManagement';

const docTypes: Array<VendorDocument['type']> = ['PAN', 'GST', 'INCORPORATION', 'BANK', 'RC', 'INSURANCE', 'GPS', 'REFERENCES'];

function pct(v: number) { return `${v.toFixed(0)}%`; }

export function VendorRegistrationPage() {
  const [otpVerified, setOtpVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    legalEntityName: '',
    companyType: 'Private Limited',
    yearEstablished: new Date().getFullYear() - 5,
    website: '',
    linkedin: '',

    primaryContactName: '',
    designation: '',
    email: '',
    mobile: '+91',
    alternateContact: '',
    registeredAddress: '',
    officeAddress: '',
    sameAsRegistered: false,
    state: '',
    pincode: '',

    fleetOwned: 0,
    fleetLeased: 0,
    vehicleTypes: [] as string[],
    serviceAreas: [] as string[],
    routesSpecialized: '',
    avgMonthlyCapacity: 0,

    gstin: '',
    annualTurnover: 0,
    creditRating: '',
    paymentTerms: 'Net 30 days',

    references: [
      { clientName: '', contactPerson: '', phone: '', email: '' },
      { clientName: '', contactPerson: '', phone: '', email: '' },
    ],
  });

  const [documents, setDocuments] = useState<VendorDocument[]>(
    docTypes.map((type) => ({ type, status: 'NOT_UPLOADED' }))
  );

  const updateDoc = (type: VendorDocument['type'], patch: Partial<VendorDocument>) => {
    setDocuments((prev) => prev.map((d) => d.type === type ? { ...d, ...patch } : d));
  };

  const requiredFieldsComplete = useMemo(() => {
    return Boolean(
      form.companyName &&
      form.legalEntityName &&
      form.companyType &&
      form.yearEstablished &&
      form.primaryContactName &&
      form.designation &&
      /^\S+@\S+\.\S+$/.test(form.email) &&
      /^\+91\d{10}$/.test(form.mobile) &&
      otpVerified &&
      form.registeredAddress &&
      form.state &&
      form.pincode &&
      form.fleetOwned + form.fleetLeased >= 1 &&
      form.vehicleTypes.length > 0 &&
      form.serviceAreas.length > 0
    );
  }, [form, otpVerified]);

  const requiredDocsUploaded = useMemo(() => {
    const required: VendorDocument['type'][] = ['PAN', 'GST', 'INCORPORATION', 'BANK', 'RC', 'INSURANCE'];
    return required.every((t) => {
      const doc = documents.find((d) => d.type === t);
      return doc && ['UPLOADED', 'VERIFYING', 'VERIFIED', 'EXPIRING_SOON'].includes(doc.status);
    });
  }, [documents]);

  const uploadedCount = documents.filter((d) => d.status !== 'NOT_UPLOADED').length;
  const verifiedCount = documents.filter((d) => d.status === 'VERIFIED').length;
  const rejectedCount = documents.filter((d) => d.status === 'REJECTED').length;
  const pendingCount = documents.length - uploadedCount;

  const canSubmit = requiredFieldsComplete && requiredDocsUploaded && !submitting;

  const submit = () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const appId = vendorManagement.submitApplication({
      companyInfo: {
        companyName: form.companyName,
        legalEntityName: form.legalEntityName,
        companyType: form.companyType,
        yearEstablished: form.yearEstablished,
        website: form.website,
        linkedin: form.linkedin,
      },
      contact: {
        primaryContactName: form.primaryContactName,
        designation: form.designation,
        email: form.email,
        mobile: form.mobile,
        alternateContact: form.alternateContact,
        registeredAddress: form.registeredAddress,
        officeAddress: form.sameAsRegistered ? form.registeredAddress : form.officeAddress,
        state: form.state,
        pincode: form.pincode,
      },
      business: {
        fleetOwned: form.fleetOwned,
        fleetLeased: form.fleetLeased,
        vehicleTypes: form.vehicleTypes,
        serviceAreas: form.serviceAreas,
        routesSpecialized: form.routesSpecialized,
        avgMonthlyCapacity: form.avgMonthlyCapacity,
      },
      financial: {
        annualTurnover: form.annualTurnover,
        creditRating: form.creditRating,
        paymentTerms: form.paymentTerms,
      },
      references: form.references,
      documents,
    });

    setTimeout(() => {
      setSubmitting(false);
      setSubmittedId(appId);
    }, 600);
  };

  const statusStyle = (status: VendorDocument['status']) => {
    if (status === 'VERIFIED') return { backgroundColor: VENDOR_COLORS.success, color: 'white' };
    if (status === 'UPLOADED') return { backgroundColor: VENDOR_COLORS.success, color: 'white' };
    if (status === 'VERIFYING') return { backgroundColor: VENDOR_COLORS.info, color: 'white' };
    if (status === 'REJECTED') return { backgroundColor: VENDOR_COLORS.error, color: 'white' };
    if (status === 'EXPIRING_SOON') return { backgroundColor: '#FB8C00', color: 'white' };
    return { backgroundColor: VENDOR_COLORS.error, color: 'white' };
  };

  const onUpload = (type: VendorDocument['type'], file?: File | null) => {
    if (!file) return;
    updateDoc(type, { status: 'UPLOADED', fileName: file.name, uploadedAt: Date.now() });

    if (type === 'GST' && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][A-Z][0-9A-Z]$/i.test(form.gstin)) {
      updateDoc(type, { status: 'VERIFIED', verifiedAt: Date.now(), verifiedBy: 'AUTO-VALIDATOR' });
    }

    if (type === 'BANK') {
      updateDoc(type, { status: 'VERIFYING' });
      setTimeout(() => updateDoc(type, { status: 'VERIFIED', verifiedAt: Date.now(), verifiedBy: 'BANK-VERIFIER' }), 900);
    }

    if (type === 'INSURANCE') {
      const expiry = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      updateDoc(type, { expiryDate: expiry, status: 'EXPIRING_SOON' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vendor Registration</h1>
        <p className="text-slate-500">Complete onboarding application for vendor account creation.</p>
      </div>

      {submittedId && (
        <div className="rounded-xl p-4" style={{ backgroundColor: '#E8F5E9', border: `1px solid ${VENDOR_COLORS.success}` }}>
          <div className="font-semibold" style={{ color: VENDOR_COLORS.success }}>✅ Application Submitted Successfully!</div>
          <div className="text-sm mt-1">Application ID: {submittedId}</div>
          <div className="text-xs text-slate-600 mt-1">Confirmation sent via email and SMS.</div>
        </div>
      )}

      <Section title="Section 1 - Company Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <Field label="Company Name" required><input className="input" value={form.companyName} onChange={(e) => setForm((s) => ({ ...s, companyName: e.target.value }))} /></Field>
          <Field label="Legal Entity Name" required><input className="input" value={form.legalEntityName} onChange={(e) => setForm((s) => ({ ...s, legalEntityName: e.target.value }))} /></Field>
          <Field label="Company Type" required>
            <select className="input" value={form.companyType} onChange={(e) => setForm((s) => ({ ...s, companyType: e.target.value }))}>
              {['Private Limited', 'Public Limited', 'Partnership', 'Proprietorship', 'LLP'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Year Established" required><input type="number" className="input" value={form.yearEstablished} onChange={(e) => setForm((s) => ({ ...s, yearEstablished: Number(e.target.value || 0) }))} /></Field>
          <Field label="Company Website"><input className="input" value={form.website} onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))} /></Field>
          <Field label="LinkedIn Profile"><input className="input" value={form.linkedin} onChange={(e) => setForm((s) => ({ ...s, linkedin: e.target.value }))} /></Field>
        </div>
      </Section>

      <Section title="Section 2 - Contact Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <Field label="Primary Contact Name" required><input className="input" value={form.primaryContactName} onChange={(e) => setForm((s) => ({ ...s, primaryContactName: e.target.value }))} /></Field>
          <Field label="Designation" required><input className="input" value={form.designation} onChange={(e) => setForm((s) => ({ ...s, designation: e.target.value }))} /></Field>
          <Field label="Email" required><input className="input" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} /></Field>

          <Field label="Mobile (+91)" required>
            <div className="flex gap-2">
              <input className="input" value={form.mobile} onChange={(e) => setForm((s) => ({ ...s, mobile: e.target.value }))} />
              <button type="button" className="px-3 rounded text-white text-xs" style={{ backgroundColor: otpVerified ? VENDOR_COLORS.success : VENDOR_COLORS.info }} onClick={() => setOtpVerified(true)}>
                {otpVerified ? 'Verified' : 'Verify OTP'}
              </button>
            </div>
          </Field>
          <Field label="Alternate Contact"><input className="input" value={form.alternateContact} onChange={(e) => setForm((s) => ({ ...s, alternateContact: e.target.value }))} /></Field>
          <Field label="State" required><input className="input" value={form.state} onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))} /></Field>

          <Field label="PIN Code" required><input className="input" value={form.pincode} onChange={(e) => setForm((s) => ({ ...s, pincode: e.target.value }))} /></Field>
          <Field label="Registered Address" required><textarea className="input min-h-[72px]" value={form.registeredAddress} onChange={(e) => setForm((s) => ({ ...s, registeredAddress: e.target.value }))} /></Field>
          <Field label="Office Address">
            <textarea className="input min-h-[72px]" value={form.officeAddress} onChange={(e) => setForm((s) => ({ ...s, officeAddress: e.target.value }))} disabled={form.sameAsRegistered} />
            <label className="text-xs inline-flex items-center gap-1 mt-1"><input type="checkbox" checked={form.sameAsRegistered} onChange={(e) => setForm((s) => ({ ...s, sameAsRegistered: e.target.checked }))} />Same as registered address</label>
          </Field>
        </div>
      </Section>

      <Section title="Section 3 - Business Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <Field label="Owned Vehicles" required><input type="number" className="input" value={form.fleetOwned} onChange={(e) => setForm((s) => ({ ...s, fleetOwned: Number(e.target.value || 0) }))} /></Field>
          <Field label="Leased Vehicles" required><input type="number" className="input" value={form.fleetLeased} onChange={(e) => setForm((s) => ({ ...s, fleetLeased: Number(e.target.value || 0) }))} /></Field>
          <Field label="Average Monthly Capacity"><input type="number" className="input" value={form.avgMonthlyCapacity} onChange={(e) => setForm((s) => ({ ...s, avgMonthlyCapacity: Number(e.target.value || 0) }))} /></Field>
          <MultiSelectField
            label="Vehicle Types"
            options={['FTL', 'LTL', 'Container', 'Refrigerated', 'Specialized', 'Others']}
            values={form.vehicleTypes}
            onChange={(vals) => setForm((s) => ({ ...s, vehicleTypes: vals }))}
          />
          <MultiSelectField
            label="Service Areas"
            options={['North India', 'South India', 'East India', 'West India', 'Pan India', 'International']}
            values={form.serviceAreas}
            onChange={(vals) => setForm((s) => ({ ...s, serviceAreas: vals }))}
          />
          <Field label="Routes Specialized">
            <textarea className="input min-h-[72px]" value={form.routesSpecialized} onChange={(e) => setForm((s) => ({ ...s, routesSpecialized: e.target.value }))} />
          </Field>
        </div>
      </Section>

      <Section title="Section 4 - Statutory Documents">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {docTypes.map((type) => {
            const doc = documents.find((d) => d.type === type)!;
            return (
              <div key={type} className="border border-slate-200 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{type}</div>
                  <span className="px-2 py-1 rounded text-xs font-semibold" style={statusStyle(doc.status)}>{doc.status.replace(/_/g, ' ')}</span>
                </div>
                {type === 'GST' && (
                  <input className="input" placeholder="GSTIN" value={form.gstin} onChange={(e) => setForm((s) => ({ ...s, gstin: e.target.value.toUpperCase() }))} />
                )}
                <input type="file" className="text-xs" onChange={(e) => onUpload(type, e.target.files?.[0] || null)} />
                {doc.fileName && <div className="text-xs text-slate-500">{doc.fileName}</div>}
                {type === 'INSURANCE' && doc.expiryDate && <div className="text-xs" style={{ color: '#FB8C00' }}>Expiry: {doc.expiryDate} (expiring soon)</div>}
              </div>
            );
          })}
        </div>

        <div className="border border-slate-200 rounded p-3 mt-2">
          <div className="font-semibold">Document Status Summary</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2 text-xs">
            <Badge label="Total" value="8" color={VENDOR_COLORS.neutral} />
            <Badge label="Uploaded" value={`${uploadedCount}`} color={VENDOR_COLORS.success} />
            <Badge label="Pending" value={`${pendingCount}`} color={VENDOR_COLORS.warning} />
            <Badge label="Verified" value={`${verifiedCount}`} color={VENDOR_COLORS.success} />
            <Badge label="Rejected" value={`${rejectedCount}`} color={VENDOR_COLORS.error} />
          </div>
          <div className="mt-2 h-2 bg-slate-200 rounded">
            <div className="h-2 rounded" style={{ width: pct((uploadedCount / documents.length) * 100), backgroundColor: VENDOR_COLORS.success }} />
          </div>
          <div className="text-xs text-slate-600 mt-1">Progress: {pct((uploadedCount / documents.length) * 100)} complete</div>
        </div>
      </Section>

      <Section title="Section 5 - Financial Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <Field label="Annual Turnover"><input type="number" className="input" value={form.annualTurnover} onChange={(e) => setForm((s) => ({ ...s, annualTurnover: Number(e.target.value || 0) }))} /></Field>
          <Field label="Credit Rating"><input className="input" value={form.creditRating} onChange={(e) => setForm((s) => ({ ...s, creditRating: e.target.value }))} /></Field>
          <Field label="Payment Terms Preferred">
            <select className="input" value={form.paymentTerms} onChange={(e) => setForm((s) => ({ ...s, paymentTerms: e.target.value }))}>
              {['Net 15 days', 'Net 30 days', 'Net 45 days', 'Advance payment accepted'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Section 6 - References">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {form.references.map((ref, idx) => (
            <div key={idx} className="border border-slate-200 rounded p-3 space-y-2">
              <div className="font-medium text-sm">Reference {idx + 1}</div>
              <input className="input" placeholder="Client Name" value={ref.clientName} onChange={(e) => setForm((s) => {
                const refs = [...s.references]; refs[idx] = { ...refs[idx], clientName: e.target.value }; return { ...s, references: refs };
              })} />
              <input className="input" placeholder="Contact Person" value={ref.contactPerson} onChange={(e) => setForm((s) => {
                const refs = [...s.references]; refs[idx] = { ...refs[idx], contactPerson: e.target.value }; return { ...s, references: refs };
              })} />
              <input className="input" placeholder="Phone" value={ref.phone} onChange={(e) => setForm((s) => {
                const refs = [...s.references]; refs[idx] = { ...refs[idx], phone: e.target.value }; return { ...s, references: refs };
              })} />
              <input className="input" placeholder="Email" value={ref.email} onChange={(e) => setForm((s) => {
                const refs = [...s.references]; refs[idx] = { ...refs[idx], email: e.target.value }; return { ...s, references: refs };
              })} />
            </div>
          ))}
        </div>
      </Section>

      <div className="border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">Progress indicator: {uploadedCount}/8 documents uploaded</div>
        <button
          disabled={!canSubmit}
          onClick={submit}
          className="px-6 py-3 rounded text-white font-semibold disabled:opacity-40"
          style={{ backgroundColor: VENDOR_COLORS.info }}
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>

      <style>{`.input{width:100%;border:1px solid #CBD5E1;border-radius:8px;padding:8px 10px;}`}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="space-y-1 block">
      <div className="text-xs text-slate-600">{label} {required && <span style={{ color: VENDOR_COLORS.error }}>*</span>}</div>
      {children}
    </label>
  );
}

function MultiSelectField({ label, options, values, onChange }: { label: string; options: string[]; values: string[]; onChange: (vals: string[]) => void }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-600">{label}</div>
      <div className="grid grid-cols-2 gap-1 text-xs border border-slate-200 rounded p-2">
        {options.map((option) => (
          <label key={option} className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={(e) => {
                if (e.target.checked) onChange([...values, option]);
                else onChange(values.filter((v) => v !== option));
              }}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className="rounded px-2 py-1 text-white text-center" style={{ backgroundColor: color }}>{label}: {value}</div>;
}

