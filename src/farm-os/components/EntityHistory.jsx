import { EVENT_SCHEMAS } from "../config/eventDefinitions";

import {
  getAvailableEventTypes,
  getEventDisplayLabel,
  formatEventDate,
  getEventSummary,
} from "../lib/eventUtils";

function EntityHistory({
  entity,
  speciesList,
  entityEvents,
  loadingEvents,
  newEvent,
  savingEvent,
  onClose,
  onSubmit,
  onTypeChange,
  onDateChange,
  onPayloadChange,
  onNotesChange,
}) {
  return (
    <div className="farmos-entity-history">
      <div className="farmos-entity-history__header">
        <div>
          <h4>Entity history</h4>

          <p>
            Events recorded for{" "}
            <strong>{entity.entity_name ?? entity.label}</strong>
          </p>
        </div>

        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {/* Add event */}
      <form className="farmos-entity-event-form" onSubmit={onSubmit}>
        <h5>Add event</h5>

        <div className="farmos-form-grid">
          {/* Event type */}
          <div className="farmos-form-field">
            <label htmlFor={`event-type-${entity.id}`}>Event type</label>

            <select
              id={`event-type-${entity.id}`}
              value={newEvent.type}
              onChange={(e) => onTypeChange(e.target.value)}
            >
              {getAvailableEventTypes(entity, speciesList).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Event date */}
          <div className="farmos-form-field">
            <label htmlFor={`event-date-${entity.id}`}>Event date</label>

            <input
              id={`event-date-${entity.id}`}
              type="date"
              value={newEvent.occurredAt}
              onChange={(e) => onDateChange(e.target.value)}
              required
            />
          </div>

          {/* Dynamic event fields */}
          {(EVENT_SCHEMAS[newEvent.type]?.fields ?? []).map((field) => {
            const value = newEvent.payload?.[field.key] ?? "";

            return (
              <div key={field.key} className="farmos-form-field">
                <label htmlFor={`event-${field.key}-${entity.id}`}>
                  {field.label}
                </label>

                <input
                  id={`event-${field.key}-${entity.id}`}
                  type={field.type}
                  min={field.min}
                  step={field.step}
                  placeholder={field.placeholder}
                  value={value}
                  onChange={(e) => {
                    const rawValue = e.target.value;

                    const nextValue =
                      field.type === "number" && rawValue !== ""
                        ? Number(rawValue)
                        : rawValue;

                    onPayloadChange(field.key, nextValue);
                  }}
                />

                {field.unit && (
                  <span className="farmos-form-help">Unit: {field.unit}</span>
                )}
              </div>
            );
          })}

          {/* Notes */}
          <div className="farmos-form-field farmos-form-field--full">
            <label htmlFor={`event-notes-${entity.id}`}>Details / notes</label>

            <textarea
              id={`event-notes-${entity.id}`}
              value={newEvent.notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Describe what happened..."
              rows="3"
            />
          </div>
        </div>

        <button type="submit" disabled={savingEvent}>
          {savingEvent ? "Saving…" : "Save event"}
        </button>
      </form>

      {/* Event history */}
      {loadingEvents ? (
        <p className="farmos-form-help">Loading history…</p>
      ) : entityEvents.length === 0 ? (
        <p className="farmos-form-help">
          No events recorded for this entity yet.
        </p>
      ) : (
        <div className="farmos-entity-history__list">
          {entityEvents.map((event) => (
            <div key={event.id} className="farmos-entity-history__item">
              <div className="farmos-entity-history__item-header">
                <strong>{getEventDisplayLabel(event.type)}</strong>

                <span>{formatEventDate(event.occurred_at)}</span>
              </div>

              <p className="farmos-entity-history__summary">
                {getEventSummary(event)}
              </p>

              {event.payload?.notes && (
                <p className="farmos-entity-history__notes">
                  {event.payload.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EntityHistory;
