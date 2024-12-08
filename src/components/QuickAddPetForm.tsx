import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Stepper,
  StepperContent,
  StepperNavigation,
} from "@/components/ui/stepper";

const petSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.string().min(1, "Pet type is required"),
  breed: z.string().min(1, "Breed is required"),
  age: z.number().min(0, "Age must be positive"),
  gender: z.enum(["male", "female", "other"]),
  description: z.string().optional(),
  status: z.enum(["available", "pending", "adopted"]).default("available"),
  location: z.object({
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
  }),
  adoptionFee: z.number().min(0, "Adoption fee must be positive"),
  healthInfo: z.object({
    vaccinated: z.boolean(),
    neutered: z.boolean(),
    microchipped: z.boolean(),
  }),
  images: z.array(z.string()).default([]),
});

type PetFormData = z.infer<typeof petSchema>;

interface QuickAddPetFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const steps = [
  { title: "Basic Info", description: "Name, type, breed, etc." },
  { title: "Location", description: "Where the pet is located" },
  { title: "Health", description: "Vaccination and health status" },
  { title: "Description", description: "More about the pet" },
  { title: "Adoption", description: "Adoption details" },
];

export function QuickAddPetForm({ onSuccess, onError }: QuickAddPetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: "",
      type: "",
      breed: "",
      age: 0,
      gender: "male",
      description: "",
      status: "available",
      location: {
        city: "",
        state: "",
        country: "",
      },
      adoptionFee: 0,
      healthInfo: {
        vaccinated: false,
        neutered: false,
        microchipped: false,
      },
      images: [],
    },
  });

  const submitPetData = async (data: PetFormData) => {
    setIsSubmitting(true);
    setGlobalError(null);

    try {
      const petRef = collection(db, "pets");
      const newPet = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(petRef, newPet);

      setSuccess(true);
      form.reset();
      onSuccess?.();
      setCurrentStep(0); // Reset to first step after successful submission
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add pet";
      setGlobalError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof PetFormData)[] = [];

    switch (step) {
      case 0:
        fieldsToValidate = ["name", "type", "breed", "age", "gender"];
        break;
      case 1:
        fieldsToValidate = [
          "location.city",
          "location.state",
          "location.country",
        ];
        break;
      case 2:
        fieldsToValidate = [
          "healthInfo.vaccinated",
          "healthInfo.neutered",
          "healthInfo.microchipped",
        ];
        break;
      case 3:
        fieldsToValidate = ["description"];
        break;
      case 4:
        fieldsToValidate = ["adoptionFee", "status"];
        break;
    }

    return await form.trigger(fieldsToValidate as any);
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      if (currentStep === steps.length - 1) {
        const isFormValid = await form.trigger();
        if (isFormValid) {
          const formData = form.getValues();
          await submitPetData(formData);
        }
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Prevent default form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Stepper steps={steps} currentStep={currentStep} />

        <StepperContent step={0} currentStep={currentStep}>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Pet's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="bird">Bird</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Breed</FormLabel>
                  <FormControl>
                    <Input placeholder="Pet's breed" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Pet's age"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </StepperContent>

        <StepperContent step={1} currentStep={currentStep}>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="location.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </StepperContent>

        <StepperContent step={2} currentStep={currentStep}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="healthInfo.vaccinated"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Vaccinated</FormLabel>
                    <FormDescription>Is the pet vaccinated?</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="healthInfo.neutered"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Neutered</FormLabel>
                    <FormDescription>
                      Is the pet neutered or spayed?
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="healthInfo.microchipped"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Microchipped</FormLabel>
                    <FormDescription>Is the pet microchipped?</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </StepperContent>

        <StepperContent step={3} currentStep={currentStep}>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Pet's description"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </StepperContent>

        <StepperContent step={4} currentStep={currentStep}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="adoptionFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adoption Fee ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Adoption fee"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="adopted">Adopted</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </StepperContent>

        {globalError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Pet added successfully! You can add another pet or close this
              form.
            </AlertDescription>
          </Alert>
        )}

   <StepperNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />

        {currentStep === steps.length - 1 && (
           <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleNext}
              className="ml-2 w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Pet...
                </>
              ) : (
                "Add Pet"
              )}
            </Button>
        )}
      </form>
    </Form>
  );
}

export default QuickAddPetForm;
