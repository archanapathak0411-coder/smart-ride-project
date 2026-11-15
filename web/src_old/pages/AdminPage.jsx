import { useEffect, useState } from "react";
import { adminBookings, adminCancelRide, adminRides, adminStudents, rejectStudent, verifyStudent } from "../api";

export default function AdminPage() {
  const [students, setStudents] = useState([]);
  const [rides, setRides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [studentData, rideData, bookingData] = await Promise.all([
        adminStudents(),
        adminRides(),
        adminBookings(),
      ]);
      setStudents(studentData.students);
      setRides(rideData.rides);
      setBookings(bookingData.bookings);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(action) {
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Admin</h1>
      <p className="hint">Verify student IDs and keep an eye on rides and bookings.</p>
      {error && <p className="error">{error}</p>}

      <h2>Students</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Student ID</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.student_id}</td>
                <td>{student.verification_status}</td>
                <td>
                  <button className="btn tiny" type="button" onClick={() => run(() => verifyStudent(student.id))}>
                    Verify
                  </button>
                  <button className="btn tiny secondary" type="button" onClick={() => run(() => rejectStudent(student.id))}>
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Rides</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Route</th>
              <th>When</th>
              <th>Seats</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride) => (
              <tr key={ride.id}>
                <td>{ride.driver.name}</td>
                <td>
                  {ride.pickup.name} to {ride.drop.name}
                </td>
                <td>
                  {ride.ride_date} {ride.ride_time}
                </td>
                <td>{ride.seats_available}</td>
                <td>{ride.status}</td>
                <td>
                  {ride.status !== "cancelled" && ride.status !== "completed" && (
                    <button className="btn tiny secondary" type="button" onClick={() => run(() => adminCancelRide(ride.id))}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Bookings</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Passenger</th>
              <th>Driver</th>
              <th>Route</th>
              <th>When</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.passenger_name}</td>
                <td>{booking.driver_name}</td>
                <td>
                  {booking.pickup} to {booking.drop}
                </td>
                <td>
                  {booking.ride_date} {booking.ride_time}
                </td>
                <td>{booking.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
