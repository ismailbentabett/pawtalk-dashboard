import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "../../src/components/Header";
import Sidebar from "../../src/components/Sidebar";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <Outlet />
        </main>
        <footer className="bg-white border-t p-4 text-center">
          <Link to="/login">
            <Button variant="link">Logout</Button>
          </Link>
        </footer>
      </div>
    </div>
  );
}
