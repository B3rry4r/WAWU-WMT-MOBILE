// Explore — eight variants, all built from the web Explore content model:
// featured hero, creator categories, featured creators (photo + Follow), events (date block),
// professional doors, learning, platform services (commissioned art), featured-this-week.
const CR = [
  ['Adaeze Okonkwo', 'Business Strategist', 'p1', 2],
  ['Funmi Adeyemi', 'Accountant', 'p2', 1],
  ['Zainab Bello', 'Agribusiness Trainer', 'p3', 1],
  ['Musa Danladi', 'Welder & trainer', 'p4', 0],
  ['Ifeanyi Nwosu', 'Fashion Designer', 'p5', 1],
];
const CATS = [['LayoutGrid', 'All'], ['Music', 'Music'], ['Clapperboard', 'Film & Video'], ['Palette', 'Art & Design'], ['Camera', 'Photography'], ['Shirt', 'Fashion'], ['PenLine', 'Writing'], ['Ellipsis', 'More']];
const SVC = [['bills', 'Bills'], ['events', 'Events'], ['legal', 'Legal'], ['loans', 'Loans', 1], ['bnpl', 'BNPL', 1], ['pensions', 'Pensions', 1], ['telemedicine', 'Health', 1], ['shop', 'Shop', 1]];
const EV = [['e1', 'OCT', '12', 'WAWU Creators Summit', 'Eko Convention Centre', 'Conference'], ['e2', 'OCT', '18', 'Gospel Night Live', 'Abuja', 'Concert'], ['e3', 'NOV', '02', 'Monetise Your Content', 'Online', 'Workshop']];

function Search({ ph = 'Search creators, services, events', h = 48, r = 999 }) {
  return <div style={{ flex: 1, height: h, borderRadius: r, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', color: 'var(--t3)', fontSize: 15 }}><Icon n="Search" s={19} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{ph}</span></div>;
}
function Follow({ on, h = 34, light }) {
  return <div style={{ height: h, borderRadius: 999, display: 'grid', placeItems: 'center', fontSize: 13.5, fontWeight: 700, background: on ? (light ? 'rgba(255,255,255,.2)' : 'transparent') : 'var(--acc)', color: on ? (light ? '#fff' : 'var(--t2)') : '#fff', boxShadow: on && !light ? 'inset 0 0 0 1px var(--line2)' : 'none', backdropFilter: light ? 'blur(8px)' : 'none' }}>{on ? 'Following' : 'Follow'}</div>;
}
function Ticks({ n = 1, s = 14 }) {
  if (!n) return null;
  return <span style={{ display: 'inline-flex', gap: 1 }}>{Array.from({ length: n }).map((_, i) => <Icon key={i} n="BadgeCheck" s={s} c="#fff" fill={i ? '#3DA5FF' : '#9411C9'} w={2} />)}</span>;
}
function CreatorCard({ c, w = 150, h = 200, on }) {
  const [name, role, img, ticks] = c;
  return (
    <div style={{ width: w, flexShrink: 0 }}>
      <Media src={img} h={h} r={20}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(11,10,13,.88))' }}></div>
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, color: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div><div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{name.split(' ')[0]} {name.split(' ')[1][0]}.<Ticks n={ticks} s={13} /></div><div style={{ fontSize: 12, opacity: 0.8, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{role}</div></div>
          <Follow on={on} h={32} light />
        </div>
      </Media>
    </div>
  );
}
function DateBlock({ m, d, s = 1 }) {
  return <div style={{ width: 44 * s, height: 48 * s, borderRadius: 12 * s, background: 'var(--acc)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 9.5 * s, fontWeight: 700, letterSpacing: '0.08em', opacity: 0.85 }}>{m}</span><span style={{ fontSize: 18 * s, fontWeight: 700, lineHeight: 1 }}>{d}</span></div>;
}
function EventCard({ e, w = 230 }) {
  const [img, m, d, t, loc, tag] = e;
  return (
    <div style={{ width: w, flexShrink: 0, borderRadius: 20, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', overflow: 'hidden' }}>
      <Media src={img} h={120} r={0}><div style={{ position: 'absolute', top: 10, left: 10 }}><DateBlock m={m} d={d} /></div><div style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(11,10,13,.5)', display: 'grid', placeItems: 'center' }}><Icon n="Bookmark" s={16} c="#fff" /></div></Media>
      <div style={{ padding: '11px 13px 13px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--t3)', marginTop: 4 }}><Icon n="MapPin" s={13} />{loc}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>{[tag, loc === 'Online' ? 'Online' : 'In person'].map(x => <span key={x} style={{ height: 24, padding: '0 9px', borderRadius: 999, boxShadow: 'inset 0 0 0 1px var(--line2)', fontSize: 11.5, fontWeight: 600, color: 'var(--t2)', display: 'grid', placeItems: 'center' }}>{x}</span>)}</div>
      </div>
    </div>
  );
}
const SVC_ICON = { bills: 'Zap', events: 'CalendarDays', legal: 'Scale', shop: 'ShoppingBag', loans: 'Landmark', bnpl: 'CreditCard', pensions: 'PiggyBank', telemedicine: 'Stethoscope' };
function Svc({ k, label, soon, s = 60 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: soon ? 0.45 : 1, width: s + 16 }}>
      <div style={{ width: s, height: s, borderRadius: s * 0.32, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', display: 'grid', placeItems: 'center' }}><Icon n={SVC_ICON[k]} s={s * 0.42} c="var(--sel)" w={1.9} /></div>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}
function Rail({ children, gap = 10 }) {
  return <div style={{ display: 'flex', gap, margin: '0 -20px', padding: '0 20px', overflow: 'hidden' }}>{children}</div>;
}
function SecHead({ title, cap }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
      <div><div style={{ fontSize: 18.5, fontWeight: 700, letterSpacing: '-0.025em' }}>{title}</div>{cap && <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 3 }}>{cap}</div>}</div>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--sel)', flexShrink: 0 }}>See all</span>
    </div>
  );
}
function TopBar({ children }) {
  return <div style={{ padding: '6px 20px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>{children}</div>;
}
function Door({ n, t, s }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accT)', display: 'grid', placeItems: 'center' }}><Icon n={n} s={19} c="var(--sel)" /></div>
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 600 }}>{t}</div><div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 2 }}>{s}</div></div>
      <Icon n="ChevronRight" s={17} c="var(--t3)" />
    </div>
  );
}
const Card = ({ children, style }) => <div style={{ borderRadius: 22, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', ...style }}>{children}</div>;

// E1 — Faithful port of the approved desktop structure
function E1() {
  return (
    <Phone>
      <TopBar><img src="../assets/wawu-icon-purple.png" style={{ width: 34 }} /><Search ph="Search WAWU" h={44} /><IconBtn n="Bell" dot s={44} /></TopBar>
      <Body gap={20}>
        <Media src="e1" h={196} r={24}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(11,10,13,.92), rgba(11,10,13,.2))' }}></div>
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16, color: '#fff', display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#D9A6F2' }}>FEATURED EVENT</span>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1 }}>WAWU Creators Summit, Lagos</span>
            <span style={{ fontSize: 13, opacity: 0.8 }}>12 Oct · Eko Convention Centre</span>
          </div>
          <div style={{ position: 'absolute', right: 16, bottom: 18, display: 'flex', gap: 5 }}>{[22, 6, 6].map((w, i) => <div key={i} style={{ width: w, height: 6, borderRadius: 3, background: i ? 'rgba(255,255,255,.4)' : '#fff' }}></div>)}</div>
        </Media>
        <Rail gap={8}>
          {CATS.map(([n, t], i) => <div key={t} style={{ width: 80, height: 80, flexShrink: 0, borderRadius: 18, background: i ? 'var(--card)' : 'var(--accT)', boxShadow: i ? 'inset 0 0 0 1px var(--line)' : 'inset 0 0 0 1.5px var(--acc)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7 }}><Icon n={n} s={21} c="var(--sel)" /><span style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{t}</span></div>)}
        </Rail>
        <SecHead title="Featured creators" cap="Talent across Africa and beyond" />
        <Rail>{CR.map((c, i) => <CreatorCard key={i} c={c} on={i === 2} />)}</Rail>
        <SecHead title="Upcoming events" />
        <Rail>{EV.map((e, i) => <EventCard key={i} e={e} />)}</Rail>
      </Body>
      <NavLocked on={1} />
    </Phone>
  );
}

// E2 — Tabbed directory: web's top tab row becomes a sticky segmented scroller
function E2() {
  return (
    <Phone>
      <TopBar><Search h={46} /><IconBtn n="SlidersHorizontal" s={46} /></TopBar>
      <div style={{ display: 'flex', gap: 22, padding: '0 20px', fontSize: 15.5, fontWeight: 600, boxShadow: 'inset 0 -1px 0 var(--line)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {['For you', 'Creators', 'Professionals', 'Events', 'Learning', 'Services'].map((t, i) => <div key={t} style={{ paddingBottom: 12, color: i === 1 ? 'var(--t1)' : 'var(--t3)', boxShadow: i === 1 ? 'inset 0 -2.5px 0 var(--acc)' : 'none' }}>{t}</div>)}
      </div>
      <Body gap={16} style={{ paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 8, overflow: 'hidden', margin: '0 -20px', padding: '0 20px' }}>{['All', 'Music', 'Film & Video', 'Art & Design', 'Fashion'].map((t, i) => <Chip key={t} on={!i}>{t}</Chip>)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--t2)' }}><span><b style={{ color: 'var(--t1)' }}>1,284</b> creators</span><span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>Most followed<Icon n="ChevronDown" s={15} /></span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CR.concat([CR[0]]).slice(0, 4).map((c, i) => <CreatorCard key={i} c={c} w="100%" h={218} on={i === 1} />)}
        </div>
      </Body>
      <NavLocked on={1} />
    </Phone>
  );
}

// E3 — Services first (the "tiles" reference): WAWU as a super-app
function E3() {
  const feat = [['p1', 'Creator', 'Adaeze O.', 'Business Strategist', 'Follow'], ['p2', 'Professional', 'Funmi A.', 'Accountant · from ₦15K', 'Book now'], ['e1', 'Event', 'Creators Summit', '12 Oct · Lagos', 'Get tickets']];
  return (
    <Phone>
      <TopBar><div style={{ flex: 1, fontSize: 28, fontWeight: 700, letterSpacing: '-0.035em' }}>Explore</div><IconBtn n="Search" /><IconBtn n="Bell" dot /></TopBar>
      <Body gap={22}>
        <Card style={{ padding: '18px 8px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', rowGap: 16, justifyItems: 'center' }}>{SVC.map(([k, l, s]) => <Svc key={k} k={k} label={l} soon={s} s={56} />)}</div>
        </Card>
        <SecHead title="Featured this week" cap="Creators, professionals and events" />
        <Rail>
          {feat.map(([img, kind, t, s, cta], i) => (
            <div key={i} style={{ width: 160, flexShrink: 0 }}>
              <Media src={img} h={226} r={20}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 38%, rgba(11,10,13,.9))' }}></div>
                <div style={{ position: 'absolute', top: 10, left: 10, height: 22, padding: '0 8px', borderRadius: 999, background: 'rgba(11,10,13,.66)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', display: 'grid', placeItems: 'center' }}>{kind.toUpperCase()}</div>
                <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, color: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><div style={{ fontSize: 14.5, fontWeight: 700 }}>{t}</div><div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{s}</div></div>
                  <div style={{ height: 32, borderRadius: 999, background: i === 1 ? '#fff' : 'var(--acc)', color: i === 1 ? '#111018' : '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700 }}>{cta}</div>
                </div>
              </Media>
            </div>
          ))}
        </Rail>
      </Body>
      <NavLocked on={1} />
    </Phone>
  );
}

// E4 — Editorial: one big story per scroll, like a magazine front
function E4() {
  return (
    <Phone>
      <TopBar><div style={{ flex: 1 }}><div style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 600 }}>Friday, 26 September</div><div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.035em' }}>Explore</div></div><IconBtn n="Search" /></TopBar>
      <Body gap={22}>
        <Media src="p5" h={330} r={28}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.2), transparent 30%, rgba(11,10,13,.92))' }}></div>
          <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#fff', opacity: 0.9 }}>CREATOR OF THE WEEK</div>
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18, color: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Ifeanyi Nwosu <Ticks n={1} s={20} /></div><div style={{ fontSize: 14, opacity: 0.85, marginTop: 4, lineHeight: 1.4 }}>Fashion designer in Aba. Teaching pattern-cutting to 3,000 students.</div></div>
            <div style={{ display: 'flex', gap: 8 }}><div style={{ flex: 1 }}><Follow h={42} /></div><div style={{ flex: 1, height: 42, borderRadius: 999, background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700 }}>View profile</div></div>
          </div>
        </Media>
        <SecHead title="This week" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: -6 }}>
          {EV.slice(0, 2).map(([img, m, d, t, loc, tag]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <DateBlock m={m} d={d} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 15.5, fontWeight: 600 }}>{t}</div><div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 2 }}>{tag} · {loc}</div></div>
              <Media src={img} h={52} r={12} style={{ width: 52 }} />
            </div>
          ))}
        </div>
      </Body>
      <NavLocked on={1} />
    </Phone>
  );
}

// E5 — Bento: every door is a live preview, sized by importance
function E5() {
  const face = (s, z, x) => <div style={{ width: 40, height: 40, borderRadius: '50%', background: `center/cover url(img/${s}.jpg)`, boxShadow: '0 0 0 2.5px var(--card)', marginLeft: x, zIndex: z }}></div>;
  return (
    <Phone>
      <TopBar><div style={{ flex: 1, fontSize: 28, fontWeight: 700, letterSpacing: '-0.035em' }}>Explore</div><IconBtn n="Bell" dot /></TopBar>
      <Body gap={12}>
        <div style={{ display: 'flex', marginBottom: 6 }}><Search /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: 128, gap: 10 }}>
          <Media src="p3" h="auto" r={22} style={{ gridRow: 'span 2' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(11,10,13,.88))' }}></div>
            <div style={{ position: 'absolute', left: 14, bottom: 14, color: '#fff' }}><div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>Creators</div><div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 2 }}>1,284 across 15 fields</div></div>
          </Media>
          <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex' }}>{face('p2', 3, 0)}{face('p4', 2, -12)}{face('p1', 1, -12)}</div>
            <div><div style={{ fontSize: 16, fontWeight: 700 }}>Professionals</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Lawyers, accountants…</div></div>
          </Card>
          <Media src="e2" h="auto" r={22}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,10,13,.45)' }}></div>
            <div style={{ position: 'absolute', top: 12, left: 12 }}><DateBlock m="OCT" d="18" s={0.85} /></div>
            <div style={{ position: 'absolute', left: 14, bottom: 12, color: '#fff', fontSize: 16, fontWeight: 700 }}>Events</div>
          </Media>
          <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Icon n="GraduationCap" s={26} c="var(--sel)" />
            <div><div style={{ fontSize: 16, fontWeight: 700 }}>Learning</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>42 courses</div></div>
          </Card>
          <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Icon n="Users" s={26} c="var(--sel)" />
            <div><div style={{ fontSize: 16, fontWeight: 700 }}>Communities</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>120 active</div></div>
          </Card>
          <Card style={{ gridColumn: 'span 2', padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700 }}>Services</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Bills, legal, events and more</div></div>
            <div style={{ display: 'flex', gap: 6 }}>{['bills', 'legal', 'events'].map(k => <div key={k} style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--accT)', display: 'grid', placeItems: 'center' }}><Icon n={SVC_ICON[k]} s={19} c="var(--sel)" /></div>)}</div>
          </Card>
        </div>
      </Body>
      <NavLocked on={1} />
    </Phone>
  );
}

// E6 — Intent-first: start from what you want to do, not what WAWU has
function E6() {
  const rows = [
    ['UserRoundSearch', 'Find creators to follow', '1,284 creators · 15 fields', ['p1', 'p3', 'p5']],
    ['BriefcaseBusiness', 'Hire a professional', 'Lawyers, accountants, mentors', ['p2', 'p4']],
    ['CalendarDays', 'Go to an event', '14 this month near Lagos', ['e1', 'e2']],
    ['GraduationCap', 'Learn a skill', '42 courses · 9 free', ['c1', 'c2']],
    ['Zap', 'Get things done', 'Bills, CAC filings, legal', null],
  ];
  return (
    <Phone>
      <TopBar><img src="../assets/wawu-icon-purple.png" style={{ width: 34 }} /><div style={{ flex: 1 }}></div><IconBtn n="Bell" dot /></TopBar>
      <Body gap={16}>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1 }}>What are you<br />looking for today?</div>
        <div style={{ display: 'flex' }}><Search ph="Try “accountant in Ikeja”" /></div>
        <Card>
          {rows.map(([n, t, s, imgs], i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', boxShadow: i ? 'inset 0 1px 0 var(--line)' : 'none' }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--accT)', display: 'grid', placeItems: 'center' }}><Icon n={n} s={20} c="var(--sel)" /></div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15.5, fontWeight: 600 }}>{t}</div><div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 2 }}>{s}</div></div>
              <div style={{ display: 'flex' }}>{imgs ? imgs.map((m, j) => <div key={m} style={{ width: 30, height: 30, borderRadius: '50%', background: `center/cover url(img/${m}.jpg)`, marginLeft: j ? -9 : 0, boxShadow: '0 0 0 2px var(--card)' }}></div>) : <Icon n="Zap" s={20} c="var(--sel)" />}</div>
            </div>
          ))}
        </Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['CAC registration', 'Afrobeats', 'Photography class', 'Tax filing'].map(t => <div key={t} style={{ height: 32, padding: '0 12px', borderRadius: 999, background: 'var(--card2)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--t2)' }}><Icon n="TrendingUp" s={13} />{t}</div>)}
        </div>
      </Body>
      <NavLocked on={1} />
    </Phone>
  );
}

// E7 — Stories + masonry: people first, then a mixed discovery wall
function E7() {
  return (
    <Phone>
      <TopBar><Search h={46} ph="Search WAWU" /><IconBtn n="Bell" dot s={46} /></TopBar>
      <Body gap={18}>
        <Rail gap={14}>
          {CR.map(([n, r, img], i) => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 66, flexShrink: 0 }}>
              <div style={{ padding: 2.5, borderRadius: '50%', boxShadow: i < 3 ? '0 0 0 2.5px var(--acc)' : '0 0 0 1.5px var(--line2)' }}><div style={{ width: 60, height: 60, borderRadius: '50%', background: `center/cover url(img/${img}.jpg)` }}></div></div>
              <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{n.split(' ')[0]}</span>
            </div>
          ))}
        </Rail>
        <div style={{ display: 'flex', gap: 8, overflow: 'hidden', margin: '0 -20px', padding: '0 20px' }}>{['For you', 'Creators', 'Events', 'Learning', 'Pros'].map((t, i) => <Chip key={t} on={!i}>{t}</Chip>)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <CreatorCard c={CR[0]} w="100%" h={230} />
            <Media src="c1" h={150} r={20}><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(11,10,13,.85))' }}></div><div style={{ position: 'absolute', top: 10, left: 10 }}><TypeTag n="GraduationCap">Course</TypeTag></div><div style={{ position: 'absolute', left: 12, right: 12, bottom: 11, color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>Content Creation & Social Growth</div></Media>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Media src="e3" h={170} r={20}><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(11,10,13,.85))' }}></div><div style={{ position: 'absolute', top: 10, left: 10 }}><DateBlock m="NOV" d="02" s={0.85} /></div><div style={{ position: 'absolute', left: 12, right: 12, bottom: 11, color: '#fff', fontSize: 14, fontWeight: 700 }}>Monetise Your Content</div></Media>
            <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><div style={{ width: 38, height: 38, borderRadius: '50%', background: 'center/cover url(img/p2.jpg)' }}></div><div><div style={{ fontSize: 13.5, fontWeight: 700 }}>Funmi A.</div><div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Accountant</div></div></div>
              <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.4 }}>Tax filing for creators, from ₦15,000</div>
              <div style={{ height: 32, borderRadius: 999, background: 'var(--t1)', color: 'var(--bg)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700 }}>Book</div>
            </Card>
          </div>
        </div>
      </Body>
      <NavLocked on={1} />
    </Phone>
  );
}

// E8 — Near you: location-aware, pay-ready listings
function E8() {
  const pros = [['p2', 'Funmi Adeyemi', 'Accountant · Ikeja', 4.9, 15000], ['p4', 'Musa Danladi', 'Welding trainer · Yaba', 4.7, 8000], ['p1', 'Adaeze Okonkwo', 'Business mentor · Lekki', 5.0, 25000]];
  return (
    <Phone>
      <TopBar>
        <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, color: 'var(--t3)', fontWeight: 600 }}>Exploring near</div><div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}><Icon n="MapPin" s={18} c="var(--sel)" w={2.2} />Lagos<Icon n="ChevronDown" s={17} /></div></div>
        <IconBtn n="Search" /><IconBtn n="Bell" dot />
      </TopBar>
      <Body gap={20}>
        <div style={{ display: 'flex', gap: 8, overflow: 'hidden', margin: '0 -20px', padding: '0 20px' }}>{['This weekend', 'Free', 'Online', 'Under ₦10K'].map((t, i) => <Chip key={t} on={!i}>{t}</Chip>)}</div>
        <Rail>{EV.map((e, i) => <EventCard key={i} e={e} w={250} />)}</Rail>
        <SecHead title="Professionals near you" cap="Pay from your WAWU wallet" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: -4 }}>
          {pros.map(([img, n, s, r, p]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `center/cover url(img/${img}.jpg)`, flexShrink: 0 }}></div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 600 }}>{n}</div><div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--t3)', marginTop: 3 }}><Icon n="Star" s={12} c="var(--warn)" fill="var(--warn)" />{r.toFixed(1)} · {s}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11.5, color: 'var(--t3)' }}>from</div><Amt v={p} size={15} dec={false} /></div>
            </div>
          ))}
        </div>
      </Body>
      <NavLocked on={1} />
    </Phone>
  );
}

window.EXPLORE = [
  [E1, 'Faithful port', 'The approved desktop Explore, re-flowed for a thumb: featured hero, category tiles, creator cards with Follow, event cards with date blocks.'],
  [E2, 'Tabbed directory', 'The web’s top tab row becomes a sticky scroller. Each tab is a full directory with filters, sort and a 2-up photo grid.'],
  [E3, 'Services first', 'From the “tiles” reference: WAWU’s commissioned service icons lead, then one mixed rail where each card carries its own action — Follow, Book, Get tickets.'],
  [E4, 'Editorial', 'One big story per scroll: a creator of the week, then a short dated list. Calm, curated, least like a catalogue.'],
  [E5, 'Bento', 'Every section is a door with a live preview, sized by importance. Whole app visible in one screen, no scrolling needed.'],
  [E6, 'Intent-first', 'Starts from what the user wants to do, not what WAWU has. Five plain-language jobs plus trending searches.'],
  [E7, 'People + wall', 'Creator rings up top, then a mixed masonry of creators, events, courses and bookable pros.'],
  [E8, 'Near you', 'Location-aware. Weekend events and nearby professionals with ratings and prices you can pay from your wallet.'],
];

Object.assign(window, { Svc, CreatorCard, EventCard, DateBlock, Follow, Ticks, Rail, SecHead });
