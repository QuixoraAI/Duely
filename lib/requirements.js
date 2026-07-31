// The master list of UK landlord compliance requirements.
// Adding a new requirement here automatically makes it show up on every property.

export const REQUIREMENTS = [
  {
    key: "gas_safety",
    name: "Gas Safety Certificate (CP12)",
    note: "Renews annually",
  },
  {
    key: "eicr",
    name: "EICR (electrical)",
    note: "Renews every 5 years",
  },
  {
    key: "epc",
    name: "EPC",
    note: "Valid for 10 years, minimum rating E",
  },
  {
    key: "info_sheet",
    name: "Renters' Rights Act Information Sheet",
    note: "Served once, at start of tenancy",
  },
  {
    key: "deposit_protection",
    name: "Deposit protection + Prescribed Information",
    note: "Within 30 days of taking deposit",
  },
  {
    key: "right_to_rent",
    name: "Right to Rent evidence",
    note: "Checked before tenancy starts",
  },
  {
    key: "tenancy_agreement",
    name: "Tenancy agreement",
    note: "Periodic Assured Tenancy",
  },
  {
    key: "smoke_co_alarms",
    name: "Smoke & CO alarm test record",
    note: "Tested at tenancy start",
  },
  {
    key: "landlord_insurance",
    name: "Landlord insurance",
    note: "Active policy",
  },
];

// Given a document's expiry_date, work out its status.
export function getStatus(document) {
  if (!document) return "missing";
  if (!document.expiry_date) return "ok"; // one-off documents with no expiry
  const today = new Date();
  const expiry = new Date(document.expiry_date);
  const daysLeft = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return "bad";
  if (daysLeft <= 30) return "warn";
  return "ok";
}

export const STATUS_LABEL = {
  ok: "Compliant",
  warn: "Renew soon",
  bad: "Expired",
  missing: "Missing",
};
