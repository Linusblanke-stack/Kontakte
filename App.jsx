import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Search,
  Plus,
  X,
  Check,
  ChevronDown,
  Trash2,
  CalendarClock,
  MessageCirclePlus,
  MapPin,
  Phone,
  Instagram,
  Mail,
  Pencil,
  Home,
} from "lucide-react";

const DEFAULT_CATEGORIES = ["Musik", "Business", "Bar/Event", "Radio/TV", "Sonstiges"];
const STATUS_OPTIONS = ["Neu", "Kontaktiert", "Am Laufen", "Erledigt"];

const STORAGE_KEY_CONTACTS = "kontakte-crm:contacts";
const STORAGE_KEY_CATEGORIES = "kontakte-crm:categories";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayStr() {
  return new Date().toLocaleDateString("en-CA");
}

function parseLocalDate(dateStr) {
  return new Date(dateStr + "T00:00:00");
}

function formatDateShort(dateStr) {
  return parseLocalDate(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatDateLong(dateStr) {
  return parseLocalDate(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

function daysUntil(dateStr) {
  return Math.round((parseLocalDate(dateStr) - parseLocalDate(todayStr())) / 86400000);
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export default function App() {
  const [tab, setTab] = useState("contacts");
  const [contacts, setContacts] = useState(() => loadFromStorage(STORAGE_KEY_CONTACTS, []));
  const [categories, setCategories] = useState(() => loadFromStorage(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES));

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Alle");
  const [expandedId, setExpandedId] = useState(null);

  const [addingContact, setAddingContact] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState(() => DEFAULT_CATEGORIES[0]);
  const [formWhereMet, setFormWhereMet] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formInstagram, setFormInstagram] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formFollowUp, setFormFollowUp] = useState("");
  const nameInputRef = useRef(null);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const categoryInputRef = useRef(null);

  const [activityDrafts, setActivityDrafts] = useState({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  function resetForm() {
    setFormName("");
    setFormCategory(categories[0] || "Sonstiges");
    setFormWhereMet("");
    setFormCity("");
    setFormPhone("");
    setFormInstagram("");
    setFormEmail("");
    setFormNotes("");
    setFormFollowUp("");
  }

  function saveContact() {
    const name = formName.trim();
    if (!name) return;
    const contact = {
      id: uid(),
      name,
      category: formCategory,
      whereMet: formWhereMet.trim(),
      city: formCity.trim(),
      phone: formPhone.trim(),
      instagram: formInstagram.trim(),
      email: formEmail.trim(),
      notes: formNotes.trim(),
      followUpDate: formFollowUp || null,
      status: "Neu",
      createdDate: todayStr(),
      activity: [],
    };
    setContacts((c) => [contact, ...c]);
    resetForm();
    setAddingContact(false);
  }

  function deleteContact(id) {
    setContacts((c) => c.filter((x) => x.id !== id));
  }

  function updateContact(id, patch) {
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addActivity(id) {
    const text = (activityDrafts[id] || "").trim();
    if (!text) return;
    setContacts((cs) =>
      cs.map((c) => (c.id === id ? { ...c, activity: [{ id: uid(), date: todayStr(), text }, ...c.activity] } : c))
    );
    setActivityDrafts((d) => ({ ...d, [id]: "" }));
  }

  function removeActivity(contactId, activityId) {
    setContacts((cs) =>
      cs.map((c) => (c.id === contactId ? { ...c, activity: c.activity.filter((a) => a.id !== activityId) } : c))
    );
  }

  function confirmNewCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      setAddingCategory(false);
      return;
    }
    if (!categories.includes(name)) {
      setCategories((c) => [...c, name]);
    }
    setFormCategory(name);
    setNewCategoryName("");
    setAddingCategory(false);
  }

  function deleteCategory(name, e) {
    e.stopPropagation();
    if (categories.length <= 1) return;
    setCategories((c) => c.filter((x) => x !== name));
    if (filterCategory === name) setFilterCategory("Alle");
    if (formCategory === name) setFormCategory(categories.find((c) => c !== name) || "Sonstiges");
  }

  function markFollowUpDone(id) {
    const contact = contacts.find((c) => c.id === id);
    updateContact(id, {
      followUpDate: null,
      activity: [{ id: uid(), date: todayStr(), text: "Follow-up erledigt" }, ...(contact?.activity || [])],
    });
  }

  function snoozeFollowUp(id, days) {
    const contact = contacts.find((c) => c.id === id);
    const base = contact?.followUpDate ? parseLocalDate(contact.followUpDate) : parseLocalDate(todayStr());
    const next = new Date(base.getTime() + days * 86400000);
    const nextStr = `${next.getFullYear()}-${(next.getMonth() + 1).toString().padStart(2, "0")}-${next
      .getDate()
      .toString()
      .padStart(2, "0")}`;
    updateContact(id, { followUpDate: nextStr });
  }

  const filteredContacts = contacts.filter((c) => {
    const matchesCategory = filterCategory === "Alle" || c.category === filterCategory;
    const matchesSearch =
      search.trim() === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.whereMet.toLowerCase().includes(search.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.instagram || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      c.notes.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const dueContacts = contacts
    .filter((c) => c.followUpDate)
    .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));

  const overdueCount = dueContacts.filter((c) => daysUntil(c.followUpDate) <= 0).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <div className="max-w-md w-full mx-auto flex flex-col min-h-screen relative">
        <header className="px-5 pt-6 pb-4 flex items-center gap-2.5 border-b border-neutral-900">
          <div className="w-8 h-8 rounded-md bg-violet-500 flex items-center justify-center shrink-0">
            <Users size={17} className="text-neutral-950" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight leading-none">Kontakte</h1>
            <p className="text-[11px] text-neutral-500 mt-1 leading-none">{contacts.length} gesamt</p>
          </div>
          {overdueCount > 0 && (
            <div className="ml-auto text-right">
              <div className="text-[16px] font-bold tabular-nums leading-none text-orange-400">{overdueCount}</div>
              <div className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wide mt-0.5">Fällig</div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
          {tab === "contacts" && (
            <div className="px-5 pt-5">
              <div className="relative mb-4">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, Ort oder Notiz suchen"
                  className="w-full bg-neutral-900 rounded-xl pl-10 pr-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={() => setFilterCategory("Alle")}
                  className={
                    "px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors " +
                    (filterCategory === "Alle"
                      ? "bg-neutral-100 text-neutral-950"
                      : "bg-neutral-900 text-neutral-400 active:bg-neutral-800")
                  }
                >
                  Alle
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={
                      "px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors " +
                      (filterCategory === cat
                        ? "bg-violet-500 text-neutral-950"
                        : "bg-neutral-900 text-neutral-400 active:bg-neutral-800")
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {!addingContact ? (
                <button
                  onClick={() => {
                    setAddingContact(true);
                    setTimeout(() => nameInputRef.current && nameInputRef.current.focus(), 50);
                  }}
                  className="w-full mb-5 bg-violet-500 text-neutral-950 rounded-xl py-3 text-[14px] font-bold flex items-center justify-center gap-1.5 active:bg-violet-400"
                >
                  <Plus size={16} strokeWidth={3} />
                  Neuer Kontakt
                </button>
              ) : (
                <div className="bg-neutral-900 rounded-2xl p-4 mb-5 border border-neutral-800">
                  <input
                    ref={nameInputRef}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Name"
                    className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-3"
                  />

                  <div className="flex flex-wrap gap-2 mb-3">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFormCategory(cat)}
                        className={
                          "px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 " +
                          (formCategory === cat ? "bg-violet-500 text-neutral-950" : "bg-neutral-950 text-neutral-400")
                        }
                      >
                        {cat}
                        {categories.length > 1 && (
                          <span onClick={(e) => deleteCategory(cat, e)} className="opacity-60">
                            <X size={10} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    ))}
                    {!addingCategory && (
                      <button
                        onClick={() => {
                          setAddingCategory(true);
                          setTimeout(() => categoryInputRef.current && categoryInputRef.current.focus(), 50);
                        }}
                        className="px-3 py-1.5 rounded-full text-[12px] font-semibold bg-neutral-950 text-neutral-500 flex items-center gap-1"
                      >
                        <Plus size={11} strokeWidth={3} />
                        Neu
                      </button>
                    )}
                  </div>

                  {addingCategory && (
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        ref={categoryInputRef}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && confirmNewCategory()}
                        placeholder="Kategorie-Name"
                        className="flex-1 bg-neutral-950 rounded-lg px-3 py-2 text-[13px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500"
                      />
                      <button
                        onClick={confirmNewCategory}
                        className="w-9 h-9 rounded-lg bg-violet-500 text-neutral-950 flex items-center justify-center shrink-0"
                      >
                        <Check size={16} strokeWidth={3} />
                      </button>
                    </div>
                  )}

                  <input
                    value={formWhereMet}
                    onChange={(e) => setFormWhereMet(e.target.value)}
                    placeholder="Wo getroffen? (z. B. Bar XY, Insta)"
                    className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-3"
                  />

                  <input
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Wohnort (optional)"
                    className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-3"
                  />

                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Telefonnummer (optional)"
                    className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-3"
                  />

                  <input
                    type="text"
                    value={formInstagram}
                    onChange={(e) => setFormInstagram(e.target.value)}
                    placeholder="Instagram (optional, z. B. @name)"
                    className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-3"
                  />

                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="E-Mail (optional)"
                    className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-3"
                  />

                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Notiz (worüber gesprochen, was vereinbart)"
                    rows={2}
                    className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-3 resize-none"
                  />

                  <div className="flex items-center justify-between bg-neutral-950 rounded-lg px-3.5 py-2.5 mb-4">
                    <span className="text-[13px] text-neutral-500">Follow-up am</span>
                    <input
                      type="date"
                      value={formFollowUp}
                      onChange={(e) => setFormFollowUp(e.target.value)}
                      style={{ colorScheme: "dark" }}
                      className="bg-neutral-900 text-neutral-100 text-[13px] rounded-md px-2 py-1 outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={saveContact}
                      className="flex-1 bg-violet-500 text-neutral-950 rounded-xl py-2.5 text-[13px] font-bold active:bg-violet-400"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={() => {
                        setAddingContact(false);
                        resetForm();
                      }}
                      className="px-4 rounded-xl bg-neutral-950 text-neutral-500 text-[13px] font-semibold"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {filteredContacts.length === 0 && (
                <div className="text-center py-14">
                  <Users size={26} className="mx-auto text-neutral-700 mb-3" />
                  <p className="text-[13px] text-neutral-600">
                    {contacts.length === 0 ? "Noch keine Kontakte angelegt." : "Nichts gefunden."}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                {filteredContacts.map((c) => (
                  <ContactCard
                    key={c.id}
                    contact={c}
                    categories={categories}
                    expanded={expandedId === c.id}
                    onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    onUpdate={(patch) => updateContact(c.id, patch)}
                    onDelete={() => deleteContact(c.id)}
                    activityDraft={activityDrafts[c.id] || ""}
                    onActivityDraftChange={(v) => setActivityDrafts((d) => ({ ...d, [c.id]: v }))}
                    onAddActivity={() => addActivity(c.id)}
                    onRemoveActivity={(activityId) => removeActivity(c.id, activityId)}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === "due" && (
            <div className="px-5 pt-5">
              {dueContacts.length === 0 ? (
                <div className="text-center py-16">
                  <CalendarClock size={28} className="mx-auto text-neutral-700 mb-3" />
                  <p className="text-[13px] text-neutral-600">Keine offenen Follow-ups.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {dueContacts.map((c) => {
                    const diff = daysUntil(c.followUpDate);
                    const overdue = diff < 0;
                    const dueToday = diff === 0;
                    return (
                      <div key={c.id} className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-[14px] font-bold">{c.name}</div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">{c.category}</div>
                          </div>
                          <span
                            className={
                              "text-[11px] font-bold px-2 py-1 rounded-full " +
                              (overdue
                                ? "bg-red-500/15 text-red-400"
                                : dueToday
                                ? "bg-orange-500/15 text-orange-400"
                                : "bg-neutral-800 text-neutral-400")
                            }
                          >
                            {overdue
                              ? `${Math.abs(diff)} Tag${Math.abs(diff) === 1 ? "" : "e"} überfällig`
                              : dueToday
                              ? "Heute fällig"
                              : `in ${diff} Tagen`}
                          </span>
                        </div>
                        <div className="text-[12px] text-neutral-500 mb-3">{formatDateLong(c.followUpDate)}</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => markFollowUpDone(c.id)}
                            className="flex-1 bg-neutral-100 text-neutral-950 rounded-lg py-2 text-[12px] font-bold active:bg-neutral-300"
                          >
                            Erledigt
                          </button>
                          <button
                            onClick={() => snoozeFollowUp(c.id, 7)}
                            className="flex-1 bg-neutral-950 text-neutral-400 rounded-lg py-2 text-[12px] font-semibold active:bg-neutral-800"
                          >
                            +7 Tage
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950/95 backdrop-blur border-t border-neutral-900 flex px-3 py-2 gap-1">
          <NavButton
            active={tab === "contacts"}
            onClick={() => setTab("contacts")}
            icon={<Users size={17} strokeWidth={2.3} />}
            label="Kontakte"
          />
          <NavButton
            active={tab === "due"}
            onClick={() => setTab("due")}
            icon={<CalendarClock size={17} strokeWidth={2.3} />}
            label="Fällig"
            badge={overdueCount > 0 && tab !== "due"}
          />
        </nav>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, badge }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center py-1">
      <div
        className={
          "relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-colors w-full " +
          (active ? "bg-neutral-900 text-violet-400" : "text-neutral-600")
        }
      >
        {icon}
        <span className="text-[9px] font-bold tracking-wide">{label}</span>
        {badge && <span className="absolute top-0 right-3 w-1.5 h-1.5 rounded-full bg-orange-500" />}
      </div>
    </button>
  );
}

function ContactCard({
  contact,
  categories,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  activityDraft,
  onActivityDraftChange,
  onAddActivity,
  onRemoveActivity,
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(contact.name);
  const [editCategory, setEditCategory] = useState(contact.category);
  const [editWhereMet, setEditWhereMet] = useState(contact.whereMet || "");
  const [editCity, setEditCity] = useState(contact.city || "");
  const [editPhone, setEditPhone] = useState(contact.phone || "");
  const [editInstagram, setEditInstagram] = useState(contact.instagram || "");
  const [editEmail, setEditEmail] = useState(contact.email || "");
  const [editNotes, setEditNotes] = useState(contact.notes || "");

  function startEdit() {
    setEditName(contact.name);
    setEditCategory(contact.category);
    setEditWhereMet(contact.whereMet || "");
    setEditCity(contact.city || "");
    setEditPhone(contact.phone || "");
    setEditInstagram(contact.instagram || "");
    setEditEmail(contact.email || "");
    setEditNotes(contact.notes || "");
    setEditing(true);
  }

  function saveEdit() {
    const name = editName.trim();
    if (!name) return;
    onUpdate({
      name,
      category: editCategory,
      whereMet: editWhereMet.trim(),
      city: editCity.trim(),
      phone: editPhone.trim(),
      instagram: editInstagram.trim(),
      email: editEmail.trim(),
      notes: editNotes.trim(),
    });
    setEditing(false);
  }

  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3.5">
        <div className="text-left">
          <div className="text-[14px] font-bold">{contact.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-violet-400 font-semibold">{contact.category}</span>
            {contact.whereMet && (
              <span className="text-[11px] text-neutral-600 flex items-center gap-0.5">
                <MapPin size={10} />
                {contact.whereMet}
              </span>
            )}
            {contact.city && (
              <span className="text-[11px] text-neutral-600 flex items-center gap-0.5">
                <Home size={10} />
                {contact.city}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-neutral-500 bg-neutral-950 rounded-full px-2 py-1">
            {contact.status}
          </span>
          <ChevronDown size={15} className={"text-neutral-500 transition-transform " + (expanded ? "rotate-180" : "")} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {editing ? (
            <div className="mb-3">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name"
                className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-2.5"
              />

              <div className="flex flex-wrap gap-2 mb-2.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setEditCategory(cat)}
                    className={
                      "px-3 py-1.5 rounded-full text-[12px] font-semibold " +
                      (editCategory === cat ? "bg-violet-500 text-neutral-950" : "bg-neutral-950 text-neutral-400")
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <input
                value={editWhereMet}
                onChange={(e) => setEditWhereMet(e.target.value)}
                placeholder="Wo getroffen? (z. B. Bar XY, Insta)"
                className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-2.5"
              />

              <input
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="Wohnort (optional)"
                className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-2.5"
              />

              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Telefonnummer (optional)"
                className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-2.5"
              />

              <input
                type="text"
                value={editInstagram}
                onChange={(e) => setEditInstagram(e.target.value)}
                placeholder="Instagram (optional, z. B. @name)"
                className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-2.5"
              />

              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="E-Mail (optional)"
                className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-2.5"
              />

              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notiz (worüber gesprochen, was vereinbart)"
                rows={2}
                className="w-full bg-neutral-950 rounded-lg px-3.5 py-2.5 text-[14px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500 mb-3 resize-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="flex-1 bg-violet-500 text-neutral-950 rounded-xl py-2.5 text-[13px] font-bold active:bg-violet-400"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 rounded-xl bg-neutral-950 text-neutral-500 text-[13px] font-semibold"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-500 active:text-violet-400 mb-3"
              >
                <Pencil size={11} />
                Kontakt bearbeiten
              </button>

              {(contact.phone || contact.instagram || contact.email) && (
                <div className="flex flex-col gap-1.5 mb-3">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                      className="flex items-center gap-1.5 text-[13px] font-semibold text-violet-400"
                    >
                      <Phone size={13} />
                      {contact.phone}
                    </a>
                  )}
                  {contact.instagram && (
                    <a
                      href={`https://instagram.com/${contact.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-[13px] font-semibold text-violet-400"
                    >
                      <Instagram size={13} />
                      {contact.instagram}
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-1.5 text-[13px] font-semibold text-violet-400"
                    >
                      <Mail size={13} />
                      {contact.email}
                    </a>
                  )}
                </div>
              )}
              {contact.notes && <p className="text-[13px] text-neutral-400 mb-3 leading-relaxed">{contact.notes}</p>}
            </>
          )}

          <div className="mb-3">
            <span className="text-[10px] font-bold tracking-widest text-neutral-600 uppercase block mb-1.5">
              Status
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdate({ status: s })}
                  className={
                    "px-2.5 py-1 rounded-full text-[11px] font-semibold " +
                    (contact.status === s ? "bg-violet-500 text-neutral-950" : "bg-neutral-950 text-neutral-500")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between bg-neutral-950 rounded-lg px-3 py-2">
            <span className="text-[12px] text-neutral-500">Follow-up</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={contact.followUpDate || ""}
                onChange={(e) => onUpdate({ followUpDate: e.target.value || null })}
                style={{ colorScheme: "dark" }}
                className="bg-neutral-900 text-neutral-100 text-[12px] rounded-md px-2 py-1 outline-none"
              />
              {contact.followUpDate && (
                <button onClick={() => onUpdate({ followUpDate: null })} className="text-neutral-600 active:text-red-400">
                  <X size={13} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>

          <div className="mb-3">
            <span className="text-[10px] font-bold tracking-widest text-neutral-600 uppercase block mb-1.5">
              Verlauf
            </span>
            <div className="flex items-center gap-2 mb-2">
              <input
                value={activityDraft}
                onChange={(e) => onActivityDraftChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAddActivity()}
                placeholder="Neue Notiz, z. B. Nachricht geschickt"
                className="flex-1 bg-neutral-950 rounded-lg px-3 py-2 text-[13px] text-neutral-100 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                onClick={onAddActivity}
                className="w-9 h-9 rounded-lg bg-neutral-950 text-violet-400 flex items-center justify-center shrink-0"
              >
                <MessageCirclePlus size={16} />
              </button>
            </div>
            {contact.activity.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {contact.activity.map((a) => (
                  <div key={a.id} className="flex items-start justify-between bg-neutral-950 rounded-lg px-3 py-2">
                    <div>
                      <div className="text-[12px] text-neutral-300">{a.text}</div>
                      <div className="text-[10px] text-neutral-600 mt-0.5">{formatDateShort(a.date)}</div>
                    </div>
                    <button
                      onClick={() => onRemoveActivity(a.id)}
                      className="text-neutral-700 active:text-red-400 p-1 -mr-1 shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onDelete}
            className="w-full text-[12px] font-semibold text-neutral-600 active:text-red-400 py-2 flex items-center justify-center gap-1.5"
          >
            <Trash2 size={13} />
            Kontakt löschen
          </button>
        </div>
      )}
    </div>
  );
}
