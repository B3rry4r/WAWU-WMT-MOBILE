// Direction A — "Two Rooms": content and money are separate tabs, bridged by a balance chip.
function A_Home() {
  return (
    <Phone>
      <div style={{ padding: '6px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo h={26} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ height: 42, padding: '0 14px 0 6px', borderRadius: 999, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flag cur="NGN" s={30} /><Amt v={485250} size={14.5} dec={false} />
          </div>
          {!React.useContext(NavOverride) && <IconBtn n="MessageCircle" dot />}
          <IconBtn n="Bell" dot={React.useContext(NavOverride)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px', overflow: 'hidden' }}>
        <Chip on>For you</Chip><Chip>Following</Chip><Chip>Courses</Chip><Chip>Audio</Chip><Chip>Templates</Chip>
      </div>
      <Body gap={22}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Media src="w6" h={250}>
            <div style={{ position: 'absolute', top: 12, left: 12 }}><TypeTag n="Play">Video · 18 min</TypeTag></div>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center' }}><Icon n="Play" s={24} c="#111018" fill="#111018" /></div></div>
          </Media>
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar name="Tife Adeola" hue="lemon" s={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.3 }}>Shooting a documentary on ₦0 budget — the full breakdown</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13.5, color: 'var(--t2)', marginTop: 5 }}>Tife Adeola <Verified s={14} /> · 12K views · 2d</div>
            </div>
            <Icon n="EllipsisVertical" s={20} c="var(--t3)" />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Media src="w2" h={210}>
            <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(14px)', background: 'rgba(11,10,13,.35)' }}></div>
            <div style={{ position: 'absolute', top: 12, left: 12 }}><TypeTag n="GraduationCap">Course · 9 lessons</TypeTag></div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#fff' }}>
              <Icon n="Lock" s={26} c="#fff" />
              <div style={{ height: 40, padding: '0 18px', borderRadius: 999, background: '#fff', color: '#111018', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14.5 }}>Unlock · <Amt v={8000} size={14.5} weight={700} dec={false} /></div>
            </div>
          </Media>
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar name="Kemi Okafor" hue="pink" s={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: '-0.015em' }}>Pricing your freelance work in 2026</div>
            </div>
          </div>
        </div>
      </Body>
      <NavCenterCreate on={0} />
    </Phone>
  );
}

function A_Explore() {
  const creators = [['Tife Adeola', 'lemon', 'Film'], ['Kemi Okafor', 'pink', 'Design'], ['Chidi Eze', 'sky', 'Tech'], ['Amaka Nwosu', 'green', 'Music'], ['Femi B', 'coral', 'Biz']];
  return (
    <Phone>
      <Body gap={22} style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.035em' }}>Explore</div>
        <div style={{ height: 50, borderRadius: 16, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', color: 'var(--t3)', fontSize: 15.5 }}><Icon n="Search" s={20} />Creators, courses, communities</div>
        <div style={{ display: 'flex', gap: 8, overflow: 'hidden', margin: '-6px 0' }}><Chip on>All</Chip><Chip n="Users">Creators</Chip><Chip n="Hash">Communities</Chip><Chip n="Calendar">Events</Chip><Chip n="GraduationCap">Learn</Chip></div>
        <Head title="Rising this week" />
        <div style={{ display: 'flex', gap: 16, margin: '-8px 0 0' }}>
          {creators.map(([n, h, t]) => <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, width: 60 }}><Avatar name={n} hue={h} s={60} /><span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{n.split(' ')[0]}</span><span style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: -5 }}>{t}</span></div>)}
        </div>
        <Head title="Top courses in Lagos" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: -8 }}>
          {[['c1', 'Brand voice for small shops', 5000, 'Kemi Okafor'], ['w4', 'Sunset colour grading', 0, 'Tife Adeola']].map(([s, t, p, a]) => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Media src={s} h={132} r={16}><div style={{ position: 'absolute', bottom: 8, left: 8 }}><PriceTag v={p} locked={p > 0} /></div></Media>
              <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{t}</div>
              <div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: -4 }}>{a}</div>
            </div>
          ))}
        </div>
        <Head title="Communities" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', marginTop: -8 }}>
          <Media src="w5" h={48} r={14} style={{ width: 48 }} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600 }}>Lagos Freelancers</div><div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 2 }}>4.2K members · 7-day free trial</div></div>
          <div style={{ height: 34, padding: '0 14px', borderRadius: 999, background: 'var(--t1)', color: 'var(--bg)', display: 'grid', placeItems: 'center', fontSize: 13.5, fontWeight: 600 }}>Join</div>
        </div>
      </Body>
      <NavCenterCreate on={1} />
    </Phone>
  );
}

function A_Create() {
  const types = [['Video', 'Play'], ['Course', 'GraduationCap'], ['Audio', 'AudioLines'], ['Book / PDF', 'BookOpen'], ['Image / Art', 'Image'], ['Template', 'LayoutTemplate']];
  return (
    <Phone>
      <div style={{ position: 'absolute', inset: 0, background: 'center/cover url(img/w6.jpg)', filter: 'blur(3px)' }}></div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,10,13,.55)' }}></div>
      <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, borderRadius: 44, background: 'var(--bg)', padding: '12px 20px 40px', display: 'flex', flexDirection: 'column', gap: 18, zIndex: 12 }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: 'var(--line2)', alignSelf: 'center' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Create</div><div style={{ fontSize: 14, color: 'var(--t2)', marginTop: 3 }}>Free or paid — you set the price.</div></div>
          <IconBtn n="X" s={38} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {types.map(([t, n]) => <div key={t} style={{ height: 96, borderRadius: 20, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 14 }}><Icon n={n} s={24} /><span style={{ fontSize: 14, fontWeight: 600 }}>{t}</span></div>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 20, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
          {[['Calendar', 'Host an event', 'Reviewed before it goes live'], ['Hash', 'Post to a community', 'Lagos Freelancers +2'], ['HandCoins', 'Request money', 'Send a payment link']].map(([n, t, s], i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', boxShadow: i ? 'inset 0 1px 0 var(--line)' : 'none' }}>
              <TxIcon n={n} /><div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600 }}>{t}</div><div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 2 }}>{s}</div></div><Icon n="ChevronRight" s={18} c="var(--t3)" />
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}

function A_Wallet() {
  return (
    <Phone>
      <div style={{ padding: '6px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.035em' }}>Wallet</div>
        <div style={{ display: 'flex', gap: 8 }}><IconBtn n="ScanLine" /><IconBtn n="Settings2" /></div>
      </div>
      <Body gap={20}>
        <Seg items={['Naira', 'Dollar', 'Crypto']} on={0} h={42} />
        <div style={{ borderRadius: 28, background: 'var(--money)', color: '#fff', padding: 22, position: 'relative', overflow: 'hidden', boxShadow: 'var(--moneySh)' }}>
          <div style={{ position: 'absolute', right: -60, top: -80, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(148,17,201,.55), transparent 70%)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <span style={{ fontSize: 14, opacity: 0.7 }}>Naira balance</span><Icon n="Eye" s={19} c="rgba(255,255,255,.7)" />
          </div>
          <div style={{ marginTop: 10, position: 'relative' }}><Amt v={485250} size={42} weight={600} /></div>
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)', position: 'relative' }}>
            <div><div style={{ fontSize: 12, opacity: 0.6 }}>WAWU · Fintava MFB</div><div style={{ fontSize: 15, fontWeight: 600, marginTop: 3, letterSpacing: '0.04em' }}>812 345 6789</div></div>
            <div style={{ height: 32, padding: '0 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}><Icon n="Copy" s={14} c="#fff" />Copy</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['ArrowUpRight', 'Send'], ['Plus', 'Add money']].map(([n, t]) => <div key={t} style={{ flex: 1, height: 54, borderRadius: 999, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15.5, fontWeight: 600 }}><Icon n={n} s={19} w={2.2} />{t}</div>)}
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', display: 'grid', placeItems: 'center' }}><Icon n="ArrowLeftRight" s={19} w={2.2} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {[['Smartphone', 'Airtime'], ['Wifi', 'Data'], ['Zap', 'Power'], ['Tv', 'TV'], ['LayoutGrid', 'More']].map(([n, t]) => <Tile key={t} n={n} label={t} size={54} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Head title="Transactions" />
          <TxRow lead={<Avatar name="Amaka Nwosu" hue="green" />} title="Amaka Nwosu" sub="Tip on your video" v={2000} meta="10:24" />
          <TxRow lead={<TxIcon n="Zap" />} title="Ikeja Electric" sub="Prepaid · 45.2 kWh" v={-10500} meta="Yesterday" />
        </div>
      </Body>
      <NavCenterCreate on={3} />
    </Phone>
  );
}

function A_Me() {
  return (
    <Phone>
      <div style={{ padding: '6px 20px 0', display: 'flex', justifyContent: 'space-between' }}>
        <IconBtn n="QrCode" /><div style={{ display: 'flex', gap: 8 }}><IconBtn n="Share" /><IconBtn n="Settings" /></div>
      </div>
      <Body gap={20} style={{ paddingTop: 6 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          <Avatar name="Lennox Emmanuel" hue="lilac" s={92} ring="var(--acc)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 23, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 4 }}>Lennox Emmanuel <Verified s={20} /></div>
          <div style={{ fontSize: 14, color: 'var(--t2)', marginTop: -4 }}>@lennox · Creator · Lagos</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderRadius: 20, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', padding: '16px 0' }}>
          {[['12.5K', 'Followers'], ['48', 'Pieces'], ['4.9', 'Rating']].map(([v, l], i) => <div key={l} style={{ textAlign: 'center', boxShadow: i ? 'inset 1px 0 0 var(--line)' : 'none' }}><div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em' }}>{v}</div><div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 3 }}>{l}</div></div>)}
        </div>
        <div style={{ borderRadius: 22, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>Earned in September</span><span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--pos)', background: 'var(--posT)', padding: '4px 9px', borderRadius: 999 }}>+18%</span></div>
          <Amt v={128400} size={32} />
          <div style={{ display: 'flex', gap: 4, height: 40, alignItems: 'flex-end' }}>{[30, 44, 26, 52, 38, 60, 48, 70, 56, 82, 64, 100].map((h, i) => <div key={i} style={{ flex: 1, height: h + '%', borderRadius: 4, background: i === 11 ? 'var(--acc)' : 'var(--card2)' }}></div>)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 20, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
          {[['LayoutGrid', 'My content', '48'], ['MessageSquareDot', 'Paid DMs', '₦500 / msg'], ['ShoppingBag', 'My purchases', '12']].map(([n, t, s], i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', boxShadow: i ? 'inset 0 1px 0 var(--line)' : 'none' }}><Icon n={n} s={21} /><span style={{ flex: 1, fontSize: 15.5, fontWeight: 500 }}>{t}</span><span style={{ fontSize: 14, color: 'var(--t3)' }}>{s}</span><Icon n="ChevronRight" s={18} c="var(--t3)" /></div>
          ))}
        </div>
      </Body>
      <NavCenterCreate on={4} />
    </Phone>
  );
}

window.DIR_A = [A_Home, A_Explore, A_Create, A_Wallet, A_Me];
