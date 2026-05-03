export default function StatCard({ label, value, detail, tone = "default" }) {
  return (
    <article className={`stat-card stat-card-${tone}`}>
      <p className="stat-label">{label}</p>
      <h3 className="stat-value">{value}</h3>
      <p className="stat-detail">{detail}</p>
    </article>
  );
}
