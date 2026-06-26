import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ArrowUpDown,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  PackageX,
} from "lucide-react";
import { useProductStore, useSortedProducts, type SortKey, type SortDir } from "../state/productState";
import {
  type Product,
  type AvailabilityStatus,
  type DerivedStatus,
  getDerivedStatus,
  getCategoryName,
  LOW_STOCK_THRESHOLD,
} from "../types/product";

/* -------------------------------------------------------------------------- */
/*  Status badge config                                                       */
/* -------------------------------------------------------------------------- */

const statusConfig: Record<DerivedStatus, { label: string; className: string; pulse?: boolean }> = {
  ACTIVE: { label: "Active", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15" },
  LOW_STOCK: {
    label: "Low stock",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/15",
    pulse: true,
  },
  OUT_OF_STOCK: {
    label: "Out of stock",
    className: "bg-red-50 text-red-700 ring-1 ring-red-600/15",
    pulse: true,
  },
  HIDDEN: { label: "Hidden", className: "bg-[#2B1B0E]/[0.06] text-[#2B1B0E]/50 ring-1 ring-[#2B1B0E]/10" },
};

/* -------------------------------------------------------------------------- */
/*  KPI strip                                                                 */
/* -------------------------------------------------------------------------- */

function KpiCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-[#2B1B0E]/[0.07] bg-white px-4 py-3.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${tint}1A`, color: tint }}
      >
        <Icon size={17} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-[#2B1B0E]/55">{label}</p>
        <span className="text-xl font-bold tabular-nums text-[#2B1B0E]">{value}</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inline-editable stock cell                                                */
/* -------------------------------------------------------------------------- */

function StockCell({
  product,
  onCommit,
}: {
  product: Product;
  onCommit: (newQty: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.stockQuantity));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setValue(String(product.stockQuantity));
  }, [product.stockQuantity]);

  const commit = async () => {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      setValue(String(product.stockQuantity));
      setEditing(false);
      return;
    }
    if (parsed === product.stockQuantity) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onCommit(parsed);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const low = product.stockQuantity <= LOW_STOCK_THRESHOLD && product.stockQuantity > 0;
  const zero = product.stockQuantity === 0;

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={0}
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue(String(product.stockQuantity));
            setEditing(false);
          }
        }}
        className="w-16 rounded-md border border-[#C2825A] bg-white px-1.5 py-1 text-sm font-medium tabular-nums text-[#2B1B0E] focus:outline-none focus:ring-2 focus:ring-[#C2825A]/25"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`group inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium tabular-nums transition-colors hover:bg-[#2B1B0E]/[0.05] ${
        zero ? "text-red-600" : low ? "text-amber-700" : "text-[#2B1B0E]"
      }`}
      title="Click to edit stock"
    >
      {saving ? <Loader2 size={13} className="animate-spin" /> : null}
      {product.stockQuantity}
      <span className="text-[11px] font-normal text-[#2B1B0E]/40">{product.unit}</span>
      <Pencil size={11} className="text-[#2B1B0E]/0 transition-colors group-hover:text-[#2B1B0E]/35" />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Row actions menu                                                          */
/* -------------------------------------------------------------------------- */

function RowMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_WIDTH = 144;

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuHeight = 84;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow < menuHeight ? rect.top - menuHeight - 4 : rect.bottom + 4;
      const left = Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8);
      setCoords({ top, left });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="flex h-7 w-7 items-center justify-center rounded-full text-[#2B1B0E]/45 hover:bg-[#2B1B0E]/[0.06] hover:text-[#2B1B0E]"
      >
        <MoreVertical size={15} />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH }}
              className="z-50 overflow-hidden rounded-xl border border-[#2B1B0E]/[0.08] bg-white py-1 shadow-lg"
            >
              <button
                onClick={() => { setOpen(false); onEdit(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[#2B1B0E] hover:bg-[#FBF1E9]"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                onClick={() => { setOpen(false); onDelete(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={13} /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sortable column header                                                    */
/* -------------------------------------------------------------------------- */

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const isActive = sortKey === activeKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#2B1B0E]/50 hover:text-[#2B1B0E] ${
        align === "right" ? "justify-end" : ""
      }`}
    >
      {label}
      {isActive ? (
        dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      ) : (
        <ArrowUpDown size={11} className="opacity-30" />
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Confirm-delete dialog                                                     */
/* -------------------------------------------------------------------------- */

function ConfirmDeleteDialog({
  productName,
  onCancel,
  onConfirm,
}: {
  productName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-base font-semibold text-[#2B1B0E]">Delete this product?</h3>
        <p className="mt-1.5 text-sm text-[#2B1B0E]/60">
          <strong className="font-medium text-[#2B1B0E]">{productName}</strong> will be removed
          permanently. This can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-full border border-[#2B1B0E]/15 px-4 py-2 text-sm font-medium text-[#2B1B0E] hover:bg-[#FBF1E9]"
          >
            Cancel
          </button>
          <button
            onClick={async () => { setDeleting(true); await onConfirm(); }}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Filter select                                                             */
/* -------------------------------------------------------------------------- */

function SelectFilter({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full border border-[#2B1B0E]/10 bg-[#FBF1E9] py-2 pl-3.5 pr-8 text-sm font-medium text-[#2B1B0E] focus:border-[#C2825A] focus:outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#2B1B0E]/40" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ProductsPage() {
  const navigate = useNavigate();

  const {
    categories,
    total,
    pages,
    page,
    limit,
    statusFilter,
    sortKey,
    sortDir,
    loading,
    error,
    actionError,
    fetchProducts,
    fetchCategories,
    setSearch,
    setCategoryFilter,
    setStatusFilter,
    setPage,
    clearFilters,
    setSort,
    toggleAvailability,
    updateStock,
    deleteProduct,
    setActionError,
  } = useProductStore();

  const categoryFilter = useProductStore((s) => s.categoryFilter);
  const search = useProductStore((s) => s.search);
  const sorted = useSortedProducts();

  const [searchInput, setSearchInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput.trim() !== search) setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const kpis = useMemo(() => {
    const active = sorted.filter((p) => getDerivedStatus(p) === "ACTIVE").length;
    const low = sorted.filter((p) => getDerivedStatus(p) === "LOW_STOCK").length;
    const out = sorted.filter((p) => getDerivedStatus(p) === "OUT_OF_STOCK").length;
    return { active, low, out };
  }, [sorted]);

  const handleStockCommit = async (product: Product, newQty: number) => {
    await updateStock(product, newQty);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget._id);
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
    }
  };

  const hasFilters = Boolean(search || categoryFilter || statusFilter);

  return (
    <>
      <div className="px-8 py-6">
        {/* Page heading + primary action */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#2B1B0E]">Products</h1>
            <p className="text-sm text-[#2B1B0E]/50">
              {total} product{total === 1 ? "" : "s"} in your catalogue
            </p>
          </div>
          <button
            onClick={() => navigate("/store/products/new")}
            className="inline-flex items-center gap-2 rounded-full bg-[#C2825A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <Plus size={16} /> Add product
          </button>
        </div>

        {/* KPI strip */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <KpiCard icon={CheckCircle2} label="Active (this page)" value={kpis.active} tint="#10B981" />
          <KpiCard icon={AlertTriangle} label="Low stock (this page)" value={kpis.low} tint="#D97706" />
          <KpiCard icon={Ban} label="Out of stock (this page)" value={kpis.out} tint="#DC2626" />
        </div>

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#2B1B0E]/[0.07] bg-white p-3.5">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B1B0E]/35" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-full border border-[#2B1B0E]/10 bg-[#FBF1E9] py-2 pl-9 pr-4 text-sm text-[#2B1B0E] placeholder:text-[#2B1B0E]/40 focus:border-[#C2825A] focus:outline-none focus:ring-2 focus:ring-[#C2825A]/15"
            />
          </div>

          <SelectFilter
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="All categories"
            options={categories.map((c) => ({ value: c._id, label: c.categoryName }))}
          />

          <SelectFilter
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as AvailabilityStatus | "")}
            placeholder="All statuses"
            options={[
              { value: "AVAILABLE", label: "Available" },
              { value: "OUT_OF_STOCK", label: "Out of stock" },
              { value: "HIDDEN", label: "Hidden" },
            ]}
          />

          {hasFilters && (
            <button
              onClick={() => { setSearchInput(""); clearFilters(); }}
              className="text-xs font-medium text-[#C2825A] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {actionError && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-600/15">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="text-red-700/60 hover:text-red-700">×</button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#2B1B0E]/[0.07] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2B1B0E]/[0.07] bg-[#FBF1E9]/60">
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Product" sortKey="productName" activeKey={sortKey} dir={sortDir} onSort={setSort} />
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#2B1B0E]/50">
                  Category
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader label="Price" sortKey="price" activeKey={sortKey} dir={sortDir} onSort={setSort} align="right" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Stock" sortKey="stockQuantity" activeKey={sortKey} dir={sortDir} onSort={setSort} />
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#2B1B0E]/50">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#2B1B0E]/50">
                  Available
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-[#2B1B0E]/45">
                    <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
                    Loading products…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-red-600">{error}</td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <PackageX size={28} className="mx-auto mb-2 text-[#2B1B0E]/25" />
                    <p className="text-sm font-medium text-[#2B1B0E]/60">
                      {hasFilters ? "No products match these filters." : "No products yet."}
                    </p>
                    {!hasFilters && (
                      <button
                        onClick={() => navigate("/store/products/new")}
                        className="mt-2 text-sm font-semibold text-[#C2825A] hover:underline"
                      >
                        Add your first product
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                sorted.map((product) => {
                  const status = getDerivedStatus(product);
                  const cfg = statusConfig[status];
                  return (
                    <tr
                      key={product._id}
                      className="border-b border-[#2B1B0E]/[0.05] last:border-0 hover:bg-[#FBF1E9]/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#E7D7C1]">
                            {product.images[0] && (
                              <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[#2B1B0E]">{product.productName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#2B1B0E]/65">{getCategoryName(product.categoryId)}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-[#2B1B0E]">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <StockCell product={product} onCommit={(qty) => handleStockCommit(product, qty)} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${cfg.className} ${
                            cfg.pulse ? "animate-pulse" : ""
                          }`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleAvailability(product)}
                          disabled={product.availabilityStatus === "HIDDEN"}
                          className={`relative inline-block h-5 w-9 rounded-full transition-colors disabled:opacity-30 ${
                            product.availabilityStatus === "AVAILABLE" ? "bg-[#C2825A]" : "bg-[#2B1B0E]/15"
                          }`}
                          title={
                            product.availabilityStatus === "HIDDEN"
                              ? "Unhide from Edit to change availability"
                              : "Toggle availability"
                          }
                        >
                          <motion.span
                            className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                            animate={{ left: product.availabilityStatus === "AVAILABLE" ? 18 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <RowMenu
                          onEdit={() => navigate(`/store/products/${product._id}/edit`)}
                          onDelete={() => setDeleteTarget(product)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && sorted.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-[#2B1B0E]/55">
            <span>
              Showing <strong className="text-[#2B1B0E]">{(page - 1) * limit + 1}</strong>–
              <strong className="text-[#2B1B0E]">{Math.min(page * limit, total)}</strong> of{" "}
              <strong className="text-[#2B1B0E]">{total}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2B1B0E]/10 hover:bg-white disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="px-2 text-xs font-medium">Page {page} of {pages}</span>
              <button
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page >= pages}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2B1B0E]/10 hover:bg-white disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDeleteDialog
            productName={deleteTarget.productName}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </>
  );
}