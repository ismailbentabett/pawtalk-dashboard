import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type Match = {
  id: string;
  name: string;
  species: string;
  breed: string;
};

type PetMatchesProps = {
  matches: Match[];
};

export function PetMatches({ matches }: PetMatchesProps) {
  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div key={match.id} className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
            <AvatarFallback>{match.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{match.name}</p>
            <p className="text-sm text-gray-500">{match.species} • {match.breed}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

