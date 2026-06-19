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
    Bike,
    Mail,
    Phone,
} from "lucide-react";
import Sidebar from "../../../../components/admin/sidebar";
import TopBar from "../../../../components/admin/topbar";
import {
    DRIVER_APPLICATIONS,
    DRIVER_STATUS_BADGE,
    verificationProgress,
    type DriverApplication,
} from "./data";

/**
 * QuickKart Admin — Driver Applications (Approvals)
 * Stack: React + TypeScript + Tailwind CSS + lucide-react
 *
 * Same shell + color tokens as Store Applications:
 *   page bg #FBF6EE · border #EBE1D2 · text #3A2C20 · muted #8C7C6B
 *   accent #8B6F47 · success #2E7D52/#EAF6EF · danger #D94F4F/#FBEAEA
 *
 * Clicking the primary action on a card navigates to the per-driver
 * review page at /admin/approvals/driver/:id.
 */

const STATS = [
    {
        label: "Pending Applications",
        value: "14",
        tag: "+12%",
        tagColor: "text-[#8B6F47]",
        bg: "bg-[#F7EFE2]",
        icon: CircleDashed,
        iconColor: "text-[#8B6F47]",
    },
    {
        label: "Approved Drivers",
        value: "145",
        tag: "+24%",
        tagColor: "text-[#2E7D52]",
        bg: "bg-[#EAF6EF]",
        icon: CheckCircle2,
        iconColor: "text-[#2E7D52]",
    },
    {
        label: "Rejected",
        value: "8",
        tag: "-5%",
        tagColor: "text-[#D94F4F]",
        bg: "bg-[#FBEAEA]",
        icon: XCircle,
        iconColor: "text-[#D94F4F]",
    },
    {
        label: "Requiring Attention",
        value: "5",
        tag: "+2",
        tagColor: "text-[#D94F4F]",
        bg: "bg-[#FBEAEA]",
        icon: AlertTriangle,
        iconColor: "text-[#D94F4F]",
    },
];

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

function DriverAvatar({ driver }: { driver: DriverApplication }) {
    const initials = driver.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    return (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EFE7DC] text-[13px] font-semibold text-[#8B6F47]">
            {initials}
        </div>
    );
}

function primaryAction(status: DriverApplication["status"]) {
    switch (status) {
        case "pending":
            return { label: "Review Application", disabled: false };
        case "documents-missing":
            return { label: "Notify Driver", disabled: false };
        case "ready":
            return { label: "Review Application", disabled: false };
        case "approved":
            return { label: "Application Approved", disabled: true };
        case "rejected":
            return { label: "Review Feedback", disabled: false };
    }
}

function secondaryAction(status: DriverApplication["status"]) {
    switch (status) {
        case "documents-missing":
            return "View Missing";
        case "rejected":
            return "Archived Docs";
        default:
            return "View Docs";
    }
}

function DriverCard({ driver, onReview }: { driver: DriverApplication; onReview: (id: string) => void }) {
    const badge = DRIVER_STATUS_BADGE[driver.status];
    const primary = primaryAction(driver.status);
    const secondary = secondaryAction(driver.status);
    const progress = verificationProgress(driver.checklist);
    const barColor =
        progress.percent === 100 ? "bg-[#2E7D52]" : progress.percent >= 50 ? "bg-[#D9A23B]" : "bg-[#D94F4F]";

    return (
        <div className="flex flex-col gap-5 rounded-2xl border border-[#EBE1D2] bg-white p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <DriverAvatar driver={driver} />
                    <div>
                        <p className="text-[15px] font-semibold text-[#3A2C20]">{driver.name}</p>
                        <p className="text-[12.5px] text-[#8C7C6B]">
                            {driver.driverCode} · {driver.city}
                        </p>
                    </div>
                </div>
                <span className={`whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] font-medium ${badge.className}`}>
                    {badge.label}
                </span>
            </div>

            {/* Contact */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-[#5A4A3A]">
                <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-[#A2937F]" />
                    {driver.email}
                </span>
                <span className="flex items-center gap-1.5">
                    <Phone size={13} className="text-[#A2937F]" />
                    {driver.phone}
                </span>
            </div>

            {/* Vehicle + verification */}
            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#FBF6EE] p-3.5">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-[#A2937F]">
                        <Bike size={12} />
                        Vehicle Info
                    </p>
                    <p className="text-[13px] font-medium text-[#3A2C20]">
                        {driver.vehicleType} · {driver.vehicleModel}
                    </p>
                    <p className="text-[12px] text-[#8C7C6B]">{driver.vehicleNumber}</p>
                </div>
                <div className="rounded-xl bg-[#FBF6EE] p-3.5">
                    <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#A2937F]">
                            Verification
                        </p>
                        <span className="text-[12px] font-semibold text-[#3A2C20]">{progress.percent}%</span>
                    </div>
                    <p className="mb-2 text-[12px] text-[#8C7C6B]">
                        {progress.verified}/{progress.total} Submitted
                    </p>
                    <div className="h-1.5 w-full rounded-full bg-[#EBE1D2]">
                        <div
                            className={`h-1.5 rounded-full ${barColor}`}
                            style={{ width: `${progress.percent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    disabled={primary.disabled}
                    onClick={() => onReview(driver.id)}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors ${
                        primary.disabled
                            ? "cursor-not-allowed bg-[#F0E6D6] text-[#A2937F]"
                            : "bg-[#3A2C20] text-[#F4EDE2] hover:bg-[#2E231C]"
                    }`}
                >
                    {primary.label}
                </button>
                <button
                    onClick={() => onReview(driver.id)}
                    className="flex-1 rounded-xl border border-[#EBE1D2] bg-white px-4 py-2.5 text-[13px] font-medium text-[#3A2C20] transition-colors hover:bg-[#F5EEE2]"
                >
                    {secondary}
                </button>
            </div>
        </div>
    );
}

const CITIES = ["All Cities", "Mumbai", "Bangalore", "Delhi", "Gurgaon"];
const STATUS_FILTERS = ["All Statuses", "Pending Review", "Documents Missing", "Ready for Review", "Approved", "Rejected"];
const VEHICLE_FILTERS = ["All Types", "Bike", "Scooter"];

export default function DriverApplicationsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Statuses");
    const [vehicleFilter, setVehicleFilter] = useState("All Types");
    const [cityFilter, setCityFilter] = useState("All Cities");
    const [dateFilter, setDateFilter] = useState("");
    const [page, setPage] = useState(1);

    const totalApplications = 132;
    const pageSize = 4;
    const totalPages = Math.ceil(totalApplications / pageSize);

    const filteredDrivers = useMemo(() => {
        return DRIVER_APPLICATIONS.filter((driver) => {
            const matchesSearch =
                search.trim() === "" ||
                driver.name.toLowerCase().includes(search.toLowerCase()) ||
                driver.email.toLowerCase().includes(search.toLowerCase()) ||
                driver.driverCode.toLowerCase().includes(search.toLowerCase());
            const matchesStatus =
                statusFilter === "All Statuses" || DRIVER_STATUS_BADGE[driver.status].label === statusFilter;
            const matchesVehicle = vehicleFilter === "All Types" || driver.vehicleType === vehicleFilter;
            const matchesCity = cityFilter === "All Cities" || driver.city === cityFilter;
            return matchesSearch && matchesStatus && matchesVehicle && matchesCity;
        });
    }, [search, statusFilter, vehicleFilter, cityFilter]);

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("All Statuses");
        setVehicleFilter("All Types");
        setCityFilter("All Cities");
        setDateFilter("");
    };

    const pendingCount = DRIVER_APPLICATIONS.filter((d) => d.status === "pending").length;
    const staleCount = 5; // pending > 48h — wire to real data once available

    return (
        <div className="flex h-screen w-full bg-[#FBF6EE]">
            <Sidebar />

            <div className="flex h-screen flex-1 flex-col overflow-hidden">
                <TopBar pageTitle="Driver Applications" showSearch={false} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-7 py-6">
                    <div className="flex flex-col gap-6">
                        <p className="text-[14px] text-[#8C7C6B]">
                            Manage and review delivery partner onboarding requests
                        </p>

                        {/* Alert banner */}
                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#EBE1D2] bg-[#F7EFE2] px-6 py-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3A2C20] text-[#F0DDB8]">
                                    <AlertTriangle size={18} />
                                </span>
                                <div>
                                    <p className="text-[14px] font-semibold text-[#3A2C20]">
                                        {pendingCount} driver applications are awaiting review
                                    </p>
                                    <p className="text-[12.5px] text-[#8C7C6B]">
                                        {staleCount} applications have been pending for more than 48 hours
                                    </p>
                                </div>
                            </div>
                            <button className="whitespace-nowrap rounded-xl bg-[#3A2C20] px-4 py-2.5 text-[13px] font-medium text-[#F4EDE2] transition-colors hover:bg-[#2E231C]">
                                Review Priority Queue
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
                            <div className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-xl border border-[#EBE1D2] bg-white px-3.5 py-2.5">
                                <Search size={16} className="shrink-0 text-[#8C7C6B]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name, Email, ID"
                                    className="w-full bg-transparent text-[13px] text-[#3A2C20] placeholder:text-[#A2937F] focus:outline-none"
                                />
                            </div>

                            <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} />
                            <FilterSelect value={vehicleFilter} onChange={setVehicleFilter} options={VEHICLE_FILTERS} />

                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="rounded-xl border border-[#EBE1D2] bg-white px-3.5 py-2.5 text-[13px] text-[#3A2C20] focus:outline-none"
                            />

                            <FilterSelect value={cityFilter} onChange={setCityFilter} options={CITIES} />

                            <button
                                onClick={resetFilters}
                                className="whitespace-nowrap text-[13px] font-medium text-[#8B6F47] hover:underline"
                            >
                                Reset Filters
                            </button>
                        </div>

                        {/* Driver cards */}
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {filteredDrivers.length === 0 ? (
                                <div className="col-span-full rounded-2xl border border-dashed border-[#EBE1D2] bg-white px-6 py-12 text-center">
                                    <p className="text-[14px] font-medium text-[#3A2C20]">
                                        No applications match these filters
                                    </p>
                                    <p className="mt-1 text-[12.5px] text-[#8C7C6B]">
                                        Try a different search term or reset the filters above.
                                    </p>
                                </div>
                            ) : (
                                filteredDrivers.map((driver) => (
                                    <DriverCard
                                        key={driver.id}
                                        driver={driver}
                                        onReview={(id) => navigate(`/admin/approvals/driver/${id}`)}
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
}: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
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
                        {opt}
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