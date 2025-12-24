export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-[#0b0b0b] border border-[var(--gold)] rounded-xl p-4 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({ title, value, icon }) {
  return (
    <Card className="text-center">
      <div className="text-[var(--gold)] text-3xl mb-2">{icon}</div>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-[var(--gold)] text-3xl font-bold mt-2">{value}</p>
    </Card>
  );
}
