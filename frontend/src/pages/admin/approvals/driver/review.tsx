import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    CircleDashed,
    FileText,
    Download,
    Eye,
    X,
    ZoomIn,
    ZoomOut,
    RotateCw,
    MessageSquareText,
    Mail,
    Phone,
    MapPin,
    Bike,
    IdCard,
} from "lucide-react";
import Sidebar from "../../../../components/admin/sidebar";
import TopBar from "../../../../components/admin/topbar";
import {
    DRIVER_APPLICATIONS,
    DRIVER_STATUS_BADGE,
    DOC_CHIP,
    verificationProgress,
    type DriverChecklistDoc,
    type DocStatus,
} from "./data";

/**
 * QuickKart Admin — Driver Application Review
 * Route: /admin/approvals/driver/:id
 *
 * Same pattern as the Store Application Review page: full applicant
 * details, document-by-document verify/flag, review notes, and a
 * decision panel (Approve / Request More Info / Reject).
 */

type Decision = "approve" | "reject" | "more-info" | null;

// Treated as an image if the filename ends in one of these. Everything else
// (pdf, etc.) falls back to the PDF/iframe branch or the "no preview" state.
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

function getFileKind(fileName?: string): "image" | "pdf" | "unknown" {
    if (!fileName) return "unknown";
    const lower = fileName.toLowerCase();
    if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "image";
    if (lower.endsWith(".pdf")) return "pdf";
    return "unknown";
}

export default function DriverApplicationReview() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const driver = useMemo(() => DRIVER_APPLICATIONS.find((d) => d.id === id), [id]);

    const [checklist, setChecklist] = useState<DriverChecklistDoc[]>(driver?.checklist ?? []);
    const [note, setNote] = useState("");
    const [decision, setDecision] = useState<Decision>(null);
    const [decisionReason, setDecisionReason] = useState("");
    const [submitted, setSubmitted] = useState<Decision>(null);
    const [previewDocId, setPreviewDocId] = useState<string | null>(null);

    const previewDoc = checklist.find((d) => d.id === previewDocId) ?? null;

    if (!driver) {
        return (
            <div className="flex h-screen w-full bg-[#FBF6EE]">
                <Sidebar />
                <div className="flex h-screen flex-1 flex-col overflow-hidden">
                    <TopBar pageTitle="Driver Applications" showSearch={false} />
                    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-7 py-6">
                        <p className="text-[15px] font-semibold text-[#3A2C20]">Application not found</p>
                        <p className="text-[13px] text-[#8C7C6B]">
                            It may have been removed, or the link is out of date.
                        </p>
                        <button
                            onClick={() => navigate("/admin/approvals/drivers")}
                            className="mt-2 rounded-xl bg-[#3A2C20] px-4 py-2.5 text-[13px] font-medium text-[#F4EDE2] hover:bg-[#2E231C]"
                        >
                            Back to Driver Applications
                        </button>
                    </main>
                </div>
            </div>
        );
    }

    const badge = DRIVER_STATUS_BADGE[driver.status];
    const progress = verificationProgress(checklist);

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
                <TopBar pageTitle="Review Driver Application" showSearch={false} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-7 py-6">
                    <div className="flex flex-col gap-6">
                        <button
                            onClick={() => navigate("/admin/approvals/drivers")}
                            className="flex w-fit items-center gap-2 text-[13px] font-medium text-[#8C7C6B] transition-colors hover:text-[#3A2C20]"
                        >
                            <ArrowLeft size={15} />
                            Back to Driver Applications
                        </button>

                        {submitted && <DecisionBanner decision={submitted} driverName={driver.name} />}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
                            {/* Left column */}
                            <div className="flex flex-col gap-6">
                                {/* Header card */}
                                <div className="flex flex-col gap-5 rounded-2xl border border-[#EBE1D2] bg-white p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <DriverAvatar name={driver.name} />
                                            <div>
                                                <p className="text-[18px] font-semibold text-[#3A2C20]">
                                                    {driver.name}
                                                </p>
                                                <p className="text-[13px] text-[#8C7C6B]">
                                                    {driver.driverCode} · {driver.city}
                                                </p>
                                                <p className="mt-1 text-[12px] text-[#A2937F]">
                                                    {driver.dateLabel}
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
                                        <InfoRow icon={Mail} label="Email" value={driver.email} />
                                        <InfoRow icon={Phone} label="Phone" value={driver.phone} />
                                        <InfoRow icon={MapPin} label="City" value={driver.city} />
                                        <InfoRow
                                            icon={Bike}
                                            label="Vehicle"
                                            value={`${driver.vehicleType} · ${driver.vehicleModel ?? "—"}`}
                                        />
                                        <InfoRow icon={IdCard} label="Vehicle Number" value={driver.vehicleNumber} />
                                        <InfoRow icon={IdCard} label="License Number" value={driver.licenseNumber} />
                                    </div>

                                    <div className="rounded-xl bg-[#FBF6EE] px-4 py-3.5">
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <p className="text-[11px] font-medium uppercase tracking-wide text-[#A2937F]">
                                                Verification Progress
                                            </p>
                                            <span className="text-[13px] font-semibold text-[#3A2C20]">
                                                {progress.verified}/{progress.total} · {progress.percent}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-[#EBE1D2]">
                                            <div
                                                className={`h-1.5 rounded-full ${
                                                    progress.percent === 100
                                                        ? "bg-[#2E7D52]"
                                                        : progress.percent >= 50
                                                        ? "bg-[#D9A23B]"
                                                        : "bg-[#D94F4F]"
                                                }`}
                                                style={{ width: `${progress.percent}%` }}
                                            />
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
                                                    onPreview={() => setPreviewDocId(doc.id)}
                                                    onVerify={() => toggleDocStatus(doc.id, "verified")}
                                                    onFlag={() => toggleDocStatus(doc.id, "issue")}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Review notes */}
                                <div className="flex flex-col gap-4 rounded-2xl border border-[#EBE1D2] bg-white p-6">
                                    <p className="text-[15px] font-semibold text-[#3A2C20]">Review Notes</p>

                                    {driver.reviewNotes && driver.reviewNotes.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {driver.reviewNotes.map((n, i) => (
                                                <div key={i} className="flex gap-3 rounded-xl bg-[#FBF6EE] px-4 py-3">
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
                                        Choose how to respond to this driver application.
                                    </p>

                                    <div className="flex flex-col gap-2">
                                        <DecisionOption
                                            label="Approve Driver"
                                            description="Driver can start accepting deliveries."
                                            icon={CheckCircle2}
                                            active={decision === "approve"}
                                            activeClass="border-[#2E7D52] bg-[#EAF6EF] text-[#2E7D52]"
                                            onClick={() => setDecision("approve")}
                                        />
                                        <DecisionOption
                                            label="Request More Info"
                                            description="Notify the driver to resubmit documents."
                                            icon={MessageSquareText}
                                            active={decision === "more-info"}
                                            activeClass="border-[#8B6F47] bg-[#F7EFE2] text-[#8B6F47]"
                                            onClick={() => setDecision("more-info")}
                                        />
                                        <DecisionOption
                                            label="Reject Application"
                                            description="Driver will not be onboarded."
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
                                                        ? "e.g. License could not be verified"
                                                        : "e.g. Please re-upload a clear vehicle RC"
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

            {previewDoc && (
                <DocumentPreviewModal
                    doc={previewDoc}
                    onClose={() => setPreviewDocId(null)}
                    onVerify={() => toggleDocStatus(previewDoc.id, "verified")}
                    onFlag={() => toggleDocStatus(previewDoc.id, "issue")}
                />
            )}
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
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

function DriverAvatar({ name }: { name: string }) {
    const initials = name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#EFE7DC] text-[16px] font-semibold text-[#8B6F47]">
            {initials}
        </div>
    );
}

function DocumentRow({
    doc,
    onPreview,
    onVerify,
    onFlag,
}: {
    doc: DriverChecklistDoc;
    onPreview: () => void;
    onVerify: () => void;
    onFlag: () => void;
}) {
    const hasFile = !!doc.fileName;
    return (
        <div className="flex flex-col gap-2 rounded-xl border border-[#EBE1D2] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={hasFile ? onPreview : undefined}
                    disabled={!hasFile}
                    className={`flex flex-1 items-center gap-3 rounded-lg text-left ${
                        hasFile ? "cursor-pointer" : "cursor-default"
                    }`}
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FBF6EE] text-[#8C7C6B]">
                        <FileText size={16} />
                    </span>
                    <div>
                        <p className="text-[13.5px] font-medium text-[#3A2C20] group-hover:underline">
                            {doc.label}
                        </p>
                        <p className="text-[12px] text-[#A2937F]">
                            {hasFile ? doc.fileName : "Not uploaded"}
                        </p>
                    </div>
                </button>
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
                    <button
                        onClick={onPreview}
                        className="flex items-center gap-1.5 rounded-lg border border-[#EBE1D2] px-3 py-1.5 text-[12px] font-medium text-[#3A2C20] transition-colors hover:bg-[#F5EEE2]"
                    >
                        <Eye size={13} />
                        View
                    </button>
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

function DocumentPreviewModal({
    doc,
    onClose,
    onVerify,
    onFlag,
}: {
    doc: DriverChecklistDoc;
    onClose: () => void;
    onVerify: () => void;
    onFlag: () => void;
}) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const kind = getFileKind(doc.fileName);

    // Reset zoom/rotation whenever a different document is opened.
    useEffect(() => {
        setZoom(1);
        setRotation(0);
    }, [doc.id]);

    // Esc to close.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white"
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b border-[#EBE1D2] px-5 py-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FBF6EE] text-[#8C7C6B]">
                            <FileText size={16} />
                        </span>
                        <div className="overflow-hidden">
                            <p className="truncate text-[14px] font-semibold text-[#3A2C20]">{doc.label}</p>
                            <p className="truncate text-[12px] text-[#A2937F]">{doc.fileName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                        <button
                            onClick={onClose}
                            aria-label="Close preview"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8C7C6B] transition-colors hover:bg-[#F5EEE2] hover:text-[#3A2C20]"
                        >
                            <X size={17} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 items-center justify-center overflow-auto bg-[#FBF6EE] p-5">
                    {kind === "image" ? (
                        <img
                            src={doc.fileUrl ?? ""}
                            alt={doc.label}
                            style={{
                                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                transition: "transform 0.15s ease",
                            }}
                            className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-sm"
                        />
                    ) : kind === "pdf" ? (
                        <iframe
                            src={doc.fileUrl ?? ""}
                            title={doc.label}
                            className="h-[60vh] w-full rounded-lg border border-[#EBE1D2] bg-white"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <FileText size={32} className="text-[#A2937F]" />
                            <p className="text-[13px] font-medium text-[#3A2C20]">
                                Preview isn't available for this file
                            </p>
                            <p className="max-w-xs text-[12px] text-[#8C7C6B]">
                                Download the file to view {doc.fileName ?? "it"} on your device.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 border-t border-[#EBE1D2] px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                        {kind === "image" && (
                            <>
                                <button
                                    onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                                    aria-label="Zoom out"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8C7C6B] transition-colors hover:bg-[#F5EEE2] hover:text-[#3A2C20]"
                                >
                                    <ZoomOut size={15} />
                                </button>
                                <span className="w-10 text-center text-[12px] text-[#8C7C6B]">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                                    aria-label="Zoom in"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8C7C6B] transition-colors hover:bg-[#F5EEE2] hover:text-[#3A2C20]"
                                >
                                    <ZoomIn size={15} />
                                </button>
                                <button
                                    onClick={() => setRotation((r) => (r + 90) % 360)}
                                    aria-label="Rotate"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8C7C6B] transition-colors hover:bg-[#F5EEE2] hover:text-[#3A2C20]"
                                >
                                    <RotateCw size={15} />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 rounded-lg border border-[#EBE1D2] px-3 py-1.5 text-[12px] font-medium text-[#3A2C20] transition-colors hover:bg-[#F5EEE2]">
                            <Download size={13} />
                            Download
                        </button>
                        <button
                            onClick={onFlag}
                            className="rounded-lg border border-transparent px-3 py-1.5 text-[12px] font-medium text-[#D94F4F] transition-colors hover:bg-[#FBEAEA]"
                        >
                            Flag Issue
                        </button>
                        <button
                            onClick={onVerify}
                            className="rounded-lg bg-[#2E7D52] px-3.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#256242]"
                        >
                            Mark Verified
                        </button>
                    </div>
                </div>
            </div>
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

function DecisionBanner({ decision, driverName }: { decision: Decision; driverName: string }) {
    if (decision === "approve") {
        return (
            <Banner
                color="success"
                title={`${driverName} has been approved`}
                body="The driver can now start accepting deliveries."
            />
        );
    }
    if (decision === "reject") {
        return (
            <Banner
                color="danger"
                title={`${driverName}'s application has been rejected`}
                body="The driver will be notified with your reason."
            />
        );
    }
    return (
        <Banner
            color="warning"
            title={`Requested more info from ${driverName}`}
            body="The driver will be notified to resubmit the flagged details."
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