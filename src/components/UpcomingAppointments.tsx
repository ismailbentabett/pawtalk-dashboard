import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

const appointments = [
  { id: 1, pet: "Buddy", owner: "John Doe", date: "2023-06-15", time: "10:00 AM", type: "Checkup" },
  { id: 2, pet: "Luna", owner: "Jane Smith", date: "2023-06-16", time: "2:30 PM", type: "Vaccination" },
  { id: 3, pet: "Max", owner: "Bob Johnson", date: "2023-06-17", time: "11:00 AM", type: "Grooming" },
  { id: 4, pet: "Bella", owner: "Alice Brown", date: "2023-06-18", time: "3:00 PM", type: "Dental Cleaning" },
  { id: 5, pet: "Charlie", owner: "Eva White", date: "2023-06-19", time: "9:30 AM", type: "Training Session" },
];

export function UpcomingAppointments() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pet</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appointment) => (
          <TableRow key={appointment.id}>
            <TableCell className="font-medium">{appointment.pet}</TableCell>
            <TableCell>{appointment.owner}</TableCell>
            <TableCell>{appointment.date}</TableCell>
            <TableCell>{appointment.time}</TableCell>
            <TableCell>{appointment.type}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

