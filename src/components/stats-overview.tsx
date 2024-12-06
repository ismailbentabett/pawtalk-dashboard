import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { Bar, BarChart, ResponsiveContainer } from "recharts"

const data = [
  {
    name: "Jan",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Feb",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Mar",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Apr",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "May",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Jun",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Jul",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Aug",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Sep",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Oct",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Nov",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Dec",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
]

export function StatsOverview() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        className="transition-all duration-300 ease-in-out"
        style={{
          transform: hoveredCard === "profiles" ? "scale(1.05)" : "scale(1)",
        }}
        onMouseEnter={() => setHoveredCard("profiles")}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2,345</div>
          <p className="text-xs text-muted-foreground">
            +180 from last month
          </p>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card
        className="transition-all duration-300 ease-in-out"
        style={{
          transform: hoveredCard === "matches" ? "scale(1.05)" : "scale(1)",
        }}
        onMouseEnter={() => setHoveredCard("matches")}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Match Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">89</div>
          <p className="text-xs text-muted-foreground">
            +20% success rate
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm">Review Pending</Button>
          </div>
        </CardContent>
      </Card>
      <Card
        className="transition-all duration-300 ease-in-out"
        style={{
          transform: hoveredCard === "engagement" ? "scale(1.05)" : "scale(1)",
        }}
        onMouseEnter={() => setHoveredCard("engagement")}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">42</div>
          <p className="text-xs text-muted-foreground">
            Active conversations
          </p>
          <div className="mt-4">
            <p className="text-sm">Response rate: 85%</p>
            <p className="text-sm">Avg. chat duration: 15 min</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

