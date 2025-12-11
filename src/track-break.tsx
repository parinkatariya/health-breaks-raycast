// @ts-nocheck
import { useState, useEffect } from "react";
import { Form, ActionPanel, Action, Icon, showToast, Toast } from "@raycast/api";
import { saveBreak, BreakRecord } from "./utils/storage";
import { showBreakLogged } from "./utils/notifications";
import { getPreferences } from "./utils/preferences";

interface TrackBreakViewProps {
  onBreakLogged?: () => void;
}

export default function TrackBreakView({ onBreakLogged }: TrackBreakViewProps) {
  const [breakType, setBreakType] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const preferences = getPreferences();

  async function handleSubmit() {
    if (!breakType) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Break Type Required",
        message: "Please select a break type",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const breakRecord: BreakRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: breakType,
        timestamp: Date.now(),
        duration: duration ? parseInt(duration, 10) * 60 : undefined, // Convert minutes to seconds
        notes: notes || undefined,
      };

      await saveBreak(breakRecord);
      await showBreakLogged(breakType);

      // Reset form
      setBreakType("");
      setDuration("");
      setNotes("");

      if (onBreakLogged) {
        onBreakLogged();
      }

      await showToast({
        style: Toast.Style.Success,
        title: "Break Logged!",
        message: "Your health break has been recorded",
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to log break. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            icon={Icon.Checkmark}
            title="Log Break"
            onSubmit={handleSubmit}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="breakType"
        title="Break Type"
        value={breakType}
        onChange={setBreakType}
        storeValue={false}
      >
        {preferences.breakTypes.map((type) => (
          <Form.Dropdown.Item key={type} value={type} title={type} />
        ))}
      </Form.Dropdown>

      <Form.TextField
        id="duration"
        title="Duration (minutes)"
        placeholder="Optional: How long was your break?"
        value={duration}
        onChange={setDuration}
        storeValue={false}
      />

      <Form.TextArea
        id="notes"
        title="Notes"
        placeholder="Optional: Add any notes about this break..."
        value={notes}
        onChange={setNotes}
        storeValue={false}
      />

      <Form.Description
        title=""
        text={`💚 Taking regular breaks helps maintain focus and reduces strain. Keep it up!`}
      />
    </Form>
  );
}
