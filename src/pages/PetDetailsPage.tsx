import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { PetChatInterface } from "../components/PetChatInterface";
import { PetHumans } from "../components/PetHumans";
import { PetMatches } from "../components/PetMatches";

// This would typically come from an API or database
const getPetDetails = (id: string) => {
  const pets = [
    {
      id: "1",
      name: "Buddy",
      species: "Dog",
      breed: "Golden Retriever",
      age: 3,
      owner: "John Doe",
      status: "Active",
      matchRate: "85%",
      lastActivity: "2023-04-01",
      matches: [
        { id: "2", name: "Max", species: "Dog", breed: "Labrador" },
        { id: "3", name: "Luna", species: "Dog", breed: "Poodle" }
      ],
      humans: [
        { id: "1", name: "John Doe", role: "Owner" },
        { id: "2", name: "Jane Smith", role: "Caretaker" }
      ],
    },
    {
      id: "2",
      name: "Whiskers",
      species: "Cat",
      breed: "Siamese",
      age: 2,
      owner: "Jane Smith",
      status: "Inactive",
      matchRate: "70%",
      lastActivity: "2023-03-28",
      matches: [
        { id: "4", name: "Mittens", species: "Cat", breed: "Persian" }
      ],
      humans: [
        { id: "2", name: "Jane Smith", role: "Owner" },
        { id: "3", name: "Bob Johnson", role: "Vet" }
      ],
    },
  ];
  return pets.find(pet => pet.id === id);
};

export default function PetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [pet, setPet] = useState<any>(null);

  useEffect(() => {
    if (id) {
      setPet(getPetDetails(id));
    }
  }, [id]);

  if (!pet) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center space-x-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={`/placeholder.svg?height=80&width=80`} alt={pet.name} />
            <AvatarFallback>{pet.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{pet.name}</CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant={pet.status === "Active" ? "default" : "secondary"}>{pet.status}</Badge>
              <span className="text-sm text-muted-foreground">{pet.species} • {pet.breed}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium">Age</dt>
              <dd>{pet.age} years</dd>
            </div>
            <div>
              <dt className="font-medium">Owner</dt>
              <dd>{pet.owner}</dd>
            </div>
            <div>
              <dt className="font-medium">Match Rate</dt>
              <dd>{pet.matchRate}</dd>
            </div>
            <div>
              <dt className="font-medium">Last Activity</dt>
              <dd>{pet.lastActivity}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="chat">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="humans">Humans</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
        </TabsList>
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <PetChatInterface pet={pet} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="humans">
          <Card>
            <CardHeader>
              <CardTitle>Associated Humans</CardTitle>
            </CardHeader>
            <CardContent>
              <PetHumans humans={pet.humans} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle>Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <PetMatches matches={pet.matches} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

