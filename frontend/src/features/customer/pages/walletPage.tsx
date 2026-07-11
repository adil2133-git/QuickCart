// src/features/customer/pages/walletPage.tsx

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowDownLeft, ArrowUpRight, Settings2, Receipt } from "lucide-react";
import api from "../../../api/axios";

interface WalletTransaction {
    id: string;
    amount: number;
    type: "REFUND_CREDIT" | "ORDER_PAYMENT" | "ADMIN_ADJUSTMENT";
    description?: string;
    orderNumber?: string | null;
    createdAt: string;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

const TX_META: Record<
    WalletTransaction["type"],
    { label: string; icon: typeof ArrowDownLeft; credit: boolean }
> = {
    REFUND_CREDIT: { label: "Refund credited", icon: ArrowDownLeft, credit: true },
    ORDER_PAYMENT: { label: "Order payment", icon: ArrowUpRight, credit: false },
    ADMIN_ADJUSTMENT: { label: "Adjustment", icon: Settings2, credit: true },
};

function TransactionSkeletonRow() {
    return (
        <div className="flex items-center justify-between px-5 py-4 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full" style={{ backgroundColor: "#F5F7F3" }} />
                <div className="space-y-2">
                    <div className="h-3 w-32 rounded" style={{ backgroundColor: "#F5F7F3" }} />
                    <div className="h-2.5 w-20 rounded" style={{ backgroundColor: "#F5F7F3" }} />
                </div>
            </div>
            <div className="h-3 w-14 rounded" style={{ backgroundColor: "#F5F7F3" }} />
        </div>
    );
}

export default function WalletPage() {
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api
            .get("/customer/wallet")
            .then(({ data }) => {
                setBalance(data.balance ?? 0);
                setTransactions(data.transactions ?? []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#F7F8F5", fontFamily: "'Inter', sans-serif" }}>
            <main className="mx-auto px-6 py-10 sm:px-10" style={{ maxWidth: 800 }}>
                <h1 className="mb-6 text-2xl font-semibold" style={{ color: "#16241D" }}>
                    My Wallet
                </h1>

                {/* ── Balance card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative overflow-hidden rounded-2xl p-7 text-white"
                    style={{ backgroundColor: "#145C43" }}
                >
                    <div className="flex items-center gap-2 opacity-85">
                        <Wallet size={16} />
                        <span className="text-xs font-medium tracking-wide">Wallet Balance</span>
                    </div>
                    <div className="mt-3 text-4xl font-bold">
                        {loading ? (
                            <span className="inline-block h-9 w-32 animate-pulse rounded" style={{ backgroundColor: "rgba(255,255,255,0.25)" }} />
                        ) : (
                            <>₹{balance.toFixed(2)}</>
                        )}
                    </div>
                    <p className="mt-2 text-xs opacity-75">
                        Refunds from cancelled orders are credited here and applied automatically at checkout.
                    </p>
                    <Wallet size={140} className="pointer-events-none absolute -right-6 -bottom-8 opacity-10" />
                </motion.div>

                {/* ── Transaction history ── */}
                <section className="mt-8">
                    <div className="mb-3 flex items-center gap-2">
                        <Receipt size={16} color="#145C43" />
                        <h2 className="text-sm font-semibold" style={{ color: "#145C43" }}>
                            Transaction History
                        </h2>
                    </div>

                    <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: "#E3E7E1" }}>
                        {loading ? (
                            <div className="divide-y" style={{ borderColor: "#E3E7E1" }}>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <TransactionSkeletonRow key={i} />
                                ))}
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-14">
                                <Wallet size={30} color="#DCE3DC" />
                                <span className="text-sm" style={{ color: "#9BAAA1" }}>
                                    No transactions yet
                                </span>
                            </div>
                        ) : (
                            <ul className="divide-y" style={{ borderColor: "#E3E7E1" }}>
                                {transactions.map((t) => {
                                    const meta = TX_META[t.type];
                                    const Icon = meta.icon;
                                    return (
                                        <li key={t.id} className="flex items-center justify-between px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                                                    style={{ backgroundColor: meta.credit ? "#E8EFEC" : "#F5E6E0" }}
                                                >
                                                    <Icon size={15} color={meta.credit ? "#145C43" : "#9C4A3A"} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: "#16241D" }}>
                                                        {t.description || meta.label}
                                                    </p>
                                                    <p className="text-xs" style={{ color: "#9BAAA1" }}>
                                                        {formatDate(t.createdAt)}
                                                        {t.orderNumber ? ` · Order #${t.orderNumber}` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className="text-sm font-semibold"
                                                style={{ color: meta.credit ? "#145C43" : "#9C4A3A" }}
                                            >
                                                {meta.credit ? "+" : "-"}₹{t.amount.toFixed(2)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}