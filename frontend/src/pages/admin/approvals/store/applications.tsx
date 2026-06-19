import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    CircleDashed,
    Store as StoreIcon,
} from "lucide-react";
import Sidebar from "../../../../components/admin/sidebar";
import TopBar from "../../../../components/admin/topbar";
import {
    APPLICATIONS,
    STATUS_BADGE,
    DOC_CHIP,
    type StoreApplication,
    type DocStatus,
} from "./data";

/**
 * QuickKart Admin — Store Applications (Approvals)
 * Stack: React + TypeScript + Tailwind CSS + lucide-react
 *
 * Uses the same color tokens as Sidebar/TopBar:
 *   page bg         #FBF6EE
 *   border          #EBE1D2
 *   text default    #3A2C20
 *   text muted      #8C7C6B
 *   accent (brown)  #8B6F47
 *   accent dark     #211712 / #3A2C20
 *   success         #2E7D52 / bg #EAF6EF
 *   danger          #D94F4F / bg #FBEAEA
 *   warning         #C8A37A / bg #F7EFE2
 *
 * Clicking the primary action (Review Application / Resolve Issues /
 * Review Feedback) navigates to the per-application review page at
 * /admin/approvals/store/:id — see StoreApplicationReview.tsx.
 */

const STATS = [
    {
        label: "Pending Approvals",
        value: "12",
        tag: "+2 today",
        tagColor: "text-[#8B6F47]",
        bg: "bg-[#F7EFE2]",
        icon: CircleDashed,
        iconColor: "text-[#8B6F47]",
    },
    {
        label: "Approved Stores",
        value: "145",
        tag: "+18 this week",
        tagColor: "text-[#2E7D52]",
        bg: "bg-[#EAF6EF]",
        icon: CheckCircle2,
        iconColor: "text-[#2E7D52]",
    },
    {
        label: "Rejected Apps",
        value: "8",
        tag: "-3.2%",
        tagColor: "text-[#D94F4F]",
        bg: "bg-[#FBEAEA]",
        icon: XCircle,
        iconColor: "text-[#D94F4F]",
    },
    {
        label: "Reviews Needed",
        value: "3",
        tag: "High Priority",
        tagColor: "text-[#D94F4F]",
        bg: "bg-[#FBEAEA]",
        icon: AlertTriangle,
        iconColor: "text-[#D94F4F]",
    },
];

function DocIcon({ status }: { status: DocStatus }) {
    if (status === "verified") return <CheckCircle2 size={12} />;
    if (status === "issue") return <XCircle size={12} />;
    return <CircleDashed size={12} />;
}

function StatCard({ stat }: { stat: (typeof STATS)[number] }) {
    const Icon = stat.icon;
    return (
        <div className={`flex flex-col gap-3 rounded-2xl ${stat.bg} p-5`}>
            <div className="flex items-center justify-between">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/70 ${stat.iconColor}`}>
                    <Icon size={16} strokeWidth={2} />
                </span>
                <span className={`text-[12px] font-semibold ${stat.tagColor}`}>{stat.tag}</span>
            </div>
            <div>
                <p className="text-[13px] text-[#5A4A3A]">{stat.label}</p>
                <p className="text-[28px] font-semibold leading-tight text-[#3A2C20]">{stat.value}</p>
            </div>
        </div>
    );
}

function StoreLogo({ app }: { app: StoreApplication }) {
    if (app.status === "rejected" || !app.logoInitial) {
        return (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFE7DC] text-[#A2937F]">
                <StoreIcon size={20} />
            </div>
        );
    }
    return (
        <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-[15px] font-semibold text-white"
            style={{ backgroundColor: app.logoColor ?? "#8B6F47" }}
        >
            {app.logoInitial}
        </div>
    );
}

function primaryAction(app: StoreApplication) {
    switch (app.status) {
        case "pending":
            return { label: "Review Application", disabled: false };
        case "needs-attention":
            return { label: "Resolve Issues", disabled: false };
        case "approved":
            return { label: "Application Approved", disabled: true };
        case "rejected":
            return { label: "Review Feedback", disabled: false };
    }
}

function secondaryAction(app: StoreApplication) {
    switch (app.status) {
        case "pending":
            return "View Documents";
        case "needs-attention":
            return "View Details";
        case "approved":
            return "View Dashboard";
        case "rejected":
            return "Archived Docs";
    }
}

function ApplicationCard({ app, onReview }: { app: StoreApplication; onReview: (id: string) => void }) {
    const badge = STATUS_BADGE[app.status];
    const primary = primaryAction(app);
    const secondary = secondaryAction(app);

    return (
        <div className="flex flex-col gap-5 rounded-2xl border border-[#EBE1D2] bg-white p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <StoreLogo app={app} />
                    <div>
                        <p className="text-[15px] font-semibold text-[#3A2C20]">{app.name}</p>
                        <p className="text-[12.5px] text-[#8C7C6B]">{app.owner}</p>
                    </div>
                </div>
                <span className={`whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] font-medium ${badge.className}`}>
                    {badge.label}
                </span>
            </div>

            {/* Contact / Location grid */}
            <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#A2937F]">Contact</p>
                    <p className="mt-1 text-[#3A2C20]">{app.contactEmail}</p>
                    <p className="text-[#3A2C20]">{app.contactPhone}</p>
                </div>
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#A2937F]">Location</p>
                    <p className="mt-1 text-[#3A2C20]">{app.location}</p>
                    <p className="italic text-[#8C7C6B]">{app.dateLabel}</p>
                </div>
            </div>

            {/* Rejection reason */}
            {app.rejectionReason && (
                <div>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#A2937F]">
                        Rejection Reason
                    </p>
                    <div className="rounded-lg bg-[#FBEAEA] px-3.5 py-2.5 text-[12.5px] text-[#C0392B]">
                        {app.rejectionReason}
                    </div>
                </div>
            )}

            {/* Verification checklist */}
            {app.checklist.length > 0 && (
                <div>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#A2937F]">
                        Verification Checklist
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {app.checklist.map((doc) => (
                            <span
                                key={doc.id}
                                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${DOC_CHIP[doc.status]}`}
                            >
                                <DocIcon status={doc.status} />
                                {doc.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats row */}
            <div className="flex items-stretch divide-x divide-[#EBE1D2] rounded-xl bg-[#FBF6EE] px-2 py-3">
                <div className="flex-1 px-3 text-center">
                    <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#A2937F]">Products</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#3A2C20]">{app.products}</p>
                </div>
                <div className="flex-1 px-3 text-center">
                    <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#A2937F]">Radius</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#3A2C20]">{app.radius}</p>
                </div>
                <div className="flex-1 px-3 text-center">
                    <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#A2937F]">Type</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#3A2C20]">{app.type}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    disabled={primary.disabled}
                    onClick={() => onReview(app.id)}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors ${
                        primary.disabled
                            ? "cursor-not-allowed bg-[#F0E6D6] text-[#A2937F]"
                            : "bg-[#3A2C20] text-[#F4EDE2] hover:bg-[#2E231C]"
                    }`}
                >
                    {primary.label}
                </button>
                <button
                    onClick={() => onReview(app.id)}
                    className="flex-1 rounded-xl border border-[#EBE1D2] bg-white px-4 py-2.5 text-[13px] font-medium text-[#3A2C20] transition-colors hover:bg-[#F5EEE2]"
                >
                    {secondary}
                </button>
            </div>
        </div>
    );
}

const CITIES = ["All Cities", "Mumbai, Maharashtra", "Delhi, NCR", "Bangalore, KA", "Hyderabad, TS"];
const STATUS_FILTERS = ["All", "Pending", "Needs Attention", "Approved", "Rejected"];
const DOC_FILTERS = ["All", "Fully Verified", "Has Issues", "Missing Docs"];

export default function StoreApplicationsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [cityFilter, setCityFilter] = useState("All Cities");
    const [docFilter, setDocFilter] = useState("All");
    const [dateFilter, setDateFilter] = useState("");
    const [page, setPage] = useState(1);

    const totalApplications = 173;
    const pageSize = 4;
    const totalPages = Math.ceil(totalApplications / pageSize);

    const filteredApps = useMemo(() => {
        return APPLICATIONS.filter((app) => {
            const matchesSearch =
                search.trim() === "" ||
                app.name.toLowerCase().includes(search.toLowerCase()) ||
                app.owner.toLowerCase().includes(search.toLowerCase());
            const matchesStatus =
                statusFilter === "All" ||
                STATUS_BADGE[app.status].label === statusFilter;
            const matchesCity = cityFilter === "All Cities" || app.location === cityFilter;
            return matchesSearch && matchesStatus && matchesCity;
        });
    }, [search, statusFilter, cityFilter]);

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("All");
        setCityFilter("All Cities");
        setDocFilter("All");
        setDateFilter("");
    };

    return (
        <div className="flex h-screen w-full bg-[#FBF6EE]">
            <Sidebar />

            <div className="flex h-screen flex-1 flex-col overflow-hidden">
                <TopBar pageTitle="Store Applications" showSearch={false} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-7 py-6">
                <div className="flex flex-col gap-6">
                <p className="text-[14px] text-[#8C7C6B]">Review and manage store onboarding requests</p>

                {/* Critical alert banner */}
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#EBE1D2] bg-[#F7EFE2] px-6 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3A2C20] text-[#F0DDB8]">
                            <AlertTriangle size={18} />
                        </span>
                        <div>
                            <p className="text-[14px] font-semibold text-[#3A2C20]">Critical Latency Alert</p>
                            <p className="text-[12.5px] text-[#8C7C6B]">
                                3 applications pending review for more than 48 hours
                            </p>
                        </div>
                    </div>
                    <button className="whitespace-nowrap rounded-xl bg-[#3A2C20] px-4 py-2.5 text-[13px] font-medium text-[#F4EDE2] transition-colors hover:bg-[#2E231C]">
                        Review Now
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {STATS.map((stat) => (
                        <StatCard key={stat.label} stat={stat} />
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex min-w-[240px] flex-1 items-center gap-2.5 rounded-xl border border-[#EBE1D2] bg-white px-3.5 py-2.5">
                        <Search size={16} className="shrink-0 text-[#8C7C6B]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by store name or owner..."
                            className="w-full bg-transparent text-[13px] text-[#3A2C20] placeholder:text-[#A2937F] focus:outline-none"
                        />
                    </div>

                    <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} prefix="Status" />

                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="rounded-xl border border-[#EBE1D2] bg-white px-3.5 py-2.5 text-[13px] text-[#3A2C20] focus:outline-none"
                    />

                    <FilterSelect value={cityFilter} onChange={setCityFilter} options={CITIES} />

                    <FilterSelect value={docFilter} onChange={setDocFilter} options={DOC_FILTERS} prefix="Docs" />

                    <button
                        onClick={resetFilters}
                        className="whitespace-nowrap text-[13px] font-medium text-[#8B6F47] hover:underline"
                    >
                        Reset Filters
                    </button>
                </div>

                {/* Application cards */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {filteredApps.length === 0 ? (
                        <div className="col-span-full rounded-2xl border border-dashed border-[#EBE1D2] bg-white px-6 py-12 text-center">
                            <p className="text-[14px] font-medium text-[#3A2C20]">No applications match these filters</p>
                            <p className="mt-1 text-[12.5px] text-[#8C7C6B]">
                                Try a different search term or reset the filters above.
                            </p>
                        </div>
                    ) : (
                        filteredApps.map((app) => (
                            <ApplicationCard
                                key={app.id}
                                app={app}
                                onReview={(id) => navigate(`/admin/approvals/store/${id}`)}
                            />
                        ))
                    )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-[#EBE1D2] pt-5">
                    <p className="text-[13px] text-[#8C7C6B]">
                        Showing <span className="font-semibold text-[#3A2C20]">1 – 4</span> of{" "}
                        <span className="font-semibold text-[#3A2C20]">{totalApplications}</span> applications
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EBE1D2] bg-white text-[#8C7C6B] transition-colors hover:bg-[#F5EEE2] disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={page === 1}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {[1, 2, 3].map((n) => (
                            <button
                                key={n}
                                onClick={() => setPage(n)}
                                className={`flex h-9 w-9 items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
                                    page === n
                                        ? "bg-[#3A2C20] text-[#F4EDE2]"
                                        : "border border-[#EBE1D2] bg-white text-[#3A2C20] hover:bg-[#F5EEE2]"
                                }`}
                            >
                                {n}
                            </button>
                        ))}
                        <span className="px-1 text-[13px] text-[#8C7C6B]">...</span>
                        <button
                            onClick={() => setPage(totalPages)}
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
                                page === totalPages
                                    ? "bg-[#3A2C20] text-[#F4EDE2]"
                                    : "border border-[#EBE1D2] bg-white text-[#3A2C20] hover:bg-[#F5EEE2]"
                            }`}
                        >
                            {totalPages}
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EBE1D2] bg-white text-[#8C7C6B] transition-colors hover:bg-[#F5EEE2] disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={page === totalPages}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
                </div>
                </main>
            </div>
        </div>
    );
}

function FilterSelect({
    value,
    onChange,
    options,
    prefix,
}: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
    prefix?: string;
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none rounded-xl border border-[#EBE1D2] bg-white px-3.5 py-2.5 pr-9 text-[13px] text-[#3A2C20] focus:outline-none"
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {prefix ? `${prefix}: ${opt}` : opt}
                    </option>
                ))}
            </select>
            <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7C6B]"
            />
        </div>
    );
}