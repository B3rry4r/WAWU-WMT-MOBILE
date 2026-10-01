// Direction B — "Pocket": money rides along on Home and inside conversations.
function B_Home() {
  return (
    <Phone>
      <div style={{ padding: '6px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name="Lennox Emmanuel" hue="lilac" s={44} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, color: 'var(--t2)' }}>Good morning</div><div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Lennox</div></div>
        <IconBtn n="Search" /><IconBtn n="Bell" dot />
      </div>
      <Body gap={24}>
        <div style={{ borderRadius: 26, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', padding: '18px 18px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--t2)', fontWeight: 500 }}>Naira wallet <Icon n="ChevronDown" s={15} /></div>
            <Icon n="Eye" s={18} c="var(--t3)" />
          </div>
          <div style={{ margin: '8px 0 18px' }}><Amt v={485250} size={36} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {[['ArrowUpRight', 'Send', true], ['Plus', 'Add'], ['Receipt', 'Bills'], ['ArrowLeftRight', 'Swap']].map(([n, t, p]) => (
              <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, width: 66 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: p ? 'var(--acc)' : 'var(--card2)', display: 'grid', placeItems: 'center' }}><Icon n={n} s={21} w={2.2} c={p ? '#fff' : 'var(--t1)'} /></div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t2)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Head title="Continue watching" />
          <div style={{ display: 'flex', gap: 12 }}>
            {[['w1', 'Orbit — a short film', 62], ['w5', 'Coastlines, ep. 3', 30]].map(([s, t, p]) => (
              <div key={s} style={{ width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                <Media src={s} h={130} r={18}><div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.35)' }}><div style={{ width: p + '%', height: '100%', borderRadius: 2, background: '#fff' }}></div></div></Media>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="Chidi Eze" hue="sky" s={36} />
            <div style={{ flex: 1, fontSize: 14.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>Chidi Eze <Verified s={14} /><span style={{ fontWeight: 400, color: 'var(--t3)' }}>· 3h</span></div>
          </div>
          <Media src="w3" h={170} r={20}><div style={{ position: 'absolute', top: 12, left: 12 }}><TypeTag n="AudioLines">Audio · 42 min</TypeTag></div></Media>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13.5, color: 'var(--t2)', fontWeight: 500, marginRight: 2 }}>Tip</span>
            {[500, 1000, 2500].map(v => <div key={v} style={{ height: 34, padding: '0 13px', borderRadius: 999, boxShadow: 'inset 0 0 0 1px var(--line2)', display: 'grid', placeItems: 'center' }}><Amt v={v} size={13.5} dec={false} /></div>)}
          </div>
        </div>
      </Body>
      <NavFab on={0} />
    </Phone>
  );
}

function B_Explore() {
  const cats = [['w1', 'Video', '2.4K'], ['c2', 'Courses', '380'], ['w3', 'Audio', '910'], ['e2', 'Books', '220'], ['w5', 'Art', '1.1K'], ['c1', 'Templates', '540']];
  return (
    <Phone>
      <Body gap={20} style={{ paddingTop: 8 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, height: 50, borderRadius: 999, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', color: 'var(--t3)', fontSize: 15.5 }}><Icon n="Search" s={20} />Search WAWU</div>
          <IconBtn n="SlidersHorizontal" s={50} />
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 16, fontWeight: 600, boxShadow: 'inset 0 -1px 0 var(--line)' }}>
          {['Content', 'Creators', 'Communities', 'Events'].map((t, i) => <div key={t} style={{ paddingBottom: 12, color: i ? 'var(--t3)' : 'var(--t1)', borderBottom: i ? '2px solid transparent' : '2px solid var(--acccc)' }}>{t}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {cats.map(([s, t, c], i) => (
            <Media key={t} src={s} h={i === 0 || i === 3 ? 196 : 148} r={20} style={{ gridRow: 'auto' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,.65))' }}></div>
              <div style={{ position: 'absolute', left: 14, bottom: 12, color: '#fff' }}><div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>{t}</div><div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 2 }}>{c} pieces</div></div>
            </Media>
          ))}
        </div>
      </Body>
      <NavFab on={1} />
    </Phone>
  );
}

function B_Inbox() {
  const rows = [
    ['Amaka Nwosu', 'green', 'Sent you ₦5,000', '10:24', 'money', 2],
    ['Chidi Eze', 'sky', 'Paid DM · 18h left to reply', '09:51', 'dm', 1],
    ['Lagos Freelancers', 'lemon', 'Tolu: who’s at the meetup Sat?', '09:12', null, 0],
    ['Kemi Okafor', 'pink', 'Requested ₦12,000 · Logo edits', 'Yest.', 'req', 0],
    ['Femi Bankole', 'coral', 'You: Thanks, got it', 'Yest.', null, 0],
    ['WAWU', 'lilac', 'Your card has shipped', 'Mon', null, 0],
  ];
  return (
    <Phone>
      <div style={{ padding: '6px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.035em' }}>Inbox</div>
        <IconBtn n="SquarePen" />
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 14px' }}><Chip on>All</Chip><Chip>Paid DMs · 1</Chip><Chip>Communities</Chip><Chip>Money</Chip></div>
      <Body gap={0} pad={20}>
        {rows.map(([n, h, m, t, k, u]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', boxShadow: 'inset 0 -1px 0 var(--line)' }}>
            {n === 'WAWU' ? <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--card2)', display: 'grid', placeItems: 'center' }}><img src="../assets/wawu-icon-purple.png" style={{ width: 30 }} /></div> : <Avatar name={n} hue={h} s={52} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 16, fontWeight: 600 }}>{n}</span><span style={{ fontSize: 12.5, color: u ? 'var(--sel)' : 'var(--t3)', fontWeight: u ? 700 : 400 }}>{t}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, gap: 8 }}>
                <span style={{ fontSize: 14, color: u ? 'var(--t1)' : 'var(--t2)', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {k === 'money' && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: 'var(--posT)' }}><Icon n="ArrowDownLeft" s={13} w={2.6} c="var(--pos)" /></span>}
                  {k === 'dm' && <Icon n="Clock" s={15} c="var(--warn)" w={2.2} />}
                  {k === 'req' && <Icon n="HandCoins" s={16} c="var(--t2)" />}
                  {m}
                </span>
                {u > 0 && <span style={{ minWidth: 21, height: 21, borderRadius: 11, background: 'var(--acc)', color: '#fff', fontSize: 11.5, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{u}</span>}
              </div>
            </div>
          </div>
        ))}
      </Body>
      <NavFab on={2} />
    </Phone>
  );
}

function B_Money() {
  const acc = [['NGN', 'Naira', 485250, '₦', '812 345 6789'], ['USD', 'Dollar', 1240.5, '$', 'US account · ••4410'], ['USDT', 'Tether', 320, 'USDT', 'TRC-20'], ['BTC', 'Bitcoin', 0.0142, 'BTC', '≈ ₦1,402,000']];
  return (
    <Phone>
      <div style={{ padding: '6px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.035em' }}>Money</div>
        <div style={{ display: 'flex', gap: 8 }}><IconBtn n="ReceiptText" /><IconBtn n="Plus" /></div>
      </div>
      <Body gap={20}>
        <div>
          <div style={{ fontSize: 13.5, color: 'var(--t2)', fontWeight: 500 }}>All accounts, in Naira</div>
          <div style={{ marginTop: 6 }}><Amt v={3769840.2} size={40} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13.5, color: 'var(--pos)', fontWeight: 600 }}><Icon n="TrendingUp" s={15} w={2.4} />₦42,100 this week</div>
        </div>
        <div style={{ borderRadius: 22, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
          {acc.map(([c, l, v, cur, s], i) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', boxShadow: i ? 'inset 0 1px 0 var(--line)' : 'none' }}>
              <Flag cur={c} s={40} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 15.5, fontWeight: 600 }}>{l}</div><div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 3 }}>{s}</div></div>
              <Amt v={v} cur={cur} size={16} dec={c !== 'BTC'} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 22, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)', padding: 14 }}>
          <div style={{ width: 74, height: 48, borderRadius: 9, background: 'var(--money)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            <img src="../assets/wawu-icon-white.png" style={{ position: 'absolute', left: 7, top: 7, width: 16 }} />
            <div style={{ position: 'absolute', right: 7, bottom: 6, fontSize: 8, color: '#fff', fontWeight: 700, letterSpacing: '0.05em' }}>VERVE</div>
          </div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600 }}>WAWU card</div><div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 2 }}>Physical · ••4821 · Active</div></div>
          <Icon n="ChevronRight" s={18} c="var(--t3)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Head title="Pay bills" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', rowGap: 14, justifyItems: 'center' }}>
            {[['Smartphone', 'Airtime'], ['Wifi', 'Data'], ['Zap', 'Power'], ['Tv', 'Cable TV'], ['Router', 'Internet'], ['GraduationCap', 'School'], ['Landmark', 'Tax'], ['LayoutGrid', 'More']].map(([n, t]) => <Tile key={t} n={n} label={t} size={54} />)}
          </div>
        </div>
      </Body>
      <NavFab on={3} fab={false} />
    </Phone>
  );
}

function B_You() {
  return (
    <Phone onDark>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, background: 'center/cover url(img/w4.jpg)' }}><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.25), transparent 50%)' }}></div></div>
      <div style={{ position: 'relative', padding: '6px 20px 0', display: 'flex', justifyContent: 'flex-end', gap: 8, zIndex: 3 }}>
        <IconBtn n="Share" bg="rgba(11,10,13,.4)" c="#fff" border={false} /><IconBtn n="Settings" bg="rgba(11,10,13,.4)" c="#fff" border={false} />
      </div>
      <Body gap={16} style={{ paddingTop: 76, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <Avatar name="Lennox Emmanuel" hue="lilac" s={96} ring="var(--bg)" />
          <div style={{ height: 38, padding: '0 16px', borderRadius: 999, boxShadow: 'inset 0 0 0 1px var(--line2)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 600 }}>Edit profile</div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Lennox Emmanuel <Verified s={20} /></div>
          <div style={{ fontSize: 14.5, color: 'var(--t2)', marginTop: 5, lineHeight: 1.45 }}>Filmmaker & brand strategist. Teaching African creators to get paid for their craft.</div>
        </div>
        <Socials />
        <div style={{ display: 'flex', gap: 22, fontSize: 14, color: 'var(--t2)' }}>
          <span><b style={{ color: 'var(--t1)', fontSize: 16 }}>12.5K</b> followers</span><span><b style={{ color: 'var(--t1)', fontSize: 16 }}>486</b> following</span><span><b style={{ color: 'var(--t1)', fontSize: 16 }}>48</b> pieces</span>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 15, fontWeight: 600, boxShadow: 'inset 0 -1px 0 var(--line)', marginTop: 4 }}>
          {['Content', 'Services', 'Shop', 'About'].map((t, i) => <div key={t} style={{ paddingBottom: 12, color: i ? 'var(--t3)' : 'var(--t1)', borderBottom: i ? '2px solid transparent' : '2px solid var(--t1)', marginBottom: -1 }}>{t}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, margin: '0 -20px' }}>
          {['w1', 'w2', 'w6', 'c1', 'w3', 'e3'].map((s, i) => (
            <Media key={s} src={s} h={128} r={0}>
              {i === 1 || i === 4 ? <><div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,.3)' }}></div><div style={{ position: 'absolute', top: 8, right: 8 }}><Icon n="Lock" s={15} c="#fff" w={2.4} /></div></> : null}
              <div style={{ position: 'absolute', left: 8, bottom: 7, display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 12, fontWeight: 600 }}><Icon n="Play" s={12} c="#fff" fill="#fff" />{['12K', '₦8K', '3.1K', '940', '₦2.5K', '8.4K'][i]}</div>
            </Media>
          ))}
        </div>
      </Body>
      <NavFab on={4} fab={false} />
    </Phone>
  );
}

window.DIR_B = [B_Home, B_Explore, B_Inbox, B_Money, B_You];
