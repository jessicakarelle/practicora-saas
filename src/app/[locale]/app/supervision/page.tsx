import { RoleDashboard } from "@/components/organization/role-dashboard";
export default async function SupervisionPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; return <RoleDashboard locale={locale} role="supervisor" />; }
