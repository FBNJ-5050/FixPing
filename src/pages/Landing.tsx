import { Link } from 'react-router-dom'
import {
  MessageSquare,
  LayoutDashboard,
  Image,
  Send,
  ClipboardList,
  Bell,
  Smartphone,
  PhoneCall,
  Zap,
  Users,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'

export default function Landing() {
  const scrollToHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const el = document.getElementById('how-it-works')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[#0F172A]">

      {/* ─── NAV ─── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-extrabold tracking-tight text-[#0F172A]">FixPing</span>
          <nav className="flex items-center gap-6">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold bg-[#0F172A] text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pt-24 pb-28 px-6">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full opacity-50 translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-slate-100 rounded-full opacity-60 -translate-x-1/3 translate-y-1/4 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#3B82F6] text-xs font-semibold px-3 py-1.5 rounded-full mb-8 border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
            Real-time maintenance tracking
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-[#0F172A] leading-[1.1] tracking-tight mb-6">
            Every maintenance request.
            <br />
            <span className="text-[#3B82F6]">One place. Real time.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Give your tenants a number to text. Watch requests appear on your dashboard instantly.
            Assign vendors in 2 clicks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-[#0F172A] text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 text-base"
            >
              Start free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              onClick={scrollToHowItWorks}
              className="inline-flex items-center gap-2 text-[#0F172A] font-semibold px-7 py-3.5 rounded-xl border border-slate-200 hover:border-slate-400 transition-colors text-base"
            >
              See how it works
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Abstract dashboard mockup */}
          <div className="mt-16 mx-auto max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/80 overflow-hidden">
            {/* Mock browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
              <span className="w-3 h-3 rounded-full bg-red-300" />
              <span className="w-3 h-3 rounded-full bg-yellow-300" />
              <span className="w-3 h-3 rounded-full bg-green-300" />
              <span className="ml-4 flex-1 bg-slate-100 rounded-md h-5 text-xs text-slate-400 flex items-center px-3">
                app.fixping.com/dashboard
              </span>
            </div>
            {/* Mock dashboard content */}
            <div className="p-6 grid gap-3">
              {[
                { unit: 'Unit 4B', msg: 'Kitchen faucet leaking under sink', time: 'Just now', color: 'bg-blue-500', status: 'New' },
                { unit: 'Unit 2A', msg: 'Heater not turning on — getting cold', time: '12 min ago', color: 'bg-amber-500', status: 'Assigned' },
                { unit: 'Unit 7C', msg: 'Bathroom light flickering constantly', time: '1 hr ago', color: 'bg-green-500', status: 'Done' },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className={`w-8 h-8 rounded-full ${row.color} opacity-20 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F172A]">{row.unit}</span>
                      <span className="text-xs text-slate-400">{row.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{row.msg}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    row.status === 'New' ? 'bg-blue-100 text-blue-700' :
                    row.status === 'Assigned' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {row.status}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                <span className="text-xs text-slate-400">Live — updates without refresh</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM STRIP ─── */}
      <section className="bg-[#0F172A] py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-slate-400 text-sm font-semibold uppercase tracking-widest mb-10">
            Sound familiar?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: <PhoneCall className="w-6 h-6" />,
                title: 'Texts buried in your personal phone',
                desc: 'Maintenance requests mixed with everything else — easy to miss, hard to track.',
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Vendors booked by memory',
                desc: 'No record of who fixed what or when. You rely on your own mental Rolodex.',
              },
              {
                icon: <Bell className="w-6 h-6" />,
                title: 'Tenants left wondering if you saw it',
                desc: 'No confirmation means more follow-up texts — from them and from you.',
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-[#3B82F6]">
                  {item.icon}
                </div>
                <h3 className="text-white font-semibold text-base leading-snug">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#3B82F6] text-sm font-semibold uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Three steps. Zero confusion.
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Connector line for desktop */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-slate-100" />

            {[
              {
                step: '01',
                icon: <MessageSquare className="w-6 h-6" />,
                title: 'Tenant texts your FixPing number',
                desc: 'They send a message and a photo from any phone. No app to download, no account to create.',
              },
              {
                step: '02',
                icon: <LayoutDashboard className="w-6 h-6" />,
                title: 'Request appears on your dashboard instantly',
                desc: 'You see it in real time — the message, the photo, the unit. No refresh needed.',
              },
              {
                step: '03',
                icon: <Send className="w-6 h-6" />,
                title: 'Assign a vendor. Everyone gets notified.',
                desc: 'Tenant gets a confirmation. Vendor gets job details over SMS. Done in 2 clicks.',
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-start gap-4">
                <div className="relative w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-[#3B82F6] flex-shrink-0">
                  {item.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0F172A] text-white text-[10px] font-extrabold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A] mb-2 leading-snug">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#3B82F6] text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Everything a landlord actually needs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-5 h-5" />,
                title: 'Real-time dashboard',
                desc: 'Every new request pops up the moment a tenant sends it. No polling. No delays.',
              },
              {
                icon: <Image className="w-5 h-5" />,
                title: 'Photo documentation',
                desc: 'Tenants attach photos via text. You see them alongside every request automatically.',
              },
              {
                icon: <Send className="w-5 h-5" />,
                title: 'Vendor dispatch via SMS',
                desc: 'Assign vendors from your saved list. They get the details by text immediately.',
              },
              {
                icon: <ClipboardList className="w-5 h-5" />,
                title: 'Full audit trail',
                desc: 'Every request, every message, every action is logged and searchable forever.',
              },
              {
                icon: <Bell className="w-5 h-5" />,
                title: 'Tenant status updates',
                desc: 'Tenants get automatic confirmations when a request is received and when it\'s fixed.',
              },
              {
                icon: <Smartphone className="w-5 h-5" />,
                title: 'Works via text — no app needed',
                desc: 'Tenants use their regular SMS app. Nothing to install, nothing to teach.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#3B82F6] mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-[#0F172A] text-base mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-[#3B82F6] text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-slate-500 text-base mb-12">
            One plan. No hidden fees. No per-unit surprises.
          </p>

          <div className="bg-[#0F172A] rounded-3xl p-8 sm:p-10 text-left shadow-2xl shadow-slate-900/30">
            <div className="flex items-end gap-2 mb-6">
              <span className="text-5xl font-extrabold text-white">$99</span>
              <span className="text-slate-400 text-base mb-2">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                'Up to 50 units',
                'Unlimited maintenance requests',
                'SMS included — no extra carrier fees',
                'Real-time dashboard',
                'Vendor dispatch + tenant notifications',
                'Full request history & audit log',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to="/signup"
              className="block w-full text-center bg-[#3B82F6] text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-colors text-base"
            >
              Start free 14-day trial
            </Link>
            <p className="text-center text-slate-500 text-xs mt-4">No credit card required to start.</p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-100 bg-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-lg font-extrabold text-[#0F172A] tracking-tight">FixPing</span>
            <p className="text-slate-400 text-sm mt-0.5">Built for independent landlords</p>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-500">
            <Link to="/login" className="hover:text-[#0F172A] transition-colors">Sign in</Link>
            <Link to="/signup" className="hover:text-[#0F172A] transition-colors font-medium">Get started</Link>
          </nav>
        </div>
      </footer>

    </div>
  )
}
