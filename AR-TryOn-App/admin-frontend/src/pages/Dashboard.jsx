import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { authService, jewelleryService, orderService } from "../services";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaPlus, FaBoxOpen, FaShoppingBag } from "react-icons/fa";

export default function Dashboard() {
  const [user, setUser] = useState(authService.getUser());
  const [activeTab, setActiveTab] = useState("overview");
  const [sellerItems, setSellerItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [user?.role]);

  const loadData = async () => {
    try {
      if (user?.role === 'SELLER' || (user?.role && user.role.toLowerCase() === 'admin')) {
        const items = await jewelleryService.getSellerJewellery();
        setSellerItems(items);
        const ordersData = await orderService.getSellerOrders();
        setOrders(ordersData.orders || []);
      } else {
        const ordersData = await orderService.getBuyerOrders();
        setOrders(ordersData.orders || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this jewelry?")) {
      try {
        await jewelleryService.deleteJewellery(id);
        toast.success("Jewelry deleted");
        loadData();
      } catch (err) {
        toast.error("Failed to delete");
      }
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await orderService.updateOrderStatus(id, status);
      toast.success("Order status updated");
      loadData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gold-500/30">
      <Navbar />
      <div className="container mx-auto px-6 pt-32 pb-20">
        <div className="flex justify-between items-center mb-8 border-b border-[var(--gold)]/20 pb-4">
          <h1 className="text-4xl font-serif text-[var(--gold)]">
            {user?.role === 'SELLER' || (user?.role && user.role.toLowerCase() === 'admin') ? 'Seller Dashboard' : 'My Account'}
          </h1>
          {(user?.role === 'SELLER' || (user?.role && user.role.toLowerCase() === 'admin')) && (
            <Link to="/jewelry/add" className="lux-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              <FaPlus /> Add New Jewelry
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div></div>
        ) : (
          <div className="space-y-12">
            {/* SELLER: PRODUCTS */}
            {(user?.role === 'SELLER' || (user?.role && user.role.toLowerCase() === 'admin')) && (
              <section>
                <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-2">
                  <FaBoxOpen className="text-[var(--gold)]" /> Your Collections
                </h2>
                {sellerItems.length === 0 ? (
                  <p className="text-gray-400">You haven't added any jewelry pieces yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sellerItems.map(item => (
                      <div key={item._id} className="bg-zinc-900/50 rounded-xl overflow-hidden border border-[var(--gold)]/10 group">
                        <div className="h-48 overflow-hidden relative">
                          <img src={item.image2D} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Link to={`/jewelry/edit/${item._id}`} className="bg-black/50 text-white p-2 rounded-full hover:bg-[var(--gold)] hover:text-black transition"><FaEdit /></Link>
                            <button onClick={() => handleDelete(item._id)} className="bg-black/50 text-red-400 p-2 rounded-full hover:bg-red-500 hover:text-white transition"><FaTrash /></button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-serif text-lg">{item.name}</h3>
                          <p className="text-sm text-gray-400 mb-2 capitalize">{item.category}</p>
                          <p className="text-[var(--gold)] font-medium">Rs. {item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ORDERS SECTION (Used for both Buyer & Selling Orders) */}
            <section>
              <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-2">
                <FaShoppingBag className="text-[var(--gold)]" />
                {user?.role === 'SELLER' || (user?.role && user.role.toLowerCase() === 'admin') ? 'Customer Orders' : 'My Orders'}
              </h2>
              {orders.length === 0 ? (
                <p className="text-gray-400">No orders found.</p>
              ) : (
                <div className="rounded-xl overflow-hidden border border-[var(--gold)]/10 bg-zinc-900/30">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/80 text-[var(--gold)] border-b border-[var(--gold)]/10">
                        <th className="p-4 font-medium">Order ID</th>
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Payment</th>
                        {(user?.role === 'SELLER' || (user?.role && user.role.toLowerCase() === 'admin')) && <th className="p-4 font-medium">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--gold)]/5">
                      {orders.map(order => (
                        <tr key={order._id} className="hover:bg-zinc-900/50 transition">
                          <td className="p-4 text-sm font-mono text-gray-400">#{order._id.slice(-6)}</td>
                          <td className="p-4 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 text-white font-medium">Rs. {order.totalPrice}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                        ${order.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                                order.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-500/10 text-gray-400'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm capitalize">{order.paymentMethod}</td>
                          {(user?.role === 'SELLER' || (user?.role && user.role.toLowerCase() === 'admin')) && (
                            <td className="p-4">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                className="bg-black border border-white/20 rounded px-2 py-1 text-xs text-white"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
