import SearchForm from "../components/SearchForm";

export default function FindRidePage() {
  return (
    <div className="content">
      <div className="page-header">
        <h1>🔍 Find a Ride</h1>
        <p>Search by pickup, drop, date and time. The next page ranks the best matches for you.</p>
      </div>
      <div className="card">
        <SearchForm />
      </div>
    </div>
  );
}
