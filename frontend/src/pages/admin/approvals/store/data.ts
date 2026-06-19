export type AppStatus = "pending" | "needs-attention" | "approved" | "rejected";

export type DocStatus = "verified" | "issue" | "missing";

export interface ChecklistDoc {
    id: string;
    label: string;
    status: DocStatus;
    fileName?: string;
    note?: string;
}

export interface StoreApplication {
    id: string;
    name: string;
    owner: string;
    logoInitial?: string;
    logoColor?: string;
    status: AppStatus;
    contactEmail: string;
    contactPhone: string;
    location: string;
    fullAddress: string;
    pincode: string;
    dateLabel: string;
    submittedOn: string;
    checklist: ChecklistDoc[];
    products: string;
    radius: string;
    type: string;
    rejectionReason?: string;
    reviewNotes?: { author: string; date: string; note: string }[];
}

// Matches the documents actually collected on the Store Registration
// form: Trade License, Owner ID Proof, Store Front Photo. No GST
// certificate or bank proof is collected at signup, so those aren't
// part of the review checklist.
export const APPLICATIONS: StoreApplication[] = [
    {
        id: "green-harvest",
        name: "Green Harvest Organics",
        owner: "Julian Thorne",
        logoInitial: "G",
        logoColor: "#3F7A52",
        status: "pending",
        contactEmail: "j.thorne@greenharvest.co",
        contactPhone: "+91 98765 43210",
        location: "Mumbai, Maharashtra",
        fullAddress: "14, Linking Road, Bandra West, Mumbai, Maharashtra",
        pincode: "400050",
        dateLabel: "Submitted: Jan 22, 2024",
        submittedOn: "Jan 22, 2024",
        checklist: [
            { id: "trade-license", label: "Trade License", status: "verified", fileName: "trade-license.pdf" },
            { id: "owner-id", label: "Owner ID Proof", status: "verified", fileName: "owner-id.jpg" },
            { id: "store-front", label: "Store Front Photo", status: "missing" },
        ],
        products: "250",
        radius: "5km",
        type: "Grocery",
        reviewNotes: [],
    },
    {
        id: "daily-fresh",
        name: "Daily Fresh Mart",
        owner: "Amara Okafor",
        logoInitial: "D",
        logoColor: "#C0392B",
        status: "needs-attention",
        contactEmail: "a.okafor@dailyfresh.in",
        contactPhone: "+91 88888 77777",
        location: "Delhi, NCR",
        fullAddress: "B-12, Connaught Place, New Delhi",
        pincode: "110001",
        dateLabel: "Submitted: Jan 21, 2024",
        submittedOn: "Jan 21, 2024",
        checklist: [
            {
                id: "trade-license",
                label: "Trade License",
                status: "issue",
                fileName: "trade-license.pdf",
                note: "License number does not match the registered business name on file.",
            },
            { id: "owner-id", label: "Owner ID Proof", status: "verified", fileName: "owner-id.jpg" },
            { id: "store-front", label: "Store Front Photo", status: "verified", fileName: "store-front.jpg" },
        ],
        products: "120",
        radius: "3km",
        type: "Supermarket",
        reviewNotes: [
            {
                author: "Priya Nair (Admin)",
                date: "Jan 23, 2024",
                note: "Flagged trade license mismatch — requested updated document from owner.",
            },
        ],
    },
    {
        id: "spice-route",
        name: "The Spice Route",
        owner: "Marcus Chen",
        logoInitial: "S",
        logoColor: "#1F1B16",
        status: "approved",
        contactEmail: "m.chen@spiceroute.in",
        contactPhone: "+91 77777 66666",
        location: "Bangalore, KA",
        fullAddress: "44, Church Street, Bangalore, Karnataka",
        pincode: "560001",
        dateLabel: "Submitted: Jan 15, 2024",
        submittedOn: "Jan 15, 2024",
        checklist: [
            { id: "trade-license", label: "Trade License", status: "verified", fileName: "trade-license.pdf" },
            { id: "owner-id", label: "Owner ID Proof", status: "verified", fileName: "owner-id.jpg" },
            { id: "store-front", label: "Store Front Photo", status: "verified", fileName: "store-front.jpg" },
        ],
        products: "500+",
        radius: "10km",
        type: "Gourmet",
        reviewNotes: [
            { author: "Priya Nair (Admin)", date: "Jan 16, 2024", note: "All documents verified. Approved." },
        ],
    },
    {
        id: "urban-grains",
        name: "Urban Grains",
        owner: "Elena Hernandez",
        status: "rejected",
        contactEmail: "e.hernandez@urbangrains.com",
        contactPhone: "+91 66666 55555",
        location: "Hyderabad, TS",
        fullAddress: "Plot 9, Banjara Hills, Hyderabad, Telangana",
        pincode: "500034",
        dateLabel: "Rejected: Jan 20, 2024",
        submittedOn: "Jan 18, 2024",
        checklist: [
            {
                id: "trade-license",
                label: "Trade License",
                status: "issue",
                fileName: "trade-license.pdf",
                note: 'Duplicate trade license found under existing entity "Grain Hub".',
            },
            { id: "owner-id", label: "Owner ID Proof", status: "verified", fileName: "owner-id.jpg" },
            { id: "store-front", label: "Store Front Photo", status: "verified", fileName: "store-front.jpg" },
        ],
        products: "--",
        radius: "--",
        type: "Wholesale",
        rejectionReason: 'Duplicate trade license found under existing entity "Grain Hub".',
        reviewNotes: [
            {
                author: "Priya Nair (Admin)",
                date: "Jan 20, 2024",
                note: 'Rejected — trade license already registered under "Grain Hub" entity.',
            },
        ],
    },
];

export const STATUS_BADGE: Record<AppStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-[#F7EFE2] text-[#8B6F47]" },
    "needs-attention": { label: "Needs Attention", className: "bg-[#F7EFE2] text-[#8B6F47]" },
    approved: { label: "Approved", className: "bg-[#EAF6EF] text-[#2E7D52]" },
    rejected: { label: "Rejected", className: "bg-[#FBEAEA] text-[#D94F4F]" },
};

export const DOC_CHIP: Record<DocStatus, string> = {
    verified: "bg-[#EAF6EF] text-[#2E7D52]",
    issue: "bg-[#FBEAEA] text-[#D94F4F]",
    missing: "bg-[#F5EEE2] text-[#8C7C6B]",
};