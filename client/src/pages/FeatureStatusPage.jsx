function FeatureStatusPage({ title, summary, missing }) {
  return (
    <section className="feature-status-page">
      <p className="feature-status-eyebrow">Feature status</p>
      <h2>{title}</h2>
      <p className="feature-status-summary">{summary}</p>
      <div className="feature-status-card">
        <h3>Not connected yet</h3>
        <p>{missing}</p>
      </div>
    </section>
  );
}

export default FeatureStatusPage;
