import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata = {
  title: "Admin · Marco Polo Experience",
  description: "Curación enable/disable sobre catálogo Edvisor",
};

export default function AdminPage() {
  return (
    <main className="mpe-grain min-h-screen bg-sand px-4 py-10 text-ink sm:px-6">
      <AdminPanel />
    </main>
  );
}
