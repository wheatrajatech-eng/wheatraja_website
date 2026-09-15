import { motion } from "motion/react";
import { ArrowRight, Award, Shield, Heart, Leaf, Zap, Users, Truck } from "lucide-react";
import { useApp } from "../context";
import { IMGS } from "../data";

const STATS = [
  { val: "10,000+", label: "Families Served" },
  { val: "3", label: "Premium Varieties" },
  { val: "0%", label: "Preservatives" },
  { val: "100%", label: "NABL Tested" },
];

const PROCESS_STEPS = [
  { step: "01", title: "Source Premium Wheat", desc: "We partner directly with certified farms across Madhya Pradesh and Uttar Pradesh, selecting only Grade A wheat varieties after rigorous crop testing.", icon: Leaf },
  { step: "02", title: "NABL Laboratory Test", desc: "Every wheat batch undergoes independent NABL-certified testing for purity, adulterants, moisture content, protein levels, and nutritional profile.", icon: Shield },
  { step: "03", title: "Stone Ground Fresh", desc: "After your order arrives, we grind your wheat on traditional granite chakkis at carefully controlled low temperatures. Zero heat damage. Maximum nutrition.", icon: Zap },
  { step: "04", title: "Delivered to You", desc: "Your fresh atta is packed immediately and dispatched within 48 hours. From our Sector 78 fulfillment center to your door — still fresh, still alive.", icon: Truck },
];

const VALUES = [
  { icon: Heart, title: "Family First", desc: "Every decision starts with one question: would we feed this to our own family?" },
  { icon: Shield, title: "Radical Transparency", desc: "Our test reports, sourcing details, and pricing are available to any customer who asks." },
  { icon: Leaf, title: "100% Natural", desc: "Not a single artificial ingredient, preservative, or colour has ever entered our mill." },
  { icon: Zap, title: "Obsessive Freshness", desc: "We mill after you order. Not before. This is a promise we make with every single bag." },
  { icon: Award, title: "Certified Quality", desc: "FSSAI, NABL, and ISO 22000 certifications — not for marketing, but because families deserve proof." },
  { icon: Users, title: "Community Driven", desc: "Our recipes, blog, and education content help every family eat better, regardless of where they buy." },
];

const fade = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-50px" }, transition: { duration: 0.55, ease: "easeOut" } };

export function About() {
  const { navigate } = useApp();

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero */}
      <section className="relative bg-stone-900 overflow-hidden py-28 px-5 md:px-10">
        <img src={IMGS.hero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 to-stone-900/40" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.p {...fade} className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">Our Story</motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
            className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
          >
            We Believe Fresh Food<br />is a <em className="not-italic text-amber-400">Right</em>, Not a Luxury
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
            className="text-white/65 text-lg max-w-2xl leading-relaxed"
          >
            Wheat Raja began with a simple observation: every family in India makes rotis every day, yet almost none have access to truly fresh atta. We set out to change that — one freshly milled bag at a time.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5 md:px-10">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <motion.div {...fade}>
              <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-3">The Beginning</p>
              <h2 className="font-serif text-4xl font-bold text-stone-900 mb-5 leading-tight">A Founder's Kitchen Discovery</h2>
              <div className="space-y-4 text-stone-600 text-sm leading-relaxed">
                <p>It started in 2022 when our founder Arjun Malhotra visited his grandmother in Bhopal. She still used a traditional stone chakki to grind her own wheat. The rotis she made had a flavour and softness that nothing from a supermarket could match.</p>
                <p>Back in Noida, Arjun tested 12 different supermarket attas. Every single one had been sitting in warehouses for 3-8 months. Nutrients depleted. Oils oxidized. Taste compromised.</p>
                <p>So he did something simple: he sourced premium MP Sharbati wheat, milled it fresh, and started delivering to 10 families in his sector. Within three months, 200 families were on his waiting list. Wheat Raja was born.</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
              className="aspect-square rounded-2xl overflow-hidden bg-stone-100"
            >
              <img src={IMGS.stone} alt="Traditional stone chakki mill" className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-amber-600">
        <div className="max-w-5xl mx-auto px-5 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                className="text-center"
              >
                <p className="font-serif font-bold text-white text-4xl md:text-5xl mb-1">{s.val}</p>
                <p className="text-white/75 text-sm">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 md:py-28 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <motion.div {...fade} className="text-center mb-14">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold">From Field to Your Kitchen</h2>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
                className="relative"
              >
                {i < 3 && <div className="hidden md:block absolute top-8 left-full w-full h-px bg-amber-500/30 z-0" />}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative z-10">
                  <div className="text-5xl font-serif font-bold text-amber-600/30 mb-3">{step.step}</div>
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-serif font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <motion.div {...fade} className="text-center mb-14">
            <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-3">What We Stand For</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-stone-900">Our Values</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-amber-300 transition-colors group"
              >
                <div className="w-11 h-11 bg-amber-100 group-hover:bg-amber-200 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <v.icon className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-base mb-2">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-stone-50 border-y border-border">
        <div className="max-w-5xl mx-auto px-5 md:px-10">
          <motion.div {...fade} className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold text-stone-900 mb-2">Certified. Tested. Trusted.</h2>
            <p className="text-muted-foreground text-sm">Third-party verified quality you can trust with your family's health.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { badge: "FSSAI", title: "Food Safety Approved", desc: "License No. 12345678901234. Fully compliant with all Food Safety and Standards Authority of India regulations.", color: "bg-green-50 border-green-200" },
              { badge: "NABL", title: "Laboratory Certified", desc: "All wheat batches tested at NABL-accredited labs. Reports available on request. Zero compromise on purity standards.", color: "bg-blue-50 border-blue-200" },
              { badge: "ISO 22000", title: "Food Safety Management", desc: "Our entire supply chain — from farm to fulfillment — is audited and certified under ISO 22000:2018 international standards.", color: "bg-purple-50 border-purple-200" },
            ].map((cert, i) => (
              <motion.div
                key={cert.badge}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                className={`border-2 rounded-2xl p-6 ${cert.color}`}
              >
                <div className="font-mono font-bold text-2xl mb-2 text-stone-900">{cert.badge}</div>
                <h3 className="font-serif font-bold text-stone-900 mb-2">{cert.title}</h3>
                <p className="text-stone-600 text-xs leading-relaxed">{cert.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <motion.div {...fade}>
            <h2 className="font-serif text-4xl font-bold text-stone-900 mb-4">Ready to taste the difference?</h2>
            <p className="text-muted-foreground mb-8">Join 10,000+ families who've made the switch to fresh, nutritious atta.</p>
            <button
              onClick={() => navigate("shop")}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-10 py-4 rounded-full transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-500/25"
            >
              Shop Now <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
