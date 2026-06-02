import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { getAdminMe, updateAdminMe } from "../../api/authApi";
import { useAppDispatch } from "../../redux/hooks";
import { sessionValidated } from "../../redux/slices/authSlice";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";

type ProfileForm = {
  email: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
};

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { username, role } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    email: username ?? "",
    firstName: "",
    lastName: "",
    photoUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function fileToCompressedDataUrl(file: File): Promise<string> {
    const imageBitmap = await createImageBitmap(file);
    const maxSide = 512;
    const scale = Math.min(1, maxSide / Math.max(imageBitmap.width, imageBitmap.height));
    const width = Math.max(1, Math.round(imageBitmap.width * scale));
    const height = Math.max(1, Math.round(imageBitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to process image");
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    imageBitmap.close();

    return canvas.toDataURL("image/jpeg", 0.78);
  }

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const { user } = await getAdminMe();
        if (cancelled) return;
        if (!user) {
          setError("Profile not found.");
          return;
        }
        setForm({
          email: user.email ?? "",
          firstName: user.first_name ?? "",
          lastName: user.last_name ?? "",
          photoUrl: user.photo_url ?? "",
        });
      } catch {
        if (!cancelled) setError("Failed to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  function handlePhotoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    void (async () => {
      try {
        const value = await fileToCompressedDataUrl(file);
        if (value.length > 1_500_000) {
          setError("Image is too large. Please choose a smaller photo.");
          return;
        }
        setForm((current) => ({ ...current, photoUrl: value }));
      } catch {
        setError("Failed to process image.");
      }
    })();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();

    if (!firstName || !lastName) {
      setError("First name and last name are required.");
      return;
    }

    setSaving(true);
    try {
      const { user } = await updateAdminMe({
        firstName,
        lastName,
        photoUrl: form.photoUrl.trim(),
      });
      if (!user) {
        setError("Failed to update profile.");
        return;
      }
      setForm({
        email: user.email ?? "",
        firstName: user.first_name ?? "",
        lastName: user.last_name ?? "",
        photoUrl: user.photo_url ?? "",
      });
      dispatch(
        sessionValidated({
          username: user.email,
          role: user.role,
          firstName: user.first_name ?? null,
          lastName: user.last_name ?? null,
          photoUrl: user.photo_url ?? null,
        }),
      );
      setSuccess("Profile updated.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          (error.response?.data as { error?: string; message?: string } | undefined)?.error ||
          (error.response?.data as { error?: string; message?: string } | undefined)?.message ||
          error.message;
        setError(message || "Failed to update profile.");
      } else {
        setError("Failed to update profile.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="panel">
        <h2>Profile</h2>
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Profile</h2>
      <p>Authorized email: {form.email || username || "—"}</p>
      <p>Role: {role ?? "Admin"}</p>
      <form onSubmit={handleSubmit} autoComplete="off">
        <label htmlFor="profile-first-name">First name</label>
        <input
          id="profile-first-name"
          type="text"
          value={form.firstName}
          onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
          disabled={saving}
        />
        <label htmlFor="profile-last-name">Last name</label>
        <input
          id="profile-last-name"
          type="text"
          value={form.lastName}
          onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
          disabled={saving}
        />
        <label htmlFor="profile-photo-url">Photo URL (optional)</label>
        <input
          id="profile-photo-url"
          type="url"
          placeholder="https://example.com/photo.jpg"
          value={form.photoUrl}
          onChange={(event) => setForm((current) => ({ ...current, photoUrl: event.target.value }))}
          disabled={saving}
        />
        <label htmlFor="profile-photo-file">Or upload photo (optional)</label>
        <input
          id="profile-photo-file"
          type="file"
          accept="image/*"
          onChange={handlePhotoFileChange}
          disabled={saving}
        />
        {form.photoUrl ? (
          <div className="profile-photo-preview-wrap">
            <img src={form.photoUrl} alt="Profile preview" className="profile-photo-preview" />
          </div>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}
        {success ? <p className="success-text">{success}</p> : null}
        <div className="h-row">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => setForm((current) => ({ ...current, photoUrl: "" }))}
            disabled={saving}
          >
            Remove photo
          </button>
        </div>
      </form>
    </section>
  );
}
