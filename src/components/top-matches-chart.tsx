import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { name: "Buddy & Max", matches: 95 },
  { name: "Luna & Charlie", matches: 88 },
  { name: "Bella & Rocky", matches: 82 },
  { name: "Daisy & Cooper", matches: 79 },
  { name: "Milo & Lola", matches: 75 },
]

export function TopMatchesChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="matches" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}

