import { Link } from "react-router-dom";
import Landing from "./Landing";

export default function Home() {
  return (
    <Landing
      actions={
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/compose" className="btn btn-primary px-4">
            Compose an Email
          </Link>
          <Link to="/models" className="btn btn-outline-secondary px-4">
            Add Products
          </Link>
        </div>
      }
    />
  );
}
