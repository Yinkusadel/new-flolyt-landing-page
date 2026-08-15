import React, { useEffect, useState, useRef } from 'react';
import fullLogo from './assets/full-black-flolyt-logo.svg';
import iconLogo from './assets/dark-logo.svg';

export default function App() {
  const [route, setRoute] = useState('/');
  const [stuck, setStuck] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [activeStep, setActiveStep] = useState('s1');

  // Interactive clock timer inside Room Demo
  const [clockMinutes, setClockMinutes] = useState(4);
  const [clockSeconds, setClockSeconds] = useState(12);

  // Form handling
  const [formData, setFormData] = useState({ fn: '', ln: '', em: '', co: '', rv2: 'Under $500K' });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Intersection Observer for scroll animations
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Scroll header sticky detection
    const handleScroll = () => {
      setStuck(window.scrollY > 6);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hash routing
  useEffect(() => {
    const handleHashChange = () => {
      let raw = (window.location.hash || '#/').slice(1);
      let anchor = '';
      if (raw.charAt(0) !== '/') {
        // This is an in-page anchor like #contact
        const el = document.getElementById(raw);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }
      const hi = raw.indexOf('#');
      if (hi > -1) {
        anchor = raw.slice(hi + 1);
        raw = raw.slice(0, hi);
      }
      const validRoutes = ['/', '/pricing', '/rooms'];
      const targetRoute = validRoutes.includes(raw) ? raw : '/';
      setRoute(targetRoute);

      if (anchor) {
        setTimeout(() => {
          const el = document.getElementById(anchor);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        window.scrollTo(0, 0);
      }
      setMobileMenuOpen(false);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Active room ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setClockSeconds((prev) => {
        if (prev >= 59) {
          setClockMinutes((m) => m + 1);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Intersection observer for triggers on current page
  useEffect(() => {
    // Reset classes of animating elements to trigger them beautifully
    document.querySelectorAll('.seen').forEach((el) => el.classList.remove('seen'));
    document.querySelectorAll('.in').forEach((el) => el.classList.remove('in'));
    document.querySelectorAll('.go').forEach((el) => el.classList.remove('go'));
    document.querySelectorAll('.bar i').forEach((b) => {
      (b as HTMLElement).style.width = '0%';
    });

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.classList.add('seen');
          io.unobserve(target);
          fireAnimation(target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });

    observerRef.current = io;

    const elements = document.querySelectorAll('.page.active .rv:not(.seen)');
    elements.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, [route]);

  // Story scrollspy inside the /rooms page
  useEffect(() => {
    if (route !== '/rooms') return;

    const steps = document.querySelectorAll('#page-rooms .step');
    const vis: Record<string, boolean> = {};

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        vis[entry.target.id] = entry.isIntersecting;
      });
      const ids = Array.from(steps).map((s) => s.id);
      const cur = ids.filter((id) => vis[id])[0] || ids[0] || 's1';
      setActiveStep(cur);
    }, { rootMargin: '-15% 0px -60% 0px' });

    steps.forEach((s) => spy.observe(s));

    return () => spy.disconnect();
  }, [route]);

  // High performance animations for counts, odometers, and progress bars
  const formatNum = (n: number, fmt?: string) => {
    if (fmt === 'usd') {
      return '$' + Math.round(n).toLocaleString('en-US');
    }
    return Math.round(n).toLocaleString('en-US');
  };

  const animateValue = (el: HTMLElement, to: number, dur: number, render: (v: number) => void) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      render(to);
      return;
    }
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const easeOutCubic = 1 - Math.pow(1 - p, 3);
      render(to * easeOutCubic);
      if (p < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  const fireAnimation = (el: HTMLElement) => {
    if (el.id === 'roomdemo') {
      runRoom(el);
    }
    if (el.id === 'leakmini' || el.classList.contains('card')) {
      runBars(el);
    }
    if (el.id === 'stats') {
      runOdometer(el);
    }
  };

  const runBars = (root: HTMLElement) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.querySelectorAll('.bar i[data-w]').forEach((b, i) => {
      const htmlB = b as HTMLElement;
      setTimeout(() => {
        htmlB.style.width = htmlB.dataset.w || '0%';
      }, prefersReducedMotion ? 0 : 120 + i * 100);
    });
  };

  const runOdometer = (root: HTMLElement) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.querySelectorAll('[data-odo]').forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      const to = +(htmlEl.dataset.odo || 0);
      const pre = htmlEl.dataset.prefix || '';
      const suf = htmlEl.dataset.suffix || '';
      setTimeout(() => {
        animateValue(htmlEl, to, 1300, (v) => {
          htmlEl.textContent = pre + Math.round(v).toLocaleString('en-US') + suf;
        });
      }, prefersReducedMotion ? 0 : i * 120);
    });
  };

  const runRoom = (root: HTMLElement) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.querySelectorAll('[data-count]').forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      const to = +(htmlEl.dataset.count || 0);
      const fmt = htmlEl.dataset.fmt;
      setTimeout(() => {
        animateValue(htmlEl, to, 1400, (v) => {
          htmlEl.textContent = formatNum(v, fmt);
        });
      }, prefersReducedMotion ? 0 : 220 + i * 120);
    });

    const p = root.querySelector('#brk') as SVGPathElement | null;
    if (p && !prefersReducedMotion) {
      const length = p.getTotalLength();
      p.style.setProperty('--L', String(length));
      setTimeout(() => {
        p.classList.add('go');
      }, 400);
    }

    root.querySelectorAll('.ev').forEach((ev, i) => {
      const htmlEv = ev as HTMLElement;
      setTimeout(() => {
        htmlEv.classList.add('in');
      }, prefersReducedMotion ? 0 : 880 + i * 170);
    });

    setTimeout(() => {
      const d = root.querySelector('#dec') as HTMLElement | null;
      if (d) {
        d.classList.add('in');
      }
    }, prefersReducedMotion ? 0 : 1700);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { fn, ln, em, co } = formData;
    if (!fn.trim() || !ln.trim() || !em.trim() || !co.trim()) {
      const firstEmptyField = !fn.trim() ? 'fn' : !ln.trim() ? 'ln' : !em.trim() ? 'em' : 'co';
      document.getElementById(firstEmptyField)?.focus();
      return;
    }
    setFormSubmitted(true);
  };

  const handleScrollToStep = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Pricing pricing calculations
  const growthPrice = billingAnnual ? Math.round(2500 * 0.9) : 2500;
  const growthSave = billingAnnual ? `Saves $${Math.round(2500 * 0.1 * 12).toLocaleString('en-US')} a year` : '\u00A0';

  const scalePrice = billingAnnual ? Math.round(6000 * 0.9) : 6000;
  const scaleSave = billingAnnual ? `Saves $${Math.round(6000 * 0.1 * 12).toLocaleString('en-US')} a year` : '\u00A0';

  return (
    <div>
      <header className={`nav ${stuck ? 'stuck' : ''}`} id="nav">
        <div className="nav-in">
          <a className="logo" href="#/" aria-label="Flolyt home">
            <img src={fullLogo} alt="Flolyt" className="logo-full" />
            <img src={iconLogo} alt="Flolyt" className="logo-icon" />
          </a>
          <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`} id="navlinks">
            <a href="#/" aria-current={route === '/' ? 'page' : undefined}>Platform</a>
            <a href="#/rooms" aria-current={route === '/rooms' ? 'page' : undefined}>How it works</a>
            <a href="#/pricing" aria-current={route === '/pricing' ? 'page' : undefined}>Pricing</a>
            <a href="#/rooms#trust">Security</a>
            <a href="/blog/">Blog</a>
          </nav>
          <div className="nav-right">
            <a className="txt" href="#/pricing">Log in</a>
            <a className="btn btn-line" href="#contact">Talk to sales</a>
            <a className="btn btn-dark" href="#/pricing">Start for free</a>
            <button 
              className="burger" 
              id="burger" 
              aria-label="Menu" 
              aria-expanded={mobileMenuOpen ? "true" : "false"}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path d="M1 1h14M1 6h14M1 11h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ───────────────── PAGE: HOME ───────────────── */}
      <main className={`page ${route === '/' ? 'active' : ''}`} id="page-home">
        <section className="hero">
          <div className="holo"></div>
          <div className="wrap hero-grid">
            <div>
              <h1 className="d1 rv">Turn revenue data into decisions your team acts on</h1>
              <p className="lede rv r1">Connect your live data to AI agents and shared rooms that find, explain, and close revenue leaks.</p>
              <div className="hero-cta rv r2">
                <a className="btn btn-dark btn-lg" href="#/pricing">Start for free</a>
                <a className="btn btn-line btn-lg" href="#contact">Talk with our team</a>
              </div>
              <div className="hero-trust rv r3">
                <span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5 2.5 4v4c0 3.2 2.3 5.6 5.5 6.5 3.2-.9 5.5-3.3 5.5-6.5V4L8 1.5Z" stroke="#12857E" strokeWidth="1.4" strokeLinejoin="round"/>
                    <path d="m5.8 8 1.6 1.6L10.4 6" stroke="#12857E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>SSO, RBAC, and audit logs
                </span>
                <span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="#12857E" strokeWidth="1.4"/>
                    <path d="M8 4.5V8l2.4 1.6" stroke="#12857E" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>160+ connected data sources
                </span>
                <span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M2.5 12V6.5M6.8 12V3.5M11.2 12V8M15 12H1" stroke="#12857E" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>No per-seat pricing
                </span>
              </div>
            </div>

            {/* Live Room Demo */}
            <div className="room rv r1" id="roomdemo">
              <div className="room-bar">
                <span className="lv"></span>
                <span>ROOM 2471</span>
                <span className="hide-s">·</span>
                <span className="hide-s">opened by Repeat &amp; Decay Agent</span>
                <span style={{ marginLeft: 'auto' }} id="clock">
                  {clockMinutes}:{clockSeconds < 10 ? '0' : ''}{clockSeconds} ago
                </span>
              </div>
              <div className="room-body">
                <h2 className="room-h">Second-order rate fell from 38% to 27% for everyone who signed up after 4 March.</h2>
                <div className="mrow">
                  <div>
                    <div className="k">Customers affected</div>
                    <div className="v" data-count="148000" data-fmt="int">0</div>
                  </div>
                  <div>
                    <div className="k">At risk · 90 days</div>
                    <div className="v rose" data-count="412000" data-fmt="usd">$0</div>
                  </div>
                  <div>
                    <div className="k">Confidence</div>
                    <div className="v">0.91</div>
                  </div>
                </div>
                <div className="spark">
                  <div className="cap">−11 pts</div>
                  <svg viewBox="0 0 420 70" preserveAspectRatio="none" aria-label="Second-order rate falling from 38 to 27 percent">
                    <path className="a" d="M0 20 L60 17 L120 22 L180 18 L240 21"/>
                    <path className="b" id="brk" d="M240 21 L290 32 L340 46 L390 55 L420 58"/>
                    <circle cx="240" cy="21" r="3.5" fill="#CE3F51"/>
                    <line x1="240" y1="0" x2="240" y2="70" stroke="#F4CBD1" strokeWidth="1" strokeDasharray="3 3"/>
                  </svg>
                </div>
                <div className="evh">
                  <span>Evidence</span>
                  <span>Weight</span>
                </div>
                <div className="ev" style={{ ['--f' as any]: 1 }}>
                  <span className="wg"><i></i></span>
                  <div>
                    <div className="tx"><b>The delivery fee appears after the cart, not before it.</b> Introduced in the 4 March checkout release.</div>
                    <div className="sr">Measured · product analytics + release log</div>
                  </div>
                </div>
                <div className="ev" style={{ ['--f' as any]: 0.72 }}>
                  <span className="wg"><i></i></span>
                  <div>
                    <div className="tx">Customers whose first order arrived late reorder <b>31% less often</b>.</div>
                    <div className="sr">Corroborated · support tickets + order data</div>
                  </div>
                </div>
                <div className="ev" style={{ ['--f' as any]: 0.45 }}>
                  <span className="wg"><i></i></span>
                  <div>
                    <div className="tx">The first-order discount is not reapplied, so order two reads as a price rise.</div>
                    <div className="sr">Indicative · pricing table</div>
                  </div>
                </div>
                <div className="ev" style={{ ['--f' as any]: 0.18 }}>
                  <span className="wg"><i></i></span>
                  <div>
                    <div className="tx">Two competitors dropped their free-delivery threshold in March.</div>
                    <div className="sr">Unverified · third-party report</div>
                  </div>
                </div>
                <div className="dec" id="dec">
                  <div className="st">Show delivery fees before the cart, and hold the first-order discount through order two.</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="pill p-teal"><span className="dt"></span>Approved · Dana O.</span>
                    <span className="pill p-amber"><span className="dt"></span>Objection open · Finance</span>
                  </div>
                </div>
              </div>
              <div className="room-ft">
                <span className="ftk">In the room</span>
                <span className="stack">
                  <span className="av" style={{ background: 'var(--t-prod)' }}>DO</span>
                  <span className="av" style={{ background: 'var(--t-sup)' }}>AM</span>
                  <span className="av" style={{ background: 'var(--t-fin)' }}>RV</span>
                  <span className="av" style={{ background: 'var(--t-eng)' }}>TK</span>
                </span>
                <span className="ftk" style={{ marginLeft: '6px' }}>Running</span>
                <span className="stack ag"><span className="av">RD</span><span className="av">DQ</span></span>
                <span className="ftk" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <img
                    src={iconLogo}
                    alt=""
                    style={{ width: '12px', height: '12px' }}
                  />
                  Flolyt workspace
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="wrap" style={{ paddingTop: '14px', paddingBottom: '14px' }}>
          <p className="sm rv" style={{ margin: 0 }}>Connects to the systems you already run</p>
        </div>
        <div className="strip">
          <div className="mq" id="mq">
            <span>Postgres</span><span>Stripe</span><span>Shopify</span><span>Snowflake</span><span>BigQuery</span><span>Segment</span><span>HubSpot</span><span>Zendesk</span><span>Slack</span><span>Linear</span><span>Jira</span><span>Paystack</span><span>Braze</span><span>Klaviyo</span>
            <span>Postgres</span><span>Stripe</span><span>Shopify</span><span>Snowflake</span><span>BigQuery</span><span>Segment</span><span>HubSpot</span><span>Zendesk</span><span>Slack</span><span>Linear</span><span>Jira</span><span>Paystack</span><span>Braze</span><span>Klaviyo</span>
          </div>
        </div>

        {/* ───────────────── STATS SECTION ───────────────── */}
        <section className="band-sm">
          <div className="wrap">
            <div className="shead rv">
              <h2 className="d2">A workspace that gets smarter with every decision</h2>
              <p className="lede" style={{ marginTop: '16px' }}>Every room, approval, and outcome is retained on your workspace—helping you diagnose faster, act sooner, and stop repeating the same mistakes.</p>
              <p className="sm" style={{ marginTop: '14px' }}>Figures from the example workspace used throughout this site.</p>
            </div>
            <div className="stats rv r1" id="stats">
              <div className="stat">
                <div className="n">
                  <span className="was">11 days</span>
                  <span data-odo="1" data-suffix=" day">0</span>
                </div>
                <p>From revenue break to a named owner</p>
              </div>
              <div className="stat">
                <div className="n">
                  <span data-odo="312" data-prefix="$" data-suffix="K">$0</span>
                </div>
                <p>Preserved by a single room, measured against a holdout</p>
              </div>
              <div className="stat">
                <div className="n">
                  <span data-odo="10" data-suffix="">0</span>
                </div>
                <p>Specialist AI agents included in every workspace</p>
              </div>
              <div className="stat">
                <div className="n">
                  <span data-odo="0" data-suffix="">0</span>
                </div>
                <p>Per-seat charges, on any plan</p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────── PRODUCT CARDS SECTION ───────────────── */}
        <section className="band soft">
          <div className="wrap">
            <div className="shead-row">
              <div className="shead rv">
                <div className="kicker">The platform</div>
                <h2 className="d2">Powered by your own live data.<br/>Built for every stage of the revenue lifecycle.</h2>
                <p className="lede">One workspace for finding revenue leaks, deciding what to do about them, and proving what worked.</p>
              </div>
              <a className="tlink rv r1" href="#/rooms">
                See all capabilities 
                <svg className="arw" width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <path d="M1 5h11M8.5 1.5 12 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>

            <div className="cards" id="cards">
              {/* Card 1: Leakage Map */}
              <div className="card wide rv">
                <div className="viz">
                  <div className="mini" id="leakmini">
                    <div className="hd">
                      <span>Revenue leakage</span>
                      <span>90 days · USD</span>
                    </div>
                    <div className="rw">
                      <div>Checkout friction<div className="bar"><i data-w="88%"></i></div></div>
                      <div className="amt">$412,000</div>
                    </div>
                    <div className="rw">
                      <div>Failed payments<div className="bar"><i data-w="61%"></i></div></div>
                      <div className="amt">$286,400</div>
                    </div>
                    <div className="rw">
                      <div>Discount leakage<div className="bar"><i data-w="39%"></i></div></div>
                      <div className="amt">$183,900</div>
                    </div>
                    <div className="rw">
                      <div>Gross margin<div className="bar"><i data-w="0%"></i></div></div>
                      <div className="amt na">Unavailable</div>
                    </div>
                    <div className="rw">
                      <div>Recovered · Q3<div className="bar"><i className="t" data-w="54%"></i></div></div>
                      <div className="amt t">$312,000</div>
                    </div>
                  </div>
                </div>
                <div className="txt">
                  <h3 className="d3">Revenue leakage map</h3>
                  <p>Revenue at risk mapped by segment, lifecycle stage, market, and currency, with every figure linked to the rooms and sources behind it.</p>
                  <a className="tlink" href="#/rooms">
                    Explore leakage 
                    <svg className="arw" width="14" height="10" viewBox="0 0 14 10" fill="none">
                      <path d="M1 5h11M8.5 1.5 12 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Card 2: Rooms */}
              <div className="card wide rv r1">
                <div className="viz">
                  <div className="mini">
                    <div className="hd">
                      <span>Room 2471</span>
                      <span className="ultra">Live</span>
                    </div>
                    <div style={{ padding: '14px 12px' }}>
                      <div style={{ fontFamily: 'var(--f-d)', fontWeight: 600, letterSpacing: '-.02em', fontSize: '14.5px', marginBottom: '12px' }}>
                        Second-order rate fell 38% → 27%
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        <span className="pill p-rose"><span className="dt"></span>$412,000 at risk</span>
                        <span className="pill p-ultra"><span className="dt"></span>Cause found</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="stack">
                          <span className="av" style={{ background: 'var(--t-prod)' }}>DO</span>
                          <span className="av" style={{ background: 'var(--t-sup)' }}>AM</span>
                          <span className="av" style={{ background: 'var(--t-fin)' }}>RV</span>
                        </span>
                        <span className="stack ag"><span className="av">RD</span></span>
                        <span className="pill p-amber" style={{ marginLeft: 'auto' }}><span className="dt"></span>1 approval waiting</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="txt">
                  <h3 className="d3">Rooms</h3>
                  <p>Shared spaces where your team and AI agents close one revenue problem together, with the evidence, the proposed action, and the approval in one place.</p>
                  <a className="tlink" href="#/rooms">
                    Inside a room 
                    <svg className="arw" width="14" height="10" viewBox="0 0 14 10" fill="none">
                      <path d="M1 5h11M8.5 1.5 12 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Card 3: Live Data Fabric */}
              <div className="card rv">
                <div className="viz">
                  <div className="mini">
                    <div className="hd">
                      <span>Data health</span>
                      <span className="teal">Healthy</span>
                    </div>
                    <div className="rw" style={{ gridTemplateColumns: '1fr auto' }}>
                      <span>Postgres · orders</span>
                      <span className="pill p-teal" style={{ fontSize: '10px' }}><span className="dt"></span>2m ago</span>
                    </div>
                    <div className="rw" style={{ gridTemplateColumns: '1fr auto' }}>
                      <span>Stripe · payments</span>
                      <span className="pill p-teal" style={{ fontSize: '10px' }}><span className="dt"></span>1m ago</span>
                    </div>
                    <div className="rw" style={{ gridTemplateColumns: '1fr auto' }}>
                      <span>Zendesk · tickets</span>
                      <span className="pill p-amber" style={{ fontSize: '10px' }}><span className="dt"></span>Stale 6h</span>
                    </div>
                    <div className="rw" style={{ gridTemplateColumns: '1fr auto' }}>
                      <span>Warehouse · COGS</span>
                      <span className="pill p-mute" style={{ fontSize: '10px' }}>Not connected</span>
                    </div>
                  </div>
                </div>
                <div className="txt">
                  <h3 className="d3">Live data fabric</h3>
                  <p>Continuous sync with Postgres, Stripe, Shopify, and 160+ more, with fields mapped, duplicate customers merged, and stale sources flagged automatically.</p>
                </div>
              </div>

              {/* Card 4: Memory */}
              <div className="card rv r1">
                <div className="viz">
                  <div className="mini">
                    <div className="hd">
                      <span>Business memory</span>
                      <span>3 matches</span>
                    </div>
                    <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '12px' }}>
                      <span>Room 1180 · retry window</span>
                      <span className="teal mono" style={{ fontSize: '11px' }}>+$88.4K</span>
                    </div>
                    <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '12px' }}>
                      <span>Room 1642 · win-back SMS</span>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-4)' }}>+2.1%</span>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--ultra-soft)', borderTop: '1px solid var(--ultra-line)', fontSize: '12.5px', lineHeight: 1.45, color: 'var(--ink-2)' }}>
                      <b style={{ color: 'var(--ultra)' }}>Repeat &amp; Decay cites Room 1642:</b> messaging alone did not hold this cohort. Fix the checkout first.
                    </div>
                  </div>
                </div>
                <div className="txt">
                  <h3 className="d3">Business memory</h3>
                  <p>Every room, approval, and outcome retained, so agents cite what already worked and new teammates can read the reasoning behind past decisions.</p>
                </div>
              </div>

              {/* Card 5: Governance */}
              <div className="card rv r2">
                <div className="viz">
                  <div className="mini">
                    <div className="hd">
                      <span>Agent permissions</span>
                      <span>Workspace</span>
                    </div>
                    <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '12.5px' }}>
                      <span>Open a room, draft a campaign</span>
                      <span className="pill p-ultra" style={{ fontSize: '10px' }}><span className="dt"></span>Automatic</span>
                    </div>
                    <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '12.5px' }}>
                      <span>Message a customer</span>
                      <span className="pill p-amber" style={{ fontSize: '10px' }}><span className="dt"></span>Proposed</span>
                    </div>
                    <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '12.5px' }}>
                      <span>Change a price</span>
                      <span className="pill p-amber" style={{ fontSize: '10px' }}><span className="dt"></span>Proposed</span>
                    </div>
                    <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '12.5px' }}>
                      <span>Write to the CRM</span>
                      <span className="pill p-rose" style={{ fontSize: '10px' }}><span className="dt"></span>Blocked</span>
                    </div>
                  </div>
                </div>
                <div className="txt">
                  <h3 className="d3">Governance</h3>
                  <p>Automatic, proposed, or blocked, set per agent and per action, with a named approver required on anything that reaches a customer or a price.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────── HOW IT WORKS (TABS) ───────────────── */}
        <section className="band">
          <div className="wrap">
            <div className="shead rv">
              <div className="kicker">How it works</div>
              <h2 className="d2">Built for the whole loop.<br/>From first signal to proven outcome.</h2>
            </div>
            <div className="tabs rv r1" role="tablist" id="tabs">
              <button className="tab" role="tab" aria-selected={activeTab === 0 ? "true" : "false"} onClick={() => setActiveTab(0)}>1 · Detect</button>
              <button className="tab" role="tab" aria-selected={activeTab === 1 ? "true" : "false"} onClick={() => setActiveTab(1)}>2 · Diagnose</button>
              <button className="tab" role="tab" aria-selected={activeTab === 2 ? "true" : "false"} onClick={() => setActiveTab(2)}>3 · Decide</button>
              <button className="tab" role="tab" aria-selected={activeTab === 3 ? "true" : "false"} onClick={() => setActiveTab(3)}>4 · Remember</button>
            </div>

            {/* Panel 1 */}
            <div className={`panel ${activeTab === 0 ? 'on' : ''}`} data-p="0">
              <div>
                <h3 className="d3">Continuous monitoring across every connected source</h3>
                <p>Thirteen (13) specialist agents run against Postgres, Stripe, Shopify, and 160+ more, with no event instrumentation and no weekly exports to wait for.</p>
                <div className="who">Machine · autonomous</div>
              </div>
              <div className="mini" style={{ boxShadow: 'var(--sh-lg)' }}>
                <div className="hd"><span>Agent activity · last night</span><span className="ultra">Running</span></div>
                <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '13px' }}>
                  <span>Repeat &amp; Decay scanned 12 cohorts</span>
                  <span className="pill p-rose" style={{ fontSize: '10px' }}><span className="dt"></span>1 anomaly</span>
                </div>
                <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '13px' }}>
                  <span>Data Quality checked 6 sources</span>
                  <span className="pill p-teal" style={{ fontSize: '10px' }}><span className="dt"></span>Confirmed real</span>
                </div>
                <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '13px' }}>
                  <span>Involuntary Churn reviewed 4,180 failures</span>
                  <span className="pill p-mute" style={{ fontSize: '10px' }}>Normal</span>
                </div>
                <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '13px' }}>
                  <span>Acquisition Quality re-scored 5 channels</span>
                  <span className="pill p-mute" style={{ fontSize: '10px' }}>Normal</span>
                </div>
              </div>
            </div>

            {/* Panel 2 */}
            <div className={`panel ${activeTab === 1 ? 'on' : ''}`} data-p="1">
              <div>
                <h3 className="d3">Rooms that open with the cause attached</h3>
                <p>Each room arrives with a readable problem statement, the population affected, the exposure in dollars, and findings filed at four visible weights.</p>
                <div className="who">Machine · drafts, never sends</div>
              </div>
              <div className="mini" style={{ boxShadow: 'var(--sh-lg)' }}>
                <div className="hd"><span>Evidence</span><span>Weight</span></div>
                <div className="ev in" style={{ ['--f' as any]: 1, padding: '12px' }}><span className="wg"><i></i></span><div><div className="tx" style={{ fontSize: '13.5px' }}><b>Delivery fee moved below the cart</b> in the 4 March release.</div><div className="sr">Measured</div></div></div>
                <div className="ev in" style={{ ['--f' as any]: 0.72, padding: '12px' }}><span className="wg"><i></i></span><div><div className="tx" style={{ fontSize: '13.5px' }}>Late first delivery cuts reorder rate by 31%.</div><div className="sr">Corroborated</div></div></div>
                <div className="ev in" style={{ ['--f' as any]: 0.45, padding: '12px' }}><span className="wg"><i></i></span><div><div className="tx" style={{ fontSize: '13.5px' }}>Discount not reapplied, so order two reads as a price rise.</div><div className="sr">Indicative</div></div></div>
                <div className="ev in" style={{ ['--f' as any]: 0.18, padding: '12px' }}><span className="wg"><i></i></span><div><div className="tx" style={{ fontSize: '13.5px' }}>Competitor changed free-delivery threshold.</div><div className="sr">Unverified · excluded from the estimate</div></div></div>
              </div>
            </div>

            {/* Panel 3 */}
            <div className={`panel ${activeTab === 2 ? 'on' : ''}`} data-p="2">
              <div>
                <h3 className="d3">Human approval on every outward action</h3>
                <p>Agents propose and people release. Approvals record who and when, work syncs to Jira or Linear, and recorded objections stay visible after the decision.</p>
                <div className="who">Human · accountable</div>
              </div>
              <div className="mini" style={{ boxShadow: 'var(--sh-lg)' }}>
                <div className="hd"><span>Decision</span><span>11:04</span></div>
                <div style={{ padding: '16px 14px' }}>
                  <div style={{ fontFamily: 'var(--f-d)', fontWeight: 600, letterSpacing: '-.02em', fontSize: '15px', lineHeight: 1.35, marginBottom: '14px' }}>
                    Show delivery fees before the cart, and hold the first-order discount through order two.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="pill p-teal"><span className="dt"></span>Approved · Dana O. · Product</span>
                    <span className="pill p-amber"><span className="dt"></span>Objection open · Revan S. · margin</span>
                    <span className="pill p-mute">FLO-284 synced to Linear</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 4 */}
            <div className={`panel ${activeTab === 3 ? 'on' : ''}`} data-p="3">
              <div>
                <h3 className="d3">Outcomes that make the next decision faster</h3>
                <p>What was tried, what it returned against the holdout, and what failed—cited by your agents the next time the same pattern appears.</p>
                <div className="who">Both · compounding</div>
              </div>
              <div className="mini" style={{ boxShadow: 'var(--sh-lg)' }}>
                <div className="hd"><span>Room 2471 · closed</span><span className="teal">Day 9</span></div>
                <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '13px' }}>
                  <span>Measured against 10% holdout</span>
                  <span className="teal mono" style={{ fontSize: '12px' }}>$312,000</span>
                </div>
                <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '13px' }}>
                  <span>Time to resolution</span>
                  <span className="mono" style={{ fontSize: '12px' }}>9 days</span>
                </div>
                <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '13px' }}>
                  <span>Finance objection</span>
                  <span className="mono" style={{ fontSize: '12px', color: 'var(--amber)' }}>Partly upheld</span>
                </div>
                <div className="rw" style={{ gridTemplateColumns: '1fr auto', fontSize: '13px' }}>
                  <span>Filed to memory</span>
                  <span className="pill p-ultra" style={{ fontSize: '10px' }}><span className="dt"></span>Cited 3 times since</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────── AGENTS SECTION (DARK) ───────────────── */}
        <section className="band dark">
          <div className="wrap">
            <div className="shead-row">
              <div className="shead rv">
                <div className="kicker">Included agents</div>
                <h2 className="d2">Thirteen specialist AI agents.<br/>Included in every workspace.</h2>
                <p className="lede">Each agent owns one revenue question and opens a room when the answer changes. Import agents from Claude or OpenAI, or build your own.</p>
              </div>
            </div>
            <div className="agrid rv r1">
              <div className="ag-card"><div className="mb">RD</div><h4>Repeat &amp; Decay</h4><p>Tracks second and third order rates by cohort and flags the week they bend.</p></div>
              <div className="ag-card"><div className="mb">IC</div><h4>Involuntary Churn</h4><p>Separates customers who left from customers whose card failed. They need opposite things.</p></div>
              <div className="ag-card"><div className="mb">AQ</div><h4>Acquisition Quality</h4><p>Measures each channel against the LTV it returns, not the CAC it promised.</p></div>
              <div className="ag-card"><div className="mb">LP</div><h4>LTV Predictor</h4><p>Projects lifetime value per segment and revises it as behaviour changes.</p></div>
              <div className="ag-card"><div className="mb">CS</div><h4>Churn Specialist</h4><p>Ranks who is leaving next by value at stake, with the reason attached.</p></div>
              <div className="ag-card"><div className="mb">DO</div><h4>Discount Optimizer</h4><p>Finds discounts applied to customers who would have bought anyway.</p></div>
              <div className="ag-card"><div className="mb">RF</div><h4>Revenue Forecaster</h4><p>Projects 30, 60 and 90 days by segment and market, and flags a miss early.</p></div>
              <div className="ag-card"><div className="mb">DQ</div><h4>Data Quality</h4><p>Confirms an anomaly is real before anyone acts on it.</p></div>
              <div className="ag-card"><div className="mb">C3</div><h4>Customer 360</h4><p>Resolves identities across systems and keeps one profile per person.</p></div>
              <div className="ag-card"><div className="mb">ED</div><h4>Experiment Designer</h4><p>Turns a proposal into a test with a holdout and monitors significance.</p></div>
              <div className="ag-card"><div className="mb">+</div><h4>Your own agents</h4><p>Import from Claude or OpenAI, or build natively. Scoped to the data you allow.</p></div>
              <div className="ag-card"><div className="mb">@</div><h4>Role assistants</h4><p>CMO, Head of CS, Product and Finance personas you can mention in any room.</p></div>
            </div>
          </div>
        </section>

        {/* ───────────────── DIRECT ADDRESS / LIVE SIMULATION ───────────────── */}
        <section className="band-sm">
          <div className="wrap two" style={{ alignItems: 'center' }}>
            <div className="rv">
              <h2 className="d2">Want to know why revenue moved?<br/>The room is already open.</h2>
              <p className="lede" style={{ marginTop: '18px' }}>You make the call. Flolyt brings the evidence, the exposure, and the owner.</p>
              <div style={{ marginTop: '26px', display: 'flex', gap: '11px', flexWrap: 'wrap' }}>
                <a className="btn btn-dark" href="#/rooms">See a room, end to end</a>
                <a className="btn btn-line" href="#contact">Read the API docs</a>
              </div>
            </div>
            <div className="mini rv r1" style={{ boxShadow: 'var(--sh-lg)' }}>
              <div className="hd"><span>POST /v1/rooms</span><span className="ultra">200 OK</span></div>
              <pre style={{ margin: 0, padding: '16px', fontFamily: 'var(--f-m)', fontSize: '12.5px', lineHeight: 1.7, color: 'var(--ink-2)', overflowX: 'auto' }}>
                <span style={{ color: 'var(--ink-4)' }}>{"// open a room from your own signal"}</span>{`
room = flolyt.rooms.create(
  metric   = `}<span className="teal">"second_order_rate"</span>{`,
  segment  = `}<span className="teal">"acquired_after_2026-03-04"</span>{`,
  agents   = [`}<span className="teal">"repeat_decay"</span>{`, `}<span className="teal">"data_quality"</span>{`]
)
room.exposure   `}<span style={{ color: 'var(--ink-4)' }}>→</span> <span className="rose">412000</span>{`
room.confidence `}<span style={{ color: 'var(--ink-4)' }}>→</span> 0.91
              </pre>
            </div>
          </div>
        </section>

        {/* ───────────────── TRUST / CRITERIA LIST ───────────────── */}
        <section className="band">
          <div className="wrap two">
            <div className="rv">
              <div className="kicker">Accuracy and control</div>
              <h2 className="d2">Insights you can audit.<br/>Actions you control.</h2>
              <p className="lede" style={{ marginTop: '18px' }}>Every claim carries a weight and a source you can open, and anything that reaches a customer needs a named approver.</p>
              <div style={{ marginTop: '26px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span className="pill p-ultra"><span className="dt"></span>A machine did this</span>
                <span className="pill p-amber"><span className="dt"></span>A person must act</span>
                <span className="pill p-rose"><span className="dt"></span>Money at risk</span>
                <span className="pill p-teal"><span className="dt"></span>Money preserved</span>
              </div>
            </div>
            <ul className="klist rv r1">
              <li>
                <span className="kn">01</span>
                <div>
                  <h4>No estimates in place of missing data</h4>
                  <p>If COGS is not connected, margin reads <b>Unavailable</b> on the goal tracker, the scenario planner and every segment that would use it.</p>
                </div>
              </li>
              <li>
                <span className="kn">02</span>
                <div>
                  <h4>Four evidence weights on every finding</h4>
                  <p>Measured, corroborated, indicative or unverified. The weight sits in the room, next to the source it came from.</p>
                </div>
              </li>
              <li>
                <span className="kn">03</span>
                <div>
                  <h4>Named human approval on outward actions</h4>
                  <p>Anything that reaches a customer or changes a price is proposed, not sent. You decide what is automatic, proposed or blocked.</p>
                </div>
              </li>
              <li>
                <span className="kn">04</span>
                <div>
                  <h4>Objections recorded alongside decisions</h4>
                  <p>A recorded objection stays visible after approval. When the result lands, the record shows whose call it was and who dissented.</p>
                </div>
              </li>
              <li>
                <span className="kn">05</span>
                <div>
                  <h4>SSO, RBAC, audit logs, and data residency</h4>
                  <p>SSO via SAML or OIDC, role-based access down to the data source, full audit logs, and GDPR and CCPA tooling.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* ───────────────── AUDIENCE / ROLES ───────────────── */}
        <section className="band-sm soft">
          <div className="wrap">
            <div className="shead rv">
              <div className="kicker">Built for revenue teams</div>
              <h2 className="d2">One workspace for every team that touches revenue</h2>
            </div>
            <div className="cards rv r1">
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div className="txt" style={{ padding: '24px' }}>
                  <h3 className="d4">Revenue &amp; growth</h3>
                  <p>Cause, exposure, and owner in hand before the weekly review.</p>
                </div>
              </div>
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div className="txt" style={{ padding: '24px' }}>
                  <h3 className="d4">Product &amp; engineering</h3>
                  <p>The release that bent the curve, with the revenue consequence on the ticket.</p>
                </div>
              </div>
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div className="txt" style={{ padding: '24px' }}>
                  <h3 className="d4">Customer success</h3>
                  <p>Daily outreach ranked by value at stake, not by inbox order.</p>
                </div>
              </div>
              <div className="card" style={{ gridColumn: 'span 3' }}>
                <div className="txt" style={{ padding: '24px' }}>
                  <h3 className="d4">Finance</h3>
                  <p>Every recovered dollar traced to a room, an approver, and a holdout.</p>
                </div>
              </div>
              <div className="card" style={{ gridColumn: 'span 3' }}>
                <div className="txt" style={{ padding: '24px' }}>
                  <h3 className="d4">Support</h3>
                  <p>Frontline patterns turned into weighted evidence, in front of decision makers.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────── FOOTER CTA ───────────────── */}
        <section className="band" id="contact">
          <div className="wrap">
            <div className="final dark rv">
              <div>
                <h2 className="d2">Start protecting the revenue you already earn</h2>
                <p className="lede">Connect one source, let the agents run overnight, and read your first room in the morning. The free workspace never expires and never asks for a card.</p>
                <div style={{ marginTop: '26px', display: 'flex', gap: '11px', flexWrap: 'wrap' }}>
                  <a className="btn btn-dark btn-lg" href="#/pricing">Start for free</a>
                  <a className="btn btn-line btn-lg" href="#/rooms">See how it works</a>
                </div>
              </div>
              <form className="fform" id="cform" onSubmit={handleFormSubmit} noValidate>
                <h3 className="d4" style={{ marginBottom: '18px' }}>Let{"’"}s get started</h3>
                <div className="fr">
                  <div>
                    <label htmlFor="fn">First name</label>
                    <input 
                      id="fn" 
                      placeholder="Ada" 
                      required 
                      value={formData.fn}
                      onChange={(e) => setFormData({ ...formData, fn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="ln">Last name</label>
                    <input 
                      id="ln" 
                      placeholder="Obi" 
                      required 
                      value={formData.ln}
                      onChange={(e) => setFormData({ ...formData, ln: e.target.value })}
                    />
                  </div>
                </div>
                <div className="full">
                  <label htmlFor="em">Work email</label>
                  <input 
                    id="em" 
                    type="email" 
                    placeholder="ada@company.com" 
                    required 
                    value={formData.em}
                    onChange={(e) => setFormData({ ...formData, em: e.target.value })}
                  />
                </div>
                <div className="fr">
                  <div>
                    <label htmlFor="co">Company</label>
                    <input 
                      id="co" 
                      placeholder="Company" 
                      required 
                      value={formData.co}
                      onChange={(e) => setFormData({ ...formData, co: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="rv2">Annual revenue</label>
                    <select 
                      id="rv2"
                      value={formData.rv2}
                      onChange={(e) => setFormData({ ...formData, rv2: e.target.value })}
                    >
                      <option>Under $500K</option>
                      <option>$500K – $5M</option>
                      <option>$5M – $50M</option>
                      <option>$50M+</option>
                    </select>
                  </div>
                </div>
                <button className="btn btn-dark" type="submit" style={{ width: '100%', marginTop: '6px' }}>
                  {formSubmitted ? 'Sent' : 'Talk with our team'}
                </button>
                <p className="fnote">By submitting this form, you confirm you have read Flolyt{"’"}s privacy statement. We reply within one business day.</p>
                <div className={`ok ${formSubmitted ? 'show' : ''}`} id="okmsg">
                  Thanks. A member of our team will be in touch within one business day.
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* ───────────────── PAGE: PRICING ───────────────── */}
      <main className={`page ${route === '/pricing' ? 'active' : ''}`} id="page-pricing">
        <section className="band-sm" style={{ paddingTop: 'clamp(40px, 5vw, 72px)' }}>
          <div className="wrap">
            <div className="shead rv" style={{ maxWidth: '880px' }}>
              <div className="kicker">Pricing</div>
              <h1 className="d1" style={{ marginBottom: '20px' }}>Pricing that scales with the revenue you protect</h1>
              <p className="lede">Choose the plan that matches your annual revenue. Every teammate is included at no additional cost, on every plan.</p>
            </div>
            <div className="rv r1" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '36px' }}>
              <div className="toggle" role="group" aria-label="Billing period">
                <button id="bM" aria-pressed={!billingAnnual ? "true" : "false"} onClick={() => setBillingAnnual(false)}>Monthly</button>
                <button id="bA" aria-pressed={billingAnnual ? "true" : "false"} onClick={() => setBillingAnnual(true)}>Annual · save 10%</button>
              </div>
              <span className="sm mono" id="bnote">
                {billingAnnual ? 'Billed annually, 10% off the monthly rate.' : 'Billed monthly. Switch to annual at any time.'}
              </span>
            </div>

            <div className="tiers rv r1">
              {/* Tier 1 */}
              <div className="tier">
                <div className="tn">Free</div>
                <div className="tb">Under $500K revenue</div>
                <div className="pr">$0</div>
                <div className="sv">No card, no expiry</div>
                <ul>
                  <li><b>1 workspace</b>, unlimited teammates</li>
                  <li>10 data sources</li>
                  <li>2 agents · Repeat &amp; Decay, Churn Specialist</li>
                  <li>3 active rooms</li>
                  <li>Lifecycle view and basic segments</li>
                  <li>1 campaign a month · 500 credits</li>
                  <li>Community support</li>
                </ul>
                <a className="btn btn-line" href="#contact">Start for free</a>
              </div>

              {/* Tier 2 */}
              <div className="tier hi">
                <div className="tn">Growth</div>
                <div className="tb">$500K – $5M revenue</div>
                <div className="pr">
                  <span>${growthPrice.toLocaleString('en-US')}</span>
                  <small>/mo</small>
                </div>
                <div className="sv">{growthSave}</div>
                <ul>
                  <li>Everything in Free, plus</li>
                  <li>5 workspaces · 50 data sources</li>
                  <li><b>5 agents</b> · adds LTV Predictor, Involuntary Churn, Discount Optimizer</li>
                  <li><b>Unlimited rooms</b> and segments</li>
                  <li>Journey canvas and leakage map</li>
                  <li>Business memory · 6 months</li>
                  <li>5 campaigns a month · 2,000 credits</li>
                  <li>A/B testing · Slack and email alerts</li>
                </ul>
                <a className="btn btn-dark" href="#contact">Start free trial</a>
              </div>

              {/* Tier 3 */}
              <div className="tier">
                <div className="tn">Scale</div>
                <div className="tb">$5M – $50M revenue</div>
                <div className="pr">
                  <span>${scalePrice.toLocaleString('en-US')}</span>
                  <small>/mo</small>
                </div>
                <div className="sv">{scaleSave}</div>
                <ul>
                  <li>Everything in Growth, plus</li>
                  <li>20 workspaces · 100 data sources</li>
                  <li><b>All 13 agents</b> and the agent builder</li>
                  <li><b>Unlimited business memory</b></li>
                  <li>Forecasting, scenarios, health scoring</li>
                  <li>Multi-touch attribution and playbooks</li>
                  <li>Unlimited campaigns · 10,000 credits</li>
                  <li>Jira, Linear, Asana and Trello sync</li>
                  <li>SSO, audit logs, API, priority support</li>
                </ul>
                <a className="btn btn-line" href="#contact">Talk with our team</a>
              </div>

              {/* Tier 4 */}
              <div className="tier">
                <div className="tn">Enterprise</div>
                <div className="tb">$50M+ revenue</div>
                <div className="pr" style={{ fontSize: '29px' }}>From $15,000<small>/mo</small></div>
                <div className="sv">Scoped to your volume</div>
                <ul>
                  <li>Everything in Scale, plus</li>
                  <li>Unlimited workspaces and sources</li>
                  <li>Custom agents and marketplace access</li>
                  <li>White-labelling and embedded views</li>
                  <li>Data residency and advanced governance</li>
                  <li>Custom integrations and webhooks</li>
                  <li>99.9% uptime SLA</li>
                  <li>Named CSM, onboarding and training</li>
                </ul>
                <a className="btn btn-line" href="#contact">Talk to sales</a>
              </div>
            </div>
            <p className="sm rv r2" style={{ marginTop: '22px' }}>Revenue bands are self-declared and reviewed annually. Crossing a band mid-contract takes effect at renewal, never retroactively.</p>
          </div>
        </section>

        {/* Pricing FAQs */}
        <section className="band-sm">
          <div className="wrap">
            <div className="shead rv"><h2 className="d2">Questions people actually ask</h2></div>
            <div className="faq rv r1" style={{ borderTop: '1px solid var(--line)' }}>
              <details>
                <summary>Why price on revenue instead of seats or contacts?</summary>
                <div className="ans">Flolyt works best when marketing, product, support, and finance are all in the same room, and per-seat pricing would discourage exactly that. Revenue bands also track the value at stake, so you pay in proportion to what is at risk rather than to the size of your team.</div>
              </details>
              <details>
                <summary>How long until the first useful room?</summary>
                <div className="ans">Agents begin scanning as soon as your first source is connected, and most workspaces see a substantiated room in the first session. If nothing surfaces in week one, Flolyt will name the additional source most likely to change that.</div>
              </details>
              <details>
                <summary>What happens if an agent is wrong?</summary>
                <div className="ans">Every finding carries a weight and a source you can open, so a weak claim is visible rather than persuasive. Nothing that touches a customer or a price goes out without a named person releasing it, and results that contradict a diagnosis are written to memory and change how that agent reasons next time.</div>
              </details>
              <details>
                <summary>Do you replace Braze, Klaviyo or Customer.io?</summary>
                <div className="ans">No. Those platforms send messages well, and Flolyt works alongside them. Flolyt decides what is worth sending and why, then either triggers the campaign or hands the segment to the platform you already run. A message is one possible action out of many, and a checkout fix or a pricing change is often the better one.</div>
              </details>
              <details>
                <summary>Where does our data live, and who can see it?</summary>
                <div className="ans">Flolyt reads from your sources on a schedule you control, with role-based access down to the individual source. Every human and agent action is written to an audit log. Enterprise adds data residency options and customer-managed keys.</div>
              </details>
              <details>
                <summary>Can we bring our own agents?</summary>
                <div className="ans">Yes. Import agents from Claude, OpenAI or your own stack, or build them in Flolyt. Imported agents inherit the same governance settings and evidence requirements as the built-in ones: they draft, they cite their sources, and a person releases the action.</div>
              </details>
            </div>
          </div>
        </section>

        {/* Pricing page footer CTA */}
        <section className="band-sm" style={{ paddingBottom: 'clamp(64px, 8vw, 110px)' }}>
          <div className="wrap">
            <div className="final dark rv" style={{ gridTemplateColumns: '1fr', textAlign: 'center', justifyItems: 'center' }}>
              <div style={{ maxWidth: '640px' }}>
                <h2 className="d2">Start for free. Upgrade when a room pays for it.</h2>
                <p className="lede" style={{ margin: '16px auto 26px' }}>Every plan includes the full workspace. Upgrading adds agents, data sources, memory, and governance.</p>
                <div style={{ display: 'flex', gap: '11px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <a className="btn btn-dark btn-lg" href="#contact">Start for free</a>
                  <a className="btn btn-line btn-lg" href="#/rooms">See how it works</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ───────────────── PAGE: HOW IT WORKS (STORY ROOM) ───────────────── */}
      <main className={`page ${route === '/rooms' ? 'active' : ''}`} id="page-rooms">
        <section className="band-sm" style={{ paddingTop: 'clamp(40px, 5vw, 72px)' }}>
          <div className="wrap">
            <div className="shead rv" style={{ maxWidth: '900px' }}>
              <div className="kicker">How it works</div>
              <h1 className="d1" style={{ marginBottom: '20px' }}>See how a room works, start to finish</h1>
              <p className="lede">A room is where one revenue problem is diagnosed, decided, and closed. Below is a complete example from the workspace used across this site: $412,000 exposed on a Tuesday, $312,000 preserved nine days later.</p>
            </div>
            <div className="rv r1" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span className="pill p-ultra"><span className="dt"></span>Opened by an agent</span>
              <span className="pill p-rose"><span className="dt"></span>$412,000 at risk</span>
              <span className="pill p-amber"><span className="dt"></span>1 objection, left open</span>
              <span className="pill p-teal"><span className="dt"></span>Closed in 9 days</span>
            </div>
          </div>
        </section>

        {/* Story details layout */}
        <section className="band-sm">
          <div className="wrap story">
            <div className="snav" id="snav">
              <a href="#s1" className={activeStep === 's1' ? 'on' : ''} onClick={(e) => handleScrollToStep('s1', e)}>1 · It opens itself</a>
              <a href="#s2" className={activeStep === 's2' ? 'on' : ''} onClick={(e) => handleScrollToStep('s2', e)}>2 · Evidence, weighed</a>
              <a href="#s3" className={activeStep === 's3' ? 'on' : ''} onClick={(e) => handleScrollToStep('s3', e)}>3 · People and agents</a>
              <a href="#s4" className={activeStep === 's4' ? 'on' : ''} onClick={(e) => handleScrollToStep('s4', e)}>4 · The decision</a>
              <a href="#s5" className={activeStep === 's5' ? 'on' : ''} onClick={(e) => handleScrollToStep('s5', e)}>5 · Tested, not assumed</a>
              <a href="#trust" className={activeStep === 'trust' ? 'on' : ''} onClick={(e) => handleScrollToStep('trust', e)}>6 · Governance</a>
              <a href="#s7" className={activeStep === 's7' ? 'on' : ''} onClick={(e) => handleScrollToStep('s7', e)}>7 · Closed, and remembered</a>
            </div>
            <div>
              {/* Step 1 */}
              <div className="step rv" id="s1">
                <div className="sk">1 · It opens itself</div>
                <h2 className="d3" style={{ marginBottom: '14px' }}>The room opens on its own</h2>
                <p>At 03:40 the agent finished its nightly pass over order data. Customers acquired after 4 March were reordering at 27%, against 38% for every prior cohort. It confirmed with the Data Quality agent that no pipeline had broken, put the ninety-day exposure at $412,000, and opened a room.</p>
                <p>Every room arrives with a title a person can read, the population affected, the money at stake, and a confidence score.</p>
              </div>

              {/* Step 2 */}
              <div className="step rv" id="s2">
                <div className="sk">2 · Evidence, weighed</div>
                <h2 className="d3" style={{ marginBottom: '14px' }}>Four findings, each with a visible weight</h2>
                <p>Flolyt files each finding at one of four weights, so you can separate a measured fact from an unconfirmed signal before committing engineering time to it.</p>
                <div className="box" style={{ background: '#fff', padding: '6px 20px' }}>
                  <ul className="klist">
                    <li>
                      <span className="kn ultra">01</span>
                      <div>
                        <h4>Measured</h4>
                        <p>Observed directly in your own data. The 4 March release moved the delivery fee below the cart.</p>
                      </div>
                    </li>
                    <li>
                      <span className="kn ultra">02</span>
                      <div>
                        <h4>Corroborated</h4>
                        <p>Two independent sources agree. Support tickets and delivery logs both point at late first orders.</p>
                      </div>
                    </li>
                    <li>
                      <span className="kn ultra">03</span>
                      <div>
                        <h4>Indicative</h4>
                        <p>Consistent with the pattern, not proven by it. The lapsed first-order discount reads as a price rise.</p>
                      </div>
                    </li>
                    <li>
                      <span className="kn" style={{ color: 'var(--ink-4)' }}>04</span>
                      <div>
                        <h4>Unverified</h4>
                        <p>External or unconfirmed. A competitor changed its delivery threshold in March. Noted, and excluded from the estimate.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="step rv" id="s3">
                <div className="sk">3 · People and agents</div>
                <h2 className="d3" style={{ marginBottom: '14px' }}>People and agents, always shown separately</h2>
                <p>People appear as solid avatars and agents as dashed outlines, in two separate stacks, so you always know whether a statement came from a colleague or a model.</p>
                <div className="two" style={{ gap: '26px', marginTop: '22px' }}>
                  <div className="box" style={{ background: '#fff' }}>
                    <div className="sk" style={{ color: 'var(--ink-4)' }}>In the room</div>
                    <ul className="klist" style={{ marginTop: '6px' }}>
                      <li style={{ padding: '10px 0' }}>
                        <div>
                          <h4>Dana O. · Product</h4>
                          <p>Owns the checkout fix, approved it.</p>
                        </div>
                      </li>
                      <li style={{ padding: '10px 0' }}>
                        <div>
                          <h4>Amara N. · Support</h4>
                          <p>Brought the complaint pattern that became evidence.</p>
                        </div>
                      </li>
                      <li style={{ padding: '10px 0' }}>
                        <div>
                          <h4>Revan S. · Finance</h4>
                          <p>Objected to the discount cost, on the record.</p>
                        </div>
                      </li>
                      <li style={{ padding: '10px 0' }}>
                        <div>
                          <h4>Tunde K. · Engineering</h4>
                          <p>Shipped it on day seven.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="box" style={{ background: '#fff' }}>
                    <div className="sk">Running</div>
                    <ul className="klist" style={{ marginTop: '6px' }}>
                      <li style={{ padding: '10px 0' }}>
                        <div>
                          <h4>Repeat &amp; Decay</h4>
                          <p>Opened the room and holds the thesis.</p>
                        </div>
                      </li>
                      <li style={{ padding: '10px 0' }}>
                        <div>
                          <h4>Data Quality</h4>
                          <p>Confirmed the anomaly was real, not a broken pipe.</p>
                        </div>
                      </li>
                      <li style={{ padding: '10px 0' }}>
                        <div>
                          <h4>Experiment Designer</h4>
                          <p>Built the holdout and monitored significance.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="step rv" id="s4">
                <div className="sk">4 · The decision</div>
                <h2 className="d3" style={{ marginBottom: '14px' }}>One decision, one approver, one recorded objection</h2>
                <p>Agents drafted two actions. Dana approved the checkout change. Revan objected to holding the discount on margin grounds. The objection stayed visible after approval and was attached to the outcome when it landed.</p>
                <div className="box" style={{ background: 'var(--ultra-soft)', borderColor: 'var(--ultra-line)', marginTop: '20px' }}>
                  <div style={{ fontFamily: 'var(--f-d)', fontSize: 'clamp(18px, 2vw, 23px)', fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1.3, marginBottom: '14px' }}>
                    Show delivery fees before the cart, and hold the first-order discount through order two.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="pill p-teal"><span className="dt"></span>Approved · Dana O. · 11:04</span>
                    <span className="pill p-amber"><span className="dt"></span>Objection open · Revan S.</span>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="step rv" id="s5">
                <div className="sk">5 · Tested, not assumed</div>
                <h2 className="d3" style={{ marginBottom: '14px' }}>48,000 customers, a 10% holdout, a measured result</h2>
                <p>Before the reactivation wave went out, the Experiment Designer split the audience between WhatsApp and push and held back 10%. Significance was monitored, not declared.</p>
                <ul className="tl" style={{ marginTop: '22px' }}>
                  <li>
                    <div className="t">Day 0 · agent</div>
                    <div className="b">Room opened. <b>$412,000</b> exposure over 90 days.</div>
                  </li>
                  <li className="hm">
                    <div className="t">Day 1 · human</div>
                    <div className="b">Support confirms the complaint pattern. Finance objects to the discount cost.</div>
                  </li>
                  <li className="hm">
                    <div className="t">Day 3 · human</div>
                    <div className="b">Checkout fix approved and assigned. Ticket syncs to Linear with the room attached.</div>
                  </li>
                  <li>
                    <div className="t">Day 4 · agent</div>
                    <div className="b">A/B test live with a 10% holdout.</div>
                  </li>
                  <li className="dn">
                    <div className="t">Day 7 · shipped</div>
                    <div className="b">Fee shown before the cart. Second-order rate begins to recover.</div>
                  </li>
                  <li className="dn">
                    <div className="t">Day 9 · closed</div>
                    <div className="b"><b className="teal">$312,000 preserved</b>, measured against the holdout. Finance{"'"}s objection recorded as partly upheld.</div>
                  </li>
                </ul>
              </div>

              {/* Step 6 / Trust */}
              <div className="step rv" id="trust">
                <div className="sk">6 · Governance and security</div>
                <h2 className="d3" style={{ marginBottom: '14px' }}>Autonomy you granted, in writing</h2>
                <p>Every agent capability sits in one of three states, set per workspace and logged when changed. In this room, agents could open the room and draft the campaign unaided. Sending it and changing the discount required a person. Writing back to the CRM was blocked.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', margin: '18px 0 20px', alignItems: 'flex-start' }}>
                  <span className="pill p-ultra"><span className="dt"></span>Automatic · analyse, open rooms, draft</span>
                  <span className="pill p-amber"><span className="dt"></span>Proposed · message customers, change prices</span>
                  <span className="pill p-rose"><span className="dt"></span>Blocked · write to CRM, delete a source</span>
                </div>
                <p className="sm">SSO via SAML or OIDC · role-based access at data source, room and feature level · full audit log of every human and agent action · data residency options · GDPR and CCPA tooling · 99.9% uptime SLA on Enterprise.</p>
              </div>

              {/* Step 7 */}
              <div className="step rv" id="s7">
                <div className="sk">7 · Closed, and remembered</div>
                <h2 className="d3" style={{ marginBottom: '14px' }}>Closed rooms make the next one faster</h2>
                <p>When the leak stops, the room closes and its full record is written to Business Memory: evidence, disagreement, approval and measured outcome. The next time second-order rates bend, the agent opens with what worked and what did not, and a new hire can read why the checkout looks the way it does.</p>
                <p>A dashboard is worth the same on day 700 as on day one. A record of every revenue decision your company has made is worth more with each one you add.</p>
                <div style={{ marginTop: '24px', display: 'flex', gap: '11px', flexWrap: 'wrap' }}>
                  <a className="btn btn-dark btn-lg" href="#/pricing">Start for free</a>
                  <a className="btn btn-line btn-lg" href="#contact">Talk with our team</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ───────────────── FOOTER ───────────────── */}
      <footer>
        <div className="wrap">
          <div className="fgrid">
            <div>
              <a className="logo" href="#/" style={{ marginBottom: '14px' }}>
                <img src={fullLogo} alt="Flolyt" className="logo-full" />
                <img src={iconLogo} alt="Flolyt" className="logo-icon" />
              </a>
              <p className="sm" style={{ maxWidth: '32ch' }}>The collaborative revenue intelligence workspace. Ask why. Fix it. Together.</p>
            </div>
            <div>
              <h5>Platform</h5>
              <a href="#/">Rooms</a>
              <a href="#/">Leakage map</a>
              <a href="#/">AI agents</a>
              <a href="#/">Business memory</a>
              <a href="#/">Data fabric</a>
            </div>
            <div>
              <h5>Solutions</h5>
              <a href="#/">E-commerce</a>
              <a href="#/">B2B SaaS</a>
              <a href="#/">Subscriptions</a>
              <a href="#/">Marketplaces</a>
              <a href="#/">Fintech</a>
            </div>
            <div>
              <h5>Resources</h5>
              <a href="/blog/">Blog</a>
              <a href="#/rooms">How it works</a>
              <a href="#/pricing">Pricing</a>
              <a href="#/rooms#trust">Security</a>
              <a href="#/">API docs</a>
              <a href="#/">Changelog</a>
            </div>
            <div>
              <h5>Company</h5>
              <a href="#contact">Contact</a>
              <a href="#contact">Design partners</a>
              <a href="#/">Careers</a>
              <a href="#/">Trust centre</a>
            </div>
          </div>
          <div className="fbtm">
            <span>© 2026 Flolyt Inc.</span>
            <span>Priced on revenue, never on seats</span>
            <span>Privacy · Terms · DPA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
