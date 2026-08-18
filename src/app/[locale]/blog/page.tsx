import { translate as t } from "@/i18n";
import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { BlogExplorer } from "@/components/marketing/blog-explorer";
import { blogPosts } from "@/lib/blog";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const {locale}=await params;return{title:t(locale,"marketing.blog.metadata_title"),description:t(locale,"marketing.blog.metadata_description")}}
export default async function BlogPage({params}:{params:Promise<{locale:string}>}){const {locale}=await params;return <MarketingPageShell locale={locale} eyebrow={t(locale,"marketing.blog.resources")} title={t(locale,"marketing.blog.practical_guides_to_document_your_internship_better")} description={t(locale,"marketing.blog.methodology_organization_reports_and_career_useful_content_written_to_be_applied")}><BlogExplorer locale={locale} posts={blogPosts}/></MarketingPageShell>}
