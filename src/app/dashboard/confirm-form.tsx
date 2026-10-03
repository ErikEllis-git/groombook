"use client";

import { useActionState } from "react";
import { confirmAction, type ConfirmState } from "./actions";

type Props = {
  requestId: string;
  defaultDate: string;
  defaultTime: string;
  minDate: string;
  buttonClassName: string;
};

/** Pick an exact slot and confirm; shows why if the server refuses. */
export function ConfirmForm({
  requestId,
  defaultDate,
  defaultTime,
  minDate,
  buttonClassName,
}: Props) {
  const [state, formAction, pending] = useActionState<ConfirmState, FormData>(
    confirmAction.bind(null, requestId),
    undefined,
  );

  return (
    <form action={formAction}>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="block text-stone-600">Date</span>
          <input
            type="date"
            name="confirmedDate"
            required
            min={minDate}
            defaultValue={defaultDate}
            className="mt-1 rounded-lg border border-stone-300 px-2 py-1.5"
          />
        </label>
        <label className="text-sm">
          <span className="block text-stone-600">Time</span>
          <input
            type="time"
            name="confirmedTime"
            required
            step={900}
            defaultValue={defaultTime}
            className="mt-1 rounded-lg border border-stone-300 px-2 py-1.5"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className={`${buttonClassName} disabled:cursor-wait disabled:opacity-60`}
        >
          {pending ? "Confirming…" : "Confirm booking"}
        </button>
      </div>
      <p role="alert" className="mt-1 text-sm text-red-700">
        {state?.error}
      </p>
    </form>
  );
}
