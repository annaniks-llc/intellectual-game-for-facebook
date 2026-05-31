import { useNavigate } from "react-router-dom";

type RowActionsProps = {
  updateHref?: string;
  onUpdate?: () => void;
  onDelete: () => void;
  updating?: boolean;
};

export default function RowActions({ updateHref, onUpdate, onDelete, updating = false }: RowActionsProps) {
  const navigate = useNavigate();

  return (
    <span className="row-actions">
      <button
        type="button"
        className="ghost"
        onClick={() => (updateHref ? navigate(updateHref) : onUpdate?.())}
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
