import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";

const overallData = [
  { name: "Jan", pets: 400, matches: 240, appointments: 180 },
  { name: "Feb", pets: 300, matches: 180, appointments: 200 },
  { name: "Mar", pets: 200, matches: 200, appointments: 220 },
  { name: "Apr", pets: 278, matches: 189, appointments: 210 },
  { name: "May", pets: 189, matches: 239, appointments: 250 },
  { name: "Jun", pets: 239, matches: 349, appointments: 280 },
];

const matchSuccessData = [
  { name: "Jan", successRate: 65 },
  { name: "Feb", successRate: 59 },
  { name: "Mar", successRate: 80 },
  { name: "Apr", successRate: 71 },
  { name: "May", successRate: 56 },
  { name: "Jun", successRate: 55 },
];

const petTypeData = [
  { name: "Dogs", value: 400 },
  { name: "Cats", value: 300 },
  { name: "Birds", value: 100 },
  { name: "Others", value: 50 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <Tabs defaultValue="overall">
        <TabsList>
          <TabsTrigger value="overall">Overall Performance</TabsTrigger>
          <TabsTrigger value="matches">Match Success</TabsTrigger>
          <TabsTrigger value="pets">Pet Demographics</TabsTrigger>
        </TabsList>
        <TabsContent value="overall">
          <Card>
            <CardHeader>
              <CardTitle>Overall Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={overallData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pets" fill="#8884d8" />
                  <Bar dataKey="matches" fill="#82ca9d" />
                  <Bar dataKey="appointments" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle>Match Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={matchSuccessData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="successRate" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pets">
          <Card>
            <CardHeader>
              <CardTitle>Pet Demographics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={petTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {petTypeData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

