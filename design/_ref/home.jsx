// Home — three tabs: Today (default) · Following · For you.
// Today = the web Home tab (TGIF, "What would you like to do today?", creators) + a money glance.
// Following / For you = the full-bleed feed from screen 11.
function HomeTabs({ on, onDark }) {
  const tabs = ['Today', 'Following', 'For you'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 16.5, fontWeight: 700 }}>
      {tabs.map((t, i) => <span key={t} style={{ color: onDark ? '#fff' : (i === on ? 'var(--t1)' : 'var(--t3)'), opacity: onDark && i !== on ? 0.6 : 1, paddingBottom: 6, borderBottom: i === on ? `2.5px solid ${onDark ? '#fff' : 'var(--acc)'}` : '2.5px solid transparent' }}>{t}</span>)}
    </div>
  );
}

function TgifCard({ compact }) {
  if (compact) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 18, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(140deg,#4A0E68,#9411C9)', display: 'grid', placeItems: 'center' }}><Icon n="Sun" s={20} c="#fff" /></div>
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--sel)' }}>TGIF · TODAY</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>This is the day which the LORD hath made…</div></div>
      <Icon n="ChevronRight" s={18} c="var(--t3)" />
    </div>
  );
  return (
    <div style={{ borderRadius: 24, padding: 20, background: 'linear-gradient(150deg,#2A0C3E 0%,#5B0F80 55%,#9411C9 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -50, top: -60, width: 190, height: 190, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,210,140,.35), transparent 70%)' }}></div>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.85 }}>TGIF · FRIDAY 26 SEPT</span><Icon n="Sun" s={20} c="rgba(255,255,255,.8)" /></div>
      <div style={{ position: 'relative', fontSize: 20, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.02em', marginTop: 12 }}>“This is the day which the LORD hath made; we will rejoice and be glad in it.”</div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <span style={{ fontSize: 13, opacity: 0.75 }}>Psalm 118:24</span>
        <div style={{ height: 38, padding: '0 16px', borderRadius: 999, background: '#fff', color: '#111018', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}>Reflect<Icon n="ArrowRight" s={15} w={2.4} /></div>
      </div>
    </div>
  );
}

const TODAY_SVC = [['bills', 'Pay bills'], ['events', 'Events'], ['legal', 'Legal'], ['shop', 'Shop']];

function CreatorsRailMini() {
  const cr = [['Adaeze O.', 'Business Strategist', 'p1'], ['Funmi A.', 'Accountant', 'p2'], ['Zainab B.', 'Agribusiness', 'p3']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Head title="Creators to discover" />
      <div style={{ display: 'flex', gap: 10, margin: '0 -20px', padding: '0 20px' }}>
        {cr.map(([n, r, img], i) => (
          <Media key={n} src={img} h={196} r={20} style={{ width: 146 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(11,10,13,.88))' }}></div>
            <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, color: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><div style={{ fontSize: 14, fontWeight: 700 }}>{n}</div><div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{r}</div></div>
              <div style={{ height: 32, borderRadius: 999, background: 'var(--acc)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700 }}>Follow</div>
            </div>
          </Media>
        ))}
      </div>
    </div>
  );
}

// Today · variant 1 — TGIF leads (as on web), money is a single calm strip
function H_Today1() {
  return (
    <Phone>
      <div style={{ padding: '6px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <HomeTabs on={0} />
        <div style={{ display: 'flex', gap: 8 }}><IconBtn n="Search" s={40} /><IconBtn n="Bell" dot s={40} /></div>
      </div>
      <Body gap={22}>
        <TgifCard />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 12px 16px', borderRadius: 20, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
          <div style={{ flex: 1 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--t3)', fontWeight: 600 }}>Naira wallet<Icon n="Eye" s={14} /></div><div style={{ marginTop: 5 }}><Amt v={485250} size={22} /></div></div>
          {[['ArrowUpRight', 1], ['Plus'], ['ScanLine']].map(([n, p]) => <div key={n} style={{ width: 44, height: 44, borderRadius: '50%', background: p ? 'var(--acc)' : 'var(--card2)', display: 'grid', placeItems: 'center' }}><Icon n={n} s={19} w={2.2} c={p ? '#fff' : 'var(--t1)'} /></div>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><div style={{ fontSize: 18.5, fontWeight: 700, letterSpacing: '-0.025em' }}>What would you like to do today?</div><div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 3 }}>One app. More possibilities.</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', rowGap: 14, justifyItems: 'center' }}>{TODAY_SVC.map(([k, l, s]) => <Svc key={k} k={k} label={l} soon={s} s={58} />)}</div>
        </div>
        <CreatorsRailMini />
      </Body>
      <NavLocked on={0} />
    </Phone>
  );
}

// Today · variant 2 — money leads, TGIF folds to one line
function H_Today2() {
  return (
    <Phone>
      <div style={{ padding: '6px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <HomeTabs on={0} />
        <div style={{ display: 'flex', gap: 8 }}><IconBtn n="Search" s={40} /><IconBtn n="Bell" dot s={40} /></div>
      </div>
      <Body gap={20}>
        <div style={{ borderRadius: 26, background: 'var(--money)', color: '#fff', padding: '18px 18px 16px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--moneySh)' }}>
          <div style={{ position: 'absolute', right: -60, top: -80, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(148,17,201,.55), transparent 70%)' }}></div>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ height: 30, padding: '0 10px 0 4px', borderRadius: 999, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}><Flag cur="NGN" s={22} />Naira<Icon n="ChevronDown" s={14} c="#fff" /></div>
            <Icon n="Eye" s={19} c="rgba(255,255,255,.7)" />
          </div>
          <div style={{ position: 'relative', margin: '14px 0 18px' }}><Amt v={485250} size={38} /></div>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
            {[['ArrowUpRight', 'Send'], ['Plus', 'Add'], ['Receipt', 'Bills'], ['ScanLine', 'Scan']].map(([n, t], i) => (
              <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 64 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: i ? 'rgba(255,255,255,.12)' : 'var(--acc)', display: 'grid', placeItems: 'center' }}><Icon n={n} s={20} w={2.2} c="#fff" /></div>
                <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <TgifCard compact />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 18.5, fontWeight: 700, letterSpacing: '-0.025em' }}>What would you like to do today?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', justifyItems: 'center' }}>{TODAY_SVC.map(([k, l, s]) => <Svc key={k} k={k} label={l} soon={s} s={60} />)}</div>
        </div>
        <CreatorsRailMini />
      </Body>
      <NavLocked on={0} />
    </Phone>
  );
}

function Immersive({ tab, img, name, hue, caption, offer }) {
  return (
    <Phone onDark bg="#000">
      <div style={{ position: 'absolute', inset: 0, background: `center/cover url(img/${img}.jpg)` }}></div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.5), transparent 22%, transparent 50%, rgba(0,0,0,.85) 88%)' }}></div>
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px' }}>
        <HomeTabs on={tab} onDark />
        <Icon n="Search" s={24} c="#fff" />
      </div>
      <div style={{ position: 'absolute', right: 14, bottom: 196, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, color: '#fff' }}>
        <div style={{ position: 'relative' }}><Avatar name={name} hue={hue} s={48} ring="#fff" />{tab === 2 && <div style={{ position: 'absolute', bottom: -9, left: 15, width: 20, height: 20, borderRadius: '50%', background: 'var(--acc)', display: 'grid', placeItems: 'center' }}><Icon n="Plus" s={13} c="#fff" w={3} /></div>}</div>
        {[['Heart', '12.4K'], ['MessageCircle', '340'], ['Bookmark', '1.1K']].map(([n, v]) => <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}><Icon n={n} s={29} c="#fff" w={2} /><span style={{ fontSize: 12.5, fontWeight: 600 }}>{v}</span></div>)}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}><div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(10px)', display: 'grid', placeItems: 'center', fontSize: 19, fontWeight: 700 }}>₦</div><span style={{ fontSize: 12.5, fontWeight: 600 }}>Tip</span></div>
      </div>
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 104, zIndex: 4, color: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ paddingRight: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 700 }}>{name} <Icon n="BadgeCheck" s={16} c="#fff" fill="#9411C9" />{tab === 1 && <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.75, marginLeft: 2 }}>· Following</span>}</div>
          <div style={{ fontSize: 14.5, marginTop: 6, lineHeight: 1.4, opacity: 0.92 }}>{caption}</div>
        </div>
        {offer && <div style={{ height: 56, marginRight: 70, borderRadius: 18, background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(20px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px 0 14px' }}>
          <Icon n={offer[0]} s={22} c="#fff" />
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{offer[1]}</div><div style={{ fontSize: 12, opacity: 0.7 }}>{offer[2]}</div></div>
          <div style={{ height: 40, padding: '0 14px', borderRadius: 13, background: '#fff', color: '#111018', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700 }}><Amt v={offer[3]} size={14} weight={700} dec={false} /></div>
        </div>}
      </div>
      <NavLocked on={0} onDark />
    </Phone>
  );
}
const H_Following = () => <Immersive tab={1} img="w5" name="Ifeanyi Nwosu" hue="coral" caption="New drop: the Aba collection, cut and sewn on camera. Full pattern pack below." offer={['LayoutTemplate', 'Aba Collection · patterns', 'Template · Pay from wallet', 3500]} />;
const H_ForYou = () => <Immersive tab={2} img="w1" name="Tife Adeola" hue="lemon" caption="Orbit — lesson 1 of my VFX course. The rest is inside." offer={['GraduationCap', 'VFX for Beginners', '12 lessons · Pay from wallet', 8000]} />;

Object.assign(window, { H_Today1, H_Today2, H_Following, H_ForYou, HomeTabs });
