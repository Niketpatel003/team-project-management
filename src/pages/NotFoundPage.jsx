import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="screen-center">
      <div className="empty-card empty-card-centered">
        <p className="eyebrow">404</p>
        <h2>That page is out of range</h2>
        <p>The route you tried does not exist in this frontend yet.</p>
        <Link to="/dashboard" className="button button-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
