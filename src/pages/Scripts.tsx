import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Plus, X } from "lucide-react";
import ScriptCard from "../components/ScriptCard";
import { fetchScripts } from "../lib/scriptsApi";
import type { ScriptItem } from "../types/script";
import { categories } from "../data/categories";
import { useAuth } from "../contexts/AuthContext";
import { toPersianDigits } from "../utils/format";

export default function Scripts() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ScriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") ?? "");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "new";

  useEffect(() => {
    setSearchInput(search);
    setDebouncedSearch(search);
    setPage(1);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch === search) return;
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set("search", debouncedSearch);
    else next.delete("search");
    setSearchParams(next, { replace: true });
    // URL navigation updates the debounced value in the effect above; do not write it back as a new search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [category, sort]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchScripts({ search, category, sort, page, pageSize: 12 })
      .then((response) => {
        if (!mounted) return;
        setItems(response?.items ?? []);
        setTotalPages(response.totalPages);
        setTotal(response.total);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "خطا در بارگذاری");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [search, category, sort, page]);

  function updateFilter(key: "category" | "sort", value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value || (key === "sort" && value === "new")) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="scripts-page">
      <div className="container">
        <div className="scripts-header">
          <div>
            <h1 className="section-title">کتابخانه‌ی کدها</h1>
            <p className="section-subtitle">
              {total > 0 ? toPersianDigits(total) + " نمونه‌کد پیدا شد" : "نمونه‌کدهای Luau را جستجو یا مرور کن"}
            </p>
          </div>
          {user && (
            <Link to="/scripts/new" className="btn btn-primary">
              <Plus size={18} />
              انتشار نمونه‌کد
            </Link>
          )}
        </div>

        <div className="scripts-filters">
          <div className="search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="جستجو بین کدهای Luau..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="جستجوی نمونه‌کد"
            />
            {searchInput && (
              <button type="button" className="search-clear" onClick={() => setSearchInput("")} aria-label="پاک کردن جستجو">
                <X size={16} />
              </button>
            )}
          </div>

          <select className="filter-select" value={category} onChange={(event) => updateFilter("category", event.target.value)} aria-label="فیلتر دسته‌بندی">
            <option value="">همه‌ی دسته‌ها</option>
            {categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          </select>

          <select className="filter-select" value={sort} onChange={(event) => updateFilter("sort", event.target.value)} aria-label="مرتب‌سازی">
            <option value="new">جدیدترین</option>
            <option value="trending">محبوب‌ترین</option>
            <option value="views">پربازدیدترین</option>
          </select>
        </div>

        {error && <div className="form-error" role="alert">{error}</div>}

        {loading ? (
          <div className="page-loading"><div className="loading-spinner" /><p>در حال بارگذاری...</p></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>نمونه‌کدی با این مشخصات پیدا نشد</p>
            {(search || category) && <button type="button" className="btn btn-outline" onClick={() => { setSearchInput(""); setSearchParams({}, { replace: true }); }}>پاک کردن فیلترها</button>}
            {user && <Link to="/scripts/new" className="btn btn-primary">اولین نمونه‌کد را منتشر کن</Link>}
          </div>
        ) : (
          <>
            <div className="scripts-grid">
              {items.map((script) => <ScriptCard key={script.id} script={script} />)}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>قبلی</button>
                <span className="pagination-info">صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}</span>
                <button type="button" className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>بعدی</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
