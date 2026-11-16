import { useEffect, useState, type FormEvent } from "react";
import type { jsPDF } from "jspdf";
import {
  localeByLanguage,
  translations,
  type CategoryId,
  type Language,
  type Translation,
} from "./translations";
import "@fontsource/noto-sans-thai/thai-400.css";
import "@fontsource/noto-sans-thai/thai-500.css";
import "@fontsource/noto-sans-thai/thai-600.css";
import thaiRegularFont from "@reductoai/portable-fonts/files/NotoSansThai-Regular.ttf?url";
import thaiBoldFont from "@reductoai/portable-fonts/files/NotoSansThai-Bold.ttf?url";

type InventoryItem = {
  id: string;
  name: string;
  description: string;
  quantity: string;
  unit: string;
  category: CategoryId;
};

type Draft = {
  worker: string;
  items: InventoryItem[];
};

const storageKey = "stockroom-inventory-draft";
const languageStorageKey = "stockroom-inventory-language";
const units = ["each", "kg", "g", "L", "mL", "box", "pack", "bottle", "case"];

function newItem(): InventoryItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    quantity: "",
    unit: "each",
    category: "storeroom",
  };
}

function loadDraft(): Draft {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const savedDraft = JSON.parse(saved) as Partial<Draft> & {
        lists?: Partial<Record<"Kitchen" | "FOH" | "Storage", InventoryItem[]>>;
      };
      const items = savedDraft.items ?? [
        ...(savedDraft.lists?.Kitchen ?? []).map((item) => ({
          ...item,
          category: "boh" as const,
        })),
        ...(savedDraft.lists?.FOH ?? []).map((item) => ({
          ...item,
          category: "foh" as const,
        })),
        ...(savedDraft.lists?.Storage ?? []).map((item) => ({
          ...item,
          category: "storeroom" as const,
        })),
      ];
      return {
        worker: savedDraft.worker ?? "",
        items: (items.length ? items : [newItem()]).map((item) => ({
          ...item,
          description: item.description ?? "",
          category: ["received", "storeroom", "boh", "foh", "waste"].includes(
            item.category,
          )
            ? item.category
            : "storeroom",
        })),
      };
    }
  } catch {
    // Start with a clean draft when saved data is unavailable.
  }
  return { worker: "", items: [newItem()] };
}

function App() {
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(languageStorageKey);
    return saved === "fi" || saved === "th" ? saved : "en";
  });
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const t = translations[language];
  const locale = localeByLanguage[language];
  const hasWorkerName = draft.worker.trim().length > 0;
  const readyItems = draft.items.filter(
    (item) => item.name.trim() && item.quantity.trim(),
  );

  useEffect(() => {
    let timer: number;
    const updateClock = () => {
      setCurrentTime(new Date());
      timer = window.setTimeout(updateClock, 60_000 - (Date.now() % 60_000));
    };
    updateClock();
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language;
    document.title = `${t.appName} — ${t.restaurantName}`;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", `${t.appName} — ${t.restaurantName}`);
  }, [language, t.appName, t.restaurantName]);

  function updateItem(
    id: string,
    field: keyof Omit<InventoryItem, "id">,
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
    setError("");
    setSubmitted(false);
  }

  function addItem() {
    setDraft((current) => ({
      ...current,
      items: [...current.items, newItem()],
    }));
    setSubmitted(false);
  }

  function removeItem(id: string) {
    setDraft((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [newItem()]
          : current.items.filter((item) => item.id !== id),
    }));
    setSubmitted(false);
  }

  async function submitInventory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await deliverInventory("download");
  }

  async function shareInventory() {
    await deliverInventory("share");
  }

  async function deliverInventory(action: "download" | "share") {
    if (!hasWorkerName) {
      setError(t.enterName);
      return;
    }
    const incompleteItem = draft.items.some(
      (item) =>
        (item.name.trim() !== "" && item.quantity.trim() === "") ||
        (item.name.trim() === "" && item.quantity.trim() !== ""),
    );
    if (incompleteItem) {
      setError(t.finishRows);
      return;
    }
    const validItems = draft.items.filter(
      (item) => item.name.trim() && item.quantity.trim(),
    );
    if (!validItems.length) {
      setError(t.addOneItem);
      return;
    }

    try {
      const file = await createInventoryPdf(
        validItems,
        draft.worker.trim(),
        t,
        locale,
      );
      if (
        action === "share" &&
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: t.pdfReport,
          text: t.shareCaption,
        });
        setError("");
        setSubmitted(true);
        return;
      }
      downloadFile(file);
      if (action === "share") {
        setError(t.sharingUnavailable);
        setSubmitted(false);
        return;
      }
    } catch (cause) {
      if (
        action === "share" &&
        cause instanceof DOMException &&
        cause.name === "AbortError"
      )
        return;
      setError(t.reportError);
      return;
    }
    setError("");
    setSubmitted(true);
  }

  function clearDraft() {
    setDraft({ worker: "", items: [newItem()] });
    setError("");
    setSubmitted(false);
  }

  return (
    <main className="app-shell" lang={language}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label={`${t.appName} home`}>
          <span className="brand-mark" aria-hidden="true">
            <Icon name="stack" />
          </span>
          <span>
            {t.appName}
            <span className="brand-dot">.</span>
          </span>
        </a>
        <div className="header-tools">
          <div className="topbar-note">
            <span className="status-dot" /> {t.dailyCount}
          </div>
          <label className="language-picker">
            <span className="sr-only">{t.languageLabel}</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
            >
              {(["en", "fi", "th"] as const).map((code) => (
                <option key={code} value={code}>
                  {translations[code].languageName}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section className="intro" id="top">
        <div className="eyebrow">
          <span className="eyebrow-rule" /> {t.restaurantInventory}
        </div>
        <div className="intro-row">
          <div>
            <h1 className="restaurant-title">
              Chao Phraya
              <br />
              <span>Hietalahti.</span>
            </h1>
            <p className="intro-copy">{t.appName}</p>
          </div>
          <div className="date-card">
            <span className="date-card-label">{t.today}</span>
            <strong>
              {new Intl.DateTimeFormat(locale, {
                weekday: "short",
                day: "2-digit",
                month: "short",
                timeZone: "Europe/Helsinki",
              }).format(currentTime)}
            </strong>
            <span className="date-card-time">
              {new Intl.DateTimeFormat(locale, {
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
                timeZone: "Europe/Helsinki",
              }).format(currentTime)}
            </span>
          </div>
        </div>
      </section>

      <form className="inventory-card" onSubmit={submitInventory}>
        <div className="card-heading">
          <div>
            <div className="section-kicker">{t.count}</div>
            <h2>{t.inventoryItems}</h2>
          </div>
          <div className="item-count">
            <span>{readyItems.length.toString().padStart(2, "0")}</span>{" "}
            {t.items}
          </div>
        </div>

        <label className="worker-field">
          <span>
            {t.name} <span className="required">· {t.required}</span>
          </span>
          <input
            className={!hasWorkerName ? "worker-name-empty" : ""}
            autoComplete="name"
            required
            aria-invalid={!hasWorkerName}
            placeholder={t.yourName}
            value={draft.worker}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                worker: event.target.value,
              }));
              setError("");
              setSubmitted(false);
            }}
          />
        </label>

        <div className="list-labels" aria-hidden="true">
          <span>{t.itemName}</span>
          <span>{t.quantity}</span>
          <span>{t.unit}</span>
          <span />
        </div>
        <div className="item-list">
          {draft.items.map((item, index) => (
            <div className="item-row" key={item.id}>
              <span className="row-index">
                {(index + 1).toString().padStart(2, "0")}
              </span>
              <div className="item-details">
                <div className="item-category-field">
                  <label className="sr-only" htmlFor={`category-${item.id}`}>
                    {t.categorySelect}, row {index + 1}
                  </label>
                  <div className="category-tag">
                    <span>{t.categories[item.category].tag}</span>
                    <select
                      id={`category-${item.id}`}
                      className="category-select"
                      title={t.categories[item.category].title}
                      value={item.category}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "category",
                          event.target.value as CategoryId,
                        )
                      }
                    >
                      {(Object.keys(t.categories) as CategoryId[]).map(
                        (category) => (
                          <option key={category} value={category}>
                            {t.categories[category].title}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
                <label className="sr-only" htmlFor={`item-${item.id}`}>
                  Item name, row {index + 1}
                </label>
                <input
                  id={`item-${item.id}`}
                  className="item-name-input"
                  autoComplete="off"
                  placeholder={t.itemPlaceholder}
                  value={item.name}
                  onChange={(event) =>
                    updateItem(item.id, "name", event.target.value)
                  }
                />
                <label className="sr-only" htmlFor={`description-${item.id}`}>
                  Description or reason, optional, row {index + 1}
                </label>
                <textarea
                  id={`description-${item.id}`}
                  className="item-description-input"
                  placeholder={t.descriptionPlaceholder}
                  maxLength={300}
                  rows={1}
                  value={item.description ?? ""}
                  onChange={(event) =>
                    updateItem(item.id, "description", event.target.value)
                  }
                />
              </div>
              <label className="sr-only" htmlFor={`quantity-${item.id}`}>
                Quantity, row {index + 1}
              </label>
              <input
                id={`quantity-${item.id}`}
                className="quantity-input"
                inputMode="decimal"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={item.quantity}
                onChange={(event) =>
                  updateItem(item.id, "quantity", event.target.value)
                }
              />
              <label className="sr-only" htmlFor={`unit-${item.id}`}>
                Unit, row {index + 1}
              </label>
              <select
                id={`unit-${item.id}`}
                className="unit-select"
                value={item.unit}
                onChange={(event) =>
                  updateItem(item.id, "unit", event.target.value)
                }
              >
                {units.map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
              <button
                className="remove-button"
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`${t.removeItem} ${index + 1}`}
                title={t.removeItem}
              >
                <Icon name="close" />
              </button>
            </div>
          ))}
        </div>

        <button className="add-button" type="button" onClick={addItem}>
          <span className="add-icon">
            <Icon name="plus" />
          </span>{" "}
          {t.addItem}
        </button>

        <div className="form-bottom">
          <div className="privacy-note">
            <Icon name="check" />
            <span>{t.savedLocally}</span>
          </div>
          <button className="clear-button" type="button" onClick={clearDraft}>
            {t.clearList}
          </button>
        </div>

        {error && (
          <p className="form-message error-message" role="alert">
            {error}
          </p>
        )}
        {submitted && (
          <p className="form-message success-message" role="status">
            {t.readyToShare}
          </p>
        )}

        <div className="actions-row">
          <button
            className="submit-button"
            type="submit"
            disabled={!hasWorkerName}
          >
            <span>{t.downloadPdf}</span>
            <span className="submit-icon">
              <Icon name="arrow" />
            </span>
          </button>
          <button
            className="share-button"
            type="button"
            onClick={shareInventory}
            disabled={!hasWorkerName}
          >
            <Icon name="share" /> <span>{t.sharePdf}</span>
          </button>
        </div>
        <p className="submit-caption">{t.shareCaption}</p>
      </form>

      <footer className="page-footer">
        <span>{t.restaurantName.toLocaleUpperCase(locale)}</span>
        <span>
          {t.appName.toLocaleUpperCase(locale)}{" "}
          <span className="footer-star">✳</span>
        </span>
      </footer>
    </main>
  );
}

async function createInventoryPdf(
  items: InventoryItem[],
  worker: string,
  t: Translation,
  locale: string,
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const fontFamily = locale === "th-TH" ? "NotoSansThai" : "helvetica";
  if (locale === "th-TH") {
    pdf.addFileToVFS(
      "NotoSansThai-Regular.ttf",
      await fetchFontAsBase64(thaiRegularFont),
    );
    pdf.addFileToVFS(
      "NotoSansThai-Bold.ttf",
      await fetchFontAsBase64(thaiBoldFont),
    );
    pdf.addFont("NotoSansThai-Regular.ttf", "NotoSansThai", "normal");
    pdf.addFont("NotoSansThai-Bold.ttf", "NotoSansThai", "bold");
  }
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 19;
  const right = pageWidth - margin;
  const date = new Date();
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Helsinki",
  }).format(date);
  const submittedAt = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Helsinki",
    timeZoneName: "short",
  }).format(date);

  pdf.setProperties({
    title: `${t.pdfReport} — ${t.restaurantName}`,
    subject: `${t.inventoryItems} · ${dateLabel} · ${t.submitted} ${submittedAt}`,
    author: worker || t.restaurantName,
  });
  pdf.setFillColor(36, 76, 59);
  pdf.rect(0, 0, pageWidth, 4, "F");

  pdf.setTextColor(36, 76, 59);
  pdf.setFont(fontFamily, "bold");
  pdf.setFontSize(10);
  pdf.text(t.restaurantName.toLocaleUpperCase(locale), margin, 17);
  pdf.setTextColor(128, 137, 128);
  pdf.setFont(fontFamily, "normal");
  pdf.setFontSize(8);
  pdf.text(t.appName.toLocaleUpperCase(locale), right, 17, { align: "right" });

  pdf.setDrawColor(225, 229, 222);
  pdf.setLineWidth(0.35);
  pdf.line(margin, 22, right, 22);

  pdf.setTextColor(31, 40, 33);
  pdf.setFont(fontFamily, "bold");
  pdf.setFontSize(25);
  pdf.text(t.pdfReport, margin, 37);
  pdf.setTextColor(109, 119, 110);
  pdf.setFont(fontFamily, "normal");
  pdf.setFontSize(10);
  pdf.text(dateLabel, margin, 44);
  pdf.setFontSize(8);
  pdf.text(`${t.submitted} ${submittedAt}`, margin, 50);

  const metaTop = 58;
  const metaWidth = (right - margin - 8) / 2;
  pdf.setFillColor(246, 247, 243);
  pdf.roundedRect(margin, metaTop, metaWidth, 19, 2, 2, "F");
  pdf.roundedRect(margin + metaWidth + 8, metaTop, metaWidth, 19, 2, 2, "F");
  pdf.setTextColor(125, 134, 125);
  pdf.setFont(fontFamily, "bold");
  pdf.setFontSize(7);
  pdf.text(t.itemCount.toLocaleUpperCase(locale), margin + 5, metaTop + 7);
  pdf.text(
    t.countedBy.toLocaleUpperCase(locale),
    margin + metaWidth + 13,
    metaTop + 7,
  );
  pdf.setTextColor(31, 40, 33);
  pdf.setFont(fontFamily, "bold");
  pdf.setFontSize(11);
  pdf.text(String(items.length).padStart(2, "0"), margin + 5, metaTop + 14);
  pdf.setFont(fontFamily, "normal");
  pdf.text(worker || t.notSpecified, margin + metaWidth + 13, metaTop + 14);

  let y = 91;
  const drawTableHeader = () => {
    pdf.setFillColor(36, 76, 59);
    pdf.roundedRect(margin, y, right - margin, 10, 1.5, 1.5, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(fontFamily, "bold");
    pdf.setFontSize(7);
    pdf.text(t.rowNumber, margin + 4, y + 6.5);
    pdf.text(t.itemColumn, margin + 20, y + 6.5);
    pdf.text(t.quantity, right - 48, y + 6.5);
    pdf.text(t.unit, right - 5, y + 6.5, { align: "right" });
    y += 10;
  };

  const drawSectionHeader = (category: { title: string; tag: string }) => {
    pdf.setFillColor(237, 241, 235);
    pdf.roundedRect(margin, y, right - margin, 11, 1.5, 1.5, "F");
    pdf.setTextColor(36, 76, 59);
    pdf.setFont(fontFamily, "bold");
    pdf.setFontSize(9);
    pdf.text(category.title, margin + 4, y + 7);
    y += 13;
  };

  const groups = (Object.keys(t.categories) as CategoryId[])
    .map((category) => ({
      category: { id: category, ...t.categories[category] },
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);

  for (const group of groups) {
    if (y + 24 > pageHeight - 22) {
      addPdfFooter(pdf, pageHeight, margin, right, t, locale, fontFamily);
      pdf.addPage();
      y = 20;
    }
    drawSectionHeader(group.category);
    drawTableHeader();

    group.items.forEach((item, index) => {
      const itemName = pdf.splitTextToSize(
        item.name.trim(),
        right - margin - 77,
      );
      const description = item.description?.trim()
        ? pdf.splitTextToSize(item.description.trim(), right - margin - 77)
        : [];
      const rowHeight = Math.max(
        11,
        7 + itemName.length * 4.3 + description.length * 3.6,
      );

      if (y + rowHeight > pageHeight - 22) {
        addPdfFooter(pdf, pageHeight, margin, right, t, locale, fontFamily);
        pdf.addPage();
        y = 20;
        drawSectionHeader(group.category);
        drawTableHeader();
      }
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 246);
        pdf.rect(margin, y, right - margin, rowHeight, "F");
      }
      pdf.setTextColor(139, 148, 139);
      pdf.setFont(fontFamily, "normal");
      pdf.setFontSize(8);
      pdf.text(String(index + 1).padStart(2, "0"), margin + 4, y + 7);
      pdf.setTextColor(37, 46, 39);
      pdf.setFont(fontFamily, "bold");
      pdf.setFontSize(10);
      pdf.text(itemName, margin + 20, y + 6);
      if (description.length) {
        pdf.setTextColor(109, 119, 110);
        pdf.setFont(fontFamily, "normal");
        pdf.setFontSize(8);
        pdf.text(description, margin + 20, y + 6 + itemName.length * 4.3);
      }
      pdf.setTextColor(37, 46, 39);
      pdf.setFont(fontFamily, "normal");
      pdf.setFontSize(10);
      pdf.text(item.quantity, right - 48, y + 6);
      pdf.setTextColor(99, 110, 100);
      pdf.text(item.unit, right - 5, y + 6, { align: "right" });
      y += rowHeight;
    });
    y += 7;
  }

  addPdfFooter(pdf, pageHeight, margin, right, t, locale, fontFamily);
  const filenameDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki",
  }).format(date);
  return new File([pdf.output("blob")], `inventory-${filenameDate}.pdf`, {
    type: "application/pdf",
  });
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function fetchFontAsBase64(url: string) {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function addPdfFooter(
  pdf: jsPDF,
  pageHeight: number,
  margin: number,
  right: number,
  t: Translation,
  locale: string,
  fontFamily: string,
) {
  pdf.setDrawColor(225, 229, 222);
  pdf.setLineWidth(0.3);
  pdf.line(margin, pageHeight - 15, right, pageHeight - 15);
  pdf.setTextColor(135, 144, 135);
  pdf.setFont(fontFamily, "normal");
  pdf.setFontSize(7);
  pdf.text(
    t.internalInventory.toLocaleUpperCase(locale),
    margin,
    pageHeight - 9,
  );
  pdf.text(t.restaurantName.toLocaleUpperCase(locale), right, pageHeight - 9, {
    align: "right",
  });
}

function Icon({
  name,
}: {
  name: "stack" | "plus" | "close" | "check" | "arrow" | "share";
}) {
  const shared = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (name === "stack")
    return (
      <svg {...shared}>
        <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
        <path d="m4 12 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
      </svg>
    );
  if (name === "plus")
    return (
      <svg {...shared}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  if (name === "close")
    return (
      <svg {...shared}>
        <path d="m7 7 10 10M17 7 7 17" />
      </svg>
    );
  if (name === "check")
    return (
      <svg {...shared}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  if (name === "share")
    return (
      <svg {...shared}>
        <path d="M12 16V4m0 0L7 9m5-5 5 5" />
        <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
      </svg>
    );
  return (
    <svg {...shared}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default App;
