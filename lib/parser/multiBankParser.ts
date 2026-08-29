/**
 * UPIlerify Multi-Bank UPI Email Alert Parser
 * Extracts bank, 12-digit UTR/RRN, credit amount, sender name, account ending, and reference note
 * across 13+ Indian Banks, Wallets, and PSPs.
 */

export interface ParsedUPIAlert {
  bank: string;
  amount: number;
  utr: string;
  sender: string;
  remark?: string;
  accountEnding?: string;
  date: string;
  receivedAt: number;
  rawSnippet: string;
  isValid: boolean;
}

export function parseUPIEmail(
  subject: string = '',
  body: string = '',
  timestamp: number = Date.now()
): ParsedUPIAlert {
  // Strip HTML and clean whitespace
  const cleanBody = body
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&₹;/g, '₹')
    .replace(/&#8377;/g, '₹')
    .replace(/&#8360;/g, 'Rs')
    .replace(/\s+/g, ' ')
    .trim();

  const fullText = `${subject}\n${cleanBody}`;

  let detectedBank = 'Generic UPI';
  let amount = 0;
  let utr = '';
  let sender = '';
  let remark = '';
  let accountEnding = '';
  let date = '';

  // 1. Detect Bank / Wallet
  if (/kotak|@kotak/i.test(fullText)) {
    detectedBank = 'Kotak 811';
  } else if (/hdfc/i.test(fullText)) {
    detectedBank = 'HDFC Bank';
  } else if (/icici/i.test(fullText)) {
    detectedBank = 'ICICI Bank';
  } else if (/sbi|state\s*bank/i.test(fullText)) {
    detectedBank = 'SBI';
  } else if (/axis/i.test(fullText)) {
    detectedBank = 'Axis Bank';
  } else if (/paytm|@paytm/i.test(fullText)) {
    detectedBank = 'Paytm Payments Bank';
  } else if (/phonepe|@ybl|@axl|@ibl/i.test(fullText)) {
    detectedBank = 'PhonePe';
  } else if (/google\s*pay|gpay|@okaxis|@oksbi|@okhdfcbank|@okicici/i.test(fullText)) {
    detectedBank = 'Google Pay';
  } else if (/cred/i.test(fullText)) {
    detectedBank = 'CRED UPI';
  } else if (/indusind/i.test(fullText)) {
    detectedBank = 'IndusInd Bank';
  } else if (/idfc/i.test(fullText)) {
    detectedBank = 'IDFC FIRST Bank';
  } else if (/pnb|punjab\s*national/i.test(fullText)) {
    detectedBank = 'PNB';
  } else if (/bank\s*of\s*baroda|bob/i.test(fullText)) {
    detectedBank = 'Bank of Baroda';
  }

  // 2. Extract Amount
  const amountPatterns = [
    /Amount\s*:\s*(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:UPI Credit Alert|credited by|credited with|received|credited)\s*:\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:received|credited|has been credited)/i,
    /(?:credited\s+for|payment\s+of)\s*(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:deposited\s+with|deposited\s+for)\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];

  for (const regex of amountPatterns) {
    const match = fullText.match(regex);
    if (match && match[1]) {
      const cleanNum = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  // 3. Extract 12-Digit UTR / RRN
  const utrPatterns = [
    /(?:UPI Reference Number\s*(?:\(RRN\))?|RRN|UPI Ref(?:erence)?\s*(?:No|Number)?|UTR(?:\s*Number)?|Ref\s*no\.?|Reference\s*ID)\s*[:=]\s*(\d{12})/i,
    /(?:UPI\/|Ref:?\s*|RRN:?\s*)(\d{12})/i,
    /\b(\d{12})\b/, // Standalone 12 digits
  ];

  for (const regex of utrPatterns) {
    const match = fullText.match(regex);
    if (match && match[1]) {
      utr = match[1];
      break;
    }
  }

  // 4. Extract Dynamic Sender Name / VPA
  const senderPatterns = [
    /Sender\s*:\s*([A-Za-z0-9\s.@_-]+?)(?=\s*(?:UPI Reference|RRN|View balance|Date|Amount|Ref|$|\.|\n))/i,
    /(?:received from|paid by|From)\s*:\s*([A-Za-z0-9\s.@_-]+?)(?=\s*(?:UTR|Ref|Note|Date|\.|\n|$))/i,
    /(?:received from|paid by|From)\s+([A-Za-z0-9\s.@_-]+?)(?=\s*(?:\(|\.|\n|UTR|UPI Ref|for Rs))/i,
  ];

  for (const regex of senderPatterns) {
    const match = fullText.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && !/^(the|a|an|your|account)$/i.test(candidate)) {
        sender = candidate;
        break;
      }
    }
  }

  // 5. Extract Remark / Note (e.g. ORD-1234, BID-5678, REF-890)
  const remarkPatterns = [
    /(?:Remark[s]?|Note|Transaction Note|Message|Ref Note)\s*[:=]\s*([A-Za-z0-9_-]+)/i,
    /\b(ORD-[\w\d]+)\b/i,
    /\b(UPI-[\w\d]+)\b/i,
    /\b(REF-[\w\d]+)\b/i,
    /\b(BID-[\w\d]+)\b/i,
  ];

  for (const regex of remarkPatterns) {
    const match = fullText.match(regex);
    if (match && match[1]) {
      remark = match[1].trim();
      break;
    }
  }

  // 6. Extract Account Ending (e.g., A/c **1234 or XXXXXX9878)
  const accMatch = fullText.match(/(?:A\/c|Account|a\/c no)\s*(?:\(?(?:X+|\*+)?(\d{4})\)?)/i);
  if (accMatch && accMatch[1]) {
    accountEnding = accMatch[1];
  }

  // 7. Extract Date
  const dateMatch = fullText.match(/Date\s*:\s*([\d/-]+(?:\s+[\d:]+(?:\s*[AP]M)?)?)/i);
  if (dateMatch && dateMatch[1]) {
    date = dateMatch[1].trim();
  }

  const isValid = amount > 0 && utr.length === 12;

  return {
    bank: detectedBank,
    amount,
    utr,
    sender: sender || 'UPI Customer',
    remark: remark || undefined,
    accountEnding: accountEnding || undefined,
    date: date || new Date().toLocaleString('en-IN'),
    receivedAt: timestamp,
    rawSnippet: fullText.slice(0, 300),
    isValid,
  };
}
