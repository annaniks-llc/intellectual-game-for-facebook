import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../redux/hooks";
import { logout } from "../../redux/slices/authSlice";
import { useAuth } from "../../hooks/useAuth";

export default function ProfileMenu() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { username, role } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const email = username ?? "admin";
  const initial = email.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleChangePassword() {
    setOpen(false);
    navigate("/change-password");
  }

  function handleLogout() {
    setOpen(false);
    dispatch(logout());
    navigate("/login", { replace: true });
  }

  return (
    <div className="profile" ref={containerRef}>
      {open && (
        <div className="profile-popup" role="menu">
          <button type="button" className="profile-popup-item" role="menuitem" onClick={handleChangePassword}>
            Change Password
          </button>
          <button type="button" className="profile-popup-item danger" role="menuitem" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
      <button
        type="button"
        className="profile-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="profile-info">
          <span className="profile-email">{email}</span>
          <span className="profile-role">{role ?? "Admin"}</span>
        </span>
      </button>
    </div>
  );
}
