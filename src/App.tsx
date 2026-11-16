import { useEffect, useState, type FormEvent } from 'react'
import type { jsPDF } from 'jspdf'

type InventoryItem = {
  id: string
  name: string
  description: string
  quantity: string
  unit: string
}

type Draft = {
  worker: string
  items: InventoryItem[]
}

const storageKey = 'stockroom-inventory-draft'
const units = ['each', 'kg', 'g', 'L', 'mL', 'box', 'pack', 'bottle', 'case']

function newItem(): InventoryItem {
  return { id: crypto.randomUUID(), name: '', description: '', quantity: '', unit: 'each' }
}

function loadDraft(): Draft {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const draft = JSON.parse(saved) as Draft
      if (Array.isArray(draft.items) && draft.items.length) return draft
    }
  } catch {
    // Start with a clean draft when saved data is unavailable.
  }
  return { worker: '', items: [newItem()] }
}

function App() {
  const [draft, setDraft] = useState<Draft>(loadDraft)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const readyItems = draft.items.filter((item) => item.name.trim() && item.quantity.trim())

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(draft))
  }, [draft])

  function updateItem(id: string, field: keyof Omit<InventoryItem, 'id'>, value: string) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) => item.id === id ? { ...item, [field]: value } : item),
    }))
    setError('')
    setSubmitted(false)
  }

  function addItem() {
    setDraft((current) => ({ ...current, items: [...current.items, newItem()] }))
    setSubmitted(false)
  }

  function removeItem(id: string) {
    setDraft((current) => ({
      ...current,
      items: current.items.length === 1 ? [newItem()] : current.items.filter((item) => item.id !== id),
    }))
    setSubmitted(false)
  }

  async function submitInventory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await deliverInventory('download')
  }

  async function shareInventory() {
    await deliverInventory('share')
  }

  async function deliverInventory(action: 'download' | 'share') {
    const incompleteItem = draft.items.some((item) =>
      (item.name.trim() !== '' && item.quantity.trim() === '') ||
      (item.name.trim() === '' && item.quantity.trim() !== ''),
    )
    if (incompleteItem) {
      setError('Finish each started row, or remove it before creating the report.')
      return
    }
    const validItems = draft.items.filter((item) => item.name.trim() && item.quantity.trim())
    if (!validItems.length) {
      setError('Add at least one item and quantity to create your report.')
      return
    }

    try {
      const file = await createInventoryPdf(validItems, draft.worker.trim())
      if (action === 'share' && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Restaurant inventory report',
          text: 'Today’s restaurant inventory count.',
        })
        setError('')
        setSubmitted(true)
        return
      }
      downloadFile(file)
      if (action === 'share') {
        setError('File sharing is not available in this browser, so the PDF was downloaded instead.')
        setSubmitted(false)
        return
      }
    } catch (cause) {
      if (action === 'share' && cause instanceof DOMException && cause.name === 'AbortError') return
      setError('The report could not be created. Please try again.')
      return
    }
    setError('')
    setSubmitted(true)
  }

  function clearDraft() {
    setDraft({ worker: '', items: [newItem()] })
    setError('')
    setSubmitted(false)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Stockroom home">
          <span className="brand-mark" aria-hidden="true"><Icon name="stack" /></span>
          <span>stockroom<span className="brand-dot">.</span></span>
        </a>
        <div className="topbar-note"><span className="status-dot" /> SHIFT INVENTORY</div>
      </header>

      <section className="intro" id="top">
        <div className="eyebrow"><span className="eyebrow-rule" /> THE DAILY COUNT</div>
        <div className="intro-row">
          <div>
            <h1>Know what’s<br />in <span>stock.</span></h1>
            <p className="intro-copy">A quick count now keeps the whole kitchen<br className="desktop-break" /> on the same page.</p>
          </div>
          <div className="date-card">
            <span className="date-card-label">TODAY</span>
            <strong>{new Intl.DateTimeFormat('en', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date())}</strong>
          </div>
        </div>
      </section>

      <form className="inventory-card" onSubmit={submitInventory}>
        <div className="card-heading">
          <div>
            <div className="section-kicker">01 / COUNT</div>
            <h2>Inventory list</h2>
          </div>
          <div className="item-count"><span>{readyItems.length.toString().padStart(2, '0')}</span> ITEMS</div>
        </div>

        <label className="worker-field">
          <span>COUNTED BY <span className="optional">· OPTIONAL</span></span>
          <input
            autoComplete="name"
            placeholder="Your name"
            value={draft.worker}
            onChange={(event) => setDraft((current) => ({ ...current, worker: event.target.value }))}
          />
        </label>

        <div className="list-labels" aria-hidden="true">
          <span>ITEM NAME</span><span>QUANTITY</span><span>UNIT</span><span />
        </div>
        <div className="item-list">
          {draft.items.map((item, index) => (
            <div className="item-row" key={item.id}>
              <span className="row-index">{(index + 1).toString().padStart(2, '0')}</span>
              <div className="item-details">
                <label className="sr-only" htmlFor={`item-${item.id}`}>Item name, row {index + 1}</label>
                <input
                  id={`item-${item.id}`}
                  className="item-name-input"
                  autoComplete="off"
                  placeholder="e.g. Roma tomatoes"
                  value={item.name}
                  onChange={(event) => updateItem(item.id, 'name', event.target.value)}
                />
                <label className="sr-only" htmlFor={`description-${item.id}`}>Description or reason, optional, row {index + 1}</label>
                <textarea
                  id={`description-${item.id}`}
                  className="item-description-input"
                  placeholder="Description / reason (optional)"
                  maxLength={300}
                  rows={1}
                  value={item.description ?? ''}
                  onChange={(event) => updateItem(item.id, 'description', event.target.value)}
                />
              </div>
              <label className="sr-only" htmlFor={`quantity-${item.id}`}>Quantity, row {index + 1}</label>
              <input
                id={`quantity-${item.id}`}
                className="quantity-input"
                inputMode="decimal"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={item.quantity}
                onChange={(event) => updateItem(item.id, 'quantity', event.target.value)}
              />
              <label className="sr-only" htmlFor={`unit-${item.id}`}>Unit, row {index + 1}</label>
              <select
                id={`unit-${item.id}`}
                className="unit-select"
                value={item.unit}
                onChange={(event) => updateItem(item.id, 'unit', event.target.value)}
              >
                {units.map((unit) => <option key={unit}>{unit}</option>)}
              </select>
              <button className="remove-button" type="button" onClick={() => removeItem(item.id)} aria-label={`Remove row ${index + 1}`} title="Remove item">
                <Icon name="close" />
              </button>
            </div>
          ))}
        </div>

        <button className="add-button" type="button" onClick={addItem}>
          <span className="add-icon"><Icon name="plus" /></span> Add another item
        </button>

        <div className="form-bottom">
          <div className="privacy-note"><Icon name="check" /><span>Your count is saved on this device as you go.</span></div>
          <button className="clear-button" type="button" onClick={clearDraft}>Clear list</button>
        </div>

        {error && <p className="form-message error-message" role="alert">{error}</p>}
        {submitted && <p className="form-message success-message" role="status">Your inventory report is ready to share.</p>}

        <div className="actions-row">
          <button className="submit-button" type="submit">
            <span>Download PDF</span>
            <span className="submit-icon"><Icon name="arrow" /></span>
          </button>
          <button className="share-button" type="button" onClick={shareInventory}>
            <Icon name="share" /> <span>Share PDF</span>
          </button>
        </div>
        <p className="submit-caption">Share straight to your team’s chat.</p>
      </form>

      <footer className="page-footer"><span>GOOD SERVICE STARTS IN THE KITCHEN.</span><span>STOCKROOM <span className="footer-star">✳</span> 01</span></footer>
    </main>
  )
}

async function createInventoryPdf(items: InventoryItem[], worker: string) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 19
  const right = pageWidth - margin
  const date = new Date()
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)

  pdf.setProperties({ title: 'Restaurant inventory report', subject: `Inventory count · ${dateLabel}`, author: worker || 'Restaurant team' })
  pdf.setFillColor(36, 76, 59)
  pdf.rect(0, 0, pageWidth, 4, 'F')

  pdf.setTextColor(36, 76, 59)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('STOCKROOM', margin, 17)
  pdf.setTextColor(128, 137, 128)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('KITCHEN OPERATIONS', right, 17, { align: 'right' })

  pdf.setDrawColor(225, 229, 222)
  pdf.setLineWidth(0.35)
  pdf.line(margin, 22, right, 22)

  pdf.setTextColor(31, 40, 33)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(25)
  pdf.text('Inventory report', margin, 37)
  pdf.setTextColor(109, 119, 110)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(dateLabel, margin, 44)

  const metaTop = 55
  const metaWidth = (right - margin - 8) / 2
  pdf.setFillColor(246, 247, 243)
  pdf.roundedRect(margin, metaTop, metaWidth, 19, 2, 2, 'F')
  pdf.roundedRect(margin + metaWidth + 8, metaTop, metaWidth, 19, 2, 2, 'F')
  pdf.setTextColor(125, 134, 125)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.text('ITEMS COUNTED', margin + 5, metaTop + 7)
  pdf.text('COUNTED BY', margin + metaWidth + 13, metaTop + 7)
  pdf.setTextColor(31, 40, 33)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text(String(items.length).padStart(2, '0'), margin + 5, metaTop + 14)
  pdf.setFont('helvetica', 'normal')
  pdf.text(worker || 'Not specified', margin + metaWidth + 13, metaTop + 14)

  let y = 88
  const drawTableHeader = () => {
    pdf.setFillColor(36, 76, 59)
    pdf.roundedRect(margin, y, right - margin, 10, 1.5, 1.5, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.text('NO.', margin + 4, y + 6.5)
    pdf.text('ITEM', margin + 20, y + 6.5)
    pdf.text('QUANTITY', right - 48, y + 6.5)
    pdf.text('UNIT', right - 5, y + 6.5, { align: 'right' })
    y += 10
  }

  drawTableHeader()
  items.forEach((item, index) => {
    const itemName = pdf.splitTextToSize(item.name.trim(), right - margin - 77)
    const description = item.description?.trim()
      ? pdf.splitTextToSize(item.description.trim(), right - margin - 77)
      : []
    const rowHeight = Math.max(11, 7 + itemName.length * 4.3 + description.length * 3.6)

    if (y + rowHeight > pageHeight - 22) {
      addPdfFooter(pdf, pageHeight, margin, right)
      pdf.addPage()
      y = 20
      drawTableHeader()
    }
    if (index % 2 === 0) {
      pdf.setFillColor(248, 249, 246)
      pdf.rect(margin, y, right - margin, rowHeight, 'F')
    }
    pdf.setTextColor(139, 148, 139)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(String(index + 1).padStart(2, '0'), margin + 4, y + 7)
    pdf.setTextColor(37, 46, 39)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(itemName, margin + 20, y + 6)
    if (description.length) {
      pdf.setTextColor(109, 119, 110)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text(description, margin + 20, y + 6 + itemName.length * 4.3)
    }
    pdf.setTextColor(37, 46, 39)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(item.quantity, right - 48, y + 6)
    pdf.setTextColor(99, 110, 100)
    pdf.text(item.unit, right - 5, y + 6, { align: 'right' })
    y += rowHeight
  })

  addPdfFooter(pdf, pageHeight, margin, right)
  const filenameDate = new Intl.DateTimeFormat('en-CA').format(date)
  return new File([pdf.output('blob')], `inventory-${filenameDate}.pdf`, { type: 'application/pdf' })
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function addPdfFooter(pdf: jsPDF, pageHeight: number, margin: number, right: number) {
  pdf.setDrawColor(225, 229, 222)
  pdf.setLineWidth(0.3)
  pdf.line(margin, pageHeight - 15, right, pageHeight - 15)
  pdf.setTextColor(135, 144, 135)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text('INTERNAL KITCHEN INVENTORY', margin, pageHeight - 9)
  pdf.text('STOCKROOM', right, pageHeight - 9, { align: 'right' })
}

function Icon({ name }: { name: 'stack' | 'plus' | 'close' | 'check' | 'arrow' | 'share' }) {
  const shared = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  if (name === 'stack') return <svg {...shared}><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" /><path d="m4 12 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" /></svg>
  if (name === 'plus') return <svg {...shared}><path d="M12 5v14M5 12h14" /></svg>
  if (name === 'close') return <svg {...shared}><path d="m7 7 10 10M17 7 7 17" /></svg>
  if (name === 'check') return <svg {...shared}><path d="m5 12 4 4L19 6" /></svg>
  if (name === 'share') return <svg {...shared}><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>
  return <svg {...shared}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
}

export default App
