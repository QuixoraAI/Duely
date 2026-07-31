// Small inline SVG icons, one per requirement type, plus a few shared UI icons.
// Kept as simple line icons so they stay lightweight and match the brand.

export function ReqIcon({ reqKey, className = "w-5 h-5" }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (reqKey) {
    case "gas_safety":
      return (<svg {...common}><path d="M12 2c1 3-2 4-2 7a2 2 0 004 0c0-1-.5-1.5-.5-2.5 1.5 1 2.5 3 2.5 5a4 4 0 01-8 0c0-3.5 2-5 4-9.5z" /></svg>);
    case "eicr":
      return (<svg {...common}><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>);
    case "epc":
      return (<svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 15l3-4 3 2 4-6" /></svg>);
    case "info_sheet":
      return (<svg {...common}><path d="M6 2h9l5 5v15H6z" /><path d="M15 2v5h5" /><path d="M9 13h6M9 17h6" /></svg>);
    case "deposit_protection":
      return (<svg {...common}><rect x="3" y="10" width="18" height="10" rx="2" /><path d="M7 10V7a5 5 0 0110 0v3" /></svg>);
    case "right_to_rent":
      return (<svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c0-1.7 1.3-3 3-3s3 1.3 3 3" /><path d="M15 9h4M15 13h4" /></svg>);
    case "tenancy_agreement":
      return (<svg {...common}><path d="M6 2h9l5 5v15H6z" /><path d="M15 2v5h5" /><path d="M9 12l2 2 4-4" /></svg>);
    case "smoke_co_alarms":
      return (<svg {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></svg>);
    case "landlord_insurance":
      return (<svg {...common}><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z" /><path d="M9 12l2 2 4-4" /></svg>);
    default:
      return (<svg {...common}><rect x="4" y="4" width="16" height="16" rx="2" /></svg>);
  }
}

export function CheckIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path d="M3 10.5L7.5 15L17 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AlertIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path d="M10 2L18 17H2L10 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 8v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="10" cy="14.3" r="0.9" fill="currentColor" />
    </svg>
  );
}
