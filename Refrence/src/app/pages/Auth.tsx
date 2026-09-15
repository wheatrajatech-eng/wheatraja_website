import { useState, useRef, useEffect } from "react";
import { ArrowRight, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { useApp } from "../context";

type AuthStep = "phone" | "otp" | "name";

export function Auth() {
  const { navigate, login } = useApp();
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "otp" && resendTimer > 0) {
      const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
      return () => clearInterval(id);
    }
  }, [step, resendTimer]);

  const handleOtpChange = (val: string, i: number) => {
    const newOtp = [...otp];
    newOtp[i] = val.slice(-1);
    setOtp(newOtp);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const sendOtp = () => {
    if (phone.length !== 10) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("otp"); setResendTimer(30); }, 1000);
  };

  const verifyOtp = () => {
    if (otp.join("").length !== 6) return;
    setLoading(true);
    // Simulate new/returning user
    setTimeout(() => { setLoading(false); setStep("name"); }, 1000);
  };

  const completeLogin = () => {
    const displayName = name.trim() || "Rohit Sharma";
    login({ name: displayName, phone: `+91 ${phone}` });
    navigate("dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-serif font-bold text-xl">WR</span>
          </div>
          <h1 className="font-serif font-bold text-stone-900 text-2xl">Wheat Raja</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-7 shadow-sm">
          {/* Step: Phone */}
          {step === "phone" && (
            <div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-5">
                <Phone className="w-6 h-6 text-amber-700" />
              </div>
              <h2 className="font-serif font-bold text-stone-900 text-xl mb-1">Enter your mobile number</h2>
              <p className="text-muted-foreground text-sm mb-6">We'll send you a 6-digit OTP to verify</p>

              <div className="flex mb-4">
                <div className="flex items-center gap-1.5 bg-stone-100 border border-border rounded-l-xl px-3 py-3 text-sm font-semibold text-stone-700 shrink-0 border-r-0">
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 bg-stone-50 border border-border rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <button
                onClick={sendOtp}
                disabled={phone.length !== 10 || loading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Get OTP <ArrowRight className="w-4 h-4" /></>}
              </button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                By continuing, you agree to our{" "}
                <a href="#" className="text-amber-700 underline">Terms</a> &amp;{" "}
                <a href="#" className="text-amber-700 underline">Privacy Policy</a>
              </p>
            </div>
          )}

          {/* Step: OTP */}
          {step === "otp" && (
            <div>
              <button onClick={() => setStep("phone")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-5">
                <ArrowLeft className="w-3.5 h-3.5" /> Change number
              </button>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6 text-green-700" />
              </div>
              <h2 className="font-serif font-bold text-stone-900 text-xl mb-1">Verify OTP</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Sent to <span className="font-semibold text-stone-900">+91 {phone}</span>
              </p>

              {/* OTP input */}
              <div className="flex gap-2 mb-6 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKey(e, i)}
                    className={`w-11 h-12 text-center font-bold text-lg border-2 rounded-xl focus:outline-none transition-colors ${digit ? "border-amber-500 bg-amber-50 text-amber-900" : "border-border bg-stone-50 text-stone-900 focus:border-amber-400"}`}
                  />
                ))}
              </div>

              {/* Hint for demo */}
              <div className="bg-stone-50 border border-border rounded-xl px-4 py-2 mb-4 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Demo OTP:</span>
                <span className="font-bold text-amber-700 text-sm tracking-widest">123456</span>
                <button onClick={() => setOtp(["1","2","3","4","5","6"])} className="text-[10px] text-amber-600 border border-amber-300 px-2 py-0.5 rounded-full ml-auto hover:bg-amber-50">Fill</button>
              </div>

              <button
                onClick={verifyOtp}
                disabled={otp.join("").length !== 6 || loading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Verify & Continue"}
              </button>

              <div className="text-center mt-4">
                {resendTimer > 0 ? (
                  <p className="text-xs text-muted-foreground">Resend OTP in <span className="font-bold text-stone-700">{resendTimer}s</span></p>
                ) : (
                  <button onClick={() => { setResendTimer(30); }} className="text-xs text-amber-700 font-semibold hover:underline">Resend OTP</button>
                )}
              </div>
            </div>
          )}

          {/* Step: Name (new user) */}
          {step === "name" && (
            <div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-5 text-2xl">👋</div>
              <h2 className="font-serif font-bold text-stone-900 text-xl mb-1">Welcome to Wheat Raja!</h2>
              <p className="text-muted-foreground text-sm mb-6">Tell us your name to personalize your experience</p>

              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors mb-4"
              />

              <button
                onClick={completeLogin}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                Start Shopping 🌾
              </button>

              <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs text-green-700 font-semibold">🎁 Welcome Bonus!</p>
                <p className="text-xs text-green-600 mt-0.5">You've earned 50 Wheat Raja Points = ₹50 as a welcome gift!</p>
              </div>
            </div>
          )}
        </div>

        <button onClick={() => navigate("home")} className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors mt-6 w-full">
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
