import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Calendar } from "../components/ui/calendar";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";

const appointments = [
  { id: 1, date: new Date(2023, 5, 15), time: "10:00 AM", petName: "Max", ownerName: "John Doe", reason: "Annual checkup" },
  { id: 2, date: new Date(2023, 5, 16), time: "2:00 PM", petName: "Bella", ownerName: "Jane Smith", reason: "Vaccination" },
  { id: 3, date: new Date(2023, 5, 17), time: "11:30 AM", petName: "Charlie", ownerName: "Bob Johnson", reason: "Dental cleaning" },
];

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);

  const filteredAppointments = appointments.filter(
    (appointment) => appointment.date.toDateString() === selectedDate?.toDateString()
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Appointments</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appointments for {selectedDate?.toDateString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {filteredAppointments.length > 0 ? (
                <ul className="space-y-4">
                  {filteredAppointments.map((appointment) => (
                    <li key={appointment.id} className="bg-gray-100 p-3 rounded-md">
                      <p className="font-semibold">{appointment.time} - {appointment.petName}</p>
                      <p className="text-sm text-gray-600">Owner: {appointment.ownerName}</p>
                      <p className="text-sm text-gray-600">Reason: {appointment.reason}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No appointments for this date.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <Dialog open={isAddingAppointment} onOpenChange={setIsAddingAppointment}>
        <DialogTrigger asChild>
          <Button>Add Appointment</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Appointment</DialogTitle>
            <DialogDescription>
              Enter the details for the new appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input id="date" type="date" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input id="time" type="time" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="petName" className="text-right">
                Pet Name
              </Label>
              <Input id="petName" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ownerName" className="text-right">
                Owner Name
              </Label>
              <Input id="ownerName" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Input id="reason" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

