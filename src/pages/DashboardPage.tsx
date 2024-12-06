import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { GlobalOverviewBar } from "../components/GlobalOverviewBar";
import { RecentActivityFeed } from "../components/RecentActivityFeed";
import { TopMatchesChart } from "../components/TopMatchesChart";
import { PetDistributionChart } from "../components/PetDistributionChart";
import { ChatSummary } from "../components/ChatSummary";
import { UpcomingAppointments } from "../components/UpcomingAppointments";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div>Loading overview...</div>}>
        <GlobalOverviewBar />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Analytics Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="matches">
              <TabsList>
                <TabsTrigger value="matches">Top Matches</TabsTrigger>
                <TabsTrigger value="distribution">Pet Distribution</TabsTrigger>
              </TabsList>
              <TabsContent value="matches">
                <TopMatchesChart />
              </TabsContent>
              <TabsContent value="distribution">
                <PetDistributionChart />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityFeed />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ChatSummary />
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingAppointments />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

