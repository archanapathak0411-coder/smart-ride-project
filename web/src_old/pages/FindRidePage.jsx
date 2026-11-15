import SearchForm from "../components/SearchForm";

export default function FindRidePage() {
  return (
    <div>
      <h1>Find a ride</h1>
      <p className="lead">Search by pickup, drop, date and time. The next page ranks the best matches.</p>
      <SearchForm />
    </div>
  );
}
