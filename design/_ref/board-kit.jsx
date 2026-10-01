// Shared primitives for the WAWU mobile nav board.
const MaskCtx = React.createContext(false);
const ThemeCtx = React.createContext('light');

function Icon({ n, s = 22, w = 1.8, c = 'currentColor', fill = 'none', style }) {
  const L = window.lucide && (window.lucide.icons || window.lucide);
  const node = L && L[n];
  if (!node) return <span style={{ width: s, height: s, display: 'inline-block', flexShrink: 0 }}></span>;
  const kids = node[0] === 'svg' ? node[2] : node;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block', ...style }}>
      {kids.map(([t, a], i) => React.createElement(t, { ...a, key: i }))}
    </svg>
  );
}

const HUES = { lilac: '#9B7BFF', lemon: '#F4E94E', green: '#69D36A', sky: '#5BC8FF', pink: '#FF4FA8', coral: '#FF7A6B', yellow: '#FFB703', sand: '#E9D8C4' };
function Avatar({ name, hue = 'lilac', s = 44, ring, img }) {
  const ini = name.split(' ').map(p => p[0]).slice(0, 2).join('');
  return (
    <div style={{ width: s, height: s, borderRadius: '50%', flexShrink: 0, background: img ? `center/cover url(${img})` : HUES[hue], color: '#111018', display: 'grid', placeItems: 'center', fontSize: s * 0.36, fontWeight: 700, letterSpacing: '-0.02em', boxShadow: ring ? `0 0 0 2px var(--bg), 0 0 0 4px ${ring}` : 'none' }}>{img ? null : ini}</div>
  );
}

function Amt({ v, cur = '₦', size = 16, weight = 600, dec = true, sign, color, dim }) {
  const masked = React.useContext(MaskCtx);
  const [i, d] = Math.abs(v).toFixed(2).split('.');
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const pre = sign ? (v < 0 ? '−' : '+') : '';
  const isCrypto = cur.length > 1;
  return (
    <span style={{ fontSize: size, fontWeight: weight, letterSpacing: '-0.025em', fontFeatureSettings: '"tnum" 1,"lnum" 1', color: color || 'inherit', whiteSpace: 'nowrap', lineHeight: 1 }}>
      {masked ? <span>{isCrypto ? '' : cur}••••••</span> : <span>{pre}{isCrypto ? '' : cur}{int}{dec && <span style={{ opacity: dim === false ? 1 : 0.5, fontSize: '0.72em' }}>.{d}</span>}{isCrypto ? ' ' + cur : ''}</span>}
    </span>
  );
}

function StatusBar({ onDark }) {
  const c = onDark ? '#fff' : 'var(--t1)';
  return (
    <div style={{ height: 50, padding: '14px 28px 0 34px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: c, position: 'relative', zIndex: 5, flexShrink: 0 }}>
      <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 }}>{[5, 7, 9, 11].map(h => <div key={h} style={{ width: 3, height: h, borderRadius: 1, background: c }}></div>)}</div>
        <Icon n="Wifi" s={16} w={2.4} c={c} />
        <div style={{ width: 25, height: 12, borderRadius: 4, border: `1.5px solid ${c}`, padding: 1.5, opacity: 0.9 }}><div style={{ width: '75%', height: '100%', borderRadius: 2, background: c }}></div></div>
      </div>
    </div>
  );
}

function Phone({ children, bg = 'var(--bg)', onDark }) {
  const theme = React.useContext(ThemeCtx);
  return (
    <div className="ph" data-t={theme} style={{ width: 412, height: 866, borderRadius: 62, padding: 11, background: '#0d0c10', boxShadow: '0 0 0 1.5px #2a2930, 0 40px 80px -30px rgba(40,20,60,.45)', flexShrink: 0 }}>
      <div style={{ width: 390, height: 844, borderRadius: 51, overflow: 'hidden', position: 'relative', background: bg, color: 'var(--t1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)', width: 122, height: 35, borderRadius: 20, background: '#000', zIndex: 20 }}></div>
        <StatusBar onDark={onDark} />
        {children}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 134, height: 5, borderRadius: 3, background: bg === '#000' ? '#fff' : 'var(--t1)', opacity: 0.85, zIndex: 30 }}></div>
      </div>
    </div>
  );
}

function Body({ children, pad = 20, gap = 20, style }) {
  return <div data-body="" style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: `4px ${pad}px 120px`, display: 'flex', flexDirection: 'column', gap, ...style }}>{children}</div>;
}

function IconBtn({ n, dot, s = 42, bg = 'var(--card)', c = 'var(--t1)', border = true }) {
  return (
    <div style={{ width: s, height: s, borderRadius: '50%', background: bg, display: 'grid', placeItems: 'center', position: 'relative', boxShadow: border ? 'inset 0 0 0 1px var(--line)' : 'none', flexShrink: 0 }}>
      <Icon n={n} s={s * 0.46} c={c} />
      {dot && <div style={{ position: 'absolute', top: s * 0.22, right: s * 0.24, width: 8, height: 8, borderRadius: '50%', background: 'var(--acc)', boxShadow: `0 0 0 2px ${bg}` }}></div>}
    </div>
  );
}

function Head({ title, action = 'See all', size = 18 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <span style={{ fontSize: size, fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</span>
      {action && <span style={{ fontSize: 14, color: 'var(--t2)', fontWeight: 500 }}>{action}</span>}
    </div>
  );
}

function Chip({ children, on, n }) {
  return (
    <div style={{ height: 36, padding: '0 15px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, background: on ? 'var(--t1)' : 'transparent', color: on ? 'var(--bg)' : 'var(--t2)', boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line2)' }}>
      {n && <Icon n={n} s={15} />}{children}
    </div>
  );
}

function Tile({ n, label, size = 56, tint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: size + 16 }}>
      <div style={{ width: size, height: size, borderRadius: 18, background: tint || 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', display: 'grid', placeItems: 'center' }}><Icon n={n} s={24} /></div>
      <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--t2)', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

function TxIcon({ n, tone = 'n' }) {
  const bg = tone === 'in' ? 'var(--posT)' : tone === 'acc' ? 'var(--accT)' : 'var(--card2)';
  const c = tone === 'in' ? 'var(--pos)' : tone === 'acc' ? 'var(--sel)' : 'var(--t1)';
  return <div style={{ width: 44, height: 44, borderRadius: '50%', background: bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n={n} s={20} c={c} /></div>;
}

function TxRow({ lead, title, sub, v, cur, meta, pad = 0 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: `${pad}px 0` }}>
      {lead}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 3 }}>{sub}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Amt v={v} cur={cur} size={15.5} sign color={v > 0 ? 'var(--pos)' : 'var(--t1)'} />
        {meta && <div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 5 }}>{meta}</div>}
      </div>
    </div>
  );
}

function Media({ src, h = 200, r = 20, children, style }) {
  return <div style={{ height: h, borderRadius: r, background: `center/cover url(img/${src}.jpg) #333`, position: 'relative', overflow: 'hidden', flexShrink: 0, ...style }}>{children}</div>;
}

function TypeTag({ n, children, light }) {
  return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 10px', borderRadius: 999, background: light ? 'rgba(255,255,255,.9)' : 'rgba(11,10,13,.55)', backdropFilter: 'blur(10px)', color: light ? '#111018' : '#fff', fontSize: 12, fontWeight: 600 }}><Icon n={n} s={13} w={2.2} />{children}</div>;
}

function PriceTag({ v, locked }) {
  return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 11px', borderRadius: 999, background: '#fff', color: '#111018', fontSize: 13, fontWeight: 700 }}>{locked && <Icon n="Lock" s={12} w={2.4} />}{v === 0 ? 'Free' : <Amt v={v} size={13} weight={700} dec={false} />}</div>;
}

function Logo({ h = 24 }) {
  const t = React.useContext(ThemeCtx);
  return <img src={t === 'dark' ? '../assets/wawu-logo-white.png' : '../assets/wawu-logo.png'} style={{ height: h, width: 'auto', display: 'block' }} />;
}

function Verified({ s = 16 }) {
  return <Icon n="BadgeCheck" s={s} c="var(--vc)" fill="var(--vcT)" w={2} />;
}

function Seg({ items, on = 0, h = 40 }) {
  return (
    <div style={{ display: 'flex', padding: 4, borderRadius: 999, background: 'var(--card2)', gap: 2 }}>
      {items.map((t, i) => <div key={t} style={{ flex: 1, height: h - 8, borderRadius: 999, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 600, background: i === on ? 'var(--card)' : 'transparent', color: i === on ? 'var(--t1)' : 'var(--t2)', boxShadow: i === on ? '0 1px 3px rgba(0,0,0,.08), inset 0 0 0 1px var(--line)' : 'none' }}>{t}</div>)}
    </div>
  );
}

function Flag({ cur, s = 36 }) {
  const map = { NGN: ['#0B8A4A', '₦'], USD: ['#1E3A8A', '$'], USDT: ['#26A17B', '₮'], BTC: ['#F7931A', '₿'] };
  const [bg, g] = map[cur];
  return <div style={{ width: s, height: s, borderRadius: '50%', background: bg, color: '#fff', display: 'grid', placeItems: 'center', fontSize: s * 0.46, fontWeight: 700, flexShrink: 0 }}>{g}</div>;
}

function Divider() { return <div style={{ height: 1, background: 'var(--line)' }}></div>; }

// ---------- Nav bars ----------
function NavItem({ n, label, on, labels = true }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: on ? 'var(--sel)' : 'var(--t3)' }}>
      <Icon n={n} s={24} w={on ? 2.2 : 1.8} fill={on ? 'var(--accT2)' : 'none'} />
      {labels && <span style={{ fontSize: 11, fontWeight: on ? 700 : 500 }}>{label}</span>}
    </div>
  );
}

const NavOverride = React.createContext(false);

// Locked shell: Home · Explore · Inbox · Wallet · Me, Create as a FAB
function NavLocked({ on, fab = true, onDark }) {
  const items = [['House', 'Home'], ['Compass', 'Explore'], ['MessageCircle', 'Inbox'], ['Wallet', 'Wallet'], ['CircleUserRound', 'Me']];
  return (
    <>
      {fab && <div style={{ position: 'absolute', right: 18, bottom: 106, width: 58, height: 58, borderRadius: '50%', background: 'var(--acc)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px -6px rgba(148,17,201,.65)', zIndex: 11 }}><Icon n="Plus" s={26} w={2.4} c="#fff" /></div>}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, background: onDark ? 'rgba(11,10,13,.72)' : 'var(--chrome)', backdropFilter: 'blur(20px)', boxShadow: onDark ? 'inset 0 1px 0 rgba(255,255,255,.08)' : 'inset 0 1px 0 var(--line)', display: 'flex', alignItems: 'center', padding: '0 8px 26px', zIndex: 10 }}>
        {items.map((it, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: on === i ? (onDark ? '#fff' : 'var(--sel)') : (onDark ? 'rgba(255,255,255,.58)' : 'var(--t3)'), position: 'relative' }}>
            <Icon n={it[0]} s={24} w={on === i ? 2.2 : 1.8} fill={on === i ? (onDark ? 'rgba(255,255,255,.2)' : 'var(--accT2)') : 'none'} />
            <span style={{ fontSize: 11, fontWeight: on === i ? 700 : 500 }}>{it[1]}</span>
            {i === 2 && <div style={{ position: 'absolute', top: -3, left: '56%', minWidth: 17, height: 17, borderRadius: 9, background: 'var(--acc)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', padding: '0 4px', boxShadow: '0 0 0 2px var(--bg)' }}>3</div>}
          </div>
        ))}
      </div>
    </>
  );
}

// A: five slots, Create raised in the middle
function NavCenterCreate({ on }) {
  if (React.useContext(NavOverride)) return <NavLocked on={on} />;
  const items = [['House', 'Home'], ['Compass', 'Explore'], null, ['Wallet', 'Wallet'], ['CircleUserRound', 'Me']];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 92, paddingBottom: 26, background: 'var(--chrome)', backdropFilter: 'blur(20px)', boxShadow: 'inset 0 1px 0 var(--line)', display: 'flex', alignItems: 'center', padding: '0 8px 26px', zIndex: 10 }}>
      {items.map((it, i) => it ? <NavItem key={i} n={it[0]} label={it[1]} on={on === i} /> : (
        <div key={i} style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 54, height: 54, borderRadius: 20, background: 'var(--acc)', display: 'grid', placeItems: 'center', boxShadow: '0 8px 20px -6px rgba(148,17,201,.6)', marginTop: -6 }}><Icon n="Plus" s={26} w={2.4} c="#fff" /></div>
        </div>
      ))}
    </div>
  );
}

// B: five flat tabs, Create is a FAB (the repo's current model, extended)
function NavFab({ on, fab = true }) {
  if (React.useContext(NavOverride)) return <NavLocked on={on} fab={fab} />;
  const items = [['House', 'Home'], ['Compass', 'Explore'], ['MessageCircle', 'Inbox'], ['Wallet', 'Money'], ['CircleUserRound', 'You']];
  return (
    <>
      {fab && <div style={{ position: 'absolute', right: 18, bottom: 108, width: 58, height: 58, borderRadius: '50%', background: 'var(--acc)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px -6px rgba(148,17,201,.65)', zIndex: 11 }}><Icon n="Plus" s={26} w={2.4} c="#fff" /></div>}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 88, background: 'var(--chrome)', backdropFilter: 'blur(20px)', boxShadow: 'inset 0 1px 0 var(--line)', display: 'flex', alignItems: 'center', padding: '0 6px 24px', zIndex: 10 }}>
        {items.map((it, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: on === i ? 'var(--t1)' : 'var(--t3)', position: 'relative' }}>
            {on === i && <div style={{ position: 'absolute', top: -14, width: 22, height: 3, borderRadius: 3, background: 'var(--acc)' }}></div>}
            <Icon n={it[0]} s={24} w={on === i ? 2.2 : 1.8} fill={on === i ? 'var(--accT2)' : 'none'} c={on === i ? 'var(--sel)' : 'currentColor'} />
            <span style={{ fontSize: 11, fontWeight: on === i ? 700 : 500 }}>{it[1]}</span>
            {i === 2 && <div style={{ position: 'absolute', top: -3, left: '56%', minWidth: 17, height: 17, borderRadius: 9, background: 'var(--acc)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', padding: '0 4px', boxShadow: '0 0 0 2px var(--bg)' }}>3</div>}
          </div>
        ))}
      </div>
    </>
  );
}

// C: Pay is the centre — the most frequent money action is one thumb away
function NavPay({ on, onDark }) {
  const items = [['Play', 'Watch'], ['Compass', 'Discover'], null, ['ReceiptText', 'Activity'], ['CircleUserRound', 'Me']];
  const bg = onDark ? 'rgba(11,10,13,.72)' : 'var(--chrome)';
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 92, background: bg, backdropFilter: 'blur(20px)', boxShadow: onDark ? 'inset 0 1px 0 rgba(255,255,255,.08)' : 'inset 0 1px 0 var(--line)', display: 'flex', alignItems: 'center', padding: '0 8px 26px', zIndex: 10 }}>
      {items.map((it, i) => it ? (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: on === i ? (onDark ? '#fff' : 'var(--sel)') : (onDark ? 'rgba(255,255,255,.55)' : 'var(--t3)') }}>
          <Icon n={it[0]} s={24} w={on === i ? 2.2 : 1.8} fill={on === i ? (onDark ? 'rgba(255,255,255,.2)' : 'var(--accT2)') : 'none'} />
          <span style={{ fontSize: 11, fontWeight: on === i ? 700 : 500 }}>{it[1]}</span>
        </div>
      ) : (
        <div key={i} style={{ flex: 1.25, display: 'grid', placeItems: 'center' }}>
          <div style={{ height: 48, padding: '0 18px', borderRadius: 999, background: on === 2 ? 'var(--acc)' : (onDark ? '#fff' : 'var(--t1)'), color: on === 2 ? '#fff' : (onDark ? '#111018' : 'var(--bg)'), display: 'flex', alignItems: 'center', gap: 7, fontSize: 15, fontWeight: 700 }}><Icon n="ArrowUpRight" s={19} w={2.4} />Pay</div>
        </div>
      ))}
    </div>
  );
}

// D: floating dock, active tab expands into a labelled pill
function Dock({ on }) {
  const items = [['House', 'Home'], ['Compass', 'Explore'], ['CreditCard', 'Cards'], ['MessageCircle', 'Inbox'], ['CircleUserRound', 'Me']];
  return (
    <div style={{ position: 'absolute', left: 20, right: 20, bottom: 26, height: 66, borderRadius: 999, background: 'var(--dock)', boxShadow: '0 16px 36px -12px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 9px', zIndex: 10 }}>
      {items.map((it, i) => on === i ? (
        <div key={i} style={{ height: 48, padding: '0 16px 0 13px', borderRadius: 999, background: 'var(--acc)', color: '#fff', display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700 }}><Icon n={it[0]} s={21} w={2.2} />{it[1]}</div>
      ) : (
        <div key={i} style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.62)', position: 'relative' }}>
          <Icon n={it[0]} s={23} />
          {i === 3 && <div style={{ position: 'absolute', top: 11, right: 11, width: 8, height: 8, borderRadius: '50%', background: '#C368EA' }}></div>}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { MaskCtx, ThemeCtx, Icon, Avatar, Amt, StatusBar, Phone, Body, IconBtn, Head, Chip, Tile, TxIcon, TxRow, Media, TypeTag, PriceTag, Logo, Verified, Seg, Flag, Divider, NavCenterCreate, NavFab, NavLocked, NavOverride, NavPay, Dock, HUES });
