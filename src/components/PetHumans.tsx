import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type Human = {
  id: string;
  name: string;
  role: string;
};

type PetHumansProps = {
  humans: Human[];
};

export function PetHumans({ humans }: PetHumansProps) {
  return (
    <div className="space-y-4">
      {humans.map((human) => (
        <div key={human.id} className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
            <AvatarFallback>{human.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{human.name}</p>
            <p className="text-sm text-gray-500">{human.role}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

