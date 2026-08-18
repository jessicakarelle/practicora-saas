"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { translate as t } from "@/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { FilterPanel } from "@/components/ui/filter-panel";
import { Pagination } from "@/components/ui/pagination";

export type ResourceItem = { id: string; type: string; level: string; title: string; description: string; href: string; minutes?: number };
export function ResourceExplorer({ locale, items }: { locale: string; items: ResourceItem[] }) {
  const [filtersOpen, setFiltersOpen] = useState(false); const [query, setQuery] = useState(""); const [type, setType] = useState("all"); const [level, setLevel] = useState("all"); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(9);
  const types = useMemo(() => Array.from(new Set(items.map((item) => item.type))), [items]); const levels = useMemo(() => Array.from(new Set(items.map((item) => item.level))), [items]);
  const filtered = useMemo(() => { const q=query.trim().toLowerCase(); return items.filter((item)=>(type==="all"||item.type===type)&&(level==="all"||item.level===level)&&(!q||`${item.title} ${item.description}`.toLowerCase().includes(q))); },[items,level,query,type]);
  const pageCount=Math.max(1,Math.ceil(filtered.length/pageSize)); const safePage=Math.min(page,pageCount); const visible=filtered.slice((safePage-1)*pageSize,safePage*pageSize);
  function clear(){setQuery("");setType("all");setLevel("all");setPage(1)}
  return <div className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6 lg:px-8"><FilterPanel title={t(locale,"marketing.resources.filters")} summary={t(locale,"marketing.resources.result_count",{count:filtered.length})} open={filtersOpen} onOpenChange={setFiltersOpen} onClear={clear} clearLabel={t(locale,"marketing.resources.clear")}><div className="grid gap-3 md:grid-cols-3"><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"/><Input className="pl-10" value={query} onChange={(e)=>{setQuery(e.target.value);setPage(1)}} placeholder={t(locale,"marketing.resources.search")}/></div><Select value={type} onValueChange={(v)=>{setType(v);setPage(1)}} options={[{value:"all",label:t(locale,"marketing.resources.all_types")},...types.map((v)=>({value:v,label:v}))]}/><Select value={level} onValueChange={(v)=>{setLevel(v);setPage(1)}} options={[{value:"all",label:t(locale,"marketing.resources.all_levels")},...levels.map((v)=>({value:v,label:v}))]}/></div></FilterPanel><div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((item)=><Card key={item.id} className="h-full transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"><CardContent className="flex h-full flex-col"><div className="flex items-center justify-between text-xs font-bold uppercase tracking-[.1em] text-primary"><span>{item.type}</span><span className="text-muted">{item.level}</span></div><h2 className="mt-4 text-lg font-extrabold">{item.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-muted">{item.description}</p><Link href={item.href} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-strong">{t(locale,"marketing.resources.open")}<ArrowRight className="size-4"/></Link></CardContent></Card>)}</div><div className="mt-6"><Pagination locale={locale} page={safePage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(v)=>{setPageSize(v);setPage(1)}}/></div></div>
}
