/* @ds-bundle: {"format":4,"namespace":"WAWUAfricaDesignSystem_c75192","components":[{"name":"VerifiedTicks","sourcePath":"components/content/CreatorCard.jsx"},{"name":"CreatorCard","sourcePath":"components/content/CreatorCard.jsx"},{"name":"EventCard","sourcePath":"components/content/CreatorCard.jsx"},{"name":"CategoryTile","sourcePath":"components/content/CreatorCard.jsx"},{"name":"SearchField","sourcePath":"components/content/ExploreHero.jsx"},{"name":"ExploreHero","sourcePath":"components/content/ExploreHero.jsx"},{"name":"SectionHeader","sourcePath":"components/content/SectionHeader.jsx"},{"name":"TgifCard","sourcePath":"components/content/TgifCard.jsx"},{"name":"TypeTag","sourcePath":"components/content/TypeTag.jsx"},{"name":"DateBlock","sourcePath":"components/content/TypeTag.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/Button.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"Segmented","sourcePath":"components/core/Chip.jsx"},{"name":"Tabs","sourcePath":"components/core/Chip.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"FeedFrame","sourcePath":"components/feed/FeedFrame.jsx"},{"name":"ActionRail","sourcePath":"components/feed/FeedFrame.jsx"},{"name":"FeedCaption","sourcePath":"components/feed/FeedFrame.jsx"},{"name":"Byline","sourcePath":"components/feed/FeedFrame.jsx"},{"name":"OfferBar","sourcePath":"components/feed/FeedFrame.jsx"},{"name":"LockedOverlay","sourcePath":"components/feed/FeedFrame.jsx"},{"name":"FeedProfileCard","sourcePath":"components/feed/FeedFrame.jsx"},{"name":"SocialLinks","sourcePath":"components/identity/ProfileHeader.jsx"},{"name":"ProfileStats","sourcePath":"components/identity/ProfileHeader.jsx"},{"name":"ProfileHeader","sourcePath":"components/identity/ProfileHeader.jsx"},{"name":"ConversationRow","sourcePath":"components/inbox/ConversationRow.jsx"},{"name":"CURRENCIES","sourcePath":"components/money/Amount.jsx"},{"name":"Amount","sourcePath":"components/money/Amount.jsx"},{"name":"CurrencyFlag","sourcePath":"components/money/Amount.jsx"},{"name":"BalanceCard","sourcePath":"components/money/BalanceCard.jsx"},{"name":"AccountCard","sourcePath":"components/money/BalanceCard.jsx"},{"name":"TxIcon","sourcePath":"components/money/TxRow.jsx"},{"name":"TxRow","sourcePath":"components/money/TxRow.jsx"},{"name":"ServiceTile","sourcePath":"components/money/TxRow.jsx"},{"name":"HOME_TABS","sourcePath":"components/navigation/HomeTabs.jsx"},{"name":"HomeTabs","sourcePath":"components/navigation/HomeTabs.jsx"},{"name":"ScreenHeader","sourcePath":"components/navigation/HomeTabs.jsx"},{"name":"TABS","sourcePath":"components/navigation/TabBar.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"CreateFab","sourcePath":"components/navigation/TabBar.jsx"}],"sourceHashes":{"components/content/CreatorCard.jsx":"b854b845b9d1","components/content/ExploreHero.jsx":"bb68a7e7df87","components/content/SectionHeader.jsx":"3c22c9ee1e8c","components/content/TgifCard.jsx":"fd49b99c38e9","components/content/TypeTag.jsx":"05c88c59c8aa","components/core/Avatar.jsx":"54971cb0d6d5","components/core/Button.jsx":"a3d777eaf51d","components/core/Chip.jsx":"3f8db2d64901","components/core/Icon.jsx":"318f4fb5d93b","components/feed/FeedFrame.jsx":"925d2d74889e","components/identity/ProfileHeader.jsx":"f6c61adbe0ad","components/inbox/ConversationRow.jsx":"06bbc54e9ce3","components/money/Amount.jsx":"24dd81d009ea","components/money/BalanceCard.jsx":"e7080c7e07d9","components/money/TxRow.jsx":"51174e313100","components/navigation/HomeTabs.jsx":"7bb12175ce95","components/navigation/TabBar.jsx":"15d3eaf4d7f9","explorations/board-kit.jsx":"75954e78e96a","explorations/board.jsx":"d52660a6d9b1","explorations/dir-a.jsx":"92538fa2dbe6","explorations/dir-b.jsx":"634b0ce744ac","explorations/dir-c.jsx":"8425e5d52302","explorations/dir-d.jsx":"90ae450b2a92","explorations/dir-explore.jsx":"93748cfe5ce6","explorations/feed.jsx":"a18cb024a153","explorations/home.jsx":"3e65a4cdea60","explorations/tweaks-panel.jsx":"d259e3a86f73","guidelines/card-kit.js":"146d30d02695"},"inlinedExternals":[],"unexposedExports":[{"name":"formatMoney","sourcePath":"components/money/Amount.jsx"}]} */

(() => {

const __ds_ns = (window.WAWUAfricaDesignSystem_c75192 = window.WAWUAfricaDesignSystem_c75192 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/content/SectionHeader.jsx
try { (() => {
/** Section title with optional caption below and a purple "See all". */
function SectionHeader({
  title,
  caption,
  action = 'See all',
  onAction,
  style
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 10,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 'var(--text-h2)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-heading)',
      color: 'var(--text-primary)'
    }
  }, title), caption && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginTop: 3
    }
  }, caption)), action && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      flexShrink: 0,
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 13.5,
      fontWeight: 600,
      color: 'var(--accent-fg)'
    }
  }, action));
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const HUE = {
  lilac: 'var(--hue-lilac)',
  lemon: 'var(--hue-lemon)',
  green: 'var(--hue-green)',
  sky: 'var(--hue-sky)',
  pink: 'var(--hue-pink)',
  coral: 'var(--hue-coral)',
  sand: 'var(--hue-sand)'
};

/** Photo or initials disc. Initials sit on a bright hue in ink, never white-on-grey. */
function Avatar({
  name,
  initial,
  src,
  size = 44,
  hue = 'lilac',
  ring,
  accent,
  style,
  ...rest
}) {
  const letters = initial || (name ? name.split(' ').map(p => p[0]).slice(0, 2).join('') : 'W');
  const ringColor = ring === true ? 'var(--accent)' : ring;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      flexShrink: 0,
      background: src ? `center/cover url(${src})` : accent ? 'var(--accent)' : HUE[hue] || hue,
      color: accent ? '#FFFFFF' : '#111018',
      display: 'grid',
      placeItems: 'center',
      fontWeight: 700,
      fontSize: Math.round(size * 0.36),
      letterSpacing: '-0.02em',
      boxShadow: ringColor ? `0 0 0 2px var(--surface-page), 0 0 0 4px ${ringColor}` : 'none',
      ...style
    }
  }, rest), !src && letters);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
/** Filter chip. Selected = inverted ink pill; resting = outline. */
function Chip({
  children,
  selected,
  count,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      height: 36,
      padding: '0 15px',
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      background: selected ? 'var(--text-primary)' : 'transparent',
      color: selected ? 'var(--surface-page)' : 'var(--text-secondary)',
      boxShadow: selected ? 'none' : 'inset 0 0 0 1px var(--border-strong)',
      ...style
    }
  }, children, count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.6
    }
  }, "\xB7 ", count));
}

/** Segmented control on a sunken track — Naira / Dollar / Crypto, Physical / Virtual. */
function Segmented({
  items = [],
  value = 0,
  onChange,
  height = 42,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      padding: 4,
      gap: 2,
      borderRadius: 999,
      background: 'var(--surface-sunken)',
      ...style
    }
  }, items.map((t, i) => {
    const on = i === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t,
      type: "button",
      onClick: () => onChange && onChange(i),
      style: {
        flex: 1,
        height: height - 8,
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 600,
        background: on ? 'var(--surface-card)' : 'transparent',
        color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
        boxShadow: on ? '0 1px 3px rgba(0,0,0,.08), inset 0 0 0 1px var(--border-hairline)' : 'none'
      }
    }, t);
  }));
}

/** Profile tabs — Content / Services / Shop / About. Ink underline. */
function Tabs({
  items = [],
  value = 0,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      ...style
    }
  }, items.map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: t,
    type: "button",
    onClick: () => onChange && onChange(i),
    style: {
      appearance: 'none',
      outline: 'none',
      padding: '0 0 12px',
      border: 'none',
      borderBottom: i === value ? '2px solid var(--text-primary)' : '2px solid transparent',
      marginBottom: -1,
      background: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 600,
      color: i === value ? 'var(--text-primary)' : 'var(--text-muted)'
    }
  }, t)));
}
Object.assign(__ds_scope, { Chip, Segmented, Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
/* Lucide — the product's icon set (lucide-react). In the browser we load the
   same library from CDN and render icon node data, so stroke width, colour and
   fill behave exactly as in src/components/ui/Icon.tsx.
   Names are PascalCase Lucide names: "ShieldCheck", "ArrowUpRight", "House".
   Plus the two hand-drawn brand glyphs Lucide dropped: "whatsapp", "instagram"
   (copied verbatim from the product source). */
const LUCIDE_URL = 'https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js';
let lucideLoader = null;
function loadLucide() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.lucide) return Promise.resolve(window.lucide);
  if (!lucideLoader) {
    lucideLoader = new Promise(resolve => {
      const s = document.createElement('script');
      s.src = LUCIDE_URL;
      s.onload = () => resolve(window.lucide);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }
  return lucideLoader;
}
function toKebab(n) {
  return String(n).replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
}
function toPascal(n) {
  return String(n).replace(/(^|[-_\s])(\w)/g, (_, __, c) => c.toUpperCase());
}

/** Lucide ships several shapes across builds. Accept them all rather than guessing:
 *  [['path',{...}], …]  ·  ['svg',{...},[…]]  ·  [{tag,attr},…]  ·  { children: [...] } */
function normalize(raw) {
  if (!raw) return [];
  if (raw.icons) return [];
  if (Array.isArray(raw)) {
    if (raw.length === 3 && raw[0] === 'svg' && Array.isArray(raw[2])) return normalize(raw[2]);
    return raw.map(n => {
      if (Array.isArray(n)) return {
        tag: n[0],
        attrs: n[1] || {}
      };
      if (n && n.tag) return {
        tag: n.tag,
        attrs: n.attr || n.attrs || {}
      };
      return null;
    }).filter(Boolean);
  }
  if (Array.isArray(raw.children)) return normalize(raw.children);
  return [];
}
function Icon({
  name,
  size = 22,
  stroke = 1.8,
  color = 'currentColor',
  fill = 'none',
  style
}) {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !window.lucide) loadLucide().then(() => force(n => n + 1));
  }, []);
  const base = {
    display: 'block',
    flexShrink: 0,
    ...style
  };
  if (name === 'whatsapp') {
    return /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      strokeWidth: stroke,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: base
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M8.6 8.3c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-.9.8-.9 2s.9 2.3 1 2.5c.1.2 1.7 2.8 4.3 3.8 2.1.8 2.5.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.5-.3-1.4-.7c-.2-.1-.4-.1-.5.1l-.6.8c-.1.2-.3.2-.5.1a5.8 5.8 0 0 1-1.7-1c-.6-.6-1-1.2-1.2-1.4-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4z",
      fill: color,
      stroke: "none"
    }));
  }
  if (name === 'instagram') {
    return /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      strokeWidth: stroke,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: base
    }, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "3",
      width: "18",
      height: "18",
      rx: "5"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "4"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "17.2",
      cy: "6.8",
      r: "0.9",
      fill: color,
      stroke: "none"
    }));
  }
  const lib = typeof window !== 'undefined' ? window.lucide : null;
  const icons = lib && lib.icons;
  const raw = icons ? icons[name] || icons[toKebab(name)] || icons[toPascal(name)] : null;
  const children = normalize(raw);
  if (!children.length) return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: 'block',
      flexShrink: 0,
      width: size,
      height: size,
      ...style
    }
  });
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: fill,
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: base
  }, children.map((c, i) => React.createElement(c.tag, {
    key: i,
    ...c.attrs
  })));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/content/ExploreHero.jsx
try { (() => {
/** Explore top bar field: pill, hairline, search glyph. */
function SearchField({
  placeholder = 'Search WAWU',
  height = 44,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height,
      borderRadius: 999,
      background: 'var(--surface-card)',
      boxShadow: 'inset 0 0 0 1px var(--border-hairline)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 16px',
      color: 'var(--text-muted)',
      fontSize: 15,
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Search",
    size: 19
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }
  }, placeholder));
}

/** Explore hero: featured event photo, eyebrow, title, date · venue, paging dots. */
function ExploreHero({
  src,
  eyebrow = 'FEATURED EVENT',
  title,
  meta,
  pages = 3,
  page = 0,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 196,
      borderRadius: 24,
      background: `center/cover url(${src}) var(--surface-sunken)`,
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(0deg, rgba(11,10,13,.92), rgba(11,10,13,.2))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 18,
      right: 18,
      bottom: 16,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: '#D9A6F2'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '-0.025em',
      lineHeight: 1.1,
      maxWidth: 260
    }
  }, title), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      opacity: 0.8
    }
  }, meta)), pages > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 16,
      bottom: 18,
      display: 'flex',
      gap: 5
    }
  }, Array.from({
    length: pages
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: i === page ? 22 : 6,
      height: 6,
      borderRadius: 3,
      background: i === page ? '#fff' : 'rgba(255,255,255,.4)'
    }
  }))));
}
Object.assign(__ds_scope, { SearchField, ExploreHero });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/ExploreHero.jsx", error: String((e && e.message) || e) }); }

// components/content/TgifCard.jsx
try { (() => {
/** TGIF on Home · Today — the approved one-line row. Opens the full reading. */
function TgifCard({
  verse,
  onOpen,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onOpen,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      borderRadius: 18,
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      width: '100%',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-primary)',
      background: 'var(--surface-card)',
      boxShadow: 'inset 0 0 0 1px var(--border-hairline)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      background: 'linear-gradient(140deg,#4A0E68,#9411C9)',
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Sun",
    size: 20,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: 'var(--accent-fg)'
    }
  }, "TGIF \xB7 TODAY"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 14,
      fontWeight: 600,
      marginTop: 2,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, verse)), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ChevronRight",
    size: 18,
    color: "var(--text-muted)"
  }));
}
Object.assign(__ds_scope, { TgifCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/TgifCard.jsx", error: String((e && e.message) || e) }); }

// components/content/TypeTag.jsx
try { (() => {
/** Content-type pill over media (feed formats): "Photo set · 6", "PDF · 84 pages", "Members only · 18 min". */
function TypeTag({
  icon,
  children,
  light,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 26,
      padding: '0 10px',
      borderRadius: 999,
      background: light ? 'rgba(255,255,255,.9)' : 'rgba(11,10,13,.55)',
      backdropFilter: 'blur(10px)',
      color: light ? '#111018' : '#FFFFFF',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 13,
    stroke: 2.2
  }), children);
}

/** Purple month-over-day block on event cards. */
function DateBlock({
  month,
  day,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 48,
      borderRadius: 12,
      background: 'var(--accent)',
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.08em',
      opacity: 0.85
    }
  }, month), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      lineHeight: 1
    }
  }, day));
}
Object.assign(__ds_scope, { TypeTag, DateBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/TypeTag.jsx", error: String((e && e.message) || e) }); }

// components/content/CreatorCard.jsx
try { (() => {
/** Creator = purple tick, Professional = blue tick. Both can apply. */
function VerifiedTicks({
  creator = true,
  professional = false,
  size = 14,
  onMedia,
  style
}) {
  const tick = (fill, k) => /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    key: k,
    name: "BadgeCheck",
    size: size,
    stroke: 2,
    color: onMedia ? '#FFFFFF' : 'var(--surface-page)',
    fill: fill
  });
  if (!creator && !professional) return null;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 1,
      verticalAlign: 'middle',
      ...style
    }
  }, creator && tick('var(--tick-creator)', 'c'), professional && tick('var(--tick-professional)', 'p'));
}

/** Portrait photo IS the card. Name, role and a Follow pill sit on the scrim. */
function CreatorCard({
  name,
  role,
  src,
  following,
  creator = true,
  professional,
  width = 150,
  height = 200,
  onFollow,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      flexShrink: 0,
      borderRadius: 'var(--radius-media)',
      background: `center/cover url(${src}) var(--surface-sunken)`,
      position: 'relative',
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--scrim-card)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 10,
      right: 10,
      bottom: 10,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 14.5,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }
  }, name, /*#__PURE__*/React.createElement(VerifiedTicks, {
    creator: creator,
    professional: professional,
    size: 13,
    onMedia: true
  })), role && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.8,
      marginTop: 2,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, role)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onFollow,
    style: {
      height: 32,
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 700,
      color: '#fff',
      background: following ? 'rgba(255,255,255,.2)' : 'var(--accent)',
      backdropFilter: following ? 'blur(8px)' : undefined
    }
  }, following ? 'Following' : 'Follow')));
}

/** Photo top with date block + save; title, venue and two tags below. */
function EventCard({
  src,
  month,
  day,
  title,
  location,
  tags = [],
  saved,
  width = 230,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      flexShrink: 0,
      borderRadius: 'var(--radius-media)',
      background: 'var(--surface-card)',
      boxShadow: 'inset 0 0 0 1px var(--border-hairline)',
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 120,
      background: `center/cover url(${src}) var(--surface-sunken)`,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      left: 10
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.DateBlock, {
    month: month,
    day: day
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: 'rgba(11,10,13,.5)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Bookmark",
    size: 16,
    color: "#fff",
    fill: saved ? '#fff' : 'none'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '11px 13px 13px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 12.5,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "MapPin",
    size: 13
  }), location), tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 10
    }
  }, tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      height: 24,
      padding: '0 9px',
      borderRadius: 999,
      boxShadow: 'inset 0 0 0 1px var(--border-strong)',
      fontSize: 11.5,
      fontWeight: 600,
      color: 'var(--text-secondary)',
      display: 'grid',
      placeItems: 'center'
    }
  }, t)))));
}

/** Explore category tile — icon over label, 80×80. */
function CategoryTile({
  icon,
  label,
  selected,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      width: 80,
      height: 80,
      flexShrink: 0,
      borderRadius: 'var(--radius-tile)',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      background: selected ? 'var(--accent-tint)' : 'var(--surface-card)',
      boxShadow: selected ? 'inset 0 0 0 1.5px var(--accent)' : 'inset 0 0 0 1px var(--border-hairline)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      color: 'var(--text-primary)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 21,
    color: "var(--accent-fg)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      whiteSpace: 'nowrap'
    }
  }, label));
}
Object.assign(__ds_scope, { VerifiedTicks, CreatorCard, EventCard, CategoryTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/CreatorCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    h: 34,
    px: 14,
    fs: 13.5,
    ic: 15
  },
  md: {
    h: 44,
    px: 18,
    fs: 14.5,
    ic: 17
  },
  lg: {
    h: 54,
    px: 24,
    fs: 16,
    ic: 19
  }
};
function look(variant) {
  switch (variant) {
    case 'secondary':
      return {
        bg: 'var(--surface-card)',
        fg: 'var(--text-primary)',
        ring: 'inset 0 0 0 1px var(--border-hairline)',
        hover: 'var(--surface-sunken)'
      };
    case 'outline':
      return {
        bg: 'transparent',
        fg: 'var(--text-primary)',
        ring: 'inset 0 0 0 1px var(--border-strong)',
        hover: 'var(--surface-sunken)'
      };
    case 'white':
      return {
        bg: '#FFFFFF',
        fg: '#111018',
        ring: 'none',
        hover: 'rgba(255,255,255,.86)'
      };
    case 'glass':
      return {
        bg: 'var(--surface-glass)',
        fg: '#FFFFFF',
        ring: 'inset 0 0 0 1px var(--border-glass)',
        hover: 'rgba(255,255,255,.22)',
        blur: true
      };
    default:
      return {
        bg: 'var(--accent)',
        fg: 'var(--text-on-accent)',
        ring: 'none',
        hover: 'var(--accent-hover)'
      };
  }
}
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  disabled,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = look(variant);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onClick: disabled ? undefined : onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      height: s.h,
      padding: `0 ${s.px}px`,
      fontSize: s.fs,
      fontWeight: 700,
      fontFamily: 'var(--font-sans)',
      letterSpacing: '-0.01em',
      borderRadius: 'var(--radius-button)',
      border: 'none',
      boxShadow: v.ring,
      background: disabled ? 'var(--surface-sunken)' : hover ? v.hover : v.bg,
      color: disabled ? 'var(--text-disabled)' : v.fg,
      backdropFilter: v.blur ? 'var(--blur-chrome)' : undefined,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      width: full ? '100%' : undefined,
      whiteSpace: 'nowrap',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transform: press ? 'scale(0.98)' : 'none',
      transition: 'background 160ms cubic-bezier(.32,.72,0,1), transform 110ms cubic-bezier(.32,.72,0,1)',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.ic,
    stroke: 2.2
  }), children, iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.ic,
    stroke: 2.2
  }));
}

/** Round icon-only control. `tone`: card (default, hairline) · glass (over a cover photo). */
function IconButton({
  icon,
  size = 42,
  tone = 'card',
  dot,
  label,
  onClick,
  style
}) {
  const t = {
    card: ['var(--surface-card)', 'var(--text-primary)', 'inset 0 0 0 1px var(--border-hairline)'],
    glass: ['rgba(11,10,13,.4)', '#FFFFFF', 'none']
  }[tone] || [];
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label || icon,
    onClick: onClick,
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      border: 'none',
      background: t[0],
      color: t[1],
      boxShadow: t[2],
      display: 'grid',
      placeItems: 'center',
      position: 'relative',
      cursor: 'pointer',
      flexShrink: 0,
      backdropFilter: tone === 'glass' ? 'var(--blur-chrome)' : undefined,
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: Math.round(size * 0.46),
    stroke: 1.8
  }), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: size * 0.22,
      right: size * 0.24,
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--accent)',
      boxShadow: `0 0 0 2px ${t[0]}`
    }
  }));
}
Object.assign(__ds_scope, { Button, IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/identity/ProfileHeader.jsx
try { (() => {
const BRAND = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X',
  threads: 'Threads',
  facebook: 'Facebook',
  snapchat: 'Snapchat',
  spotify: 'Spotify',
  whatsapp: 'WhatsApp'
};

/** Real platform marks (monochrome, via Simple Icons) with the handle. Sits above the stats. */
function SocialLinks({
  links = [],
  theme = 'dark',
  style
}) {
  const c = theme === 'light' ? '111018' : 'F4F2F7';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflow: 'hidden',
      ...style
    }
  }, links.map(({
    platform,
    handle
  }) => /*#__PURE__*/React.createElement("span", {
    key: platform,
    title: BRAND[platform] || platform,
    style: {
      height: 34,
      padding: '0 12px 0 10px',
      borderRadius: 999,
      background: 'var(--surface-card)',
      boxShadow: 'inset 0 0 0 1px var(--border-hairline)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      flexShrink: 0,
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: `https://cdn.simpleicons.org/${platform}/${c}`,
    alt: "",
    style: {
      width: 15,
      height: 15
    }
  }), handle)));
}

/** "12.5K followers · 486 following · 48 pieces" — inline, bold figures. */
function ProfileStats({
  stats = [],
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 22,
      fontSize: 14,
      color: 'var(--text-secondary)',
      ...style
    }
  }, stats.map(([v, l]) => /*#__PURE__*/React.createElement("span", {
    key: l
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--text-primary)',
      fontSize: 16
    }
  }, v), " ", l)));
}

/** Approved Me: cover, avatar overlapping, Edit profile, name + tick, bio, social handles, counts, tabs. */
function ProfileHeader({
  cover,
  avatar,
  name,
  hue = 'lilac',
  bio,
  creator = true,
  professional,
  socials = [],
  stats = [],
  tabs = ['Content', 'Services', 'Shop', 'About'],
  tab = 0,
  theme = 'dark',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 200,
      background: cover ? `center/cover url(${cover})` : 'linear-gradient(150deg,#2A1240,#9411C9)',
      margin: '0 calc(-1 * var(--gutter))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      marginTop: -48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    src: avatar,
    hue: hue,
    size: 96,
    ring: "var(--surface-page)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      height: 38,
      padding: '0 16px',
      borderRadius: 999,
      boxShadow: 'inset 0 0 0 1px var(--border-strong)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 14,
      fontWeight: 600
    }
  }, "Edit profile")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 'var(--text-h1)',
      fontWeight: 700,
      letterSpacing: '-0.03em'
    }
  }, name, /*#__PURE__*/React.createElement(__ds_scope.VerifiedTicks, {
    creator: creator,
    professional: professional,
    size: 20
  })), bio && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      color: 'var(--text-secondary)',
      marginTop: 5,
      lineHeight: 1.45
    }
  }, bio)), socials.length > 0 && /*#__PURE__*/React.createElement(SocialLinks, {
    links: socials,
    theme: theme,
    style: {
      margin: '0 calc(-1 * var(--gutter))',
      padding: '0 var(--gutter)'
    }
  }), stats.length > 0 && /*#__PURE__*/React.createElement(ProfileStats, {
    stats: stats
  }), tabs && /*#__PURE__*/React.createElement(__ds_scope.Tabs, {
    items: tabs,
    value: tab,
    style: {
      marginTop: 4
    }
  })));
}
Object.assign(__ds_scope, { SocialLinks, ProfileStats, ProfileHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/identity/ProfileHeader.jsx", error: String((e && e.message) || e) }); }

// components/inbox/ConversationRow.jsx
try { (() => {
/** Inbox row. `kind` adds the money signal before the preview: money (green ↙), dm (paid DM clock), request (hand-coins). */
function ConversationRow({
  name,
  hue = 'lilac',
  avatar,
  leading,
  preview,
  time,
  unread = 0,
  kind,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '13px 0',
      boxShadow: 'inset 0 -1px 0 var(--border-hairline)',
      ...style
    }
  }, leading || /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    hue: hue,
    src: avatar,
    size: 52
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 600
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: unread ? 'var(--accent-fg)' : 'var(--text-muted)',
      fontWeight: unread ? 700 : 400
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: unread ? 'var(--text-primary)' : 'var(--text-secondary)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }
  }, kind === 'money' && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--positive-tint)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ArrowDownLeft",
    size: 13,
    stroke: 2.6,
    color: "var(--positive)"
  })), kind === 'dm' && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Clock",
    size: 15,
    stroke: 2.2,
    color: "var(--warning)"
  }), kind === 'request' && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "HandCoins",
    size: 16,
    color: "var(--text-secondary)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, preview)), unread > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 21,
      height: 21,
      padding: '0 6px',
      borderRadius: 11,
      background: 'var(--accent)',
      color: '#fff',
      fontSize: 11.5,
      fontWeight: 700,
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0
    }
  }, unread))));
}
Object.assign(__ds_scope, { ConversationRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inbox/ConversationRow.jsx", error: String((e && e.message) || e) }); }

// components/money/Amount.jsx
try { (() => {
const CURRENCIES = {
  NGN: {
    glyph: '₦',
    name: 'Naira',
    color: 'var(--cur-ngn)',
    decimals: 2
  },
  USD: {
    glyph: '$',
    name: 'Dollar',
    color: 'var(--cur-usd)',
    decimals: 2
  },
  USDT: {
    glyph: '₮',
    name: 'Tether',
    color: 'var(--cur-usdt)',
    decimals: 2,
    crypto: true
  },
  BTC: {
    glyph: '₿',
    name: 'Bitcoin',
    color: 'var(--cur-btc)',
    decimals: 6,
    crypto: true
  }
};

/** "₦485,250.00" · "$1,240.50" · "320.00 USDT". Crypto puts the code after. */
function formatMoney(value, currency = 'NGN', {
  decimals,
  sign
} = {}) {
  const c = CURRENCIES[currency] || CURRENCIES.NGN;
  const d = decimals ?? c.decimals;
  const n = Math.abs(Number(value || 0)).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });
  const pre = sign ? value < 0 ? '−' : '+' : '';
  return c.crypto ? `${pre}${n} ${currency}` : `${pre}${c.glyph}${n}`;
}

/** Tabular money. Kobo/cents render at 72% size and half opacity. `masked` hides the figure. */
function Amount({
  value,
  currency = 'NGN',
  size = 16,
  weight = 600,
  decimals = true,
  sign,
  color,
  masked,
  style
}) {
  const c = CURRENCIES[currency] || CURRENCIES.NGN;
  const base = {
    fontSize: size,
    fontWeight: weight,
    letterSpacing: '-0.025em',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    fontFeatureSettings: '"tnum" 1, "lnum" 1',
    color: color || (sign && value > 0 ? 'var(--positive)' : 'inherit'),
    ...style
  };
  if (masked) return /*#__PURE__*/React.createElement("span", {
    style: base
  }, c.crypto ? '' : c.glyph, "\u2022\u2022\u2022\u2022\u2022\u2022", c.crypto ? ' ' + currency : '');
  const full = formatMoney(value, currency, {
    decimals: decimals ? c.decimals : 0,
    sign
  });
  if (!decimals || c.crypto) return /*#__PURE__*/React.createElement("span", {
    style: base
  }, full);
  const [int, frac] = full.split('.');
  return /*#__PURE__*/React.createElement("span", {
    style: base
  }, int, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.72em',
      opacity: 0.5
    }
  }, ".", frac));
}

/** Currency disc — account rows, currency switcher. */
function CurrencyFlag({
  currency = 'NGN',
  size = 36,
  style
}) {
  const c = CURRENCIES[currency] || CURRENCIES.NGN;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: c.color,
      color: '#FFFFFF',
      display: 'grid',
      placeItems: 'center',
      fontSize: size * 0.46,
      fontWeight: 700,
      flexShrink: 0,
      ...style
    }
  }, c.glyph);
}
Object.assign(__ds_scope, { CURRENCIES, formatMoney, Amount, CurrencyFlag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/money/Amount.jsx", error: String((e && e.message) || e) }); }

// components/money/BalanceCard.jsx
try { (() => {
const DEFAULT_ACTIONS = [{
  icon: 'ArrowUpRight',
  label: 'Send'
}, {
  icon: 'Plus',
  label: 'Add'
}, {
  icon: 'Receipt',
  label: 'Bills'
}, {
  icon: 'ScanLine',
  label: 'Scan'
}];

/** The approved Home · Today money card: currency switcher, balance, four actions (first is primary). */
function BalanceCard({
  currency = 'NGN',
  balance = 0,
  masked,
  onToggleMask,
  actions = DEFAULT_ACTIONS,
  onAction,
  onCurrency,
  style
}) {
  const c = __ds_scope.CURRENCIES[currency] || __ds_scope.CURRENCIES.NGN;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-money)',
      background: 'var(--surface-money)',
      color: '#FFFFFF',
      padding: '18px 18px 16px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-money)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: -60,
      top: -80,
      width: 220,
      height: 220,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(148,17,201,.55), transparent 70%)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onCurrency,
    style: {
      height: 30,
      padding: '0 10px 0 4px',
      borderRadius: 999,
      border: 'none',
      background: 'rgba(255,255,255,.12)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.CurrencyFlag, {
    currency: currency,
    size: 22
  }), c.name, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ChevronDown",
    size: 14,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onToggleMask,
    "aria-label": masked ? 'Show balance' : 'Hide balance',
    style: {
      border: 'none',
      background: 'none',
      padding: 0,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: masked ? 'EyeOff' : 'Eye',
    size: 19,
    color: "rgba(255,255,255,.7)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      margin: '14px 0 18px'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Amount, {
    value: balance,
    currency: currency,
    size: 38,
    masked: masked
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, actions.map((a, i) => /*#__PURE__*/React.createElement("button", {
    key: a.label,
    type: "button",
    onClick: () => onAction && onAction(a.label),
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      width: 64,
      border: 'none',
      background: 'none',
      color: '#fff',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 48,
      height: 48,
      borderRadius: '50%',
      background: i ? 'rgba(255,255,255,.12)' : 'var(--accent)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: a.icon,
    size: 20,
    stroke: 2.2,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      opacity: 0.85
    }
  }, a.label)))));
}

/** Wallet-tab hero: balance + account number + copy. */
function AccountCard({
  currency = 'NGN',
  balance = 0,
  label,
  bank = 'WAWU · Fintava MFB',
  accountNumber,
  masked,
  style
}) {
  const c = __ds_scope.CURRENCIES[currency] || __ds_scope.CURRENCIES.NGN;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 28,
      background: 'var(--surface-money)',
      color: '#fff',
      padding: 22,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-money)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: -60,
      top: -80,
      width: 220,
      height: 220,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(148,17,201,.55), transparent 70%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      opacity: 0.7
    }
  }, label || `${c.name} balance`), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Eye",
    size: 19,
    color: "rgba(255,255,255,.7)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Amount, {
    value: balance,
    currency: currency,
    size: 42,
    masked: masked
  })), accountNumber && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      marginTop: 22,
      paddingTop: 16,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.6
    }
  }, bank), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      marginTop: 3,
      letterSpacing: '0.04em'
    }
  }, accountNumber)), /*#__PURE__*/React.createElement("span", {
    style: {
      height: 32,
      padding: '0 12px',
      borderRadius: 999,
      background: 'rgba(255,255,255,.12)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Copy",
    size: 14,
    color: "#fff"
  }), "Copy")));
}
Object.assign(__ds_scope, { BalanceCard, AccountCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/money/BalanceCard.jsx", error: String((e && e.message) || e) }); }

// components/money/TxRow.jsx
try { (() => {
/** Round glyph for a transaction. tone: neutral · in (green) · accent. */
function TxIcon({
  icon = 'ArrowLeftRight',
  tone = 'neutral',
  size = 44
}) {
  const bg = tone === 'in' ? 'var(--positive-tint)' : tone === 'accent' ? 'var(--accent-tint)' : 'var(--surface-sunken)';
  const fg = tone === 'in' ? 'var(--positive)' : tone === 'accent' ? 'var(--accent-fg)' : 'var(--text-primary)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: bg,
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size * 0.45,
    color: fg
  }));
}

/** One ledger line. Positive values render green with "+". */
function TxRow({
  leading,
  title,
  subtitle,
  value,
  currency = 'NGN',
  meta,
  masked,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, leading || /*#__PURE__*/React.createElement(TxIcon, null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginTop: 3,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Amount, {
    value: value,
    currency: currency,
    size: 15.5,
    sign: true,
    masked: masked,
    color: value > 0 ? 'var(--positive)' : 'var(--text-primary)'
  }), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      marginTop: 5
    }
  }, meta)));
}

/** Home services (Pay bills · Events · Legal · Shop, purple glyph, 60) and Wallet bills (Airtime · Data · Power · TV · More, neutral, 54). */
function ServiceTile({
  icon,
  label,
  soon,
  size = 60,
  tone = 'accent',
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: soon ? undefined : onClick,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      width: size + 16,
      border: 'none',
      background: 'none',
      padding: 0,
      cursor: soon ? 'default' : 'pointer',
      opacity: soon ? 0.45 : 1,
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: tone === 'neutral' ? 18 : size * 0.32,
      background: 'var(--surface-card)',
      boxShadow: 'inset 0 0 0 1px var(--border-hairline)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: Math.round(size * 0.42),
    color: tone === 'neutral' ? 'var(--text-primary)' : 'var(--accent-fg)'
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--text-secondary)',
      whiteSpace: 'nowrap'
    }
  }, label));
}
Object.assign(__ds_scope, { TxIcon, TxRow, ServiceTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/money/TxRow.jsx", error: String((e && e.message) || e) }); }

// components/navigation/HomeTabs.jsx
try { (() => {
const HOME_TABS = ['Today', 'Following', 'For you'];

/** Home's top tabs. Today is calm (page chrome); Following / For you go full-bleed (onDark). */
function HomeTabs({
  value = 0,
  onDark,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      ...style
    }
  }, HOME_TABS.map((t, i) => {
    const on = i === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t,
      type: "button",
      onClick: () => onChange && onChange(i),
      style: {
        appearance: 'none',
        outline: 'none',
        border: 'none',
        background: 'none',
        padding: '0 0 6px',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 16.5,
        fontWeight: 700,
        color: onDark ? '#FFFFFF' : on ? 'var(--text-primary)' : 'var(--text-muted)',
        opacity: onDark && !on ? 0.6 : 1,
        boxShadow: on ? `inset 0 -2.5px 0 ${onDark ? '#FFFFFF' : 'var(--accent)'}` : 'none'
      }
    }, t);
  }));
}

/** Large-title header for a tab root (Inbox, Wallet, Me). Children = trailing icon buttons. */
function ScreenHeader({
  title,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px var(--gutter) 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-title)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-title)'
    }
  }, title)), children && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, children));
}
Object.assign(__ds_scope, { HOME_TABS, HomeTabs, ScreenHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/HomeTabs.jsx", error: String((e && e.message) || e) }); }

// components/feed/FeedFrame.jsx
try { (() => {
const glass = {
  background: 'var(--surface-glass)',
  backdropFilter: 'var(--blur-chrome)',
  WebkitBackdropFilter: 'var(--blur-chrome)',
  boxShadow: 'inset 0 0 0 1px var(--border-glass)'
};

/** Full-bleed Following / For you frame. Fills a position:relative 390×844 screen; children are overlays.
    `background` is any CSS background (photo, gradient); `blur` frosts it (locked, PDF, audio). */
function FeedFrame({
  tab = 2,
  background = '#000',
  blur = 0,
  scrim = true,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      background: '#000',
      color: '#fff',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: blur ? -30 : 0,
      background,
      filter: blur ? `blur(${blur}px)` : 'none'
    }
  }), blur > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(11,10,13,.35)'
    }
  }), scrim && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--scrim-feed)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 56,
      left: 20,
      right: 20,
      zIndex: 5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.HomeTabs, {
    value: tab,
    onDark: true
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Search",
    size: 24,
    color: "#fff"
  })), children);
}

/** Right-edge rail: author, like, comment, save, ₦ tip. */
function ActionRail({
  name = 'Creator',
  avatar,
  hue = 'lemon',
  likes = '0',
  comments = '0',
  saves = '0',
  follow,
  onTip,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 14,
      bottom: 196,
      zIndex: 6,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 18,
      color: '#fff',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    src: avatar,
    hue: hue,
    size: 46,
    ring: "#fff"
  }), follow && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: -9,
      left: 13,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--accent)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Plus",
    size: 13,
    color: "#fff",
    stroke: 3
  }))), [['Heart', likes], ['MessageCircle', comments], ['Bookmark', saves]].map(([n, v]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: n,
    size: 28,
    color: "#fff",
    stroke: 2
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, v))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onTip,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      border: 'none',
      background: 'none',
      color: '#fff',
      padding: 0,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 42,
      height: 42,
      borderRadius: '50%',
      ...glass,
      boxShadow: 'none',
      display: 'grid',
      placeItems: 'center',
      fontSize: 18,
      fontWeight: 700
    }
  }, "\u20A6"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, "Tip")));
}

/** Bottom-left overlay stack: sits above the tab bar, clear of the action rail. */
function FeedCaption({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 104,
      zIndex: 6,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      ...style
    }
  }, children);
}

/** Type tag, name + tick, caption. */
function Byline({
  name,
  caption,
  typeIcon,
  type,
  professional,
  following,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingRight: 76,
      ...style
    }
  }, type && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.TypeTag, {
    icon: typeIcon
  }, type)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 16,
      fontWeight: 700
    }
  }, name, /*#__PURE__*/React.createElement(__ds_scope.VerifiedTicks, {
    professional: professional,
    size: 16,
    onMedia: true
  }), following && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      opacity: 0.75
    }
  }, "\xB7 Following")), caption && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      marginTop: 6,
      lineHeight: 1.4,
      opacity: 0.92
    }
  }, caption));
}

/** Glass purchase bar: what it is, how you pay, the price. Pay-from-wallet is implied. */
function OfferBar({
  icon = 'ShoppingBag',
  title,
  subtitle,
  price,
  cta,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      height: 56,
      marginRight: 70,
      borderRadius: 18,
      ...glass,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 8px 0 14px',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 22,
    color: "#fff"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.7
    }
  }, subtitle)), /*#__PURE__*/React.createElement("span", {
    style: {
      height: 40,
      padding: '0 14px',
      borderRadius: 13,
      background: '#fff',
      color: '#111018',
      display: 'grid',
      placeItems: 'center',
      fontSize: 14,
      fontWeight: 700,
      whiteSpace: 'nowrap'
    }
  }, cta || /*#__PURE__*/React.createElement(__ds_scope.Amount, {
    value: price || 0,
    size: 14,
    weight: 700,
    decimals: false
  })));
}

/** Locked piece: frosted frame with unlock + subscribe, paid from wallet. Place inside FeedFrame (blur ≈ 22). */
function LockedOverlay({
  title = 'Preview ended',
  body,
  unlockPrice,
  subscribePrice,
  balance,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 30,
      right: 30,
      top: 190,
      zIndex: 6,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14,
      color: '#fff',
      textAlign: 'center',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      ...glass,
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Lock",
    size: 28,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '-0.025em'
    }
  }, title), body && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      opacity: 0.85,
      lineHeight: 1.45
    }
  }, body), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: '100%',
      marginTop: 6
    }
  }, unlockPrice != null && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 50,
      borderRadius: 999,
      background: '#fff',
      color: '#111018',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      fontSize: 15.5,
      fontWeight: 700
    }
  }, "Unlock \xB7 ", /*#__PURE__*/React.createElement(__ds_scope.Amount, {
    value: unlockPrice,
    size: 15.5,
    weight: 700,
    decimals: false
  })), subscribePrice != null && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 50,
      borderRadius: 999,
      ...glass,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      fontSize: 15,
      fontWeight: 700
    }
  }, "Subscribe \xB7 ", /*#__PURE__*/React.createElement(__ds_scope.Amount, {
    value: subscribePrice,
    size: 15,
    weight: 700,
    decimals: false
  }), " / month")), balance != null && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12.5,
      opacity: 0.75
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Wallet",
    size: 14,
    color: "#fff"
  }), "Paid from Naira wallet \xB7 ", /*#__PURE__*/React.createElement(__ds_scope.Amount, {
    value: balance,
    size: 12.5,
    decimals: false
  }), " available"));
}

/** Creator / professional card that scrolls in the feed. Sits between header and caption zones. */
function FeedProfileCard({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 16,
      right: 16,
      top: 108,
      bottom: 178,
      zIndex: 4,
      borderRadius: 'var(--radius-feed-card)',
      overflow: 'hidden',
      background: '#16151B',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { FeedFrame, ActionRail, FeedCaption, Byline, OfferBar, LockedOverlay, FeedProfileCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feed/FeedFrame.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
/** The locked five tabs. Order and labels are fixed — do not add, remove or reorder. */
const TABS = [{
  id: 'home',
  icon: 'House',
  label: 'Home'
}, {
  id: 'explore',
  icon: 'Compass',
  label: 'Explore'
}, {
  id: 'inbox',
  icon: 'MessageCircle',
  label: 'Inbox'
}, {
  id: 'wallet',
  icon: 'Wallet',
  label: 'Wallet'
}, {
  id: 'me',
  icon: 'CircleUserRound',
  label: 'Me'
}];

/** Bottom tab bar. `onDark` for full-bleed feed screens. Pins to the bottom of a position:relative screen. */
function TabBar({
  active = 'home',
  badges = {},
  onDark,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 'var(--tabbar-h)',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px 26px',
      background: onDark ? 'rgba(11,10,13,.72)' : 'var(--surface-chrome)',
      backdropFilter: 'var(--blur-chrome)',
      WebkitBackdropFilter: 'var(--blur-chrome)',
      boxShadow: onDark ? 'inset 0 1px 0 rgba(255,255,255,.08)' : 'inset 0 1px 0 var(--border-hairline)',
      ...style
    }
  }, TABS.map(t => {
    const on = t.id === active;
    const color = on ? onDark ? '#FFFFFF' : 'var(--accent-fg)' : onDark ? 'rgba(255,255,255,.58)' : 'var(--text-muted)';
    const badge = badges[t.id];
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      type: "button",
      onClick: () => onChange && onChange(t.id),
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        color,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        position: 'relative',
        padding: 0,
        fontFamily: 'var(--font-sans)'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: t.icon,
      size: 24,
      stroke: on ? 2.2 : 1.8,
      fill: on ? onDark ? 'rgba(255,255,255,.2)' : 'var(--accent-tint-strong)' : 'none'
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-tab)',
        fontWeight: on ? 700 : 500
      }
    }, t.label), badge ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: -3,
        left: '56%',
        minWidth: 17,
        height: 17,
        padding: '0 4px',
        borderRadius: 9,
        background: 'var(--accent)',
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 0 0 2px var(--surface-page)'
      }
    }, badge) : null);
  }));
}

/** Create — floating, bottom-right, above the tab bar. Creator accounts only. */
function CreateFab({
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Create",
    onClick: onClick,
    style: {
      position: 'absolute',
      right: 18,
      bottom: 106,
      zIndex: 11,
      width: 58,
      height: 58,
      borderRadius: '50%',
      border: 'none',
      background: 'var(--accent)',
      color: '#fff',
      display: 'grid',
      placeItems: 'center',
      boxShadow: 'var(--shadow-fab)',
      cursor: 'pointer',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Plus",
    size: 26,
    stroke: 2.4,
    color: "#fff"
  }));
}
Object.assign(__ds_scope, { TABS, TabBar, CreateFab });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// explorations/board-kit.jsx
try { (() => {
// Shared primitives for the WAWU mobile nav board.
const MaskCtx = React.createContext(false);
const ThemeCtx = React.createContext('light');
function Icon({
  n,
  s = 22,
  w = 1.8,
  c = 'currentColor',
  fill = 'none',
  style
}) {
  const L = window.lucide && (window.lucide.icons || window.lucide);
  const node = L && L[n];
  if (!node) return /*#__PURE__*/React.createElement("span", {
    style: {
      width: s,
      height: s,
      display: 'inline-block',
      flexShrink: 0
    }
  });
  const kids = node[0] === 'svg' ? node[2] : node;
  return /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: fill,
    stroke: c,
    strokeWidth: w,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flexShrink: 0,
      display: 'block',
      ...style
    }
  }, kids.map(([t, a], i) => React.createElement(t, {
    ...a,
    key: i
  })));
}
const HUES = {
  lilac: '#9B7BFF',
  lemon: '#F4E94E',
  green: '#69D36A',
  sky: '#5BC8FF',
  pink: '#FF4FA8',
  coral: '#FF7A6B',
  yellow: '#FFB703',
  sand: '#E9D8C4'
};
function Avatar({
  name,
  hue = 'lilac',
  s = 44,
  ring,
  img
}) {
  const ini = name.split(' ').map(p => p[0]).slice(0, 2).join('');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: s,
      height: s,
      borderRadius: '50%',
      flexShrink: 0,
      background: img ? `center/cover url(${img})` : HUES[hue],
      color: '#111018',
      display: 'grid',
      placeItems: 'center',
      fontSize: s * 0.36,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      boxShadow: ring ? `0 0 0 2px var(--bg), 0 0 0 4px ${ring}` : 'none'
    }
  }, img ? null : ini);
}
function Amt({
  v,
  cur = '₦',
  size = 16,
  weight = 600,
  dec = true,
  sign,
  color,
  dim
}) {
  const masked = React.useContext(MaskCtx);
  const [i, d] = Math.abs(v).toFixed(2).split('.');
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const pre = sign ? v < 0 ? '−' : '+' : '';
  const isCrypto = cur.length > 1;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size,
      fontWeight: weight,
      letterSpacing: '-0.025em',
      fontFeatureSettings: '"tnum" 1,"lnum" 1',
      color: color || 'inherit',
      whiteSpace: 'nowrap',
      lineHeight: 1
    }
  }, masked ? /*#__PURE__*/React.createElement("span", null, isCrypto ? '' : cur, "\u2022\u2022\u2022\u2022\u2022\u2022") : /*#__PURE__*/React.createElement("span", null, pre, isCrypto ? '' : cur, int, dec && /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: dim === false ? 1 : 0.5,
      fontSize: '0.72em'
    }
  }, ".", d), isCrypto ? ' ' + cur : ''));
}
function StatusBar({
  onDark
}) {
  const c = onDark ? '#fff' : 'var(--t1)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 50,
      padding: '14px 28px 0 34px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: c,
      position: 'relative',
      zIndex: 5,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: '-0.01em'
    }
  }, "9:41"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 2,
      height: 12
    }
  }, [5, 7, 9, 11].map(h => /*#__PURE__*/React.createElement("div", {
    key: h,
    style: {
      width: 3,
      height: h,
      borderRadius: 1,
      background: c
    }
  }))), /*#__PURE__*/React.createElement(Icon, {
    n: "Wifi",
    s: 16,
    w: 2.4,
    c: c
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 25,
      height: 12,
      borderRadius: 4,
      border: `1.5px solid ${c}`,
      padding: 1.5,
      opacity: 0.9
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '75%',
      height: '100%',
      borderRadius: 2,
      background: c
    }
  }))));
}
function Phone({
  children,
  bg = 'var(--bg)',
  onDark
}) {
  const theme = React.useContext(ThemeCtx);
  return /*#__PURE__*/React.createElement("div", {
    className: "ph",
    "data-t": theme,
    style: {
      width: 412,
      height: 866,
      borderRadius: 62,
      padding: 11,
      background: '#0d0c10',
      boxShadow: '0 0 0 1.5px #2a2930, 0 40px 80px -30px rgba(40,20,60,.45)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 390,
      height: 844,
      borderRadius: 51,
      overflow: 'hidden',
      position: 'relative',
      background: bg,
      color: 'var(--t1)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 122,
      height: 35,
      borderRadius: 20,
      background: '#000',
      zIndex: 20
    }
  }), /*#__PURE__*/React.createElement(StatusBar, {
    onDark: onDark
  }), children, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 8,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 134,
      height: 5,
      borderRadius: 3,
      background: bg === '#000' ? '#fff' : 'var(--t1)',
      opacity: 0.85,
      zIndex: 30
    }
  })));
}
function Body({
  children,
  pad = 20,
  gap = 20,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    "data-body": "",
    style: {
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      padding: `4px ${pad}px 120px`,
      display: 'flex',
      flexDirection: 'column',
      gap,
      ...style
    }
  }, children);
}
function IconBtn({
  n,
  dot,
  s = 42,
  bg = 'var(--card)',
  c = 'var(--t1)',
  border = true
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: s,
      height: s,
      borderRadius: '50%',
      background: bg,
      display: 'grid',
      placeItems: 'center',
      position: 'relative',
      boxShadow: border ? 'inset 0 0 0 1px var(--line)' : 'none',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: s * 0.46,
    c: c
  }), dot && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: s * 0.22,
      right: s * 0.24,
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--acc)',
      boxShadow: `0 0 0 2px ${bg}`
    }
  }));
}
function Head({
  title,
  action = 'See all',
  size = 18
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size,
      fontWeight: 600,
      letterSpacing: '-0.02em'
    }
  }, title), action && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--t2)',
      fontWeight: 500
    }
  }, action));
}
function Chip({
  children,
  on,
  n
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 36,
      padding: '0 15px',
      borderRadius: 999,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 14,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      flexShrink: 0,
      background: on ? 'var(--t1)' : 'transparent',
      color: on ? 'var(--bg)' : 'var(--t2)',
      boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line2)'
    }
  }, n && /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 15
  }), children);
}
function Tile({
  n,
  label,
  size = 56,
  tint
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      width: size + 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: 18,
      background: tint || 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 24
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 500,
      color: 'var(--t2)',
      whiteSpace: 'nowrap'
    }
  }, label));
}
function TxIcon({
  n,
  tone = 'n'
}) {
  const bg = tone === 'in' ? 'var(--posT)' : tone === 'acc' ? 'var(--accT)' : 'var(--card2)';
  const c = tone === 'in' ? 'var(--pos)' : tone === 'acc' ? 'var(--sel)' : 'var(--t1)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: bg,
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 20,
    c: c
  }));
}
function TxRow({
  lead,
  title,
  sub,
  v,
  cur,
  meta,
  pad = 0
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: `${pad}px 0`
    }
  }, lead, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t3)',
      marginTop: 3
    }
  }, sub)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: v,
    cur: cur,
    size: 15.5,
    sign: true,
    color: v > 0 ? 'var(--pos)' : 'var(--t1)'
  }), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--t3)',
      marginTop: 5
    }
  }, meta)));
}
function Media({
  src,
  h = 200,
  r = 20,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: h,
      borderRadius: r,
      background: `center/cover url(img/${src}.jpg) #333`,
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      ...style
    }
  }, children);
}
function TypeTag({
  n,
  children,
  light
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 26,
      padding: '0 10px',
      borderRadius: 999,
      background: light ? 'rgba(255,255,255,.9)' : 'rgba(11,10,13,.55)',
      backdropFilter: 'blur(10px)',
      color: light ? '#111018' : '#fff',
      fontSize: 12,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 13,
    w: 2.2
  }), children);
}
function PriceTag({
  v,
  locked
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 28,
      padding: '0 11px',
      borderRadius: 999,
      background: '#fff',
      color: '#111018',
      fontSize: 13,
      fontWeight: 700
    }
  }, locked && /*#__PURE__*/React.createElement(Icon, {
    n: "Lock",
    s: 12,
    w: 2.4
  }), v === 0 ? 'Free' : /*#__PURE__*/React.createElement(Amt, {
    v: v,
    size: 13,
    weight: 700,
    dec: false
  }));
}
function Logo({
  h = 24
}) {
  const t = React.useContext(ThemeCtx);
  return /*#__PURE__*/React.createElement("img", {
    src: t === 'dark' ? '../assets/wawu-logo-white.png' : '../assets/wawu-logo.png',
    style: {
      height: h,
      width: 'auto',
      display: 'block'
    }
  });
}
function Verified({
  s = 16
}) {
  return /*#__PURE__*/React.createElement(Icon, {
    n: "BadgeCheck",
    s: s,
    c: "var(--vc)",
    fill: "var(--vcT)",
    w: 2
  });
}
function Seg({
  items,
  on = 0,
  h = 40
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      padding: 4,
      borderRadius: 999,
      background: 'var(--card2)',
      gap: 2
    }
  }, items.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      flex: 1,
      height: h - 8,
      borderRadius: 999,
      display: 'grid',
      placeItems: 'center',
      fontSize: 14,
      fontWeight: 600,
      background: i === on ? 'var(--card)' : 'transparent',
      color: i === on ? 'var(--t1)' : 'var(--t2)',
      boxShadow: i === on ? '0 1px 3px rgba(0,0,0,.08), inset 0 0 0 1px var(--line)' : 'none'
    }
  }, t)));
}
function Flag({
  cur,
  s = 36
}) {
  const map = {
    NGN: ['#0B8A4A', '₦'],
    USD: ['#1E3A8A', '$'],
    USDT: ['#26A17B', '₮'],
    BTC: ['#F7931A', '₿']
  };
  const [bg, g] = map[cur];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: s,
      height: s,
      borderRadius: '50%',
      background: bg,
      color: '#fff',
      display: 'grid',
      placeItems: 'center',
      fontSize: s * 0.46,
      fontWeight: 700,
      flexShrink: 0
    }
  }, g);
}
function Divider() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--line)'
    }
  });
}

// ---------- Nav bars ----------
function NavItem({
  n,
  label,
  on,
  labels = true
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      color: on ? 'var(--sel)' : 'var(--t3)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 24,
    w: on ? 2.2 : 1.8,
    fill: on ? 'var(--accT2)' : 'none'
  }), labels && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: on ? 700 : 500
    }
  }, label));
}
const NavOverride = React.createContext(false);

// Locked shell: Home · Explore · Inbox · Wallet · Me, Create as a FAB
function NavLocked({
  on,
  fab = true,
  onDark
}) {
  const items = [['House', 'Home'], ['Compass', 'Explore'], ['MessageCircle', 'Inbox'], ['Wallet', 'Wallet'], ['CircleUserRound', 'Me']];
  return /*#__PURE__*/React.createElement(React.Fragment, null, fab && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 18,
      bottom: 106,
      width: 58,
      height: 58,
      borderRadius: '50%',
      background: 'var(--acc)',
      display: 'grid',
      placeItems: 'center',
      boxShadow: '0 10px 24px -6px rgba(148,17,201,.65)',
      zIndex: 11
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Plus",
    s: 26,
    w: 2.4,
    c: "#fff"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 90,
      background: onDark ? 'rgba(11,10,13,.72)' : 'var(--chrome)',
      backdropFilter: 'blur(20px)',
      boxShadow: onDark ? 'inset 0 1px 0 rgba(255,255,255,.08)' : 'inset 0 1px 0 var(--line)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px 26px',
      zIndex: 10
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      color: on === i ? onDark ? '#fff' : 'var(--sel)' : onDark ? 'rgba(255,255,255,.58)' : 'var(--t3)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: it[0],
    s: 24,
    w: on === i ? 2.2 : 1.8,
    fill: on === i ? onDark ? 'rgba(255,255,255,.2)' : 'var(--accT2)' : 'none'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: on === i ? 700 : 500
    }
  }, it[1]), i === 2 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -3,
      left: '56%',
      minWidth: 17,
      height: 17,
      borderRadius: 9,
      background: 'var(--acc)',
      color: '#fff',
      fontSize: 10,
      fontWeight: 700,
      display: 'grid',
      placeItems: 'center',
      padding: '0 4px',
      boxShadow: '0 0 0 2px var(--bg)'
    }
  }, "3")))));
}

// A: five slots, Create raised in the middle
function NavCenterCreate({
  on
}) {
  if (React.useContext(NavOverride)) return /*#__PURE__*/React.createElement(NavLocked, {
    on: on
  });
  const items = [['House', 'Home'], ['Compass', 'Explore'], null, ['Wallet', 'Wallet'], ['CircleUserRound', 'Me']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 92,
      paddingBottom: 26,
      background: 'var(--chrome)',
      backdropFilter: 'blur(20px)',
      boxShadow: 'inset 0 1px 0 var(--line)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px 26px',
      zIndex: 10
    }
  }, items.map((it, i) => it ? /*#__PURE__*/React.createElement(NavItem, {
    key: i,
    n: it[0],
    label: it[1],
    on: on === i
  }) : /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 54,
      height: 54,
      borderRadius: 20,
      background: 'var(--acc)',
      display: 'grid',
      placeItems: 'center',
      boxShadow: '0 8px 20px -6px rgba(148,17,201,.6)',
      marginTop: -6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Plus",
    s: 26,
    w: 2.4,
    c: "#fff"
  })))));
}

// B: five flat tabs, Create is a FAB (the repo's current model, extended)
function NavFab({
  on,
  fab = true
}) {
  if (React.useContext(NavOverride)) return /*#__PURE__*/React.createElement(NavLocked, {
    on: on,
    fab: fab
  });
  const items = [['House', 'Home'], ['Compass', 'Explore'], ['MessageCircle', 'Inbox'], ['Wallet', 'Money'], ['CircleUserRound', 'You']];
  return /*#__PURE__*/React.createElement(React.Fragment, null, fab && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 18,
      bottom: 108,
      width: 58,
      height: 58,
      borderRadius: '50%',
      background: 'var(--acc)',
      display: 'grid',
      placeItems: 'center',
      boxShadow: '0 10px 24px -6px rgba(148,17,201,.65)',
      zIndex: 11
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Plus",
    s: 26,
    w: 2.4,
    c: "#fff"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 88,
      background: 'var(--chrome)',
      backdropFilter: 'blur(20px)',
      boxShadow: 'inset 0 1px 0 var(--line)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 6px 24px',
      zIndex: 10
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      color: on === i ? 'var(--t1)' : 'var(--t3)',
      position: 'relative'
    }
  }, on === i && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -14,
      width: 22,
      height: 3,
      borderRadius: 3,
      background: 'var(--acc)'
    }
  }), /*#__PURE__*/React.createElement(Icon, {
    n: it[0],
    s: 24,
    w: on === i ? 2.2 : 1.8,
    fill: on === i ? 'var(--accT2)' : 'none',
    c: on === i ? 'var(--sel)' : 'currentColor'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: on === i ? 700 : 500
    }
  }, it[1]), i === 2 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -3,
      left: '56%',
      minWidth: 17,
      height: 17,
      borderRadius: 9,
      background: 'var(--acc)',
      color: '#fff',
      fontSize: 10,
      fontWeight: 700,
      display: 'grid',
      placeItems: 'center',
      padding: '0 4px',
      boxShadow: '0 0 0 2px var(--bg)'
    }
  }, "3")))));
}

// C: Pay is the centre — the most frequent money action is one thumb away
function NavPay({
  on,
  onDark
}) {
  const items = [['Play', 'Watch'], ['Compass', 'Discover'], null, ['ReceiptText', 'Activity'], ['CircleUserRound', 'Me']];
  const bg = onDark ? 'rgba(11,10,13,.72)' : 'var(--chrome)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 92,
      background: bg,
      backdropFilter: 'blur(20px)',
      boxShadow: onDark ? 'inset 0 1px 0 rgba(255,255,255,.08)' : 'inset 0 1px 0 var(--line)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px 26px',
      zIndex: 10
    }
  }, items.map((it, i) => it ? /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      color: on === i ? onDark ? '#fff' : 'var(--sel)' : onDark ? 'rgba(255,255,255,.55)' : 'var(--t3)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: it[0],
    s: 24,
    w: on === i ? 2.2 : 1.8,
    fill: on === i ? onDark ? 'rgba(255,255,255,.2)' : 'var(--accT2)' : 'none'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: on === i ? 700 : 500
    }
  }, it[1])) : /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1.25,
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 48,
      padding: '0 18px',
      borderRadius: 999,
      background: on === 2 ? 'var(--acc)' : onDark ? '#fff' : 'var(--t1)',
      color: on === 2 ? '#fff' : onDark ? '#111018' : 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 15,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "ArrowUpRight",
    s: 19,
    w: 2.4
  }), "Pay"))));
}

// D: floating dock, active tab expands into a labelled pill
function Dock({
  on
}) {
  const items = [['House', 'Home'], ['Compass', 'Explore'], ['CreditCard', 'Cards'], ['MessageCircle', 'Inbox'], ['CircleUserRound', 'Me']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 26,
      height: 66,
      borderRadius: 999,
      background: 'var(--dock)',
      boxShadow: '0 16px 36px -12px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.07)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 9px',
      zIndex: 10
    }
  }, items.map((it, i) => on === i ? /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      height: 48,
      padding: '0 16px 0 13px',
      borderRadius: 999,
      background: 'var(--acc)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 14,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: it[0],
    s: 21,
    w: 2.2
  }), it[1]) : /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 48,
      height: 48,
      display: 'grid',
      placeItems: 'center',
      color: 'rgba(255,255,255,.62)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: it[0],
    s: 23
  }), i === 3 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      right: 11,
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: '#C368EA'
    }
  }))));
}
Object.assign(window, {
  MaskCtx,
  ThemeCtx,
  Icon,
  Avatar,
  Amt,
  StatusBar,
  Phone,
  Body,
  IconBtn,
  Head,
  Chip,
  Tile,
  TxIcon,
  TxRow,
  Media,
  TypeTag,
  PriceTag,
  Logo,
  Verified,
  Seg,
  Flag,
  Divider,
  NavCenterCreate,
  NavFab,
  NavLocked,
  NavOverride,
  NavPay,
  Dock,
  HUES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/board-kit.jsx", error: String((e && e.message) || e) }); }

// explorations/board.jsx
try { (() => {
const DIRS = [{
  k: 'A',
  name: 'Two Rooms',
  screens: window.DIR_A,
  labels: ['Home', 'Explore', 'Create', 'Wallet', 'Me'],
  nav: 'Home · Explore · ⊕ · Wallet · Me',
  msg: 'Messages move to the Home header.',
  why: 'Content and money each get a whole room. Home stays a pure feed; a balance chip in the header is the only bridge. The easiest model to learn — it is how people already think of “an app with a wallet”.',
  cost: 'Messages lose their tab, and paying still means leaving the feed.'
}, {
  k: 'B',
  name: 'Pocket',
  screens: window.DIR_B,
  labels: ['Home', 'Explore', 'Inbox', 'Money', 'You'],
  nav: 'Home · Explore · Inbox · Money · You',
  msg: 'Create stays a floating button, like the web app today.',
  why: 'Money comes along with you. Home opens with a small wallet card, tips go right under the content, and payments show up inside conversations. Closest to the current web nav, so it is the smallest jump for existing users.',
  cost: 'Home has two jobs, so the top of the feed must stay small.'
}, {
  k: 'C',
  name: 'Pay at the Centre',
  screens: window.DIR_C,
  labels: ['Watch', 'Discover', 'Pay', 'Activity', 'Me'],
  nav: 'Watch · Discover · [Pay] · Activity · Me',
  msg: 'Create moves to the Watch header and Me.',
  why: 'The middle button is for paying, not for posting. Paying someone is the thing people do most often, so it sits under the thumb. Watch is a full-screen feed where you can tip or unlock right on the video. Activity is one history for everything.',
  cost: 'Creators need an extra tap to post. It reads as a fintech app first.'
}, {
  k: 'D',
  name: 'Card Stack',
  screens: window.DIR_D,
  labels: ['Home', 'Explore', 'Cards', 'Inbox', 'Me'],
  nav: 'floating dock — Home · Explore · Cards · Inbox · Me',
  msg: 'Bills and transfers live on Home; Create lives in Me.',
  why: 'A premium, wallet-first Today screen. Naira, Dollar and Crypto are stacked cards you swipe through, and the WAWU card gets its own tab because a physical card is what makes it feel like a real bank.',
  cost: 'Content gets less room on Home. The floating dock covers part of the screen.'
}];
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "mask": false
} /*EDITMODE-END*/;
function Toggle({
  opts,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      padding: 4,
      borderRadius: 999,
      background: '#fff',
      boxShadow: 'inset 0 0 0 1px rgba(17,16,24,.1)'
    }
  }, opts.map(([v, l]) => /*#__PURE__*/React.createElement("button", {
    key: String(v),
    onClick: () => onChange(v),
    style: {
      border: 0,
      cursor: 'pointer',
      height: 40,
      padding: '0 20px',
      borderRadius: 999,
      fontSize: 15,
      fontWeight: 600,
      fontFamily: 'inherit',
      background: value === v ? '#111018' : 'transparent',
      color: value === v ? '#fff' : '#5D5B66'
    }
  }, l)));
}
function DirIntro({
  d
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 340,
      flexShrink: 0,
      paddingTop: 44,
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      color: '#111018'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 16,
      background: '#111018',
      color: '#fff',
      display: 'grid',
      placeItems: 'center',
      fontSize: 24,
      fontWeight: 700
    }
  }, d.k), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      fontWeight: 700,
      letterSpacing: '-0.035em',
      lineHeight: 1
    }
  }, d.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: '#8E8C96'
    }
  }, "NAV"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 600,
      marginTop: -12,
      lineHeight: 1.35
    }
  }, d.nav), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: '#5D5B66',
      marginTop: -10
    }
  }, d.msg), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: '#8E8C96',
      marginTop: 6
    }
  }, "WHY"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      lineHeight: 1.5,
      marginTop: -12,
      textWrap: 'pretty'
    }
  }, d.why), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: '#8E8C96',
      marginTop: 6
    }
  }, "TRADE-OFF"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      lineHeight: 1.5,
      marginTop: -12,
      color: '#5D5B66',
      textWrap: 'pretty'
    }
  }, d.cost));
}
function Board() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  return /*#__PURE__*/React.createElement(ThemeCtx.Provider, {
    value: t.theme
  }, /*#__PURE__*/React.createElement(MaskCtx.Provider, {
    value: t.mask
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      padding: 80,
      display: 'flex',
      flexDirection: 'column',
      gap: 110,
      fontFamily: 'var(--font-sans)',
      color: '#111018'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/wawu-logo.png",
    style: {
      height: 34,
      width: 'auto',
      alignSelf: 'flex-start'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 60,
      fontWeight: 700,
      letterSpacing: '-0.04em',
      lineHeight: 1
    }
  }, "Mobile \u2014 nav & key screens"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      color: '#5D5B66',
      maxWidth: 1000,
      lineHeight: 1.5
    }
  }, "Four ways to put content and money in one app, with 5 key screens each (20 total). Each direction is a different answer to one question: how close should the money sit to the content? Every screen works in light and dark mode.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Toggle, {
    opts: [['light', 'Light'], ['dark', 'Dark']],
    value: t.theme,
    onChange: v => setTweak('theme', v)
  }), /*#__PURE__*/React.createElement(Toggle, {
    opts: [[false, 'Show ₦'], [true, 'Hide ₦']],
    value: t.mask,
    onChange: v => setTweak('mask', v)
  }))), DIRS.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.k,
    style: {
      display: 'flex',
      gap: 56
    }
  }, /*#__PURE__*/React.createElement(DirIntro, {
    d: d
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 44
    }
  }, d.screens.map((S, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    id: d.k + (i + 1),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      paddingLeft: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 28,
      padding: '0 10px',
      borderRadius: 8,
      background: '#111018',
      color: '#fff',
      fontSize: 14,
      fontWeight: 700,
      display: 'grid',
      placeItems: 'center'
    }
  }, d.k, i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 600
    }
  }, d.labels[i])), /*#__PURE__*/React.createElement(S, null))))))), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Board"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Theme",
    value: t.theme,
    options: ['light', 'dark'],
    onChange: v => setTweak('theme', v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Hide balances",
    value: t.mask,
    onChange: v => setTweak('mask', v)
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Board, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/board.jsx", error: String((e && e.message) || e) }); }

// explorations/dir-a.jsx
try { (() => {
// Direction A — "Two Rooms": content and money are separate tabs, bridged by a balance chip.
function A_Home() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    h: 26
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 42,
      padding: '0 14px 0 6px',
      borderRadius: 999,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Flag, {
    cur: "NGN",
    s: 30
  }), /*#__PURE__*/React.createElement(Amt, {
    v: 485250,
    size: 14.5,
    dec: false
  })), !React.useContext(NavOverride) && /*#__PURE__*/React.createElement(IconBtn, {
    n: "MessageCircle",
    dot: true
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Bell",
    dot: React.useContext(NavOverride)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      padding: '0 20px 16px',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    on: true
  }, "For you"), /*#__PURE__*/React.createElement(Chip, null, "Following"), /*#__PURE__*/React.createElement(Chip, null, "Courses"), /*#__PURE__*/React.createElement(Chip, null, "Audio"), /*#__PURE__*/React.createElement(Chip, null, "Templates")), /*#__PURE__*/React.createElement(Body, {
    gap: 22
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: "w6",
    h: 250
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12
    }
  }, /*#__PURE__*/React.createElement(TypeTag, {
    n: "Play"
  }, "Video \xB7 18 min")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 58,
      height: 58,
      borderRadius: '50%',
      background: 'rgba(255,255,255,.92)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Play",
    s: 24,
    c: "#111018",
    fill: "#111018"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Tife Adeola",
    hue: "lemon",
    s: 40
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16.5,
      fontWeight: 600,
      letterSpacing: '-0.015em',
      lineHeight: 1.3
    }
  }, "Shooting a documentary on \u20A60 budget \u2014 the full breakdown"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 13.5,
      color: 'var(--t2)',
      marginTop: 5
    }
  }, "Tife Adeola ", /*#__PURE__*/React.createElement(Verified, {
    s: 14
  }), " \xB7 12K views \xB7 2d")), /*#__PURE__*/React.createElement(Icon, {
    n: "EllipsisVertical",
    s: 20,
    c: "var(--t3)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: "w2",
    h: 210
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      backdropFilter: 'blur(14px)',
      background: 'rgba(11,10,13,.35)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12
    }
  }, /*#__PURE__*/React.createElement(TypeTag, {
    n: "GraduationCap"
  }, "Course \xB7 9 lessons")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Lock",
    s: 26,
    c: "#fff"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 40,
      padding: '0 18px',
      borderRadius: 999,
      background: '#fff',
      color: '#111018',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontWeight: 700,
      fontSize: 14.5
    }
  }, "Unlock \xB7 ", /*#__PURE__*/React.createElement(Amt, {
    v: 8000,
    size: 14.5,
    weight: 700,
    dec: false
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Kemi Okafor",
    hue: "pink",
    s: 40
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16.5,
      fontWeight: 600,
      letterSpacing: '-0.015em'
    }
  }, "Pricing your freelance work in 2026"))))), /*#__PURE__*/React.createElement(NavCenterCreate, {
    on: 0
  }));
}
function A_Explore() {
  const creators = [['Tife Adeola', 'lemon', 'Film'], ['Kemi Okafor', 'pink', 'Design'], ['Chidi Eze', 'sky', 'Tech'], ['Amaka Nwosu', 'green', 'Music'], ['Femi B', 'coral', 'Biz']];
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(Body, {
    gap: 22,
    style: {
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Explore"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 50,
      borderRadius: 16,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 16px',
      color: 'var(--t3)',
      fontSize: 15.5
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Search",
    s: 20
  }), "Creators, courses, communities"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflow: 'hidden',
      margin: '-6px 0'
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    on: true
  }, "All"), /*#__PURE__*/React.createElement(Chip, {
    n: "Users"
  }, "Creators"), /*#__PURE__*/React.createElement(Chip, {
    n: "Hash"
  }, "Communities"), /*#__PURE__*/React.createElement(Chip, {
    n: "Calendar"
  }, "Events"), /*#__PURE__*/React.createElement(Chip, {
    n: "GraduationCap"
  }, "Learn")), /*#__PURE__*/React.createElement(Head, {
    title: "Rising this week"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      margin: '-8px 0 0'
    }
  }, creators.map(([n, h, t]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 7,
      width: 60
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    hue: h,
    s: 60
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      whiteSpace: 'nowrap'
    }
  }, n.split(' ')[0]), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: 'var(--t3)',
      marginTop: -5
    }
  }, t)))), /*#__PURE__*/React.createElement(Head, {
    title: "Top courses in Lagos"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginTop: -8
    }
  }, [['c1', 'Brand voice for small shops', 5000, 'Kemi Okafor'], ['w4', 'Sunset colour grading', 0, 'Tife Adeola']].map(([s, t, p, a]) => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: s,
    h: 132,
    r: 16
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 8,
      left: 8
    }
  }, /*#__PURE__*/React.createElement(PriceTag, {
    v: p,
    locked: p > 0
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em'
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--t3)',
      marginTop: -4
    }
  }, a)))), /*#__PURE__*/React.createElement(Head, {
    title: "Communities"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 18,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      marginTop: -8
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: "w5",
    h: 48,
    r: 14,
    style: {
      width: 48
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, "Lagos Freelancers"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, "4.2K members \xB7 7-day free trial")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 34,
      padding: '0 14px',
      borderRadius: 999,
      background: 'var(--t1)',
      color: 'var(--bg)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "Join"))), /*#__PURE__*/React.createElement(NavCenterCreate, {
    on: 1
  }));
}
function A_Create() {
  const types = [['Video', 'Play'], ['Course', 'GraduationCap'], ['Audio', 'AudioLines'], ['Book / PDF', 'BookOpen'], ['Image / Art', 'Image'], ['Template', 'LayoutTemplate']];
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'center/cover url(img/w6.jpg)',
      filter: 'blur(3px)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(11,10,13,.55)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 8,
      right: 8,
      bottom: 8,
      borderRadius: 44,
      background: 'var(--bg)',
      padding: '12px 20px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      zIndex: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 5,
      borderRadius: 3,
      background: 'var(--line2)',
      alignSelf: 'center'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: '-0.03em'
    }
  }, "Create"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--t2)',
      marginTop: 3
    }
  }, "Free or paid \u2014 you set the price.")), /*#__PURE__*/React.createElement(IconBtn, {
    n: "X",
    s: 38
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 10
    }
  }, types.map(([t, n]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      height: 96,
      borderRadius: 20,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 14
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 24
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 20,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)'
    }
  }, [['Calendar', 'Host an event', 'Reviewed before it goes live'], ['Hash', 'Post to a community', 'Lagos Freelancers +2'], ['HandCoins', 'Request money', 'Send a payment link']].map(([n, t, s], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '14px 16px',
      boxShadow: i ? 'inset 0 1px 0 var(--line)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(TxIcon, {
    n: n
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, s)), /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronRight",
    s: 18,
    c: "var(--t3)"
  }))))));
}
function A_Wallet() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Wallet"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    n: "ScanLine"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Settings2"
  }))), /*#__PURE__*/React.createElement(Body, {
    gap: 20
  }, /*#__PURE__*/React.createElement(Seg, {
    items: ['Naira', 'Dollar', 'Crypto'],
    on: 0,
    h: 42
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 28,
      background: 'var(--money)',
      color: '#fff',
      padding: 22,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--moneySh)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: -60,
      top: -80,
      width: 220,
      height: 220,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(148,17,201,.55), transparent 70%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      opacity: 0.7
    }
  }, "Naira balance"), /*#__PURE__*/React.createElement(Icon, {
    n: "Eye",
    s: 19,
    c: "rgba(255,255,255,.7)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: 485250,
    size: 42,
    weight: 600
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 16,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.6
    }
  }, "WAWU \xB7 Fintava MFB"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      marginTop: 3,
      letterSpacing: '0.04em'
    }
  }, "812 345 6789")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 32,
      padding: '0 12px',
      borderRadius: 999,
      background: 'rgba(255,255,255,.12)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Copy",
    s: 14,
    c: "#fff"
  }), "Copy"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, [['ArrowUpRight', 'Send'], ['Plus', 'Add money']].map(([n, t]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      flex: 1,
      height: 54,
      borderRadius: 999,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      fontSize: 15.5,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 19,
    w: 2.2
  }), t)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 54,
      height: 54,
      borderRadius: '50%',
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "ArrowLeftRight",
    s: 19,
    w: 2.2
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, [['Smartphone', 'Airtime'], ['Wifi', 'Data'], ['Zap', 'Power'], ['Tv', 'TV'], ['LayoutGrid', 'More']].map(([n, t]) => /*#__PURE__*/React.createElement(Tile, {
    key: t,
    n: n,
    label: t,
    size: 54
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Head, {
    title: "Transactions"
  }), /*#__PURE__*/React.createElement(TxRow, {
    lead: /*#__PURE__*/React.createElement(Avatar, {
      name: "Amaka Nwosu",
      hue: "green"
    }),
    title: "Amaka Nwosu",
    sub: "Tip on your video",
    v: 2000,
    meta: "10:24"
  }), /*#__PURE__*/React.createElement(TxRow, {
    lead: /*#__PURE__*/React.createElement(TxIcon, {
      n: "Zap"
    }),
    title: "Ikeja Electric",
    sub: "Prepaid \xB7 45.2 kWh",
    v: -10500,
    meta: "Yesterday"
  }))), /*#__PURE__*/React.createElement(NavCenterCreate, {
    on: 3
  }));
}
function A_Me() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 0',
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    n: "QrCode"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    n: "Share"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Settings"
  }))), /*#__PURE__*/React.createElement(Body, {
    gap: 20,
    style: {
      paddingTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Lennox Emmanuel",
    hue: "lilac",
    s: 92,
    ring: "var(--acc)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 23,
      fontWeight: 700,
      letterSpacing: '-0.03em',
      marginTop: 4
    }
  }, "Lennox Emmanuel ", /*#__PURE__*/React.createElement(Verified, {
    s: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--t2)',
      marginTop: -4
    }
  }, "@lennox \xB7 Creator \xB7 Lagos")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      borderRadius: 20,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      padding: '16px 0'
    }
  }, [['12.5K', 'Followers'], ['48', 'Pieces'], ['4.9', 'Rating']].map(([v, l], i) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      textAlign: 'center',
      boxShadow: i ? 'inset 1px 0 0 var(--line)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: '-0.03em'
    }
  }, v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--t3)',
      marginTop: 3
    }
  }, l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 22,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--t2)',
      fontWeight: 600
    }
  }, "Earned in September"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: 'var(--pos)',
      background: 'var(--posT)',
      padding: '4px 9px',
      borderRadius: 999
    }
  }, "+18%")), /*#__PURE__*/React.createElement(Amt, {
    v: 128400,
    size: 32
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      height: 40,
      alignItems: 'flex-end'
    }
  }, [30, 44, 26, 52, 38, 60, 48, 70, 56, 82, 64, 100].map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: h + '%',
      borderRadius: 4,
      background: i === 11 ? 'var(--acc)' : 'var(--card2)'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 20,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)'
    }
  }, [['LayoutGrid', 'My content', '48'], ['MessageSquareDot', 'Paid DMs', '₦500 / msg'], ['ShoppingBag', 'My purchases', '12']].map(([n, t, s], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '15px 16px',
      boxShadow: i ? 'inset 0 1px 0 var(--line)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 21
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15.5,
      fontWeight: 500
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--t3)'
    }
  }, s), /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronRight",
    s: 18,
    c: "var(--t3)"
  }))))), /*#__PURE__*/React.createElement(NavCenterCreate, {
    on: 4
  }));
}
window.DIR_A = [A_Home, A_Explore, A_Create, A_Wallet, A_Me];
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/dir-a.jsx", error: String((e && e.message) || e) }); }

// explorations/dir-b.jsx
try { (() => {
// Direction B — "Pocket": money rides along on Home and inside conversations.
function B_Home() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Lennox Emmanuel",
    hue: "lilac",
    s: 44
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--t2)'
    }
  }, "Good morning"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: '-0.02em'
    }
  }, "Lennox")), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Search"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Bell",
    dot: true
  })), /*#__PURE__*/React.createElement(Body, {
    gap: 24
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 26,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      padding: '18px 18px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13.5,
      color: 'var(--t2)',
      fontWeight: 500
    }
  }, "Naira wallet ", /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronDown",
    s: 15
  })), /*#__PURE__*/React.createElement(Icon, {
    n: "Eye",
    s: 18,
    c: "var(--t3)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '8px 0 18px'
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: 485250,
    size: 36
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, [['ArrowUpRight', 'Send', true], ['Plus', 'Add'], ['Receipt', 'Bills'], ['ArrowLeftRight', 'Swap']].map(([n, t, p]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 7,
      width: 66
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: '50%',
      background: p ? 'var(--acc)' : 'var(--card2)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 21,
    w: 2.2,
    c: p ? '#fff' : 'var(--t1)'
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--t2)'
    }
  }, t))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Head, {
    title: "Continue watching"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, [['w1', 'Orbit — a short film', 62], ['w5', 'Coastlines, ep. 3', 30]].map(([s, t, p]) => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      width: 230,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: s,
    h: 130,
    r: 18
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 10,
      right: 10,
      bottom: 10,
      height: 4,
      borderRadius: 2,
      background: 'rgba(255,255,255,.35)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: p + '%',
      height: '100%',
      borderRadius: 2,
      background: '#fff'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600
    }
  }, t))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Chidi Eze",
    hue: "sky",
    s: 36
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 14.5,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 5
    }
  }, "Chidi Eze ", /*#__PURE__*/React.createElement(Verified, {
    s: 14
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 400,
      color: 'var(--t3)'
    }
  }, "\xB7 3h"))), /*#__PURE__*/React.createElement(Media, {
    src: "w3",
    h: 170,
    r: 20
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12
    }
  }, /*#__PURE__*/React.createElement(TypeTag, {
    n: "AudioLines"
  }, "Audio \xB7 42 min"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: 'var(--t2)',
      fontWeight: 500,
      marginRight: 2
    }
  }, "Tip"), [500, 1000, 2500].map(v => /*#__PURE__*/React.createElement("div", {
    key: v,
    style: {
      height: 34,
      padding: '0 13px',
      borderRadius: 999,
      boxShadow: 'inset 0 0 0 1px var(--line2)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: v,
    size: 13.5,
    dec: false
  })))))), /*#__PURE__*/React.createElement(NavFab, {
    on: 0
  }));
}
function B_Explore() {
  const cats = [['w1', 'Video', '2.4K'], ['c2', 'Courses', '380'], ['w3', 'Audio', '910'], ['e2', 'Books', '220'], ['w5', 'Art', '1.1K'], ['c1', 'Templates', '540']];
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(Body, {
    gap: 20,
    style: {
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 50,
      borderRadius: 999,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 18px',
      color: 'var(--t3)',
      fontSize: 15.5
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Search",
    s: 20
  }), "Search WAWU"), /*#__PURE__*/React.createElement(IconBtn, {
    n: "SlidersHorizontal",
    s: 50
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      fontSize: 16,
      fontWeight: 600,
      boxShadow: 'inset 0 -1px 0 var(--line)'
    }
  }, ['Content', 'Creators', 'Communities', 'Events'].map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      paddingBottom: 12,
      color: i ? 'var(--t3)' : 'var(--t1)',
      borderBottom: i ? '2px solid transparent' : '2px solid var(--acccc)'
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, cats.map(([s, t, c], i) => /*#__PURE__*/React.createElement(Media, {
    key: t,
    src: s,
    h: i === 0 || i === 3 ? 196 : 148,
    r: 20,
    style: {
      gridRow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,.65))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 14,
      bottom: 12,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: '-0.02em'
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      opacity: 0.8,
      marginTop: 2
    }
  }, c, " pieces")))))), /*#__PURE__*/React.createElement(NavFab, {
    on: 1
  }));
}
function B_Inbox() {
  const rows = [['Amaka Nwosu', 'green', 'Sent you ₦5,000', '10:24', 'money', 2], ['Chidi Eze', 'sky', 'Paid DM · 18h left to reply', '09:51', 'dm', 1], ['Lagos Freelancers', 'lemon', 'Tolu: who’s at the meetup Sat?', '09:12', null, 0], ['Kemi Okafor', 'pink', 'Requested ₦12,000 · Logo edits', 'Yest.', 'req', 0], ['Femi Bankole', 'coral', 'You: Thanks, got it', 'Yest.', null, 0], ['WAWU', 'lilac', 'Your card has shipped', 'Mon', null, 0]];
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Inbox"), /*#__PURE__*/React.createElement(IconBtn, {
    n: "SquarePen"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      padding: '0 20px 14px'
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    on: true
  }, "All"), /*#__PURE__*/React.createElement(Chip, null, "Paid DMs \xB7 1"), /*#__PURE__*/React.createElement(Chip, null, "Communities"), /*#__PURE__*/React.createElement(Chip, null, "Money")), /*#__PURE__*/React.createElement(Body, {
    gap: 0,
    pad: 20
  }, rows.map(([n, h, m, t, k, u]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '13px 0',
      boxShadow: 'inset 0 -1px 0 var(--line)'
    }
  }, n === 'WAWU' ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: '50%',
      background: 'var(--card2)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/wawu-icon-purple.png",
    style: {
      width: 30
    }
  })) : /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    hue: h,
    s: 52
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 600
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: u ? 'var(--sel)' : 'var(--t3)',
      fontWeight: u ? 700 : 400
    }
  }, t)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: u ? 'var(--t1)' : 'var(--t2)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }
  }, k === 'money' && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--posT)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "ArrowDownLeft",
    s: 13,
    w: 2.6,
    c: "var(--pos)"
  })), k === 'dm' && /*#__PURE__*/React.createElement(Icon, {
    n: "Clock",
    s: 15,
    c: "var(--warn)",
    w: 2.2
  }), k === 'req' && /*#__PURE__*/React.createElement(Icon, {
    n: "HandCoins",
    s: 16,
    c: "var(--t2)"
  }), m), u > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 21,
      height: 21,
      borderRadius: 11,
      background: 'var(--acc)',
      color: '#fff',
      fontSize: 11.5,
      fontWeight: 700,
      display: 'grid',
      placeItems: 'center'
    }
  }, u)))))), /*#__PURE__*/React.createElement(NavFab, {
    on: 2
  }));
}
function B_Money() {
  const acc = [['NGN', 'Naira', 485250, '₦', '812 345 6789'], ['USD', 'Dollar', 1240.5, '$', 'US account · ••4410'], ['USDT', 'Tether', 320, 'USDT', 'TRC-20'], ['BTC', 'Bitcoin', 0.0142, 'BTC', '≈ ₦1,402,000']];
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Money"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    n: "ReceiptText"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Plus"
  }))), /*#__PURE__*/React.createElement(Body, {
    gap: 20
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--t2)',
      fontWeight: 500
    }
  }, "All accounts, in Naira"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: 3769840.2,
    size: 40
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      fontSize: 13.5,
      color: 'var(--pos)',
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "TrendingUp",
    s: 15,
    w: 2.4
  }), "\u20A642,100 this week")), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 22,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)'
    }
  }, acc.map(([c, l, v, cur, s], i) => /*#__PURE__*/React.createElement("div", {
    key: c,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '15px 16px',
      boxShadow: i ? 'inset 0 1px 0 var(--line)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(Flag, {
    cur: c,
    s: 40
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600
    }
  }, l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--t3)',
      marginTop: 3
    }
  }, s)), /*#__PURE__*/React.createElement(Amt, {
    v: v,
    cur: cur,
    size: 16,
    dec: c !== 'BTC'
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      borderRadius: 22,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 74,
      height: 48,
      borderRadius: 9,
      background: 'var(--money)',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/wawu-icon-white.png",
    style: {
      position: 'absolute',
      left: 7,
      top: 7,
      width: 16
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 7,
      bottom: 6,
      fontSize: 8,
      color: '#fff',
      fontWeight: 700,
      letterSpacing: '0.05em'
    }
  }, "VERVE")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, "WAWU card"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, "Physical \xB7 \u2022\u20224821 \xB7 Active")), /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronRight",
    s: 18,
    c: "var(--t3)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Head, {
    title: "Pay bills"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      rowGap: 14,
      justifyItems: 'center'
    }
  }, [['Smartphone', 'Airtime'], ['Wifi', 'Data'], ['Zap', 'Power'], ['Tv', 'Cable TV'], ['Router', 'Internet'], ['GraduationCap', 'School'], ['Landmark', 'Tax'], ['LayoutGrid', 'More']].map(([n, t]) => /*#__PURE__*/React.createElement(Tile, {
    key: t,
    n: n,
    label: t,
    size: 54
  }))))), /*#__PURE__*/React.createElement(NavFab, {
    on: 3,
    fab: false
  }));
}
function B_You() {
  return /*#__PURE__*/React.createElement(Phone, {
    onDark: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 200,
      background: 'center/cover url(img/w4.jpg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(0,0,0,.25), transparent 50%)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '6px 20px 0',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      zIndex: 3
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    n: "Share",
    bg: "rgba(11,10,13,.4)",
    c: "#fff",
    border: false
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Settings",
    bg: "rgba(11,10,13,.4)",
    c: "#fff",
    border: false
  })), /*#__PURE__*/React.createElement(Body, {
    gap: 16,
    style: {
      paddingTop: 76,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Lennox Emmanuel",
    hue: "lilac",
    s: 96,
    ring: "var(--bg)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 38,
      padding: '0 16px',
      borderRadius: 999,
      boxShadow: 'inset 0 0 0 1px var(--line2)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 14,
      fontWeight: 600
    }
  }, "Edit profile")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: '-0.03em'
    }
  }, "Lennox Emmanuel ", /*#__PURE__*/React.createElement(Verified, {
    s: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      color: 'var(--t2)',
      marginTop: 5,
      lineHeight: 1.45
    }
  }, "Filmmaker & brand strategist. Teaching African creators to get paid for their craft.")), /*#__PURE__*/React.createElement(Socials, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 22,
      fontSize: 14,
      color: 'var(--t2)'
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--t1)',
      fontSize: 16
    }
  }, "12.5K"), " followers"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--t1)',
      fontSize: 16
    }
  }, "486"), " following"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--t1)',
      fontSize: 16
    }
  }, "48"), " pieces")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      fontSize: 15,
      fontWeight: 600,
      boxShadow: 'inset 0 -1px 0 var(--line)',
      marginTop: 4
    }
  }, ['Content', 'Services', 'Shop', 'About'].map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      paddingBottom: 12,
      color: i ? 'var(--t3)' : 'var(--t1)',
      borderBottom: i ? '2px solid transparent' : '2px solid var(--t1)',
      marginBottom: -1
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 4,
      margin: '0 -20px'
    }
  }, ['w1', 'w2', 'w6', 'c1', 'w3', 'e3'].map((s, i) => /*#__PURE__*/React.createElement(Media, {
    key: s,
    src: s,
    h: 128,
    r: 0
  }, i === 1 || i === 4 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      backdropFilter: 'blur(10px)',
      background: 'rgba(0,0,0,.3)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 8,
      right: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Lock",
    s: 15,
    c: "#fff",
    w: 2.4
  }))) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 8,
      bottom: 7,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      color: '#fff',
      fontSize: 12,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Play",
    s: 12,
    c: "#fff",
    fill: "#fff"
  }), ['12K', '₦8K', '3.1K', '940', '₦2.5K', '8.4K'][i]))))), /*#__PURE__*/React.createElement(NavFab, {
    on: 4,
    fab: false
  }));
}
window.DIR_B = [B_Home, B_Explore, B_Inbox, B_Money, B_You];
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/dir-b.jsx", error: String((e && e.message) || e) }); }

// explorations/dir-c.jsx
try { (() => {
// Direction C — "Pay at the centre": the feed is immersive, and paying anyone is one thumb away.
function C_Watch() {
  return /*#__PURE__*/React.createElement(Phone, {
    onDark: true,
    bg: "#000"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'center/cover url(img/w1.jpg)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(0,0,0,.45), transparent 22%, transparent 50%, rgba(0,0,0,.85) 88%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 20px',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Search",
    s: 24,
    c: "#fff"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      fontSize: 16.5,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.6
    }
  }, "Following"), /*#__PURE__*/React.createElement("span", {
    style: {
      boxShadow: 'inset 0 -2px 0 #fff',
      paddingBottom: 6
    }
  }, "For you")), /*#__PURE__*/React.createElement(Icon, {
    n: "SquarePlus",
    s: 25,
    c: "#fff"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 14,
      bottom: 210,
      zIndex: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Tife Adeola",
    hue: "lemon",
    s: 48,
    ring: "#fff"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -9,
      left: 15,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--acc)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Plus",
    s: 13,
    c: "#fff",
    w: 3
  }))), [['Heart', '12.4K'], ['MessageCircle', '340'], ['Bookmark', '1.1K']].map(([n, v]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 30,
    c: "#fff",
    w: 2
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, v))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 46,
      height: 46,
      borderRadius: '50%',
      background: 'rgba(255,255,255,.18)',
      backdropFilter: 'blur(10px)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 20,
      fontWeight: 700
    }
  }, "\u20A6"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, "Tip"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 104,
      zIndex: 4,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      paddingRight: 70
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 16,
      fontWeight: 700
    }
  }, "Tife Adeola ", /*#__PURE__*/React.createElement(Icon, {
    n: "BadgeCheck",
    s: 16,
    c: "#fff",
    fill: "rgba(155,123,255,.9)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      marginTop: 6,
      lineHeight: 1.4,
      opacity: 0.92
    }
  }, "Orbit \u2014 lesson 1 of my VFX course. The rest is inside.")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      borderRadius: 18,
      background: 'rgba(255,255,255,.14)',
      backdropFilter: 'blur(20px)',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 8px 0 14px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "GraduationCap",
    s: 22,
    c: "#fff"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, "VFX for Beginners"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.7
    }
  }, "12 lessons \xB7 Pay from wallet")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 40,
      padding: '0 16px',
      borderRadius: 13,
      background: '#fff',
      color: '#111018',
      display: 'grid',
      placeItems: 'center',
      fontSize: 14,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: 8000,
    size: 14,
    weight: 700,
    dec: false
  })))), /*#__PURE__*/React.createElement(NavPay, {
    on: 0,
    onDark: true
  }));
}
function C_Discover() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(Body, {
    gap: 22,
    style: {
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Discover"), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Search"
  })), /*#__PURE__*/React.createElement(Media, {
    src: "e1",
    h: 228,
    r: 26
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,.8))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 14,
      left: 14,
      width: 52,
      height: 56,
      borderRadius: 14,
      background: '#fff',
      color: '#111018',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--acc)'
    }
  }, "OCT"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      lineHeight: 1
    }
  }, "12")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 16,
      color: '#fff',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.08em',
      opacity: 0.8
    }
  }, "EVENT \xB7 IN-PERSON"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      marginTop: 4
    }
  }, "Night Sky Creators Meetup"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      opacity: 0.8,
      marginTop: 3
    }
  }, "Yaba, Lagos \xB7 340 going")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 38,
      padding: '0 16px',
      borderRadius: 999,
      background: '#fff',
      color: '#111018',
      display: 'grid',
      placeItems: 'center',
      fontSize: 14,
      fontWeight: 700
    }
  }, "Going"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, [['GraduationCap', 'Learn', 'Courses & playbooks'], ['Briefcase', 'Services', 'CAC, NEPC, mentors'], ['Users', 'Communities', '120 active'], ['Store', 'Marketplace', 'Basket & Beauty']].map(([n, t, s]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      borderRadius: 22,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 13,
      background: 'var(--card2)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 21
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--t3)',
      marginTop: 3
    }
  }, s))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Head, {
    title: "Mentors available now"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Zainab Musa",
    hue: "sand",
    s: 48
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600
    }
  }, "Zainab Musa"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, "Export & NEPC \xB7 11 yrs")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 36,
      padding: '0 14px',
      borderRadius: 999,
      boxShadow: 'inset 0 0 0 1px var(--line2)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "Request")))), /*#__PURE__*/React.createElement(NavPay, {
    on: 1
  }));
}
function C_Pay() {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    n: "ScanLine"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 42,
      padding: '0 8px 0 6px',
      borderRadius: 999,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 14.5,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Flag, {
    cur: "NGN",
    s: 30
  }), "Naira", /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronDown",
    s: 16
  })), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Clock"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '14px 20px 118px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      justifyContent: 'center'
    }
  }, [['Amaka Nwosu', 'green', true], ['Chidi Eze', 'sky'], ['Kemi Okafor', 'pink'], ['Mum', 'sand'], ['+', null]].map(([n, h, on]) => h ? /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      width: 56,
      opacity: on ? 1 : 0.55
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    hue: h,
    s: 50,
    ring: on ? 'var(--acc)' : null
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600
    }
  }, n.split(' ')[0])) : /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      width: 56
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 50,
      height: 50,
      borderRadius: '50%',
      boxShadow: 'inset 0 0 0 1.5px var(--line2)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Search",
    s: 20,
    c: "var(--t2)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--t2)'
    }
  }, "Bank")))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 64,
      fontWeight: 600,
      letterSpacing: '-0.045em',
      lineHeight: 1
    }
  }, "\u20A625,000"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--t2)'
    }
  }, "To Amaka Nwosu \xB7 @amaka \xB7 Free"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 32,
      padding: '0 12px',
      borderRadius: 999,
      background: 'var(--card2)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      color: 'var(--t2)',
      fontWeight: 500,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "PenLine",
    s: 14
  }), "Add a note")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      rowGap: 4
    }
  }, keys.map(k => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 56,
      display: 'grid',
      placeItems: 'center',
      fontSize: 26,
      fontWeight: 500
    }
  }, k === '⌫' ? /*#__PURE__*/React.createElement(Icon, {
    n: "Delete",
    s: 24
  }) : k))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      borderRadius: 999,
      background: 'var(--acc)',
      color: '#fff',
      display: 'grid',
      placeItems: 'center',
      fontSize: 16.5,
      fontWeight: 700,
      marginTop: 10
    }
  }, "Send \u20A625,000")), /*#__PURE__*/React.createElement(NavPay, {
    on: 2
  }));
}
function C_Activity() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Activity"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    n: "Search"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Download"
  }))), /*#__PURE__*/React.createElement(Body, {
    gap: 18
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, [['Money in', 186400, 'var(--pos)', 'ArrowDownLeft', 72], ['Money out', 94150, 'var(--t1)', 'ArrowUpRight', 38]].map(([l, v, c, n, p]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      borderRadius: 20,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      color: 'var(--t2)',
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 15,
    w: 2.4,
    c: c
  }), l), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: v,
    size: 22,
    dec: false
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      borderRadius: 2,
      background: 'var(--card2)',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: p + '%',
      height: '100%',
      borderRadius: 2,
      background: c
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    on: true
  }, "All"), /*#__PURE__*/React.createElement(Chip, null, "Earnings"), /*#__PURE__*/React.createElement(Chip, null, "Transfers"), /*#__PURE__*/React.createElement(Chip, null, "Bills"), /*#__PURE__*/React.createElement(Chip, null, "Card")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.06em',
      color: 'var(--t3)'
    }
  }, "TODAY"), /*#__PURE__*/React.createElement(TxRow, {
    lead: /*#__PURE__*/React.createElement(TxIcon, {
      n: "GraduationCap",
      tone: "in"
    }),
    title: "Course sale",
    sub: "Pricing your freelance work",
    v: 8000,
    meta: "11:02"
  }), /*#__PURE__*/React.createElement(TxRow, {
    lead: /*#__PURE__*/React.createElement(Avatar, {
      name: "Amaka Nwosu",
      hue: "green"
    }),
    title: "Amaka Nwosu",
    sub: "Transfer \xB7 Rent split",
    v: -25000,
    meta: "10:40"
  }), /*#__PURE__*/React.createElement(TxRow, {
    lead: /*#__PURE__*/React.createElement(TxIcon, {
      n: "Smartphone"
    }),
    title: "MTN Airtime",
    sub: "0803 \u2022\u2022\u2022 4412",
    v: -2000,
    meta: "09:15"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.06em',
      color: 'var(--t3)',
      marginTop: 4
    }
  }, "YESTERDAY"), /*#__PURE__*/React.createElement(TxRow, {
    lead: /*#__PURE__*/React.createElement(TxIcon, {
      n: "MessageSquareDot",
      tone: "in"
    }),
    title: "Paid DM",
    sub: "From Chidi Eze \xB7 held 24h",
    v: 500,
    meta: "21:30"
  }), /*#__PURE__*/React.createElement(TxRow, {
    lead: /*#__PURE__*/React.createElement(TxIcon, {
      n: "CreditCard"
    }),
    title: "Spotify",
    sub: "WAWU card \u2022\u20224821",
    v: -2900,
    meta: "$1.99"
  })), /*#__PURE__*/React.createElement(NavPay, {
    on: 3
  }));
}
function C_Me() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(Body, {
    gap: 18,
    style: {
      paddingTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Lennox Emmanuel",
    hue: "lilac",
    s: 64
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: '-0.025em'
    }
  }, "Lennox Emmanuel ", /*#__PURE__*/React.createElement(Verified, {
    s: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--t2)',
      marginTop: 3
    }
  }, "WAWU ID \xB7 LEN-20931 \xB7 View profile")), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Settings"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 22,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, "Account level"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--t2)'
    }
  }, "Tier 2 of 3")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, [1, 1, 0].map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      background: f ? 'var(--acc)' : 'var(--card2)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--t2)',
      lineHeight: 1.4
    }
  }, "Add your NIN to lift daily limits to \u20A65,000,000 and order a physical card.")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 58,
      borderRadius: 20,
      background: 'var(--t1)',
      color: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 18px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Plus",
    s: 22,
    w: 2.4
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 16,
      fontWeight: 600
    }
  }, "Create something"), /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronRight",
    s: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, [['TrendingUp', 'Earnings', '₦128,400'], ['CreditCard', 'Cards', '2 active'], ['Landmark', 'Accounts', 'NGN · USD · Crypto'], ['ShoppingBag', 'Purchases', '12 items']].map(([n, t, s]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      borderRadius: 20,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      padding: 15,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 22
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, s))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 20,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)'
    }
  }, [['Bookmark', 'Saved'], ['ShieldCheck', 'Security & PIN'], ['LifeBuoy', 'Help']].map(([n, t], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '14px 16px',
      boxShadow: i ? 'inset 0 1px 0 var(--line)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 500
    }
  }, t), /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronRight",
    s: 18,
    c: "var(--t3)"
  }))))), /*#__PURE__*/React.createElement(NavPay, {
    on: 4
  }));
}
window.DIR_C = [C_Watch, C_Discover, C_Pay, C_Activity, C_Me];
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/dir-c.jsx", error: String((e && e.message) || e) }); }

// explorations/dir-d.jsx
try { (() => {
// Direction D — "Card stack": wallet-forward home, floating dock, Cards get their own tab.
function D_Home() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Lennox Emmanuel",
    hue: "lilac",
    s: 44
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 17,
      letterSpacing: '-0.015em'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t2)'
    }
  }, "Hello, "), /*#__PURE__*/React.createElement("b", null, "Lennox")), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Bell",
    dot: true
  })), /*#__PURE__*/React.createElement(Body, {
    gap: 18
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 250
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 14,
      right: 14,
      top: 0,
      height: 120,
      borderRadius: 24,
      background: '#9B7BFF',
      padding: '12px 18px',
      display: 'flex',
      justifyContent: 'space-between',
      color: '#111018',
      fontSize: 13.5,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", null, "Crypto"), /*#__PURE__*/React.createElement(Amt, {
    v: 1722,
    cur: "$",
    size: 13.5,
    weight: 700
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 7,
      right: 7,
      top: 38,
      height: 120,
      borderRadius: 24,
      background: '#F4E94E',
      padding: '12px 18px',
      display: 'flex',
      justifyContent: 'space-between',
      color: '#111018',
      fontSize: 13.5,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", null, "Dollar"), /*#__PURE__*/React.createElement(Amt, {
    v: 1240.5,
    cur: "$",
    size: 13.5,
    weight: 700
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 76,
      bottom: 0,
      borderRadius: 28,
      background: 'var(--money)',
      color: '#fff',
      padding: 22,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden',
      boxShadow: 'var(--moneySh)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: -40,
      bottom: -90,
      width: 240,
      height: 200,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(148,17,201,.5), transparent 70%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      opacity: 0.7
    }
  }, "Naira \xB7 Total balance"), /*#__PURE__*/React.createElement(Icon, {
    n: "Eye",
    s: 19,
    c: "rgba(255,255,255,.7)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: 485250,
    size: 40
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, [['ArrowUpRight', 'Send'], ['ArrowDownLeft', 'Receive']].map(([n, t]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      flex: 1,
      height: 54,
      borderRadius: 999,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      fontSize: 15.5,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 19,
    w: 2.2
  }), t)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 54,
      height: 54,
      borderRadius: '50%',
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Receipt",
    s: 19,
    w: 2.2
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Head, {
    title: "New from people you follow"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, [['w6', 'Rainbow falls — raw footage pack', 'Template', 3500, 'Tife A.'], ['c2', 'Quiet mornings, a sleep series', 'Audio', 0, 'Amaka N.']].map(([s, t, k, p, a]) => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      width: 196,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: s,
    h: 118,
    r: 18
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 8,
      left: 8
    }
  }, /*#__PURE__*/React.createElement(PriceTag, {
    v: p,
    locked: p > 0
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      lineHeight: 1.3
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--t3)',
      marginTop: -3
    }
  }, k, " \xB7 ", a)))))), /*#__PURE__*/React.createElement(Dock, {
    on: 0
  }));
}
function D_Explore() {
  const top = [['Tife Adeola', 'lemon', 'Film · 48 pieces'], ['Kemi Okafor', 'pink', 'Design · 31 pieces'], ['Chidi Eze', 'sky', 'Tech · 22 pieces'], ['Amaka Nwosu', 'green', 'Audio · 19 pieces']];
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(Body, {
    gap: 20,
    style: {
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Explore"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 52,
      borderRadius: 18,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 16px',
      color: 'var(--t3)',
      fontSize: 15.5
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Search",
    s: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Search people, content, events"), /*#__PURE__*/React.createElement(Icon, {
    n: "Mic",
    s: 19
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, ['#freelance', 'CAC registration', 'Afrobeats stems', 'Canva templates', 'Photography'].map(t => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      height: 34,
      padding: '0 13px',
      borderRadius: 999,
      background: 'var(--card2)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13.5,
      fontWeight: 500,
      color: 'var(--t2)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "TrendingUp",
    s: 13
  }), t))), /*#__PURE__*/React.createElement(Head, {
    title: "Top creators this week"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      marginTop: -6
    }
  }, top.map(([n, h, s], i) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      fontSize: 16,
      fontWeight: 700,
      color: i ? 'var(--t3)' : 'var(--sel)'
    }
  }, i + 1), /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    hue: h,
    s: 46
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 5
    }
  }, n, i < 2 && /*#__PURE__*/React.createElement(Verified, {
    s: 14
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, s)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 34,
      padding: '0 14px',
      borderRadius: 999,
      background: i === 1 ? 'transparent' : 'var(--t1)',
      color: i === 1 ? 'var(--t2)' : 'var(--bg)',
      boxShadow: i === 1 ? 'inset 0 0 0 1px var(--line2)' : 'none',
      display: 'grid',
      placeItems: 'center',
      fontSize: 13.5,
      fontWeight: 600
    }
  }, i === 1 ? 'Following' : 'Follow')))), /*#__PURE__*/React.createElement(Head, {
    title: "Happening soon"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginTop: -6
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: "e3",
    h: 60,
    r: 14,
    style: {
      width: 60
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, "Desert Light \u2014 photo walk"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, "Sat 19 Oct \xB7 Online \xB7 88 going")))), /*#__PURE__*/React.createElement(Dock, {
    on: 1
  }));
}
function D_Cards() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Cards"), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Plus"
  })), /*#__PURE__*/React.createElement(Body, {
    gap: 20
  }, /*#__PURE__*/React.createElement(Seg, {
    items: ['Physical', 'Virtual · USD'],
    on: 0,
    h: 42
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 214,
      borderRadius: 24,
      background: 'var(--card-ink)',
      color: '#fff',
      padding: 22,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 24px 40px -18px rgba(41,13,67,.7)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: -70,
      top: -70,
      width: 260,
      height: 260,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(148,17,201,.75), transparent 68%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/wawu-logo-white.png",
    style: {
      height: 22
    }
  }), /*#__PURE__*/React.createElement(Icon, {
    n: "Nfc",
    s: 24,
    c: "rgba(255,255,255,.8)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      marginTop: 30,
      width: 44,
      height: 32,
      borderRadius: 7,
      background: 'linear-gradient(135deg,#E9D8C4,#b9a58c)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 22,
      right: 22,
      bottom: 20,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      letterSpacing: '0.14em',
      fontWeight: 600
    }
  }, "\u2022\u2022\u2022\u2022 4821"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.65,
      marginTop: 5,
      letterSpacing: '0.06em'
    }
  }, "LENNOX EMMANUEL")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 800,
      fontStyle: 'italic',
      letterSpacing: '-0.02em'
    }
  }, "Verve"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, [['Snowflake', 'Freeze'], ['Eye', 'Details'], ['Gauge', 'Limits'], ['KeyRound', 'PIN']].map(([n, t]) => /*#__PURE__*/React.createElement(Tile, {
    key: t,
    n: n,
    label: t,
    size: 58
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 20,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13.5,
      color: 'var(--t2)',
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement("span", null, "Spent this month"), /*#__PURE__*/React.createElement("span", null, "of \u20A6500,000")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: 142300,
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 3,
      background: 'var(--card2)',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '28%',
      height: '100%',
      borderRadius: 3,
      background: 'var(--acc)'
    }
  }))), /*#__PURE__*/React.createElement(TxRow, {
    lead: /*#__PURE__*/React.createElement(TxIcon, {
      n: "ShoppingCart"
    }),
    title: "Shoprite Lekki",
    sub: "POS \xB7 Chip & PIN",
    v: -18450,
    meta: "Today"
  })), /*#__PURE__*/React.createElement(Dock, {
    on: 2
  }));
}
function D_Inbox() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Inbox"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    n: "Search"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "SquarePen"
  }))), /*#__PURE__*/React.createElement(Body, {
    gap: 18
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 22,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Kemi Okafor",
    hue: "pink",
    s: 44
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t2)'
    }
  }, "Kemi Okafor requested"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: 12000,
    size: 22,
    dec: false
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--t3)'
    }
  }, "for Logo edits")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 44,
      borderRadius: 999,
      boxShadow: 'inset 0 0 0 1px var(--line2)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 14.5,
      fontWeight: 600
    }
  }, "Decline"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.4,
      height: 44,
      borderRadius: 999,
      background: 'var(--acc)',
      color: '#fff',
      display: 'grid',
      placeItems: 'center',
      fontSize: 14.5,
      fontWeight: 700
    }
  }, "Pay \u20A612,000"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14
    }
  }, [['Lagos Freelancers', 'w5'], ['Night Sky', 'e1'], ['VFX Crew', 'w1'], ['Coastline', 'w3']].map(([n, s], i) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      width: 68
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 2.5,
      borderRadius: 22,
      boxShadow: i < 2 ? '0 0 0 2px var(--acc)' : '0 0 0 1px var(--line2)'
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: s,
    h: 60,
    r: 19,
    style: {
      width: 60
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      width: '100%',
      textAlign: 'center'
    }
  }, n)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, [['Chidi Eze', 'sky', 'Paid DM · ₦500 held until you reply', '09:51', true], ['Amaka Nwosu', 'green', 'Sent ₦25,000 · rent split', '08:40'], ['Femi Bankole', 'coral', 'Can we do a call Thursday?', 'Yest.'], ['Zainab Musa', 'sand', 'Mentor request accepted', 'Mon']].map(([n, h, m, t, u]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    hue: h,
    s: 50
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15.5,
      fontWeight: 600
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: u ? 'var(--sel)' : 'var(--t3)',
      fontWeight: u ? 700 : 400
    }
  }, t)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: u ? 'var(--t1)' : 'var(--t2)',
      marginTop: 3,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, m)))))), /*#__PURE__*/React.createElement(Dock, {
    on: 3
  }));
}
function D_Me() {
  const qr = Array.from({
    length: 81
  }, (_, i) => (i * 7 + (i >> 2) * 3) % 5 < 2);
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Me"), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Settings"
  })), /*#__PURE__*/React.createElement(Body, {
    gap: 18
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 28,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Lennox Emmanuel",
    hue: "lilac",
    s: 60
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: '-0.02em'
    }
  }, "Lennox Emmanuel ", /*#__PURE__*/React.createElement(Verified, {
    s: 17
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--t2)',
      marginTop: 3
    }
  }, "@lennox \xB7 Creator"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 104,
      height: 104,
      borderRadius: 18,
      background: '#fff',
      padding: 10,
      flexShrink: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(9,1fr)',
      gap: 1.5
    }
  }, qr.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: f ? '#111018' : 'transparent',
      borderRadius: 1.5
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t3)',
      fontWeight: 600,
      letterSpacing: '0.05em'
    }
  }, "WAWU ID"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      marginTop: 2
    }
  }, "LEN-20931")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t3)',
      fontWeight: 600,
      letterSpacing: '0.05em'
    }
  }, "ACCOUNT NO."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      marginTop: 2
    }
  }, "812 345 6789")))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t2)',
      textAlign: 'center',
      marginTop: -4
    }
  }, "Scan to pay or follow Lennox")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      borderRadius: 22,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: '50%',
      background: 'conic-gradient(var(--acc) 0 82%, var(--card2) 82% 100%)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: '50%',
      background: 'var(--card)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 15,
      fontWeight: 700
    }
  }, "82")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600
    }
  }, "Trust Score \xB7 Trusted"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, "8 more points to Elite")), /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronRight",
    s: 18,
    c: "var(--t3)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 20,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)'
    }
  }, [['LayoutGrid', 'My content'], ['TrendingUp', 'Earnings'], ['ShieldCheck', 'Security & PIN']].map(([n, t], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '14px 16px',
      boxShadow: i ? 'inset 0 1px 0 var(--line)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 500
    }
  }, t), /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronRight",
    s: 18,
    c: "var(--t3)"
  }))))), /*#__PURE__*/React.createElement(Dock, {
    on: 4
  }));
}
window.DIR_D = [D_Home, D_Explore, D_Cards, D_Inbox, D_Me];
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/dir-d.jsx", error: String((e && e.message) || e) }); }

// explorations/dir-explore.jsx
try { (() => {
// Explore — eight variants, all built from the web Explore content model:
// featured hero, creator categories, featured creators (photo + Follow), events (date block),
// professional doors, learning, platform services (commissioned art), featured-this-week.
const CR = [['Adaeze Okonkwo', 'Business Strategist', 'p1', 2], ['Funmi Adeyemi', 'Accountant', 'p2', 1], ['Zainab Bello', 'Agribusiness Trainer', 'p3', 1], ['Musa Danladi', 'Welder & trainer', 'p4', 0], ['Ifeanyi Nwosu', 'Fashion Designer', 'p5', 1]];
const CATS = [['LayoutGrid', 'All'], ['Music', 'Music'], ['Clapperboard', 'Film & Video'], ['Palette', 'Art & Design'], ['Camera', 'Photography'], ['Shirt', 'Fashion'], ['PenLine', 'Writing'], ['Ellipsis', 'More']];
const SVC = [['bills', 'Bills'], ['events', 'Events'], ['legal', 'Legal'], ['loans', 'Loans', 1], ['bnpl', 'BNPL', 1], ['pensions', 'Pensions', 1], ['telemedicine', 'Health', 1], ['shop', 'Shop', 1]];
const EV = [['e1', 'OCT', '12', 'WAWU Creators Summit', 'Eko Convention Centre', 'Conference'], ['e2', 'OCT', '18', 'Gospel Night Live', 'Abuja', 'Concert'], ['e3', 'NOV', '02', 'Monetise Your Content', 'Online', 'Workshop']];
function Search({
  ph = 'Search creators, services, events',
  h = 48,
  r = 999
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: h,
      borderRadius: r,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 16px',
      color: 'var(--t3)',
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Search",
    s: 19
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }
  }, ph));
}
function Follow({
  on,
  h = 34,
  light
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: h,
      borderRadius: 999,
      display: 'grid',
      placeItems: 'center',
      fontSize: 13.5,
      fontWeight: 700,
      background: on ? light ? 'rgba(255,255,255,.2)' : 'transparent' : 'var(--acc)',
      color: on ? light ? '#fff' : 'var(--t2)' : '#fff',
      boxShadow: on && !light ? 'inset 0 0 0 1px var(--line2)' : 'none',
      backdropFilter: light ? 'blur(8px)' : 'none'
    }
  }, on ? 'Following' : 'Follow');
}
function Ticks({
  n = 1,
  s = 14
}) {
  if (!n) return null;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 1
    }
  }, Array.from({
    length: n
  }).map((_, i) => /*#__PURE__*/React.createElement(Icon, {
    key: i,
    n: "BadgeCheck",
    s: s,
    c: "#fff",
    fill: i ? '#3DA5FF' : '#9411C9',
    w: 2
  })));
}
function CreatorCard({
  c,
  w = 150,
  h = 200,
  on
}) {
  const [name, role, img, ticks] = c;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: w,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: img,
    h: h,
    r: 20
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, transparent 40%, rgba(11,10,13,.88))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 10,
      right: 10,
      bottom: 10,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 14.5,
      fontWeight: 700,
      whiteSpace: 'nowrap'
    }
  }, name.split(' ')[0], " ", name.split(' ')[1][0], ".", /*#__PURE__*/React.createElement(Ticks, {
    n: ticks,
    s: 13
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.8,
      marginTop: 2,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, role)), /*#__PURE__*/React.createElement(Follow, {
    on: on,
    h: 32,
    light: true
  }))));
}
function DateBlock({
  m,
  d,
  s = 1
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44 * s,
      height: 48 * s,
      borderRadius: 12 * s,
      background: 'var(--acc)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9.5 * s,
      fontWeight: 700,
      letterSpacing: '0.08em',
      opacity: 0.85
    }
  }, m), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18 * s,
      fontWeight: 700,
      lineHeight: 1
    }
  }, d));
}
function EventCard({
  e,
  w = 230
}) {
  const [img, m, d, t, loc, tag] = e;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: w,
      flexShrink: 0,
      borderRadius: 20,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: img,
    h: 120,
    r: 0
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      left: 10
    }
  }, /*#__PURE__*/React.createElement(DateBlock, {
    m: m,
    d: d
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: 'rgba(11,10,13,.5)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Bookmark",
    s: 16,
    c: "#fff"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '11px 13px 13px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 12.5,
      color: 'var(--t3)',
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "MapPin",
    s: 13
  }), loc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 10
    }
  }, [tag, loc === 'Online' ? 'Online' : 'In person'].map(x => /*#__PURE__*/React.createElement("span", {
    key: x,
    style: {
      height: 24,
      padding: '0 9px',
      borderRadius: 999,
      boxShadow: 'inset 0 0 0 1px var(--line2)',
      fontSize: 11.5,
      fontWeight: 600,
      color: 'var(--t2)',
      display: 'grid',
      placeItems: 'center'
    }
  }, x)))));
}
const SVC_ICON = {
  bills: 'Zap',
  events: 'CalendarDays',
  legal: 'Scale',
  shop: 'ShoppingBag',
  loans: 'Landmark',
  bnpl: 'CreditCard',
  pensions: 'PiggyBank',
  telemedicine: 'Stethoscope'
};
function Svc({
  k,
  label,
  soon,
  s = 60
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      opacity: soon ? 0.45 : 1,
      width: s + 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: s,
      height: s,
      borderRadius: s * 0.32,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: SVC_ICON[k],
    s: s * 0.42,
    c: "var(--sel)",
    w: 1.9
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--t2)',
      whiteSpace: 'nowrap'
    }
  }, label));
}
function Rail({
  children,
  gap = 10
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap,
      margin: '0 -20px',
      padding: '0 20px',
      overflow: 'hidden'
    }
  }, children);
}
function SecHead({
  title,
  cap
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18.5,
      fontWeight: 700,
      letterSpacing: '-0.025em'
    }
  }, title), cap && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t3)',
      marginTop: 3
    }
  }, cap)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: 'var(--sel)',
      flexShrink: 0
    }
  }, "See all"));
}
function TopBar({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, children);
}
function Door({
  n,
  t,
  s
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      background: 'var(--accT)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 19,
    c: "var(--sel)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, s)), /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronRight",
    s: 17,
    c: "var(--t3)"
  }));
}
const Card = ({
  children,
  style
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    borderRadius: 22,
    background: 'var(--card)',
    boxShadow: 'inset 0 0 0 1px var(--line)',
    ...style
  }
}, children);

// E1 — Faithful port of the approved desktop structure
function E1() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement("img", {
    src: "../assets/wawu-icon-purple.png",
    style: {
      width: 34
    }
  }), /*#__PURE__*/React.createElement(Search, {
    ph: "Search WAWU",
    h: 44
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Bell",
    dot: true,
    s: 44
  })), /*#__PURE__*/React.createElement(Body, {
    gap: 20
  }, /*#__PURE__*/React.createElement(Media, {
    src: "e1",
    h: 196,
    r: 24
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(0deg, rgba(11,10,13,.92), rgba(11,10,13,.2))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 18,
      right: 18,
      bottom: 16,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: '#D9A6F2'
    }
  }, "FEATURED EVENT"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '-0.025em',
      lineHeight: 1.1
    }
  }, "WAWU Creators Summit, Lagos"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      opacity: 0.8
    }
  }, "12 Oct \xB7 Eko Convention Centre")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 16,
      bottom: 18,
      display: 'flex',
      gap: 5
    }
  }, [22, 6, 6].map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: w,
      height: 6,
      borderRadius: 3,
      background: i ? 'rgba(255,255,255,.4)' : '#fff'
    }
  })))), /*#__PURE__*/React.createElement(Rail, {
    gap: 8
  }, CATS.map(([n, t], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      width: 80,
      height: 80,
      flexShrink: 0,
      borderRadius: 18,
      background: i ? 'var(--card)' : 'var(--accT)',
      boxShadow: i ? 'inset 0 0 0 1px var(--line)' : 'inset 0 0 0 1.5px var(--acc)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 21,
    c: "var(--sel)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      whiteSpace: 'nowrap'
    }
  }, t)))), /*#__PURE__*/React.createElement(SecHead, {
    title: "Featured creators",
    cap: "Talent across Africa and beyond"
  }), /*#__PURE__*/React.createElement(Rail, null, CR.map((c, i) => /*#__PURE__*/React.createElement(CreatorCard, {
    key: i,
    c: c,
    on: i === 2
  }))), /*#__PURE__*/React.createElement(SecHead, {
    title: "Upcoming events"
  }), /*#__PURE__*/React.createElement(Rail, null, EV.map((e, i) => /*#__PURE__*/React.createElement(EventCard, {
    key: i,
    e: e
  })))), /*#__PURE__*/React.createElement(NavLocked, {
    on: 1
  }));
}

// E2 — Tabbed directory: web's top tab row becomes a sticky segmented scroller
function E2() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement(Search, {
    h: 46
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "SlidersHorizontal",
    s: 46
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 22,
      padding: '0 20px',
      fontSize: 15.5,
      fontWeight: 600,
      boxShadow: 'inset 0 -1px 0 var(--line)',
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }
  }, ['For you', 'Creators', 'Professionals', 'Events', 'Learning', 'Services'].map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      paddingBottom: 12,
      color: i === 1 ? 'var(--t1)' : 'var(--t3)',
      boxShadow: i === 1 ? 'inset 0 -2.5px 0 var(--acc)' : 'none'
    }
  }, t))), /*#__PURE__*/React.createElement(Body, {
    gap: 16,
    style: {
      paddingTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflow: 'hidden',
      margin: '0 -20px',
      padding: '0 20px'
    }
  }, ['All', 'Music', 'Film & Video', 'Art & Design', 'Fashion'].map((t, i) => /*#__PURE__*/React.createElement(Chip, {
    key: t,
    on: !i
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13.5,
      color: 'var(--t2)'
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--t1)'
    }
  }, "1,284"), " creators"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontWeight: 600
    }
  }, "Most followed", /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronDown",
    s: 15
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, CR.concat([CR[0]]).slice(0, 4).map((c, i) => /*#__PURE__*/React.createElement(CreatorCard, {
    key: i,
    c: c,
    w: "100%",
    h: 218,
    on: i === 1
  })))), /*#__PURE__*/React.createElement(NavLocked, {
    on: 1
  }));
}

// E3 — Services first (the "tiles" reference): WAWU as a super-app
function E3() {
  const feat = [['p1', 'Creator', 'Adaeze O.', 'Business Strategist', 'Follow'], ['p2', 'Professional', 'Funmi A.', 'Accountant · from ₦15K', 'Book now'], ['e1', 'Event', 'Creators Summit', '12 Oct · Lagos', 'Get tickets']];
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Explore"), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Search"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Bell",
    dot: true
  })), /*#__PURE__*/React.createElement(Body, {
    gap: 22
  }, /*#__PURE__*/React.createElement(Card, {
    style: {
      padding: '18px 8px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      rowGap: 16,
      justifyItems: 'center'
    }
  }, SVC.map(([k, l, s]) => /*#__PURE__*/React.createElement(Svc, {
    key: k,
    k: k,
    label: l,
    soon: s,
    s: 56
  })))), /*#__PURE__*/React.createElement(SecHead, {
    title: "Featured this week",
    cap: "Creators, professionals and events"
  }), /*#__PURE__*/React.createElement(Rail, null, feat.map(([img, kind, t, s, cta], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 160,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: img,
    h: 226,
    r: 20
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, transparent 38%, rgba(11,10,13,.9))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      left: 10,
      height: 22,
      padding: '0 8px',
      borderRadius: 999,
      background: 'rgba(11,10,13,.66)',
      color: '#fff',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.06em',
      display: 'grid',
      placeItems: 'center'
    }
  }, kind.toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 10,
      right: 10,
      bottom: 10,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 700
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.8,
      marginTop: 2
    }
  }, s)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 32,
      borderRadius: 999,
      background: i === 1 ? '#fff' : 'var(--acc)',
      color: i === 1 ? '#111018' : '#fff',
      display: 'grid',
      placeItems: 'center',
      fontSize: 13,
      fontWeight: 700
    }
  }, cta))))))), /*#__PURE__*/React.createElement(NavLocked, {
    on: 1
  }));
}

// E4 — Editorial: one big story per scroll, like a magazine front
function E4() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t3)',
      fontWeight: 600
    }
  }, "Friday, 26 September"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Explore")), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Search"
  })), /*#__PURE__*/React.createElement(Body, {
    gap: 22
  }, /*#__PURE__*/React.createElement(Media, {
    src: "p5",
    h: 330,
    r: 28
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(0,0,0,.2), transparent 30%, rgba(11,10,13,.92))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 16,
      left: 16,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.1em',
      color: '#fff',
      opacity: 0.9
    }
  }, "CREATOR OF THE WEEK"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 18,
      right: 18,
      bottom: 18,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: '-0.03em'
    }
  }, "Ifeanyi Nwosu ", /*#__PURE__*/React.createElement(Ticks, {
    n: 1,
    s: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      opacity: 0.85,
      marginTop: 4,
      lineHeight: 1.4
    }
  }, "Fashion designer in Aba. Teaching pattern-cutting to 3,000 students.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Follow, {
    h: 42
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 42,
      borderRadius: 999,
      background: 'rgba(255,255,255,.18)',
      backdropFilter: 'blur(8px)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 14,
      fontWeight: 700
    }
  }, "View profile")))), /*#__PURE__*/React.createElement(SecHead, {
    title: "This week"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      marginTop: -6
    }
  }, EV.slice(0, 2).map(([img, m, d, t, loc, tag]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13
    }
  }, /*#__PURE__*/React.createElement(DateBlock, {
    m: m,
    d: d
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, tag, " \xB7 ", loc)), /*#__PURE__*/React.createElement(Media, {
    src: img,
    h: 52,
    r: 12,
    style: {
      width: 52
    }
  }))))), /*#__PURE__*/React.createElement(NavLocked, {
    on: 1
  }));
}

// E5 — Bento: every door is a live preview, sized by importance
function E5() {
  const face = (s, z, x) => /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      background: `center/cover url(img/${s}.jpg)`,
      boxShadow: '0 0 0 2.5px var(--card)',
      marginLeft: x,
      zIndex: z
    }
  });
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: '-0.035em'
    }
  }, "Explore"), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Bell",
    dot: true
  })), /*#__PURE__*/React.createElement(Body, {
    gap: 12
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement(Search, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridAutoRows: 128,
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: "p3",
    h: "auto",
    r: 22,
    style: {
      gridRow: 'span 2'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, transparent 45%, rgba(11,10,13,.88))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 14,
      bottom: 14,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: '-0.02em'
    }
  }, "Creators"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      opacity: 0.8,
      marginTop: 2
    }
  }, "1,284 across 15 fields"))), /*#__PURE__*/React.createElement(Card, {
    style: {
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex'
    }
  }, face('p2', 3, 0), face('p4', 2, -12), face('p1', 1, -12)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700
    }
  }, "Professionals"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, "Lawyers, accountants\u2026"))), /*#__PURE__*/React.createElement(Media, {
    src: "e2",
    h: "auto",
    r: 22
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(11,10,13,.45)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12
    }
  }, /*#__PURE__*/React.createElement(DateBlock, {
    m: "OCT",
    d: "18",
    s: 0.85
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 14,
      bottom: 12,
      color: '#fff',
      fontSize: 16,
      fontWeight: 700
    }
  }, "Events")), /*#__PURE__*/React.createElement(Card, {
    style: {
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "GraduationCap",
    s: 26,
    c: "var(--sel)"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700
    }
  }, "Learning"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, "42 courses"))), /*#__PURE__*/React.createElement(Card, {
    style: {
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Users",
    s: 26,
    c: "var(--sel)"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700
    }
  }, "Communities"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, "120 active"))), /*#__PURE__*/React.createElement(Card, {
    style: {
      gridColumn: 'span 2',
      padding: '0 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700
    }
  }, "Services"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, "Bills, legal, events and more")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, ['bills', 'legal', 'events'].map(k => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      width: 42,
      height: 42,
      borderRadius: 13,
      background: 'var(--accT)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: SVC_ICON[k],
    s: 19,
    c: "var(--sel)"
  }))))))), /*#__PURE__*/React.createElement(NavLocked, {
    on: 1
  }));
}

// E6 — Intent-first: start from what you want to do, not what WAWU has
function E6() {
  const rows = [['UserRoundSearch', 'Find creators to follow', '1,284 creators · 15 fields', ['p1', 'p3', 'p5']], ['BriefcaseBusiness', 'Hire a professional', 'Lawyers, accountants, mentors', ['p2', 'p4']], ['CalendarDays', 'Go to an event', '14 this month near Lagos', ['e1', 'e2']], ['GraduationCap', 'Learn a skill', '42 courses · 9 free', ['c1', 'c2']], ['Zap', 'Get things done', 'Bills, CAC filings, legal', null]];
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement("img", {
    src: "../assets/wawu-icon-purple.png",
    style: {
      width: 34
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Bell",
    dot: true
  })), /*#__PURE__*/React.createElement(Body, {
    gap: 16
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.04em',
      lineHeight: 1.1
    }
  }, "What are you", /*#__PURE__*/React.createElement("br", null), "looking for today?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Search, {
    ph: "Try \u201Caccountant in Ikeja\u201D"
  })), /*#__PURE__*/React.createElement(Card, null, rows.map(([n, t, s, imgs], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '15px 16px',
      boxShadow: i ? 'inset 0 1px 0 var(--line)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 13,
      background: 'var(--accT)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 20,
    c: "var(--sel)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, s)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex'
    }
  }, imgs ? imgs.map((m, j) => /*#__PURE__*/React.createElement("div", {
    key: m,
    style: {
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: `center/cover url(img/${m}.jpg)`,
      marginLeft: j ? -9 : 0,
      boxShadow: '0 0 0 2px var(--card)'
    }
  })) : /*#__PURE__*/React.createElement(Icon, {
    n: "Zap",
    s: 20,
    c: "var(--sel)"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, ['CAC registration', 'Afrobeats', 'Photography class', 'Tax filing'].map(t => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      height: 32,
      padding: '0 12px',
      borderRadius: 999,
      background: 'var(--card2)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--t2)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "TrendingUp",
    s: 13
  }), t)))), /*#__PURE__*/React.createElement(NavLocked, {
    on: 1
  }));
}

// E7 — Stories + masonry: people first, then a mixed discovery wall
function E7() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement(Search, {
    h: 46,
    ph: "Search WAWU"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Bell",
    dot: true,
    s: 46
  })), /*#__PURE__*/React.createElement(Body, {
    gap: 18
  }, /*#__PURE__*/React.createElement(Rail, {
    gap: 14
  }, CR.map(([n, r, img], i) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      width: 66,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 2.5,
      borderRadius: '50%',
      boxShadow: i < 3 ? '0 0 0 2.5px var(--acc)' : '0 0 0 1.5px var(--line2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 60,
      height: 60,
      borderRadius: '50%',
      background: `center/cover url(img/${img}.jpg)`
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap'
    }
  }, n.split(' ')[0])))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflow: 'hidden',
      margin: '0 -20px',
      padding: '0 20px'
    }
  }, ['For you', 'Creators', 'Events', 'Learning', 'Pros'].map((t, i) => /*#__PURE__*/React.createElement(Chip, {
    key: t,
    on: !i
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(CreatorCard, {
    c: CR[0],
    w: "100%",
    h: 230
  }), /*#__PURE__*/React.createElement(Media, {
    src: "c1",
    h: 150,
    r: 20
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, transparent 40%, rgba(11,10,13,.85))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      left: 10
    }
  }, /*#__PURE__*/React.createElement(TypeTag, {
    n: "GraduationCap"
  }, "Course")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 11,
      color: '#fff',
      fontSize: 14,
      fontWeight: 700,
      lineHeight: 1.25
    }
  }, "Content Creation & Social Growth"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: "e3",
    h: 170,
    r: 20
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, transparent 40%, rgba(11,10,13,.85))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      left: 10
    }
  }, /*#__PURE__*/React.createElement(DateBlock, {
    m: "NOV",
    d: "02",
    s: 0.85
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 11,
      color: '#fff',
      fontSize: 14,
      fontWeight: 700
    }
  }, "Monetise Your Content")), /*#__PURE__*/React.createElement(Card, {
    style: {
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: '50%',
      background: 'center/cover url(img/p2.jpg)'
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700
    }
  }, "Funmi A."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--t3)'
    }
  }, "Accountant"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--t2)',
      lineHeight: 1.4
    }
  }, "Tax filing for creators, from \u20A615,000"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 32,
      borderRadius: 999,
      background: 'var(--t1)',
      color: 'var(--bg)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 13,
      fontWeight: 700
    }
  }, "Book"))))), /*#__PURE__*/React.createElement(NavLocked, {
    on: 1
  }));
}

// E8 — Near you: location-aware, pay-ready listings
function E8() {
  const pros = [['p2', 'Funmi Adeyemi', 'Accountant · Ikeja', 4.9, 15000], ['p4', 'Musa Danladi', 'Welding trainer · Yaba', 4.7, 8000], ['p1', 'Adaeze Okonkwo', 'Business mentor · Lekki', 5.0, 25000]];
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement(TopBar, null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--t3)',
      fontWeight: 600
    }
  }, "Exploring near"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: '-0.02em'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "MapPin",
    s: 18,
    c: "var(--sel)",
    w: 2.2
  }), "Lagos", /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronDown",
    s: 17
  }))), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Search"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Bell",
    dot: true
  })), /*#__PURE__*/React.createElement(Body, {
    gap: 20
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflow: 'hidden',
      margin: '0 -20px',
      padding: '0 20px'
    }
  }, ['This weekend', 'Free', 'Online', 'Under ₦10K'].map((t, i) => /*#__PURE__*/React.createElement(Chip, {
    key: t,
    on: !i
  }, t))), /*#__PURE__*/React.createElement(Rail, null, EV.map((e, i) => /*#__PURE__*/React.createElement(EventCard, {
    key: i,
    e: e,
    w: 250
  }))), /*#__PURE__*/React.createElement(SecHead, {
    title: "Professionals near you",
    cap: "Pay from your WAWU wallet"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      marginTop: -4
    }
  }, pros.map(([img, n, s, r, p]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 16,
      background: `center/cover url(img/${img}.jpg)`,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 12.5,
      color: 'var(--t3)',
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Star",
    s: 12,
    c: "var(--warn)",
    fill: "var(--warn)"
  }), r.toFixed(1), " \xB7 ", s)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--t3)'
    }
  }, "from"), /*#__PURE__*/React.createElement(Amt, {
    v: p,
    size: 15,
    dec: false
  })))))), /*#__PURE__*/React.createElement(NavLocked, {
    on: 1
  }));
}
window.EXPLORE = [[E1, 'Faithful port', 'The approved desktop Explore, re-flowed for a thumb: featured hero, category tiles, creator cards with Follow, event cards with date blocks.'], [E2, 'Tabbed directory', 'The web’s top tab row becomes a sticky scroller. Each tab is a full directory with filters, sort and a 2-up photo grid.'], [E3, 'Services first', 'From the “tiles” reference: WAWU’s commissioned service icons lead, then one mixed rail where each card carries its own action — Follow, Book, Get tickets.'], [E4, 'Editorial', 'One big story per scroll: a creator of the week, then a short dated list. Calm, curated, least like a catalogue.'], [E5, 'Bento', 'Every section is a door with a live preview, sized by importance. Whole app visible in one screen, no scrolling needed.'], [E6, 'Intent-first', 'Starts from what the user wants to do, not what WAWU has. Five plain-language jobs plus trending searches.'], [E7, 'People + wall', 'Creator rings up top, then a mixed masonry of creators, events, courses and bookable pros.'], [E8, 'Near you', 'Location-aware. Weekend events and nearby professionals with ratings and prices you can pay from your wallet.']];
Object.assign(window, {
  Svc,
  CreatorCard,
  EventCard,
  DateBlock,
  Follow,
  Ticks,
  Rail,
  SecHead
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/dir-explore.jsx", error: String((e && e.message) || e) }); }

// explorations/feed.jsx
try { (() => {
// Full-bleed feed formats for Home · Following / For you — every content type gets an immersive treatment.
function FeedShell({
  tab = 2,
  children,
  bg,
  blur = 0,
  scrim = true,
  rail = true,
  who = ['Tife Adeola', 'lemon'],
  likes = '12.4K'
}) {
  return /*#__PURE__*/React.createElement(Phone, {
    onDark: true,
    bg: "#000"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: blur ? -30 : 0,
      background: bg,
      filter: blur ? `blur(${blur}px)` : 'none'
    }
  }), scrim && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(0,0,0,.5), transparent 22%, transparent 50%, rgba(0,0,0,.86) 88%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 20px'
    }
  }, /*#__PURE__*/React.createElement(HomeTabs, {
    on: tab,
    onDark: true
  }), /*#__PURE__*/React.createElement(Icon, {
    n: "Search",
    s: 24,
    c: "#fff"
  })), rail && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 14,
      bottom: 196,
      zIndex: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 18,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: who[0],
    hue: who[1],
    s: 46,
    ring: "#fff"
  }), [['Heart', likes], ['MessageCircle', '340'], ['Bookmark', '1.1K']].map(([n, v]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 28,
    c: "#fff",
    w: 2
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, v))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: '50%',
      background: 'rgba(255,255,255,.18)',
      backdropFilter: 'blur(10px)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 18,
      fontWeight: 700
    }
  }, "\u20A6"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, "Tip"))), children, /*#__PURE__*/React.createElement(NavLocked, {
    on: 0,
    onDark: true
  }));
}
const glass = {
  background: 'rgba(255,255,255,.14)',
  backdropFilter: 'blur(20px)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16)'
};
function Byline({
  name,
  sub,
  tag
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingRight: 76
    }
  }, tag && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(TypeTag, {
    n: tag[0]
  }, tag[1])), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 16,
      fontWeight: 700
    }
  }, name, /*#__PURE__*/React.createElement(Icon, {
    n: "BadgeCheck",
    s: 16,
    c: "#fff",
    fill: "#9411C9"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      marginTop: 6,
      lineHeight: 1.4,
      opacity: 0.92
    }
  }, sub));
}
function OfferBar({
  n,
  t,
  s,
  v,
  cta
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      marginRight: 70,
      borderRadius: 18,
      ...glass,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 8px 0 14px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 22,
    c: "#fff"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.7
    }
  }, s)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 40,
      padding: '0 14px',
      borderRadius: 13,
      background: '#fff',
      color: '#111018',
      display: 'grid',
      placeItems: 'center',
      fontSize: 14,
      fontWeight: 700
    }
  }, cta || /*#__PURE__*/React.createElement(Amt, {
    v: v,
    size: 14,
    weight: 700,
    dec: false
  })));
}
const Bottom = ({
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 104,
    zIndex: 4,
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }
}, children);

// F1 — Photo set: swipe sideways through images, counter + dots
function F_Photos() {
  return /*#__PURE__*/React.createElement(FeedShell, {
    bg: "center/cover url(img/w4.jpg)",
    who: ['Amaka Nwosu', 'green'],
    likes: "8.9K"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 62,
      right: 16,
      zIndex: 4,
      height: 28,
      padding: '0 11px',
      borderRadius: 999,
      background: 'rgba(11,10,13,.55)',
      backdropFilter: 'blur(10px)',
      color: '#fff',
      fontSize: 13,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Images",
    s: 14,
    c: "#fff",
    w: 2.2
  }), "1 / 6"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: -40,
      top: 150,
      width: 64,
      height: 380,
      borderRadius: 18,
      background: 'center/cover url(img/w5.jpg)',
      opacity: 0.9,
      boxShadow: '-10px 0 30px rgba(0,0,0,.5)',
      zIndex: 2
    }
  }), /*#__PURE__*/React.createElement(Bottom, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5
    }
  }, [18, 6, 6, 6, 6, 6].map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: w,
      height: 6,
      borderRadius: 3,
      background: i ? 'rgba(255,255,255,.45)' : '#fff'
    }
  }))), /*#__PURE__*/React.createElement(Byline, {
    name: "Amaka Nwosu",
    sub: "Golden hour in Jos \u2014 six frames, unedited. Presets in the pack.",
    tag: ['Images', 'Photo set · 6']
  }), /*#__PURE__*/React.createElement(OfferBar, {
    n: "SlidersHorizontal",
    t: "Golden Hour presets",
    s: "Template \xB7 12 presets",
    v: 2500
  })));
}

// F2 — PDF / book: the cover stands up in the frame; first pages are free
function F_Book() {
  return /*#__PURE__*/React.createElement(FeedShell, {
    bg: "center/cover url(img/c2.jpg)",
    blur: 28,
    who: ['Kemi Okafor', 'pink'],
    likes: "3.2K"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(11,10,13,.35)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 118,
      display: 'flex',
      justifyContent: 'center',
      zIndex: 3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 16,
      top: 10,
      width: 200,
      height: 280,
      borderRadius: 6,
      background: '#EDEAF2',
      transform: 'rotate(4deg)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 200,
      height: 280,
      borderRadius: 6,
      background: 'linear-gradient(160deg,#1D0A2B,#5B0F80)',
      boxShadow: '0 30px 50px -10px rgba(0,0,0,.7), inset 6px 0 0 rgba(0,0,0,.25)',
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.14em',
      opacity: 0.7
    }
  }, "KEMI OKAFOR"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      lineHeight: 1.05,
      letterSpacing: '-0.03em'
    }
  }, "The Freelancer\u2019s Pricing Playbook"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      opacity: 0.7
    }
  }, "84 pages \xB7 2026 edition")))), /*#__PURE__*/React.createElement(Bottom, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginRight: 70
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      background: 'rgba(255,255,255,.25)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '14%',
      height: '100%',
      borderRadius: 2,
      background: '#fff'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      opacity: 0.85
    }
  }, "12 pages free")), /*#__PURE__*/React.createElement(Byline, {
    name: "Kemi Okafor",
    sub: "Stop guessing your rates. Chapter 1 is on me \u2014 tap to read.",
    tag: ['BookOpen', 'PDF · 84 pages']
  }), /*#__PURE__*/React.createElement(OfferBar, {
    n: "BookOpen",
    t: "Read the full playbook",
    s: "Yours forever \xB7 Pay from wallet",
    v: 3000
  })));
}

// F3 — Locked: preview plays, then the frame frosts and asks
function F_Locked() {
  return /*#__PURE__*/React.createElement(FeedShell, {
    bg: "center/cover url(img/w6.jpg)",
    blur: 22,
    who: ['Chidi Eze', 'sky'],
    likes: "21K"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(11,10,13,.35)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 24,
      right: 84,
      top: 170,
      zIndex: 3,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14,
      color: '#fff',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      ...glass,
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Lock",
    s: 28,
    c: "#fff"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '-0.025em'
    }
  }, "Preview ended"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      opacity: 0.85,
      lineHeight: 1.45
    }
  }, "Watch the full 18-minute breakdown, plus 40 members-only videos."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: '100%',
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 50,
      borderRadius: 999,
      background: '#fff',
      color: '#111018',
      display: 'grid',
      placeItems: 'center',
      fontSize: 15.5,
      fontWeight: 700
    }
  }, "Unlock this video \xB7 \u20A62,500"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 50,
      borderRadius: 999,
      ...glass,
      display: 'grid',
      placeItems: 'center',
      fontSize: 15,
      fontWeight: 700
    }
  }, "Subscribe \xB7 \u20A61,500 / month")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12.5,
      opacity: 0.75
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Wallet",
    s: 14,
    c: "#fff"
  }), "Paid from Naira wallet \xB7 ", /*#__PURE__*/React.createElement(Amt, {
    v: 485250,
    size: 12.5,
    dec: false
  }), " available")), /*#__PURE__*/React.createElement(Bottom, null, /*#__PURE__*/React.createElement(Byline, {
    name: "Chidi Eze",
    sub: "How I built a \u20A62M/month agency from Enugu.",
    tag: ['Lock', 'Members only · 18 min']
  })));
}

// F4 — Creator profile as a feed card: follow without leaving the scroll
function F_Creator() {
  const thumbs = [['w1', '12K'], ['w3', null], ['w5', '4.1K']];
  return /*#__PURE__*/React.createElement(FeedShell, {
    tab: 2,
    bg: "linear-gradient(170deg,#1D0A2B 0%,#0B0A0D 70%)",
    scrim: false,
    rail: false
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 16,
      right: 16,
      top: 108,
      bottom: 178,
      zIndex: 3,
      borderRadius: 30,
      overflow: 'hidden',
      background: '#16151B',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)',
      display: 'flex',
      flexDirection: 'column',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: "p3",
    h: 250,
    r: 0
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, transparent 50%, #16151B)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 14,
      left: 14
    }
  }, /*#__PURE__*/React.createElement(TypeTag, {
    n: "Sparkles"
  }, "Creator for you"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 18px 18px',
      marginTop: -40,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: '-0.03em'
    }
  }, "Zainab Bello", /*#__PURE__*/React.createElement(Icon, {
    n: "BadgeCheck",
    s: 20,
    c: "#fff",
    fill: "#9411C9"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      opacity: 0.72,
      marginTop: 4
    }
  }, "Agribusiness trainer \xB7 Kano \xB7 18.2K followers")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 6
    }
  }, thumbs.map(([s, v], i) => /*#__PURE__*/React.createElement(Media, {
    key: s,
    src: s,
    h: 88,
    r: 12
  }, !v && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      backdropFilter: 'blur(8px)',
      background: 'rgba(0,0,0,.3)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Lock",
    s: 18,
    c: "#fff"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 7,
      bottom: 6,
      fontSize: 11.5,
      fontWeight: 700
    }
  }, v || '₦5K')))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.4,
      height: 48,
      borderRadius: 999,
      background: '#9411C9',
      display: 'grid',
      placeItems: 'center',
      fontSize: 15,
      fontWeight: 700
    }
  }, "Follow"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 48,
      borderRadius: 999,
      background: 'rgba(255,255,255,.1)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 15,
      fontWeight: 700
    }
  }, "View profile")))));
}

// F5 — Professional profile as a feed card: book and pay in place
function F_Pro() {
  const svc = [['Tax filing for creators', '3 days', 15000], ['CAC annual returns', '5 days', 25000], ['30-min consultation', 'Video call', 5000]];
  return /*#__PURE__*/React.createElement(FeedShell, {
    tab: 2,
    bg: "linear-gradient(170deg,#0F1A2A 0%,#0B0A0D 70%)",
    scrim: false,
    rail: false
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 16,
      right: 16,
      top: 108,
      bottom: 178,
      zIndex: 3,
      borderRadius: 30,
      background: '#16151B',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)',
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(TypeTag, {
    n: "BriefcaseBusiness",
    light: true
  }, "Professional near you")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 76,
      height: 76,
      borderRadius: 24,
      background: 'center/cover url(img/p2.jpg)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 21,
      fontWeight: 700,
      letterSpacing: '-0.025em'
    }
  }, "Funmi Adeyemi", /*#__PURE__*/React.createElement(Icon, {
    n: "BadgeCheck",
    s: 18,
    c: "#fff",
    fill: "#3DA5FF"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      opacity: 0.72,
      marginTop: 3
    }
  }, "Chartered accountant \xB7 Ikeja"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 13,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Star",
    s: 13,
    c: "#FFB347",
    fill: "#FFB347"
  }), /*#__PURE__*/React.createElement("b", null, "4.9"), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.6
    }
  }, "(212) \xB7 Trust Score 91")))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 18,
      background: 'rgba(255,255,255,.05)'
    }
  }, svc.map(([t, s, p], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 14px',
      boxShadow: i ? 'inset 0 1px 0 rgba(255,255,255,.07)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.6,
      marginTop: 2
    }
  }, s)), /*#__PURE__*/React.createElement(Amt, {
    v: p,
    size: 15,
    dec: false
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 12.5,
      opacity: 0.7
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "ShieldCheck",
    s: 15,
    c: "#fff"
  }), "Payment held by WAWU until the job is done"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.4,
      height: 48,
      borderRadius: 999,
      background: '#fff',
      color: '#111018',
      display: 'grid',
      placeItems: 'center',
      fontSize: 15,
      fontWeight: 700
    }
  }, "Book Funmi"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 48,
      borderRadius: 999,
      background: 'rgba(255,255,255,.1)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 15,
      fontWeight: 700
    }
  }, "Message"))));
}

// F6 — Audio: waveform over the artwork, scrubbable in place
function F_Audio() {
  const bars = Array.from({
    length: 44
  }, (_, i) => 16 + Math.abs(Math.sin(i * 0.7) * 30 + Math.cos(i * 1.9) * 14));
  return /*#__PURE__*/React.createElement(FeedShell, {
    tab: 1,
    bg: "center/cover url(img/w3.jpg)",
    blur: 18,
    who: ['Amaka Nwosu', 'green'],
    likes: "5.6K"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(11,10,13,.4)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 128,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 22,
      zIndex: 3,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement(Media, {
    src: "w3",
    h: 220,
    r: 24,
    style: {
      width: 220,
      boxShadow: '0 30px 50px -12px rgba(0,0,0,.7)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 2.5,
      height: 60
    }
  }, bars.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 3,
      height: h,
      borderRadius: 2,
      background: i < 16 ? '#fff' : 'rgba(255,255,255,.35)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 26
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "RotateCcw",
    s: 24,
    c: "#fff"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 62,
      height: 62,
      borderRadius: '50%',
      background: '#fff',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Pause",
    s: 26,
    c: "#111018",
    fill: "#111018"
  })), /*#__PURE__*/React.createElement(Icon, {
    n: "RotateCw",
    s: 24,
    c: "#fff"
  }))), /*#__PURE__*/React.createElement(Bottom, null, /*#__PURE__*/React.createElement(Byline, {
    name: "Amaka Nwosu",
    sub: "Quiet mornings, ep. 4 \u2014 a 12-minute reset before work.",
    tag: ['AudioLines', 'Audio · 12 min · Following']
  })));
}

// Social links for the profile — real brand marks, monochrome to stay on-system
function Socials() {
  const t = React.useContext(ThemeCtx);
  const c = t === 'dark' ? 'F4F2F7' : '111018';
  const list = [['instagram', 'lennox.films'], ['tiktok', 'lennox'], ['youtube', 'LennoxFilms'], ['x', 'lennoxe'], ['threads', 'lennox.films']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflow: 'hidden',
      margin: '0 -20px',
      padding: '0 20px'
    }
  }, list.map(([k, h]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 34,
      padding: '0 12px 0 10px',
      borderRadius: 999,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)',
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      flexShrink: 0,
      fontSize: 13,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: `https://cdn.simpleicons.org/${k}/${c}`,
    style: {
      width: 15,
      height: 15
    }
  }), h)));
}
Object.assign(window, {
  F_Photos,
  F_Book,
  F_Locked,
  F_Creator,
  F_Pro,
  F_Audio,
  Socials
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/feed.jsx", error: String((e && e.message) || e) }); }

// explorations/home.jsx
try { (() => {
// Home — three tabs: Today (default) · Following · For you.
// Today = the web Home tab (TGIF, "What would you like to do today?", creators) + a money glance.
// Following / For you = the full-bleed feed from screen 11.
function HomeTabs({
  on,
  onDark
}) {
  const tabs = ['Today', 'Following', 'For you'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      fontSize: 16.5,
      fontWeight: 700
    }
  }, tabs.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      color: onDark ? '#fff' : i === on ? 'var(--t1)' : 'var(--t3)',
      opacity: onDark && i !== on ? 0.6 : 1,
      paddingBottom: 6,
      borderBottom: i === on ? `2.5px solid ${onDark ? '#fff' : 'var(--acc)'}` : '2.5px solid transparent'
    }
  }, t)));
}
function TgifCard({
  compact
}) {
  if (compact) return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      borderRadius: 18,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      background: 'linear-gradient(140deg,#4A0E68,#9411C9)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Sun",
    s: 20,
    c: "#fff"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: 'var(--sel)'
    }
  }, "TGIF \xB7 TODAY"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      marginTop: 2,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, "This is the day which the LORD hath made\u2026")), /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronRight",
    s: 18,
    c: "var(--t3)"
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 24,
      padding: 20,
      background: 'linear-gradient(150deg,#2A0C3E 0%,#5B0F80 55%,#9411C9 100%)',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: -50,
      top: -60,
      width: 190,
      height: 190,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,210,140,.35), transparent 70%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: '0.1em',
      opacity: 0.85
    }
  }, "TGIF \xB7 FRIDAY 26 SEPT"), /*#__PURE__*/React.createElement(Icon, {
    n: "Sun",
    s: 20,
    c: "rgba(255,255,255,.8)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      fontSize: 20,
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.02em',
      marginTop: 12
    }
  }, "\u201CThis is the day which the LORD hath made; we will rejoice and be glad in it.\u201D"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      opacity: 0.75
    }
  }, "Psalm 118:24"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 38,
      padding: '0 16px',
      borderRadius: 999,
      background: '#fff',
      color: '#111018',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 14,
      fontWeight: 700
    }
  }, "Reflect", /*#__PURE__*/React.createElement(Icon, {
    n: "ArrowRight",
    s: 15,
    w: 2.4
  }))));
}
const TODAY_SVC = [['bills', 'Pay bills'], ['events', 'Events'], ['legal', 'Legal'], ['shop', 'Shop']];
function CreatorsRailMini() {
  const cr = [['Adaeze O.', 'Business Strategist', 'p1'], ['Funmi A.', 'Accountant', 'p2'], ['Zainab B.', 'Agribusiness', 'p3']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Head, {
    title: "Creators to discover"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      margin: '0 -20px',
      padding: '0 20px'
    }
  }, cr.map(([n, r, img], i) => /*#__PURE__*/React.createElement(Media, {
    key: n,
    src: img,
    h: 196,
    r: 20,
    style: {
      width: 146
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, transparent 40%, rgba(11,10,13,.88))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 10,
      right: 10,
      bottom: 10,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.8,
      marginTop: 2
    }
  }, r)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 32,
      borderRadius: 999,
      background: 'var(--acc)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 13,
      fontWeight: 700
    }
  }, "Follow"))))));
}

// Today · variant 1 — TGIF leads (as on web), money is a single calm strip
function H_Today1() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(HomeTabs, {
    on: 0
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    n: "Search",
    s: 40
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Bell",
    dot: true,
    s: 40
  }))), /*#__PURE__*/React.createElement(Body, {
    gap: 22
  }, /*#__PURE__*/React.createElement(TgifCard, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 12px 12px 16px',
      borderRadius: 20,
      background: 'var(--card)',
      boxShadow: 'inset 0 0 0 1px var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12.5,
      color: 'var(--t3)',
      fontWeight: 600
    }
  }, "Naira wallet", /*#__PURE__*/React.createElement(Icon, {
    n: "Eye",
    s: 14
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: 485250,
    size: 22
  }))), [['ArrowUpRight', 1], ['Plus'], ['ScanLine']].map(([n, p]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: p ? 'var(--acc)' : 'var(--card2)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 19,
    w: 2.2,
    c: p ? '#fff' : 'var(--t1)'
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18.5,
      fontWeight: 700,
      letterSpacing: '-0.025em'
    }
  }, "What would you like to do today?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t3)',
      marginTop: 3
    }
  }, "One app. More possibilities.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      rowGap: 14,
      justifyItems: 'center'
    }
  }, TODAY_SVC.map(([k, l, s]) => /*#__PURE__*/React.createElement(Svc, {
    key: k,
    k: k,
    label: l,
    soon: s,
    s: 58
  })))), /*#__PURE__*/React.createElement(CreatorsRailMini, null)), /*#__PURE__*/React.createElement(NavLocked, {
    on: 0
  }));
}

// Today · variant 2 — money leads, TGIF folds to one line
function H_Today2() {
  return /*#__PURE__*/React.createElement(Phone, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(HomeTabs, {
    on: 0
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    n: "Search",
    s: 40
  }), /*#__PURE__*/React.createElement(IconBtn, {
    n: "Bell",
    dot: true,
    s: 40
  }))), /*#__PURE__*/React.createElement(Body, {
    gap: 20
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 26,
      background: 'var(--money)',
      color: '#fff',
      padding: '18px 18px 16px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--moneySh)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: -60,
      top: -80,
      width: 220,
      height: 220,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(148,17,201,.55), transparent 70%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 30,
      padding: '0 10px 0 4px',
      borderRadius: 999,
      background: 'rgba(255,255,255,.12)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Flag, {
    cur: "NGN",
    s: 22
  }), "Naira", /*#__PURE__*/React.createElement(Icon, {
    n: "ChevronDown",
    s: 14,
    c: "#fff"
  })), /*#__PURE__*/React.createElement(Icon, {
    n: "Eye",
    s: 19,
    c: "rgba(255,255,255,.7)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      margin: '14px 0 18px'
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: 485250,
    size: 38
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, [['ArrowUpRight', 'Send'], ['Plus', 'Add'], ['Receipt', 'Bills'], ['ScanLine', 'Scan']].map(([n, t], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      width: 64
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: '50%',
      background: i ? 'rgba(255,255,255,.12)' : 'var(--acc)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 20,
    w: 2.2,
    c: "#fff"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      opacity: 0.85
    }
  }, t))))), /*#__PURE__*/React.createElement(TgifCard, {
    compact: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18.5,
      fontWeight: 700,
      letterSpacing: '-0.025em'
    }
  }, "What would you like to do today?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      justifyItems: 'center'
    }
  }, TODAY_SVC.map(([k, l, s]) => /*#__PURE__*/React.createElement(Svc, {
    key: k,
    k: k,
    label: l,
    soon: s,
    s: 60
  })))), /*#__PURE__*/React.createElement(CreatorsRailMini, null)), /*#__PURE__*/React.createElement(NavLocked, {
    on: 0
  }));
}
function Immersive({
  tab,
  img,
  name,
  hue,
  caption,
  offer
}) {
  return /*#__PURE__*/React.createElement(Phone, {
    onDark: true,
    bg: "#000"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: `center/cover url(img/${img}.jpg)`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(0,0,0,.5), transparent 22%, transparent 50%, rgba(0,0,0,.85) 88%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 20px'
    }
  }, /*#__PURE__*/React.createElement(HomeTabs, {
    on: tab,
    onDark: true
  }), /*#__PURE__*/React.createElement(Icon, {
    n: "Search",
    s: 24,
    c: "#fff"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 14,
      bottom: 196,
      zIndex: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 18,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: name,
    hue: hue,
    s: 48,
    ring: "#fff"
  }), tab === 2 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -9,
      left: 15,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--acc)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "Plus",
    s: 13,
    c: "#fff",
    w: 3
  }))), [['Heart', '12.4K'], ['MessageCircle', '340'], ['Bookmark', '1.1K']].map(([n, v]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: n,
    s: 29,
    c: "#fff",
    w: 2
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, v))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: 'rgba(255,255,255,.18)',
      backdropFilter: 'blur(10px)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 19,
      fontWeight: 700
    }
  }, "\u20A6"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, "Tip"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 104,
      zIndex: 4,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      paddingRight: 80
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 16,
      fontWeight: 700
    }
  }, name, " ", /*#__PURE__*/React.createElement(Icon, {
    n: "BadgeCheck",
    s: 16,
    c: "#fff",
    fill: "#9411C9"
  }), tab === 1 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      opacity: 0.75,
      marginLeft: 2
    }
  }, "\xB7 Following")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      marginTop: 6,
      lineHeight: 1.4,
      opacity: 0.92
    }
  }, caption)), offer && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      marginRight: 70,
      borderRadius: 18,
      background: 'rgba(255,255,255,.14)',
      backdropFilter: 'blur(20px)',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 8px 0 14px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: offer[0],
    s: 22,
    c: "#fff"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, offer[1]), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.7
    }
  }, offer[2])), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 40,
      padding: '0 14px',
      borderRadius: 13,
      background: '#fff',
      color: '#111018',
      display: 'grid',
      placeItems: 'center',
      fontSize: 14,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement(Amt, {
    v: offer[3],
    size: 14,
    weight: 700,
    dec: false
  })))), /*#__PURE__*/React.createElement(NavLocked, {
    on: 0,
    onDark: true
  }));
}
const H_Following = () => /*#__PURE__*/React.createElement(Immersive, {
  tab: 1,
  img: "w5",
  name: "Ifeanyi Nwosu",
  hue: "coral",
  caption: "New drop: the Aba collection, cut and sewn on camera. Full pattern pack below.",
  offer: ['LayoutTemplate', 'Aba Collection · patterns', 'Template · Pay from wallet', 3500]
});
const H_ForYou = () => /*#__PURE__*/React.createElement(Immersive, {
  tab: 2,
  img: "w1",
  name: "Tife Adeola",
  hue: "lemon",
  caption: "Orbit \u2014 lesson 1 of my VFX course. The rest is inside.",
  offer: ['GraduationCap', 'VFX for Beginners', '12 lessons · Pay from wallet', 8000]
});
Object.assign(window, {
  H_Today1,
  H_Today2,
  H_Following,
  H_ForYou,
  HomeTabs
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/home.jsx", error: String((e && e.message) || e) }); }

// explorations/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // data-om-starter: inert presence marker — Claude Design's starter-usage
  // probe reads it. The closed panel renders nothing, so the marker rides
  // the <html> element as an attribute instead of a rendered node — zero
  // elements added, so page CSS (even structural selectors like
  // :nth-child) can never observe it. It records that the page WIRES a
  // tweaks panel, whether or not the panel is open. Keep this effect.
  React.useEffect(() => {
    document.documentElement.setAttribute('data-om-starter', 'tweaks-panel');
    return () => document.documentElement.removeAttribute('data-om-starter');
  }, []);
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "explorations/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// guidelines/card-kit.js
try { (() => {
/* Card harness: renders the same demo in dark and light, side by side.
   Usage in a card: DualTheme((theme) => <Demo theme={theme}/>, { width: 380 }) */
(function () {
  function DualTheme(render, opts) {
    const o = Object.assign({
      width: 380,
      pad: 20,
      gap: 0,
      direction: 'row'
    }, opts || {});
    const h = React.createElement;
    const panel = t => h('div', {
      'data-theme': t,
      key: t,
      style: {
        width: o.width,
        padding: o.pad,
        background: 'var(--surface-page)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minHeight: '100vh'
      }
    }, h('div', {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: 'var(--text-muted)'
      }
    }, t.toUpperCase()), render(t));
    const root = h('div', {
      style: {
        display: 'flex',
        flexDirection: o.direction
      }
    }, panel('dark'), panel('light'));
    ReactDOM.createRoot(document.getElementById('root')).render(root);
  }
  window.DualTheme = DualTheme;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "guidelines/card-kit.js", error: String((e && e.message) || e) }); }

__ds_ns.VerifiedTicks = __ds_scope.VerifiedTicks;

__ds_ns.CreatorCard = __ds_scope.CreatorCard;

__ds_ns.EventCard = __ds_scope.EventCard;

__ds_ns.CategoryTile = __ds_scope.CategoryTile;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.ExploreHero = __ds_scope.ExploreHero;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.TgifCard = __ds_scope.TgifCard;

__ds_ns.TypeTag = __ds_scope.TypeTag;

__ds_ns.DateBlock = __ds_scope.DateBlock;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Segmented = __ds_scope.Segmented;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.FeedFrame = __ds_scope.FeedFrame;

__ds_ns.ActionRail = __ds_scope.ActionRail;

__ds_ns.FeedCaption = __ds_scope.FeedCaption;

__ds_ns.Byline = __ds_scope.Byline;

__ds_ns.OfferBar = __ds_scope.OfferBar;

__ds_ns.LockedOverlay = __ds_scope.LockedOverlay;

__ds_ns.FeedProfileCard = __ds_scope.FeedProfileCard;

__ds_ns.SocialLinks = __ds_scope.SocialLinks;

__ds_ns.ProfileStats = __ds_scope.ProfileStats;

__ds_ns.ProfileHeader = __ds_scope.ProfileHeader;

__ds_ns.ConversationRow = __ds_scope.ConversationRow;

__ds_ns.CURRENCIES = __ds_scope.CURRENCIES;

__ds_ns.Amount = __ds_scope.Amount;

__ds_ns.CurrencyFlag = __ds_scope.CurrencyFlag;

__ds_ns.BalanceCard = __ds_scope.BalanceCard;

__ds_ns.AccountCard = __ds_scope.AccountCard;

__ds_ns.TxIcon = __ds_scope.TxIcon;

__ds_ns.TxRow = __ds_scope.TxRow;

__ds_ns.ServiceTile = __ds_scope.ServiceTile;

__ds_ns.HOME_TABS = __ds_scope.HOME_TABS;

__ds_ns.HomeTabs = __ds_scope.HomeTabs;

__ds_ns.ScreenHeader = __ds_scope.ScreenHeader;

__ds_ns.TABS = __ds_scope.TABS;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.CreateFab = __ds_scope.CreateFab;

})();
