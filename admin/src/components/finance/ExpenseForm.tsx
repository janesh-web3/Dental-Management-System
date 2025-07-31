import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Expense, ExpenseCategory } from "@/types/finance";

// Define the form schema with Zod
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("Amount must be positive")
  ),
  date: z.string().min(1, "Date is required").transform((dateString) => new Date(dateString)),
  category: z.string({
    required_error: "Category is required",
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  initialData?: Expense;
  isSubmitting: boolean;
}

const expenseCategoryOptions: { value: ExpenseCategory; label: string }[] = [
  { value: "Rent", label: "Rent" },
  { value: "Electricity Bill", label: "Electricity Bill" },
  { value: "Water Bill", label: "Water Bill" },
  { value: "Internet Bill", label: "Internet Bill" },
  { value: "Staff Salary", label: "Staff Salary" },
  { value: "Dental Supplies", label: "Dental Supplies" },
  { value: "Equipment", label: "Equipment" },
  { value: "Marketing", label: "Marketing" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Office Supplies", label: "Office Supplies" },
  { value: "Other", label: "Other" },
];

export function ExpenseForm({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting,
}: ExpenseFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          amount: initialData.amount,
          date: new Date(initialData.date),
          category: initialData.category,
          notes: initialData.notes || "",
        }
      : {
          title: "",
          amount: undefined,
          date: new Date(),
          category: undefined,
          notes: "",
        },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Expense title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  max={format(new Date(), "yyyy-MM-dd")}
                  min="1900-01-01"
                  {...field}
                  value={typeof field.value === "string" ? field.value : format(field.value, "yyyy-MM-dd")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expenseCategoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes here"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : initialData
              ? "Update Expense"
              : "Add Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 