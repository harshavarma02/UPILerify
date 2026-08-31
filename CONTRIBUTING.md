# Contributing to UPIlerify

Thank you for your interest in contributing to **UPIlerify**! We are building an open-source, developer-first alternative to traditional high-fee payment aggregators in India.

---

## 🛠️ Local Development Workflow

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+ / v22+
- **Package Manager**: `npm` (or `pnpm` / `yarn`)
- **Git**

### 2. Fork & Clone
```bash
git clone https://github.com/<your-username>/upilerify.git
cd upilerify
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Environment
```bash
cp .env.example .env.local
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the interactive Developer Console.

---

## 🏦 Adding Support for a New Bank or PSP

Bank email parsing rules are defined in [`lib/parser/multiBankParser.ts`](lib/parser/multiBankParser.ts).

To add a new bank:
1. Identify the bank's sender email address or keywords.
2. Add regex patterns for amount extraction, 12-digit UTR/RRN, sender name, and reference notes.
3. Test your regex with redacted sample alert emails.
4. Run `npm run build` to verify type safety.

---

## 📝 Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature or bank parser
- `fix:` A bug fix
- `docs:` Documentation improvements
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code refactoring without changing functionality
- `test:` Adding or improving tests
- `chore:` Build scripts or dependency updates

---

## 🚀 Submitting a Pull Request

1. Create a descriptive feature branch: `git checkout -b feat/add-yes-bank-parser`
2. Make your changes and verify with `npm run build`.
3. Commit with a clear message: `git commit -m "feat: add YES Bank alert parsing"`
4. Push to your fork: `git push origin feat/add-yes-bank-parser`
5. Open a Pull Request on GitHub against `main`.
