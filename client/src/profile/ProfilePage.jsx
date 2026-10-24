import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Crown,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Plus,
  Shield,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import {
  createIncomeSource,
  deleteIncomeSource,
  getProfileData,
  saveCurrency,
} from "./profileService";
import "./profile.css";

const EMPTY_PROFILE = {
  name: "",
  phone: "",
  location: "",
  university: "",
  major: "",
};
const EMPTY_SOURCE = { name: "", amount: "", category: "", frequency: "Monthly" };
const ROLE_COLOR = { admin: "#EF4444", premium: "#F4B400", student: "#4F93A0" };
const ROLE_LABEL = { admin: "Admin", premium: "Premium", student: "Student" };
const ICON_BY_ROLE = { admin: Shield, premium: Crown, student: UserRound };

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatMoney(value, currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${Number(value).toFixed(2)}`;
  }
}

function monthlyEquivalent(source) {
  const amount = Number(source.amount);
  switch (source.frequency.trim().toLowerCase()) {
    case "monthly":
      return amount;
    case "weekly":
      return (amount * 52) / 12;
    case "biweekly":
      return (amount * 26) / 12;
    case "yearly":
    case "annually":
      return amount / 12;
    case "daily":
      return (amount * 365) / 12;
    default:
      return 0;
  }
}

function profileDraft(user) {
  return {
    name: user.name || "",
    phone: user.phone || "",
    location: user.location || "",
    university: user.university || "",
    major: user.major || "",
  };
}

export default function ProfilePage() {
  const { currentUser, token, updateUserProfile } = useAuth();
  const [draft, setDraft] = useState(() => profileDraft(currentUser));
  const [editing, setEditing] = useState(false);
  const [financialData, setFinancialData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingSource, setSavingSource] = useState(false);
  const [sourceDraft, setSourceDraft] = useState(EMPTY_SOURCE);
  const [status, setStatus] = useState("");

  const loadFinancialData = useCallback(async () => {
    setLoadingData(true);
    setError("");
    try {
      setFinancialData(await getProfileData(token));
    } catch (requestError) {
      setError(requestError.message || "Unable to load account financial data.");
    } finally {
      setLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    getProfileData(token)
      .then((data) => {
        if (active) setFinancialData(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load account financial data.");
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const role = ROLE_LABEL[currentUser.role] || "Student";
  const roleColor = ROLE_COLOR[currentUser.role] || ROLE_COLOR.student;
  const RoleIcon = ICON_BY_ROLE[currentUser.role] || UserRound;
  const initials = currentUser.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const summaries = useMemo(() => {
    if (!financialData) return null;
    const recordedIncome = financialData.income.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const transactionIncome = financialData.transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = financialData.transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);
    const monthlyIncome = financialData.incomeSources.reduce(
      (sum, source) => sum + monthlyEquivalent(source),
      0,
    );
    return {
      totalIncome: recordedIncome + transactionIncome,
      expenses,
      balance: recordedIncome + transactionIncome - expenses,
      transactionCount: financialData.transactions.length + financialData.income.length,
      monthlyIncome,
    };
  }, [financialData]);

  async function saveProfile(event) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setStatus("Name is required.");
      return;
    }
    setSavingProfile(true);
    setStatus("");
    try {
      const updated = await updateUserProfile({
        name: draft.name.trim(),
        phone: draft.phone.trim() || null,
        location: draft.location.trim() || null,
        university: draft.university.trim() || null,
        major: draft.major.trim() || null,
      });
      setDraft(profileDraft(updated));
      setEditing(false);
      setStatus("Profile saved.");
    } catch (saveError) {
      setStatus(saveError.message || "Unable to save your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  function cancelEditing() {
    setDraft(profileDraft(currentUser));
    setEditing(false);
    setStatus("");
  }

  async function changeCurrency(event) {
    const currency = event.target.value;
    setSavingCurrency(true);
    setStatus("");
    try {
      const result = await saveCurrency(token, financialData.settings, currency);
      setFinancialData((previous) => ({
        ...previous,
        settings: result.settings,
      }));
      setStatus("Currency preference saved.");
    } catch (saveError) {
      setStatus(saveError.message || "Unable to save the currency preference.");
    } finally {
      setSavingCurrency(false);
    }
  }

  async function addIncomeSource(event) {
    event.preventDefault();
    setSavingSource(true);
    setStatus("");
    try {
      const source = await createIncomeSource(token, {
        ...sourceDraft,
        name: sourceDraft.name.trim(),
        amount: Number(sourceDraft.amount),
        category: sourceDraft.category.trim(),
      });
      setFinancialData((previous) => ({
        ...previous,
        incomeSources: [source, ...previous.incomeSources],
      }));
      setSourceDraft(EMPTY_SOURCE);
      setStatus("Income source saved.");
    } catch (saveError) {
      setStatus(saveError.message || "Unable to save the income source.");
    } finally {
      setSavingSource(false);
    }
  }

  async function removeIncomeSource(sourceId) {
    setStatus("");
    try {
      await deleteIncomeSource(token, sourceId);
      setFinancialData((previous) => ({
        ...previous,
        incomeSources: previous.incomeSources.filter((source) => source.id !== sourceId),
      }));
      setStatus("Income source removed.");
    } catch (deleteError) {
      setStatus(deleteError.message || "Unable to remove the income source.");
    }
  }

  const infoFields = [
    { label: "Full Name", field: "name", icon: UserRound, value: currentUser.name },
    { label: "Email", field: "email", icon: Mail, value: currentUser.email, readOnly: true },
    { label: "Phone", field: "phone", icon: Phone, value: currentUser.phone || "" },
    { label: "Location", field: "location", icon: MapPin, value: currentUser.location || "" },
    { label: "University", field: "university", icon: GraduationCap, value: currentUser.university || "" },
    { label: "Major", field: "major", icon: BookOpen, value: currentUser.major || "" },
  ];

  return (
    <main className="profile-page">
      <div className="profile-content">
        <section className="profile-hero">
          <div className="profile-hero-glow" />
          <div className="profile-hero-main">
            <div className="profile-avatar" style={{ "--profile-role": roleColor }}>{initials}</div>
            <div className="profile-identity">
              <div className="profile-name-line">
                <h1>{currentUser.name}</h1>
                <span className="profile-role" style={{ "--profile-role": roleColor }}>
                  <RoleIcon size={12} /> {role}
                </span>
              </div>
              <div className="profile-identity-meta">
                <span><Mail size={13} /> {currentUser.email}</span>
                {currentUser.university && <span><GraduationCap size={13} /> {currentUser.university}</span>}
              </div>
              <div className="profile-badges">
                <span>{role} Account</span>
                {currentUser.university && <span>{currentUser.university}</span>}
                <span>Member since {formatDate(currentUser.created_at)}</span>
              </div>
            </div>
            <button className="profile-edit-hero" onClick={() => setEditing(true)}>
              <UserRound size={14} /> Edit profile
            </button>
          </div>

          <div className="profile-stats">
            {[
              { label: "Net Balance", value: summaries ? formatMoney(summaries.balance, financialData.settings.currency) : "—", color: summaries && summaries.balance < 0 ? "#EF4444" : "#22C55E" },
              { label: "Recorded Income", value: summaries ? formatMoney(summaries.totalIncome, financialData.settings.currency) : "—", color: "#4F93A0" },
              { label: "Monthly Income Setup", value: summaries ? formatMoney(summaries.monthlyIncome, financialData.settings.currency) : "—", color: "#F4B400" },
              { label: "Transactions", value: summaries ? String(summaries.transactionCount) : "—", color: "#8B5CF6" },
            ].map((item) => (
              <div className="profile-stat" key={item.label}>
                <strong style={{ color: item.color }}>{loadingData ? "…" : item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <div className="profile-error" role="alert">
            <span>{error}</span>
            <button onClick={loadFinancialData} disabled={loadingData}>Retry</button>
          </div>
        )}
        {status && <div className="profile-status" role="status">{status}</div>}

        <div className="profile-columns">
          <section className="profile-card">
            <div className="profile-card-heading">
              <h2>Personal Information</h2>
              {editing ? (
                <div className="profile-action-group">
                  <button className="profile-save" onClick={saveProfile} disabled={savingProfile}>
                    <Check size={14} /> {savingProfile ? "Saving…" : "Save"}
                  </button>
                  <button className="profile-cancel" onClick={cancelEditing} disabled={savingProfile}>
                    <X size={14} /> Cancel
                  </button>
                </div>
              ) : (
                <button className="profile-edit" onClick={() => setEditing(true)}>Edit</button>
              )}
            </div>
            <div className="profile-info-list">
              {infoFields.map(({ label, field, icon: Icon, value, readOnly }) => (
                <label className="profile-info-row" key={field}>
                  <span className="profile-info-icon"><Icon size={16} /></span>
                  <span className="profile-info-value">
                    <span className="profile-info-label">{label}</span>
                    {editing && !readOnly ? (
                      <input
                        value={draft[field] ?? EMPTY_PROFILE[field]}
                        onChange={(event) => setDraft((previous) => ({ ...previous, [field]: event.target.value }))}
                        maxLength={field === "name" ? 100 : field === "phone" ? 40 : 160}
                        required={field === "name"}
                        aria-label={label}
                      />
                    ) : (
                      <span className={`profile-field-display${value ? "" : " is-empty"}`}>
                        {value || `No ${label.toLowerCase()} added`}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <div className="profile-side-column">
            <section className="profile-card">
              <h2 className="profile-section-title"><Shield size={16} /> Account Details</h2>
              <div className="profile-detail-list">
                <div><span>Account Role</span><strong style={{ color: roleColor }}>{role}</strong></div>
                <div><span>Member Since</span><strong>{formatDate(currentUser.created_at)}</strong></div>
                <div className="profile-currency-row">
                  <label htmlFor="profile-currency">Currency</label>
                  <select
                    id="profile-currency"
                    value={financialData?.settings.currency || "INR"}
                    onChange={changeCurrency}
                    disabled={!financialData || savingCurrency}
                  >
                    {["USD", "INR", "EUR", "GBP", "JPY"].map((currency) => (
                      <option value={currency} key={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
                <div><span>Transactions</span><strong className="profile-accent">{summaries ? summaries.transactionCount : loadingData ? "Loading…" : "Unavailable"}</strong></div>
                <div><span>Income Sources</span><strong className="profile-green">{financialData ? financialData.incomeSources.length : loadingData ? "Loading…" : "Unavailable"}</strong></div>
              </div>
            </section>

            <section className="profile-card">
              <div className="profile-card-heading">
                <h2>Monthly Income Setup</h2>
              </div>
              <p className="profile-card-description">
                Manage recurring income sources. Monthly estimates are calculated from the saved frequency.
              </p>
              {loadingData ? (
                <p className="profile-empty">Loading income sources…</p>
              ) : financialData?.incomeSources.length ? (
                <div className="profile-source-list">
                  {financialData.incomeSources.map((source) => (
                    <div className="profile-source-row" key={source.id}>
                      <div>
                        <strong>{source.name}</strong>
                        <span>{source.category} · {source.frequency}</span>
                      </div>
                      <div className="profile-source-amount">
                        <strong>{formatMoney(Number(source.amount), financialData.settings.currency)}</strong>
                        <button
                          aria-label={`Remove ${source.name}`}
                          title={`Remove ${source.name}`}
                          onClick={() => removeIncomeSource(source.id)}
                        ><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="profile-empty">No recurring income sources have been added.</p>
              )}
              <form className="profile-source-form" onSubmit={addIncomeSource}>
                <input
                  aria-label="Income source name"
                  placeholder="Income source"
                  value={sourceDraft.name}
                  onChange={(event) => setSourceDraft((previous) => ({ ...previous, name: event.target.value }))}
                  maxLength={255}
                  required
                />
                <input
                  aria-label="Income amount"
                  placeholder="Amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={sourceDraft.amount}
                  onChange={(event) => setSourceDraft((previous) => ({ ...previous, amount: event.target.value }))}
                  required
                />
                <input
                  aria-label="Income category"
                  placeholder="Category"
                  value={sourceDraft.category}
                  onChange={(event) => setSourceDraft((previous) => ({ ...previous, category: event.target.value }))}
                  maxLength={100}
                  required
                />
                <select
                  aria-label="Income frequency"
                  value={sourceDraft.frequency}
                  onChange={(event) => setSourceDraft((previous) => ({ ...previous, frequency: event.target.value }))}
                >
                  <option>Monthly</option>
                  <option>Weekly</option>
                  <option>Biweekly</option>
                  <option>Yearly</option>
                </select>
                <button type="submit" disabled={savingSource}>
                  <Plus size={15} /> {savingSource ? "Saving…" : "Add source"}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
