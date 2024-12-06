import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { name: "Mon", matches: 12 },
  { name: "Tue", matches: 18 },
  { name: "Wed", matches: 15 },
  { name: "Thu", matches: 25 },
  { name: "Fri", matches: 30 },
  { name: "Sat", matches: 40 },
  { name: "Sun", matches: 35 },
]

export function MatchAnalytics() {
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Match Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="matches" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

