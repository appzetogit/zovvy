# Homepage Color Audit + Theme

Source scope: `frontend/src/modules/user/pages/HomePage.jsx` + homepage-visible components in `UserLayout` + `frontend/src/index.css`.

## 1) Core Brand Tokens (already defined)

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#00A952` | Main CTA, highlights, active states |
| `primaryHover` | `#009246` | Button hover |
| `primaryDeep` | `#006B3C` | Deep brand shade |
| `background` | `#FFFFFF` | Main page background |
| `mint` / `primaryLight` | `#E6F7EF` | Soft tint backgrounds/borders |
| `surface` | `#F8FAFC` | Light surfaces/text-on-dark support |
| `textPrimary` | `#0F172A` | Primary text |
| `textSecondary` | `#64748B` | Secondary text |
| `offerRed` | `#E63946` | Discount/sale badge |
| `warning` | `#FACC15` | Warning/accent |
| `footerBg` | `#0F172A` | Footer/nav dark base |
| `footerText` | `#F8FAFC` | Footer text |
| `info` | `#2563EB` | Link/info tone |
| `gold` | `#D4AF37` | Premium accent |
| `skeleton` | `#E9EEF2` | Skeleton loading blocks |

## 2) Extra Explicit Colors Used on Homepage Components

### A) Text Colors
- `#4A4A4A` (product name text)
- `#374151` (mega menu item text)
- `#25D366` (mobile drawer icon/WhatsApp accent)
- `#EF4444` (wishlist heart fill)

### B) Background Colors
- `#FDFDFD` (hero/card light panel)
- `#F5F5F5` (review avatar section)
- `#0B1221` (mobile drawer background)
- Category strip pills:
  - `#006071`
  - `#67705B`
  - `#902D45`
  - `#7E3021`
  - `#C08552`
  - `#7D5A5A`
  - `#A68966`
- Product tag badge: `#B07038`
- Menu bullet green: `#10B981`

### C) Overlay / Alpha / Shadow Colors
- `rgba(0,0,0,0.12)`
- `rgba(0,0,0,0.15)`
- `rgba(0,0,0,0.25)`
- `rgba(0,0,0,0.3)`
- `rgba(255,255,255,0.02)`
- `rgba(255,255,255,0.1)`
- `rgba(255,255,255,0.55)`
- Utility overlays used frequently: `white/10`, `white/20`, `white/40`, `white/60`, `black/20`, `black/35`, `black/40`, `black/50`

## 3) Tailwind Palette Colors Used (Homepage scope)

- Gray scale used: `gray-50, 100, 200, 300, 400, 500, 600, 700, 800, 900`
- Other palette shades used: `slate-100`, `amber-50`, `amber-300`, `amber-900`, `red-500`, `red-600`, `emerald-600`, `emerald-700`

Reference hex (Tailwind defaults commonly mapped):
- `gray-50 #F9FAFB`, `gray-100 #F3F4F6`, `gray-200 #E5E7EB`, `gray-300 #D1D5DB`, `gray-400 #9CA3AF`, `gray-500 #6B7280`, `gray-600 #4B5563`, `gray-700 #374151`, `gray-800 #1F2937`, `gray-900 #111827`
- `slate-100 #F1F5F9`
- `amber-50 #FFFBEB`, `amber-300 #FCD34D`, `amber-900 #78350F`
- `red-500 #EF4444`, `red-600 #DC2626`
- `emerald-600 #059669`, `emerald-700 #047857`

## 4) Extracted Clean Theme (recommended)

Use this as unified homepage theme:

```css
:root {
  --bg: #FFFFFF;
  --surface: #F8FAFC;
  --surface-soft: #E6F7EF;

  --text-main: #0F172A;
  --text-muted: #64748B;

  --brand: #00A952;
  --brand-hover: #009246;
  --brand-deep: #006B3C;

  --accent-sale: #E63946;
  --accent-warm: #C08552;
  --accent-whatsapp: #25D366;

  --border-soft: #E5E7EB;
  --overlay-dark: rgba(0,0,0,0.35);
  --overlay-light: rgba(255,255,255,0.20);
}
```

## 5) Quick Mapping (Text / Background / Border)

- Text primary: `--text-main`
- Secondary text: `--text-muted`
- Main background: `--bg`
- Card background: `--surface`
- Section soft background: `--surface-soft`
- Primary buttons/links: `--brand`
- Button hover: `--brand-hover`
- Sale badges/errors: `--accent-sale`
- Borders: `--border-soft`

---

Note: This audit is code-defined colors only (images/banners ke pixel colors included nahi hain).
