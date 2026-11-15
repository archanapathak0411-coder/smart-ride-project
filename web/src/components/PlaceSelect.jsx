export default function PlaceSelect({ label, places = [], value, onChange, required = true }) {
  const selectElement = (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        border: "1.5px solid var(--line)",
        fontSize: "0.93rem",
        background: "white",
        width: "100%",
      }}
    >
      <option value="">Choose a location…</option>
      {places.map((place) => (
        <option key={place.id} value={place.id}>
          {place.name}
        </option>
      ))}
    </select>
  );

  if (label) {
    return (
      <label className="field">
        <span>{label}</span>
        {selectElement}
      </label>
    );
  }

  return selectElement;
}
