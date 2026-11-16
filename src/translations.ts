export type Language = "en" | "fi" | "th";
export type CategoryId = "received" | "storeroom" | "boh" | "foh" | "waste";

export type Translation = {
  languageName: string;
  appName: string;
  languageLabel: string;
  dailyCount: string;
  restaurantInventory: string;
  restaurantName: string;
  today: string;
  count: string;
  inventoryItems: string;
  items: string;
  name: string;
  required: string;
  yourName: string;
  itemName: string;
  quantity: string;
  unit: string;
  rowNumber: string;
  itemColumn: string;
  itemPlaceholder: string;
  descriptionPlaceholder: string;
  removeItem: string;
  addItem: string;
  savedLocally: string;
  clearList: string;
  downloadPdf: string;
  sharePdf: string;
  shareCaption: string;
  readyToShare: string;
  enterName: string;
  finishRows: string;
  addOneItem: string;
  sharingUnavailable: string;
  reportError: string;
  categorySelect: string;
  pdfReport: string;
  submitted: string;
  itemCount: string;
  countedBy: string;
  notSpecified: string;
  internalInventory: string;
  categories: Record<CategoryId, { title: string; tag: string }>;
};

export const translations: Record<Language, Translation> = {
  en: {
    languageName: "English",
    appName: "Daily Stock Sheet",
    languageLabel: "Language",
    dailyCount: "DAILY COUNT",
    restaurantInventory: "RESTAURANT INVENTORY",
    restaurantName: "Chao Phraya Hietalahti",
    today: "TODAY",
    count: "01 / COUNT",
    inventoryItems: "Inventory items",
    items: "ITEMS",
    name: "NAME",
    required: "REQUIRED",
    yourName: "Your name",
    itemName: "ITEM NAME",
    quantity: "QUANTITY",
    unit: "UNIT",
    rowNumber: "NO.",
    itemColumn: "ITEM",
    itemPlaceholder: "e.g. Roma tomatoes",
    descriptionPlaceholder: "Description / reason (optional)",
    removeItem: "Remove item",
    addItem: "Add another item",
    savedLocally: "Your count is saved on this device as you go.",
    clearList: "Clear list",
    downloadPdf: "Download PDF",
    sharePdf: "Share PDF",
    shareCaption: "Share straight to your team’s chat.",
    readyToShare: "Your inventory report is ready to share.",
    enterName: "Enter your name before creating the inventory report.",
    finishRows:
      "Finish each started row, or remove it before creating the report.",
    addOneItem: "Add at least one item and quantity to create your report.",
    sharingUnavailable:
      "File sharing is not available in this browser, so the PDF was downloaded instead.",
    reportError: "The report could not be created. Please try again.",
    categorySelect: "Inventory list",
    pdfReport: "Daily Stock Sheet",
    submitted: "Submitted",
    itemCount: "ITEMS COUNTED",
    countedBy: "COUNTED BY",
    notSpecified: "Not specified",
    internalInventory: "INTERNAL INVENTORY",
    categories: {
      received: {
        title: "Goods Received Log (Stock enters the building)",
        tag: "Goods received",
      },
      storeroom: {
        title: "Main Storeroom Inventory Sheet (Bulk stock waiting to be used)",
        tag: "Main storeroom",
      },
      boh: {
        title: "BOH Par & Prep Sheet (Kitchen line & prep)",
        tag: "BOH par & prep",
      },
      foh: {
        title: "FOH / Service Station Par Sheet (Counter, drinks, packaging)",
        tag: "FOH / service",
      },
      waste: {
        title: "Daily Waste & Spoilage Log (Stock lost before sale)",
        tag: "Waste & spoilage",
      },
    },
  },
  fi: {
    languageName: "Suomi",
    appName: "Päivittäinen varastolomake",
    languageLabel: "Kieli",
    dailyCount: "PÄIVITTÄINEN LASKENTA",
    restaurantInventory: "RAVINTOLAN VARASTO",
    restaurantName: "Chao Phraya Hietalahti",
    today: "TÄNÄÄN",
    count: "01 / LASKENTA",
    inventoryItems: "Varastotuotteet",
    items: "TUOTETTA",
    name: "NIMI",
    required: "PAKOLLINEN",
    yourName: "Nimesi",
    itemName: "TUOTE",
    quantity: "MÄÄRÄ",
    unit: "YKSIKKÖ",
    rowNumber: "NRO",
    itemColumn: "TUOTE",
    itemPlaceholder: "esim. Luumutomaatti",
    descriptionPlaceholder: "Kuvaus / syy (valinnainen)",
    removeItem: "Poista tuote",
    addItem: "Lisää tuote",
    savedLocally: "Laskenta tallentuu automaattisesti tälle laitteelle.",
    clearList: "Tyhjennä lista",
    downloadPdf: "Lataa PDF",
    sharePdf: "Jaa PDF",
    shareCaption: "Jaa suoraan tiimin keskusteluun.",
    readyToShare: "Varastoraportti on valmis jaettavaksi.",
    enterName: "Kirjoita nimesi ennen raportin luomista.",
    finishRows:
      "Täydennä aloitetut rivit tai poista ne ennen raportin luomista.",
    addOneItem: "Lisää vähintään yksi tuote ja määrä raporttia varten.",
    sharingUnavailable:
      "Tiedoston jakaminen ei ole käytettävissä tässä selaimessa. PDF ladattiin sen sijaan.",
    reportError: "Raportin luominen epäonnistui. Yritä uudelleen.",
    categorySelect: "Varastolista",
    pdfReport: "Päivittäinen varastolomake",
    submitted: "Lähetetty",
    itemCount: "LASKETUT TUOTTEET",
    countedBy: "LASKIJA",
    notSpecified: "Ei ilmoitettu",
    internalInventory: "SISÄINEN VARASTORAPORTTI",
    categories: {
      received: {
        title: "Vastaanotetut tuotteet (Rakennukseen saapuva varasto)",
        tag: "Vastaanotetut",
      },
      storeroom: {
        title: "Päävaraston inventaario (Käyttöä odottava suurtavaravarasto)",
        tag: "Päävarasto",
      },
      boh: {
        title:
          "BOH minimi- ja esivalmistelulista (Keittiölinja ja esivalmistelu)",
        tag: "BOH valmistelu",
      },
      foh: {
        title: "FOH / palvelupisteen minimitaso (Tiski, juomat, pakkaukset)",
        tag: "FOH / palvelu",
      },
      waste: {
        title:
          "Päivittäinen hävikki- ja pilaantumislista (Ennen myyntiä menetetty varasto)",
        tag: "Hävikki",
      },
    },
  },
  th: {
    languageName: "ไทย",
    appName: "ใบบันทึกสต็อกประจำวัน",
    languageLabel: "ภาษา",
    dailyCount: "ตรวจนับประจำวัน",
    restaurantInventory: "สต็อกร้านอาหาร",
    restaurantName: "Chao Phraya Hietalahti",
    today: "วันนี้",
    count: "01 / ตรวจนับ",
    inventoryItems: "รายการสินค้า",
    items: "รายการ",
    name: "ชื่อ",
    required: "จำเป็น",
    yourName: "ชื่อของคุณ",
    itemName: "ชื่อสินค้า",
    quantity: "จำนวน",
    unit: "หน่วย",
    rowNumber: "ลำดับ",
    itemColumn: "สินค้า",
    itemPlaceholder: "เช่น มะเขือเทศโรมา",
    descriptionPlaceholder: "รายละเอียด / เหตุผล (ไม่บังคับ)",
    removeItem: "ลบรายการ",
    addItem: "เพิ่มรายการ",
    savedLocally: "รายการจะถูกบันทึกไว้ในอุปกรณ์นี้โดยอัตโนมัติ",
    clearList: "ล้างรายการ",
    downloadPdf: "ดาวน์โหลด PDF",
    sharePdf: "แชร์ PDF",
    shareCaption: "แชร์ไปยังแชตของทีมได้โดยตรง",
    readyToShare: "รายงานสต็อกพร้อมแชร์แล้ว",
    enterName: "กรุณากรอกชื่อก่อนสร้างรายงาน",
    finishRows: "กรุณากรอกรายการที่เริ่มไว้ให้ครบ หรือลบออกก่อนสร้างรายงาน",
    addOneItem: "เพิ่มสินค้าและจำนวนอย่างน้อยหนึ่งรายการเพื่อสร้างรายงาน",
    sharingUnavailable: "เบราว์เซอร์นี้ไม่รองรับการแชร์ไฟล์ จึงดาวน์โหลด PDF แทน",
    reportError: "สร้างรายงานไม่สำเร็จ กรุณาลองอีกครั้ง",
    categorySelect: "หมวดหมู่สต็อก",
    pdfReport: "ใบบันทึกสต็อกประจำวัน",
    submitted: "ส่งเมื่อ",
    itemCount: "รายการที่ตรวจนับ",
    countedBy: "ผู้ตรวจนับ",
    notSpecified: "ไม่ได้ระบุ",
    internalInventory: "รายงานสต็อกภายใน",
    categories: {
      received: { title: "Goods Received Log (รับสินค้าเข้าร้าน)", tag: "รับสินค้า" },
      storeroom: {
        title: "Main Storeroom Inventory Sheet (สต็อกหลักที่รอใช้งาน)",
        tag: "คลังสินค้าหลัก",
      },
      boh: {
        title: "BOH Par & Prep Sheet (ครัวและการเตรียมอาหาร)",
        tag: "BOH เตรียมอาหาร",
      },
      foh: {
        title: "FOH / Service Station Par Sheet (เคาน์เตอร์ เครื่องดื่ม บรรจุภัณฑ์)",
        tag: "FOH / บริการ",
      },
      waste: {
        title: "Daily Waste & Spoilage Log (สินค้าที่เสียก่อนจำหน่าย)",
        tag: "ของเสีย",
      },
    },
  },
};

export const localeByLanguage: Record<Language, string> = {
  en: "en-GB",
  fi: "fi-FI",
  th: "th-TH",
};
