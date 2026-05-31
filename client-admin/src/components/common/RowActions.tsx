type RowActionsProps = {
  onUpdate: () => void;
  onDelete: () => void;
  updating?: boolean;
};

export default function RowActions({ onUpdate, onDelete, updating = false }: RowActionsProps) {
  return (
    <span className="row-actions">
      <button
        type="button"
        className="ghost"
        onClick={onUpdate}
        disabled={updating}
      >
        {updating ? "Updating..." : "Update"}
      </button>
      <button type="button" className="ghost" onClick={onDelete}>
        Delete
      </button>
    </span>
  );
}
