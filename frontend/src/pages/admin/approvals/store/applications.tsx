import { useEffect, useState } from "react";
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
import api from "../../../../api/axios";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"];
const CITIES = ["All Cities", "Mumbai, Maharashtra", "Delhi, NCR", "Bangalore, KA", "Hyderabad, TS"];
const PAGE_SIZE = 4;

// ---------- Types ----------

type StoreStatus = "pending" | "approved" | "rejected";

interface ChecklistDoc {
    id: string;
    label: string;
    fileUrl: string | null;
    fileName: string | null;
    status: "verified" | "missing";
}

interface StoreApplication {
    id: string;
    storeCode: string;
    name: string;
    owner: string;
    contactEmail: string;
    contactPhone: string;
    location: string;
    fullAddress: string;
    pincode: string | null;
    type: string;
    products: number;
    radius: string;
    logoInitial: string | null;
    status: StoreStatus;
    checklist: ChecklistDoc[];
    documentsSubmitted: number;
    documentsTotal: number;
    dateLabel: string;
    submittedOn: string;
    createdAt: string;
}

interface StoreApplicationStats {
    pending: number;
    approved: number;
    rejected: number;
    requiringAttention: number;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ---------- UI helpers ----------

const STATUS_BADGE: Record<StoreStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-[#F7EFE2] text-[#8B6F47]" },
    approved: { label: "Approved", className: "bg-[#EAF6EF] text-[#2E7D52]" },
    rejected: { label: "Rejected", className: "bg-[#FBEAEA] text-[#D94F4F]" },
};

const DOC_CHIP: Record<ChecklistDoc["status"], string> = {
    verified: "bg-[#EAF6EF] text-[#2E7D52]",
    missing: "bg-[#F0E6D6] text-[#A2937F]",
};

function DocIcon({ status }: { status: ChecklistDoc["status"] }) {
    if (status === "verified") return <CheckCircle2 size={12} />;
    return <CircleDashed size={12} />;
}

function formatDateLabel(createdAt: string) {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function StatCard({
    label,
    value,
    icon: Icon,
    bg,
    iconColor,
}: {
    label: string;
    value: number;
    icon: typeof CircleDashed;
    bg: string;
    iconColor: string;
}) {
    return (
        <div className={`flex flex-col gap-3 rounded-2xl ${bg} p-5`}>
            <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/70 ${iconColor}`}>
                <Icon size={16} strokeWidth={2} />
            </span>
            <div>
                <p className="text-[13px] text-[#5A4A3A]">{label}</p>
                <p className="text-[28px] font-semibold leading-tight text-[#3A2C20]">{value}</p>
            </div>
        </div>
    );
}

function StoreLogo({ app }: { app: StoreApplication }) {
    if (!app.logoInitial) {
        return (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFE7DC] text-[#A2937F]">
                <StoreIcon size={20} />
            </div>
        );
    }
    return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B6F47] text-[15px] font-semibold text-white">
            {app.logoInitial}
        </div>
    );
}

function primaryAction(status: StoreApplication["status"]) {
    switch (status) {
        case "pending":
            return { label: "Review Application", disabled: false };
        case "approved":
            return { label: "Application Approved", disabled: true };
        case "rejected":
            return { label: "Review Feedback", disabled: false };
    }
}

function ApplicationCard({ app, onReview }: { app: StoreApplication; onReview: (id: string) => void }) {
    const badge = STATUS_BADGE[app.status];
    const primary = primaryAction(app.status);

    return (
        <div className="flex flex-col gap-5 rounded-2xl border border-[#EBE1D2] bg-white p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <StoreLogo app={app} />
                    <div>
                        <p className="text-[15px] font-semibold text-[#3A2C20]">{app.name}</p>
                        <p className="text-[12.5px] text-[#8C7C6B]">
                            {app.owner} · {app.storeCode}
                        </p>
                    </div>
                </div>
                <span className={`whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] font-medium ${badge.className}`}>
                    {badge.label}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#A2937F]">Contact</p>
                    <p className="mt-1 text-[#3A2C20]">{app.contactEmail}</p>
                    <p className="text-[#3A2C20]">{app.contactPhone}</p>
                </div>
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#A2937F]">Location</p>
                    <p className="mt-1 text-[#3A2C20]">{app.location}</p>
                    <p className="italic text-[#8C7C6B]">{formatDateLabel(app.dateLabel)}</p>
                </div>
            </div>

            <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#A2937F]">
                    Submitted Documents
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

            <div className="flex items-stretch divide-x divide-[#EBE1D2] rounded-xl bg-[#FBF6EE] px-2 py-3">
                <div className="flex-1 px-3 text-center">
                    <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#A2937F]">Documents</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#3A2C20]">
                        {app.documentsSubmitted}/{app.documentsTotal}
                    </p>
                </div>
                <div className="flex-1 px-3 text-center">
                    <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#A2937F]">Type</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#3A2C20]">{app.type}</p>
                </div>
                <div className="flex-1 px-3 text-center">
                    <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#A2937F]">Pincode</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#3A2C20]">{app.pincode ?? "—"}</p>
                </div>
            </div>

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
                    View Documents
                </button>
            </div>
        </div>
    );
}

export default function StoreApplicationsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [cityFilter, setCityFilter] = useState("All Cities");
    const [dateFilter, setDateFilter] = useState("");
    const [page, setPage] = useState(1);

    const [applications, setApplications] = useState<StoreApplication[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [stats, setStats] = useState<StoreApplicationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Debounce search so we don't fire a request on every keystroke.
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    // Reset to page 1 whenever filters change.
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, cityFilter, dateFilter]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        api
            .get("/admin/store/applications", {
                params: {
                    search: debouncedSearch,
                    status: statusFilter,
                    city: cityFilter,
                    date: dateFilter || undefined,
                    page,
                    limit: PAGE_SIZE,
                },
            })
            .then((res) => {
                if (!active) return;
                setApplications(res.data.applications);
                setPagination(res.data.pagination);
            })
            .catch((err) => {
                if (!active) return;
                setError(err?.response?.data?.message || "Failed to load applications.");
            })
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, [debouncedSearch, statusFilter, cityFilter, dateFilter, page]);

    useEffect(() => {
        api
            .get("/admin/store/applications/stats")
            .then((res) => setStats(res.data.stats))
            .catch(() => setStats(null));
    }, []);

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("All");
        setCityFilter("All Cities");
        setDateFilter("");
    };

    const totalPages = pagination?.totalPages ?? 1;
    const total = pagination?.total ?? 0;
    const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(page * PAGE_SIZE, total);

    return (
        <div className="flex h-screen w-full bg-[#FBF6EE]">
            <Sidebar />

            <div className="flex h-screen flex-1 flex-col overflow-hidden">
                <TopBar pageTitle="Store Applications" showSearch={false} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-7 py-6">
                    <div className="flex flex-col gap-6">
                        <p className="text-[14px] text-[#8C7C6B]">Review and manage store onboarding requests</p>

                        {/* Alert banner */}
                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#EBE1D2] bg-[#F7EFE2] px-6 py-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3A2C20] text-[#F0DDB8]">
                                    <AlertTriangle size={18} />
                                </span>
                                <div>
                                    <p className="text-[14px] font-semibold text-[#3A2C20]">
                                        {stats?.pending ?? "—"} store applications are awaiting review
                                    </p>
                                    <p className="text-[12.5px] text-[#8C7C6B]">
                                        {stats?.requiringAttention ?? "—"} applications have been pending for more than 48 hours
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                label="Pending Applications"
                                value={stats?.pending ?? 0}
                                icon={CircleDashed}
                                bg="bg-[#F7EFE2]"
                                iconColor="text-[#8B6F47]"
                            />
                            <StatCard
                                label="Approved Stores"
                                value={stats?.approved ?? 0}
                                icon={CheckCircle2}
                                bg="bg-[#EAF6EF]"
                                iconColor="text-[#2E7D52]"
                            />
                            <StatCard
                                label="Rejected"
                                value={stats?.rejected ?? 0}
                                icon={XCircle}
                                bg="bg-[#FBEAEA]"
                                iconColor="text-[#D94F4F]"
                            />
                            <StatCard
                                label="Requiring Attention"
                                value={stats?.requiringAttention ?? 0}
                                icon={AlertTriangle}
                                bg="bg-[#FBEAEA]"
                                iconColor="text-[#D94F4F]"
                            />
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
                            <FilterSelect value={cityFilter} onChange={setCityFilter} options={CITIES} />

                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="rounded-xl border border-[#EBE1D2] bg-white px-3.5 py-2.5 text-[13px] text-[#3A2C20] focus:outline-none"
                            />

                            <button
                                onClick={resetFilters}
                                className="whitespace-nowrap text-[13px] font-medium text-[#8B6F47] hover:underline"
                            >
                                Reset Filters
                            </button>
                        </div>

                        {/* Application cards */}
                        {error ? (
                            <div className="col-span-full rounded-2xl border border-dashed border-[#D94F4F] bg-white px-6 py-12 text-center">
                                <p className="text-[14px] font-medium text-[#D94F4F]">{error}</p>
                            </div>
                        ) : loading ? (
                            <div className="col-span-full rounded-2xl border border-dashed border-[#EBE1D2] bg-white px-6 py-12 text-center">
                                <p className="text-[14px] text-[#8C7C6B]">Loading applications...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                {applications.length === 0 ? (
                                    <div className="col-span-full rounded-2xl border border-dashed border-[#EBE1D2] bg-white px-6 py-12 text-center">
                                        <p className="text-[14px] font-medium text-[#3A2C20]">
                                            No applications match these filters
                                        </p>
                                        <p className="mt-1 text-[12.5px] text-[#8C7C6B]">
                                            Try a different search term or reset the filters above.
                                        </p>
                                    </div>
                                ) : (
                                    applications.map((app) => (
                                        <ApplicationCard
                                            key={app.id}
                                            app={app}
                                            onReview={(id) => navigate(`/admin/approvals/store/${id}`)}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {total > 0 && (
                            <div className="flex items-center justify-between border-t border-[#EBE1D2] pt-5">
                                <p className="text-[13px] text-[#8C7C6B]">
                                    Showing <span className="font-semibold text-[#3A2C20]">{rangeStart} – {rangeEnd}</span> of{" "}
                                    <span className="font-semibold text-[#3A2C20]">{total}</span> applications
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EBE1D2] bg-white text-[#8C7C6B] transition-colors hover:bg-[#F5EEE2] disabled:cursor-not-allowed disabled:opacity-50"
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="px-2 text-[13px] text-[#3A2C20]">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EBE1D2] bg-white text-[#8C7C6B] transition-colors hover:bg-[#F5EEE2] disabled:cursor-not-allowed disabled:opacity-50"
                                        disabled={page === totalPages}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
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