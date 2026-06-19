import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    CircleDashed,
    FileText,
    Download,
    MessageSquareText,
    Store as StoreIcon,
    Mail,
    Phone,
    MapPin,
    Building2,
    ShieldCheck,
} from "lucide-react";
import Sidebar from "../../../../components/admin/sidebar";
import TopBar from "../../../../components/admin/topbar";
import {
    APPLICATIONS,
    STATUS_BADGE,
    DOC_CHIP,
    type ChecklistDoc,
    type DocStatus,
} from "./data";

/**
 * QuickKart Admin — Store Application Review
 * Route: /admin/approvals/store/:id
 *
 * Opened from the "Review Application" / "Resolve Issues" / "Review
 * Feedback" button on the Store Applications list. Lets an admin:
 *   - see full applicant + business details
 *   - open/download each submitted document and mark it
 *     verified / flagged
 *   - leave a review note (kept in the application's audit trail)
 *   - Approve, Reject (reason required), or Request More Info
 *
 * Same color tokens as the rest of the admin panel.
 */

type Decision = "approve" | "reject" | "more-info" | null;

export default function StoreApplicationReview() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const application = useMemo(() => APPLICATIONS.find((a) => a.id === id), [id]);

    const [checklist, setChecklist] = useState<ChecklistDoc[]>(application?.checklist ?? []);
    const [note, setNote] = useState("");
    const [decision, setDecision] = useState<Decision>(null);
    const [decisionReason, setDecisionReason] = useState("");
    const [submitted, setSubmitted] = useState<Decision>(null);

    if (!application) {
        return (
            <div className="flex h-screen w-full bg-[#FBF6EE]">
                <Sidebar />
                <div className="flex h-screen flex-1 flex-col overflow-hidden">
                    <TopBar pageTitle="Store Applications" showSearch={false} />
                    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-7 py-6">
                        <p className="text-[15px] font-semibold text-[#3A2C20]">Application not found</p>
                        <p className="text-[13px] text-[#8C7C6B]">
                            It may have been removed, or the link is out of date.
                        </p>
                        <button
                            onClick={() => navigate("/admin/approvals")}
                            className="mt-2 rounded-xl bg-[#3A2C20] px-4 py-2.5 text-[13px] font-medium text-[#F4EDE2] hover:bg-[#2E231C]"
                        >
                            Back to Applications
                        </button>
                    </main>
                </div>
            </div>
        );
    }

    const badge = STATUS_BADGE[application.status];

    const toggleDocStatus = (docId: string, status: DocStatus) => {
        setChecklist((prev) => prev.map((d) => (d.id === docId ? { ...d, status } : d)));
    };

    const allVerified = checklist.length > 0 && checklist.every((d) => d.status === "verified");
    const hasIssues = checklist.some((d) => d.status === "issue");

    const requiresReason = decision === "reject" || decision === "more-info";
    const canSubmit = decision !== null && (!requiresReason || decisionReason.trim().length > 0);

    const handleSubmit = () => {
        if (!canSubmit) return;
        setSubmitted(decision);
    };

    return (
        <div className="flex h-screen w-full bg-[#FBF6EE]">
            <Sidebar />

            <div className="flex h-screen flex-1 flex-col overflow-hidden">
                <TopBar pageTitle="Review Application" showSearch={false} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-7 py-6">
                    <div className="flex flex-col gap-6">
                        {/* Back link */}
                        <button
                            onClick={() => navigate("/admin/approvals")}
                            className="flex w-fit items-center gap-2 text-[13px] font-medium text-[#8C7C6B] transition-colors hover:text-[#3A2C20]"
                        >
                            <ArrowLeft size={15} />
                            Back to Store Applications
                        </button>

                        {submitted && (
                            <DecisionBanner decision={submitted} storeName={application.name} />
                        )}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
                            {/* Left column: main content */}
                            <div className="flex flex-col gap-6">
                                {/* Header card */}
                                <div className="flex flex-col gap-5 rounded-2xl border border-[#EBE1D2] bg-white p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <StoreLogo app={application} />
                                            <div>
                                                <p className="text-[18px] font-semibold text-[#3A2C20]">
                                                    {application.name}
                                                </p>
                                                <p className="text-[13px] text-[#8C7C6B]">
                                                    Owner — {application.owner}
                                                </p>
                                                <p className="mt-1 text-[12px] text-[#A2937F]">
                                                    {application.dateLabel}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] font-medium ${badge.className}`}
                                        >
                                            {badge.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 border-t border-[#EBE1D2] pt-4 sm:grid-cols-2">
                                        <InfoRow icon={Mail} label="Email" value={application.contactEmail} />
                                        <InfoRow icon={Phone} label="Phone" value={application.contactPhone} />
                                        <InfoRow icon={MapPin} label="Address" value={application.fullAddress} />
                                        <InfoRow icon={ShieldCheck} label="Pincode" value={application.pincode} />
                                        <InfoRow icon={Building2} label="Store Type" value={application.type} />
                                    </div>

                                    <div className="flex items-stretch divide-x divide-[#EBE1D2] rounded-xl bg-[#FBF6EE] px-2 py-3">
                                        <div className="flex-1 px-3 text-center">
                                            <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#A2937F]">
                                                Products
                                            </p>
                                            <p className="mt-1 text-[14px] font-semibold text-[#3A2C20]">
                                                {application.products}
                                            </p>
                                        </div>
                                        <div className="flex-1 px-3 text-center">
                                            <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#A2937F]">
                                                Delivery Radius
                                            </p>
                                            <p className="mt-1 text-[14px] font-semibold text-[#3A2C20]">
                                                {application.radius}
                                            </p>
                                        </div>
                                        <div className="flex-1 px-3 text-center">
                                            <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#A2937F]">
                                                Submitted
                                            </p>
                                            <p className="mt-1 text-[14px] font-semibold text-[#3A2C20]">
                                                {application.submittedOn}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div className="flex flex-col gap-4 rounded-2xl border border-[#EBE1D2] bg-white p-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[15px] font-semibold text-[#3A2C20]">
                                            Submitted Documents
                                        </p>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${
                                                allVerified
                                                    ? "bg-[#EAF6EF] text-[#2E7D52]"
                                                    : hasIssues
                                                    ? "bg-[#FBEAEA] text-[#D94F4F]"
                                                    : "bg-[#F7EFE2] text-[#8B6F47]"
                                            }`}
                                        >
                                            {allVerified
                                                ? "All Verified"
                                                : hasIssues
                                                ? "Issues Found"
                                                : "Pending Review"}
                                        </span>
                                    </div>

                                    {checklist.length === 0 ? (
                                        <p className="text-[13px] text-[#8C7C6B]">
                                            No documents were attached to this application.
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {checklist.map((doc) => (
                                                <DocumentRow
                                                    key={doc.id}
                                                    doc={doc}
                                                    onVerify={() => toggleDocStatus(doc.id, "verified")}
                                                    onFlag={() => toggleDocStatus(doc.id, "issue")}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Review notes / audit trail */}
                                <div className="flex flex-col gap-4 rounded-2xl border border-[#EBE1D2] bg-white p-6">
                                    <p className="text-[15px] font-semibold text-[#3A2C20]">Review Notes</p>

                                    {application.reviewNotes && application.reviewNotes.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {application.reviewNotes.map((n, i) => (
                                                <div
                                                    key={i}
                                                    className="flex gap-3 rounded-xl bg-[#FBF6EE] px-4 py-3"
                                                >
                                                    <MessageSquareText
                                                        size={15}
                                                        className="mt-0.5 shrink-0 text-[#8B6F47]"
                                                    />
                                                    <div>
                                                        <p className="text-[12.5px] text-[#3A2C20]">{n.note}</p>
                                                        <p className="mt-1 text-[11.5px] text-[#A2937F]">
                                                            {n.author} · {n.date}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[13px] text-[#8C7C6B]">No notes yet.</p>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="Add an internal note about this review..."
                                            rows={3}
                                            className="w-full resize-none rounded-xl border border-[#EBE1D2] bg-[#FBF6EE] px-3.5 py-2.5 text-[13px] text-[#3A2C20] placeholder:text-[#A2937F] focus:outline-none"
                                        />
                                        <button
                                            disabled={note.trim().length === 0}
                                            onClick={() => setNote("")}
                                            className="self-end rounded-xl bg-[#3A2C20] px-4 py-2 text-[12.5px] font-medium text-[#F4EDE2] transition-colors hover:bg-[#2E231C] disabled:cursor-not-allowed disabled:bg-[#F0E6D6] disabled:text-[#A2937F]"
                                        >
                                            Add Note
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right column: decision panel */}
                            <div className="flex flex-col gap-4">
                                <div className="sticky top-0 flex flex-col gap-4 rounded-2xl border border-[#EBE1D2] bg-white p-6">
                                    <p className="text-[15px] font-semibold text-[#3A2C20]">Decision</p>
                                    <p className="text-[12.5px] text-[#8C7C6B]">
                                        Choose how to respond to this application.
                                    </p>

                                    <div className="flex flex-col gap-2">
                                        <DecisionOption
                                            label="Approve Application"
                                            description="Store goes live immediately."
                                            icon={CheckCircle2}
                                            active={decision === "approve"}
                                            activeClass="border-[#2E7D52] bg-[#EAF6EF] text-[#2E7D52]"
                                            onClick={() => setDecision("approve")}
                                        />
                                        <DecisionOption
                                            label="Request More Info"
                                            description="Notify the owner to resubmit documents."
                                            icon={MessageSquareText}
                                            active={decision === "more-info"}
                                            activeClass="border-[#8B6F47] bg-[#F7EFE2] text-[#8B6F47]"
                                            onClick={() => setDecision("more-info")}
                                        />
                                        <DecisionOption
                                            label="Reject Application"
                                            description="Store will not be onboarded."
                                            icon={XCircle}
                                            active={decision === "reject"}
                                            activeClass="border-[#D94F4F] bg-[#FBEAEA] text-[#D94F4F]"
                                            onClick={() => setDecision("reject")}
                                        />
                                    </div>

                                    {requiresReason && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[12px] font-medium text-[#3A2C20]">
                                                {decision === "reject"
                                                    ? "Reason for rejection (required)"
                                                    : "What's missing? (required)"}
                                            </label>
                                            <textarea
                                                value={decisionReason}
                                                onChange={(e) => setDecisionReason(e.target.value)}
                                                rows={3}
                                                placeholder={
                                                    decision === "reject"
                                                        ? "e.g. Duplicate license number on file"
                                                        : "e.g. Please re-upload a valid address proof"
                                                }
                                                className="w-full resize-none rounded-xl border border-[#EBE1D2] bg-[#FBF6EE] px-3.5 py-2.5 text-[13px] text-[#3A2C20] placeholder:text-[#A2937F] focus:outline-none"
                                            />
                                        </div>
                                    )}

                                    <button
                                        disabled={!canSubmit}
                                        onClick={handleSubmit}
                                        className="rounded-xl bg-[#3A2C20] px-4 py-2.5 text-[13px] font-medium text-[#F4EDE2] transition-colors hover:bg-[#2E231C] disabled:cursor-not-allowed disabled:bg-[#F0E6D6] disabled:text-[#A2937F]"
                                    >
                                        {decision === "approve"
                                            ? "Confirm Approval"
                                            : decision === "reject"
                                            ? "Confirm Rejection"
                                            : decision === "more-info"
                                            ? "Send Request"
                                            : "Select a decision"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Mail;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-2.5">
            <Icon size={15} className="mt-0.5 shrink-0 text-[#8C7C6B]" />
            <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#A2937F]">{label}</p>
                <p className="text-[13px] text-[#3A2C20]">{value}</p>
            </div>
        </div>
    );
}

function StoreLogo({ app }: { app: { logoInitial?: string; logoColor?: string } }) {
    if (!app.logoInitial) {
        return (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#EFE7DC] text-[#A2937F]">
                <StoreIcon size={22} />
            </div>
        );
    }
    return (
        <div
            className="flex h-14 w-14 items-center justify-center rounded-xl text-[17px] font-semibold text-white"
            style={{ backgroundColor: app.logoColor ?? "#8B6F47" }}
        >
            {app.logoInitial}
        </div>
    );
}

function DocumentRow({
    doc,
    onVerify,
    onFlag,
}: {
    doc: ChecklistDoc;
    onVerify: () => void;
    onFlag: () => void;
}) {
    const hasFile = !!doc.fileName;
    return (
        <div className="flex flex-col gap-2 rounded-xl border border-[#EBE1D2] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FBF6EE] text-[#8C7C6B]">
                        <FileText size={16} />
                    </span>
                    <div>
                        <p className="text-[13.5px] font-medium text-[#3A2C20]">{doc.label}</p>
                        <p className="text-[12px] text-[#A2937F]">
                            {hasFile ? doc.fileName : "Not uploaded"}
                        </p>
                    </div>
                </div>
                <span
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${DOC_CHIP[doc.status]}`}
                >
                    {doc.status === "verified" ? (
                        <CheckCircle2 size={12} />
                    ) : doc.status === "issue" ? (
                        <XCircle size={12} />
                    ) : (
                        <CircleDashed size={12} />
                    )}
                    {doc.status === "verified" ? "Verified" : doc.status === "issue" ? "Flagged" : "Missing"}
                </span>
            </div>

            {doc.note && (
                <p className="rounded-lg bg-[#FBEAEA] px-3 py-2 text-[12px] text-[#C0392B]">{doc.note}</p>
            )}

            {hasFile && (
                <div className="flex items-center gap-2 pt-1">
                    <button className="flex items-center gap-1.5 rounded-lg border border-[#EBE1D2] px-3 py-1.5 text-[12px] font-medium text-[#3A2C20] transition-colors hover:bg-[#F5EEE2]">
                        <Download size={13} />
                        Download
                    </button>
                    <button
                        onClick={onVerify}
                        className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#2E7D52] transition-colors hover:bg-[#EAF6EF]"
                    >
                        Mark Verified
                    </button>
                    <button
                        onClick={onFlag}
                        className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#D94F4F] transition-colors hover:bg-[#FBEAEA]"
                    >
                        Flag Issue
                    </button>
                </div>
            )}
        </div>
    );
}

function DecisionOption({
    label,
    description,
    icon: Icon,
    active,
    activeClass,
    onClick,
}: {
    label: string;
    description: string;
    icon: typeof CheckCircle2;
    active: boolean;
    activeClass: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                active ? activeClass : "border-[#EBE1D2] text-[#3A2C20] hover:bg-[#F5EEE2]"
            }`}
        >
            <Icon size={17} className="mt-0.5 shrink-0" />
            <div>
                <p className="text-[13px] font-medium">{label}</p>
                <p className={`text-[11.5px] ${active ? "opacity-80" : "text-[#8C7C6B]"}`}>{description}</p>
            </div>
        </button>
    );
}

function DecisionBanner({ decision, storeName }: { decision: Decision; storeName: string }) {
    if (decision === "approve") {
        return (
            <Banner
                color="success"
                title={`${storeName} has been approved`}
                body="The store can now go live on the platform."
            />
        );
    }
    if (decision === "reject") {
        return (
            <Banner
                color="danger"
                title={`${storeName} has been rejected`}
                body="The owner will be notified with your reason."
            />
        );
    }
    return (
        <Banner
            color="warning"
            title={`Requested more info from ${storeName}`}
            body="The owner will be notified to resubmit the flagged details."
        />
    );
}

function Banner({
    color,
    title,
    body,
}: {
    color: "success" | "danger" | "warning";
    title: string;
    body: string;
}) {
    const styles = {
        success: "bg-[#EAF6EF] text-[#2E7D52]",
        danger: "bg-[#FBEAEA] text-[#D94F4F]",
        warning: "bg-[#F7EFE2] text-[#8B6F47]",
    }[color];
    const Icon = color === "success" ? CheckCircle2 : color === "danger" ? XCircle : MessageSquareText;

    return (
        <div className={`flex items-start gap-3 rounded-2xl px-5 py-4 ${styles}`}>
            <Icon size={18} className="mt-0.5 shrink-0" />
            <div>
                <p className="text-[13.5px] font-semibold">{title}</p>
                <p className="text-[12.5px] opacity-90">{body}</p>
            </div>
        </div>
    );
}