import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getFirestore,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface MatchData {
  id: string;
  petId: string;
  userId: string;
  status: 'matched';
  createdAt: Timestamp;
  matchedAt: Timestamp;
}

interface WeeklyData {
  name: string;
  matches: number;
  date: Date;
}

export function MatchAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const { toast } = useToast();
  const db = getFirestore();

  // Loading Component
  const LoadingState = () => (
    <Card className="h-[400px]">
      <CardContent className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading...</p>
      </CardContent>
    </Card>
  );

  // Error Component
  const ErrorState = ({ message }: { message: string }) => (
    <Card className="h-[400px]">
      <CardContent className="flex flex-col items-center justify-center h-full">
        <p className="text-red-600 mb-4">{message}</p>
        <button
          onClick={fetchMatchData}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </CardContent>
    </Card>
  );

  // Empty State Component
  const EmptyState = () => (
    <Card className="h-[400px]">
      <CardContent className="flex items-center justify-center h-full">
        <p className="text-gray-500">No matches found for this week</p>
      </CardContent>
    </Card>
  );

  const processMatchData = (matches: MatchData[]): WeeklyData[] => {
    // Get the start of the current week (Sunday)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Create array for all days of the week
    const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return {
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        matches: 0,
        date: new Date(date)
      };
    });

    // Count matches for each day
    matches.forEach(match => {
      const matchDate = match.matchedAt.toDate();
      const dayIndex = matchDate.getDay();
      if (matchDate >= startOfWeek && matchDate <= today) {
        daysOfWeek[dayIndex].matches++;
      }
    });

    return daysOfWeek;
  };

  const fetchMatchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get start of current week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Query matches for the current week
      const matchesRef = collection(db, 'matches');
      const matchesQuery = query(
        matchesRef,
        where('matchedAt', '>=', Timestamp.fromDate(startOfWeek)),
        orderBy('matchedAt', 'desc')
      );

      const querySnapshot = await getDocs(matchesQuery);
      
      const matches = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MatchData[];

      const processedData = processMatchData(matches);
      setWeeklyData(processedData);

    } catch (err) {
      console.error('Error fetching match data:', err);
      setError('Failed to fetch match data');
      toast({
        title: "Error",
        description: "Failed to fetch match data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchData();

    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(fetchMatchData, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!weeklyData.length) {
    return <EmptyState />;
  }

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Match Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <XAxis 
              dataKey="name"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => Math.floor(value)}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
              contentStyle={{
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px'
              }}
              formatter={(value: number) => [`${value} matches`, 'Matches']}
            />
            <Bar 
              dataKey="matches" 
              fill="#8884d8"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}