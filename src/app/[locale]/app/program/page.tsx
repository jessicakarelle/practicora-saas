import { RoleDashboard } from "@/components/organization/role-dashboard";
export default async function ProgramPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; return <RoleDashboard locale={locale} role="program" />; }
