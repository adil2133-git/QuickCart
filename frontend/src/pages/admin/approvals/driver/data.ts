export type DriverAppStatus = "pending" | "documents-missing" | "ready" | "approved" | "rejected";

export type DocStatus = "verified" | "issue" | "missing";

export interface DriverChecklistDoc {
    id: string;
    label: string;
    status: DocStatus;
    fileName?: string;
    note?: string;
}

// Matches the Driver Registration form exactly: name, email, phone,
// vehicle type (Bike or Scooter only), vehicle number, license number,
// and 3 uploaded documents — Driving License, Vehicle RC, Profile Photo.
export interface DriverApplication {
    id: string;
    name: string;
    driverCode: string; // e.g. "DRV-8924"
    photoUrl?: string;
    status: DriverAppStatus;
    email: string;
    phone: string;
    city: string;
    vehicleType: "Bike" | "Scooter";
    vehicleModel?: string;
    vehicleNumber: string;
    licenseNumber: string;
    dateLabel: string;
    submittedOn: string;
    checklist: DriverChecklistDoc[];
    reviewNotes?: { author: string; date: string; note: string }[];
    rejectionReason?: string;
}

export const DRIVER_APPLICATIONS: DriverApplication[] = [
    {
        id: "arjun-varma",
        name: "Arjun Varma",
        driverCode: "DRV-8924",
        status: "pending",
        email: "arjun.v@email.com",
        phone: "+91 98765 43210",
        city: "Mumbai",
        vehicleType: "Bike",
        vehicleModel: "Ather 450X",
        vehicleNumber: "MH-01-AX-4592",
        licenseNumber: "LIC-556677",
        dateLabel: "Submitted: Jan 22, 2024",
        submittedOn: "Jan 22, 2024",
        checklist: [
            { id: "license", label: "Driving License", status: "verified", fileName: "driving-license.pdf" },
            { id: "rc", label: "Vehicle RC", status: "verified", fileName: "vehicle-rc.pdf" },
            { id: "photo", label: "Profile Photo", status: "verified", fileName: "profile-photo.jpg" },
        ],
        reviewNotes: [],
    },
    {
        id: "sanya-malhotra",
        name: "Sanya Malhotra",
        driverCode: "DRV-9011",
        status: "documents-missing",
        email: "sanya.m@email.com",
        phone: "+91 88223 11004",
        city: "Bangalore",
        vehicleType: "Scooter",
        vehicleModel: "Honda Activa",
        vehicleNumber: "KA-05-MM-1234",
        licenseNumber: "LIC-778899",
        dateLabel: "Submitted: Jan 21, 2024",
        submittedOn: "Jan 21, 2024",
        checklist: [
            { id: "license", label: "Driving License", status: "verified", fileName: "driving-license.pdf" },
            { id: "rc", label: "Vehicle RC", status: "missing" },
            { id: "photo", label: "Profile Photo", status: "missing" },
        ],
        reviewNotes: [
            {
                author: "Priya Nair (Admin)",
                date: "Jan 22, 2024",
                note: "Vehicle RC and profile photo not uploaded. Notified driver to resubmit.",
            },
        ],
    },
    {
        id: "rahul-roy",
        name: "Rahul Roy",
        driverCode: "DRV-7762",
        status: "ready",
        email: "rahul.r@email.com",
        phone: "+91 99001 88223",
        city: "Delhi",
        vehicleType: "Bike",
        vehicleModel: "Hero Splendor",
        vehicleNumber: "DL-12-CZ-0019",
        licenseNumber: "LIC-112233",
        dateLabel: "Submitted: Jan 20, 2024",
        submittedOn: "Jan 20, 2024",
        checklist: [
            { id: "license", label: "Driving License", status: "verified", fileName: "driving-license.pdf" },
            { id: "rc", label: "Vehicle RC", status: "verified", fileName: "vehicle-rc.pdf" },
            { id: "photo", label: "Profile Photo", status: "verified", fileName: "profile-photo.jpg" },
        ],
        reviewNotes: [],
    },
    {
        id: "vikram-singh",
        name: "Vikram Singh",
        driverCode: "DRV-6612",
        status: "pending",
        email: "vik.singh@email.com",
        phone: "+91 77221 00993",
        city: "Gurgaon",
        vehicleType: "Scooter",
        vehicleModel: "TVS Jupiter",
        vehicleNumber: "HR-26-TY-8812",
        licenseNumber: "LIC-334455",
        dateLabel: "Submitted: Jan 19, 2024",
        submittedOn: "Jan 19, 2024",
        checklist: [
            { id: "license", label: "Driving License", status: "verified", fileName: "driving-license.pdf" },
            { id: "rc", label: "Vehicle RC", status: "verified", fileName: "vehicle-rc.pdf" },
            { id: "photo", label: "Profile Photo", status: "missing" },
        ],
        reviewNotes: [],
    },
];

export const DRIVER_STATUS_BADGE: Record<DriverAppStatus, { label: string; className: string }> = {
    pending: { label: "Pending Review", className: "bg-[#F7EFE2] text-[#8B6F47]" },
    "documents-missing": { label: "Documents Missing", className: "bg-[#FBEAEA] text-[#D94F4F]" },
    ready: { label: "Ready for Review", className: "bg-[#EAF6EF] text-[#2E7D52]" },
    approved: { label: "Approved", className: "bg-[#EAF6EF] text-[#2E7D52]" },
    rejected: { label: "Rejected", className: "bg-[#FBEAEA] text-[#D94F4F]" },
};

export const DOC_CHIP: Record<DocStatus, string> = {
    verified: "bg-[#EAF6EF] text-[#2E7D52]",
    issue: "bg-[#FBEAEA] text-[#D94F4F]",
    missing: "bg-[#F5EEE2] text-[#8C7C6B]",
};

export function verificationProgress(checklist: DriverChecklistDoc[]) {
    const total = checklist.length;
    const verified = checklist.filter((d) => d.status === "verified").length;
    return { verified, total, percent: total === 0 ? 0 : Math.round((verified / total) * 100) };
}