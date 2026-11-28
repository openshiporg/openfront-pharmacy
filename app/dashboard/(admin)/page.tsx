import { redirect } from "next/navigation";

// Staff land on the day's work. The raw record lists stay under Advanced / All records for the administrator.
export default function DashboardHome() {
  redirect("/dashboard/platform/overview");
}
