import React from "react";
import ReactTestRenderer from "react-test-renderer";
import RideCard from "../src/components/RideCard";

test("ride card shows the route", () => {
  let view: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    view = ReactTestRenderer.create(
      <RideCard
        ride={{
          id: 1,
          driver: { id: 2, name: "Rahul", average_rating: null, rating_count: 0 },
          pickup: { id: 1, name: "Sector 16", latitude: 1, longitude: 2 },
          drop: { id: 2, name: "JC Bose University (Campus)", latitude: 3, longitude: 4 },
          ride_date: "2026-09-29",
          ride_time: "08:31",
          seats_total: 3,
          seats_available: 3,
          cost_per_seat: 40,
          women_only: false,
          status: "open",
        }}
        score={86}
      />,
    );
  });
  const tree = JSON.stringify(view!.toJSON());
  expect(tree).toContain("Sector 16");
  expect(tree).toContain("86");
});
