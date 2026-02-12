"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { BaseCheckbox } from "@/components/atoms/inputs/BaseCheckbox";
import { Button } from "@/components/molecules/buttons/Button";
import { SelectField } from "@/components/molecules/forms/SelectField";
import {
  useCreateNationalHoliday,
  useUpdateNationalHoliday,
  useDeleteNationalHoliday,
} from "@/hooks/mutations/useNationalHolidayMutations";
import { teamRepository } from "@/lib/api/repositories";
import type { NationalHoliday } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Globe, Loader2 } from "lucide-react";

const LOCATION_OPTIONS = [
  { value: "lahore", label: "Lahore (Pakistan)" },
  { value: "dubai", label: "Dubai (UAE)" },
  { value: "uk", label: "United Kingdom" },
  { value: "europe", label: "Europe" },
];

interface FormState {
  name: string;
  date: string;
  location: string;
  recurring: boolean;
}

const INITIAL_FORM: FormState = { name: "", date: "", location: "", recurring: true };

export function NationalHolidaysManagement() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ["team", "national-holidays", "all"],
    queryFn: () => teamRepository.getNationalHolidays(),
  });

  const createHoliday = useCreateNationalHoliday();
  const updateHoliday = useUpdateNationalHoliday();
  const deleteHoliday = useDeleteNationalHoliday();

  const handleSubmit = useCallback(() => {
    if (!form.name || !form.date || !form.location) return;
    const payload = {
      name: form.name,
      date: form.date,
      location: form.location,
      recurring: form.recurring,
    };
    if (editingId) {
      updateHoliday.mutate(
        { id: editingId, data: payload },
        { onSuccess: () => { setForm(INITIAL_FORM); setEditingId(null); } },
      );
    } else {
      createHoliday.mutate(payload, {
        onSuccess: () => setForm(INITIAL_FORM),
      });
    }
  }, [form, editingId, createHoliday, updateHoliday]);

  const handleEdit = useCallback((holiday: NationalHoliday) => {
    setEditingId(holiday.id);
    setForm({
      name: holiday.name,
      date: holiday.date.split("T")[0],
      location: holiday.location,
      recurring: holiday.recurring ?? true,
    });
  }, []);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setForm(INITIAL_FORM);
  }, []);

  const isPending = createHoliday.isPending || updateHoliday.isPending;
  const isValid = form.name && form.date && form.location;

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Manage National Holidays
        </h3>
        <p className="text-sm text-muted-foreground">
          Add, edit, or remove national holidays for each office location
        </p>
      </div>
      <div className="px-6 pb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <BaseLabel>Name</BaseLabel>
            <BaseInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Holiday name"
            />
          </div>
          <div className="space-y-2">
            <BaseLabel>Date</BaseLabel>
            <BaseInput
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <SelectField
            label="Location"
            options={LOCATION_OPTIONS}
            value={form.location}
            onValueChange={(v) => setForm({ ...form, location: v })}
            placeholder="Select"
          />
          <div className="space-y-2">
            <BaseLabel>Recurring</BaseLabel>
            <div className="flex items-center h-10">
              <BaseCheckbox
                checked={form.recurring}
                onCheckedChange={(v) => setForm({ ...form, recurring: v === true })}
              />
              <span className="text-sm ml-2">Yearly</span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isPending}
              className="w-full"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingId ? "Update" : <><Plus className="h-4 w-4 mr-1" />Add</>}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : holidays.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No national holidays configured.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Location</th>
                  <th className="text-left py-3 px-4 font-medium">Recurring</th>
                  <th className="w-[80px] py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {holidays.map((h) => (
                  <tr key={h.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{h.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {format(new Date(h.date), "MMM d, yyyy")}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{h.location}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {h.recurring ? (
                        <Badge variant="secondary">Yearly</Badge>
                      ) : (
                        <span className="text-muted-foreground">One-time</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(h)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => deleteHoliday.mutate(h.id)}
                          disabled={deleteHoliday.isPending}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
