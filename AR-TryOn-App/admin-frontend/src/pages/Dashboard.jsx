import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  return (
    <>
      <Navbar />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        <Link
          to="/add-jewelry"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          ➕ Add Jewelry
        </Link>
      </div>
    </>
  );
}
