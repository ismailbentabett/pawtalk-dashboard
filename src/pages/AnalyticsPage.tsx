import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
  getFirestore,
} from "firebase/firestore";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Types
interface Pet {
  id: string;
  type: 'dog' | 'cat' | 'bird' | 'other';
  status: 'available' | 'pending' | 'adopted';
  createdAt: Timestamp;
  lastActivity: Timestamp;
}

interface Match {
  id: string;
  petId: string;
  userId: string;
  status: 'matched';
  createdAt: Timestamp;
  matchedAt: Timestamp;
}

interface AnalyticsData {
  overallData: Array<{
    name: string;
    pets: number;
    matches: number;
    appointments: number;
  }>;
  matchSuccessData: Array<{
    name: string;
    successRate: number;
    totalMatches: number;
  }>;
  petTypeData: Array<{
    name: string;
    value: number;
  }>;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'6months' | '1year'>('6months');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    overallData: [],
    matchSuccessData: [],
    petTypeData: []
  });

  const { toast } = useToast();
  const db = getFirestore();
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // Loading Component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  // Empty State Component
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-gray-600 mb-4">{message}</p>
      <button
        onClick={fetchData}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Retry
      </button>
    </div>
  );

  const processAnalyticsData = (pets: Pet[], matches: Match[]): AnalyticsData => {
    try {
      const monthsToProcess = selectedPeriod === '6months' ? 6 : 12;
      const months = Array.from({ length: monthsToProcess }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          name: date.toLocaleString('default', { month: 'short' }),
          timestamp: date
        };
      }).reverse();

      const overallData = months.map(({ name, timestamp }) => {
        const monthStart = new Date(timestamp);
        monthStart.setDate(1);
        const monthEnd = new Date(timestamp.getFullYear(), timestamp.getMonth() + 1, 0);

        const monthPets = pets.filter(p => {
          const petDate = p.createdAt.toDate();
          return petDate >= monthStart && petDate <= monthEnd;
        });

        const monthMatches = matches.filter(m => {
          const matchDate = m.matchedAt.toDate();
          return matchDate >= monthStart && matchDate <= monthEnd;
        });

        const monthAppointments = pets.filter(p => {
          const activityDate = p.lastActivity.toDate();
          return activityDate >= monthStart && 
                 activityDate <= monthEnd && 
                 p.status === 'pending';
        });

        return {
          name,
          pets: monthPets.length,
          matches: monthMatches.length,
          appointments: monthAppointments.length
        };
      });

      const matchSuccessData = months.map(({ name, timestamp }) => {
        const monthStart = new Date(timestamp);
        monthStart.setDate(1);
        const monthEnd = new Date(timestamp.getFullYear(), timestamp.getMonth() + 1, 0);

        const monthMatches = matches.filter(m => {
          const matchDate = m.matchedAt.toDate();
          return matchDate >= monthStart && matchDate <= monthEnd;
        });

        // All matches are successful in this case
        return {
          name,
          successRate: monthMatches.length > 0 ? 100 : 0,
          totalMatches: monthMatches.length
        };
      });

      const petTypes = ['dog', 'cat', 'bird', 'other'] as const;
      const petTypeData = petTypes.map(type => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: pets.filter(p => p.type === type).length
      }));

      return {
        overallData,
        matchSuccessData,
        petTypeData
      };
    } catch (err) {
      console.error('Error processing analytics data:', err);
      toast({
        title: "Error",
        description: "Failed to process analytics data",
        variant: "destructive"
      });
      return {
        overallData: [],
        matchSuccessData: [],
        petTypeData: []
      };
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (selectedPeriod === '6months' ? 6 : 12));

      // Fetch pets
      const petsRef = collection(db, 'pets');
      const petsQuery = query(
        petsRef,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc'),
        limit(1000)
      );

      // Fetch matches
      const matchesRef = collection(db, 'matches');
      const matchesQuery = query(
        matchesRef,
        where('matchedAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('matchedAt', 'desc'),
        limit(1000)
      );

      const [petsSnapshot, matchesSnapshot] = await Promise.all([
        getDocs(petsQuery),
        getDocs(matchesQuery)
      ]);

      if (petsSnapshot.empty && matchesSnapshot.empty) {
        setAnalyticsData({
          overallData: [],
          matchSuccessData: [],
          petTypeData: []
        });
        return;
      }

      const pets = petsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pet[];

      const matches = matchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Match[];

      const processedData = processAnalyticsData(pets, matches);
      setAnalyticsData(processedData);

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to fetch analytics data');
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasNoData = !analyticsData.overallData.length && 
                    !analyticsData.matchSuccessData.length && 
                    !analyticsData.petTypeData.length;

  if (hasNoData) {
    return <EmptyState message="No data available for the selected period" />;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as '6months' | '1year')}
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      <Tabs defaultValue="overall" className="w-full">
        <TabsList className="mb-4">
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
              {analyticsData.overallData.length === 0 ? (
                <EmptyState message="No performance data available" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.overallData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Count']}
                      contentStyle={{ background: 'white', border: '1px solid #ccc' }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="pets" 
                      fill="#8884d8" 
                      name="New Pets"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="matches" 
                      fill="#82ca9d" 
                      name="Successful Matches"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="appointments" 
                      fill="#ffc658" 
                      name="Appointments"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle>Match Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.matchSuccessData.length === 0 ? (
                <EmptyState message="No match data available" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData.matchSuccessData}>
                    <XAxis dataKey="name" />
                    <YAxis 
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'successRate') return [`${value}%`, 'Success Rate'];
                        return [value, 'Total Matches'];
                      }}
                      contentStyle={{ background: 'white', border: '1px solid #ccc' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="successRate"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Success Rate"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalMatches"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Total Matches"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pets">
          <Card>
            <CardHeader>
              <CardTitle>Pet Demographics</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.petTypeData.length === 0 ? (
                <EmptyState message="No pet demographic data available" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={analyticsData.petTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) => 
                        `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                      }
                    >
                      {analyticsData.petTypeData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, 'Count']}
                      contentStyle={{ background: 'white', border: '1px solid #ccc' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}