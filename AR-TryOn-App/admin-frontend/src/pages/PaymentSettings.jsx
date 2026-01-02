import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { authService } from '../services';
import { toast } from 'react-toastify';

export default function PaymentSettings() {
  const [user, setUser] = useState(authService.getUser());
  const [form, setForm] = useState({ esewaId: '', khaltiId: '', defaultMethod: 'none' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = authService.getUser();
    setUser(u);
    if (u && u.payment) {
      setForm({
        esewaId: u.payment.esewaId || '',
        khaltiId: u.payment.khaltiId || '',
        defaultMethod: u.payment.defaultMethod || 'none',
      });
    }
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const fn = user?.payment?.defaultMethod === undefined && !user?.payment ? authService.savePayment : authService.updatePayment;
      const res = await fn(form);
      if (res.success) {
        toast.success('Payment preferences saved');
        setUser(res.user);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gold-500/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-28">
        <div className="max-w-3xl mx-auto bg-zinc-900/50 backdrop-blur-md border border-[var(--gold)]/20 rounded-xl p-8">
          <h1 className="text-2xl font-serif text-[var(--gold)] mb-4">Payment Settings</h1>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">eSewa ID</label>
              <input name="esewaId" value={form.esewaId} onChange={handleChange} className="w-full bg-black/60 border border-[var(--gold)]/20 rounded-lg px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Khalti ID</label>
              <input name="khaltiId" value={form.khaltiId} onChange={handleChange} className="w-full bg-black/60 border border-[var(--gold)]/20 rounded-lg px-4 py-3 text-white" />
            </div>

            <div>
              <p className="text-sm text-gray-300 mb-2">Default Payment Method</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="radio" name="defaultMethod" value="esewa" checked={form.defaultMethod==='esewa'} onChange={handleChange} /> eSewa</label>
                <label className="flex items-center gap-2"><input type="radio" name="defaultMethod" value="khalti" checked={form.defaultMethod==='khalti'} onChange={handleChange} /> Khalti</label>
                <label className="flex items-center gap-2"><input type="radio" name="defaultMethod" value="none" checked={form.defaultMethod==='none'} onChange={handleChange} /> None</label>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-[var(--gold)] text-black rounded" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
