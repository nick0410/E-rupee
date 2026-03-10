import { useState } from "react";
import { Smartphone, ShieldCheck, ArrowRight, RotateCcw, CheckCircle2, XCircle, Loader2, Wallet } from "lucide-react";
import OtpInput from "@/components/OtpInput";
import BankCard from "@/components/BankCard";
import CardVerification from "@/components/CardVerification";
import { FAKE_DATABASE, BankAccount } from "@/data/fakeBankData";

type Step = "phone" | "otp" | "result" | "cardVerify" | "walletAccess";

const Index = () => {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [error, setError] = useState("");
  const [holderName, setHolderName] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedSim, setSelectedSim] = useState<string>("");

  const handlePhoneSubmit = () => {
    if (!selectedSim) {
      setError("Please select a SIM first");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 800);
  };

  const handleOtpComplete = (otp: string) => {
    setLoading(true);
    setTimeout(() => {
      const result = FAKE_DATABASE[phone];
      if (result !== undefined) {
        setAccounts(result);
        if (result.length > 0) setHolderName(result[0].accountHolder);
      } else {
        setAccounts([]);
      }
      setLoading(false);
      setStep("result");
    }, 1500);
  };

  const handleSelectAccount = (acc: BankAccount) => {
    setSelectedAccount(acc);
    setStep("cardVerify");
  };

  const reset = () => {
    setStep("phone");
    setPhone("");
    setAccounts([]);
    setError("");
    setHolderName("");
    setSelectedAccount(null);
    setSelectedSim("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-4 px-6" style={{ background: "var(--gradient-hero)" }}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
            <span className="text-xl">₹</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-foreground">e-Rupee Wallet</h1>
            <p className="text-xs text-primary-foreground/70">Digital Currency by RBI</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">

          {/* Phone Input Step */}
          {step === "phone" && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elevated)" }}>
                  <Smartphone className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Verify Your Phone</h2>
                <p className="text-muted-foreground text-sm">Enter the mobile number linked to your bank account to check e₹ wallet eligibility</p>
              </div>

              <div className="rounded-2xl bg-card p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <label className="block text-sm font-medium text-card-foreground">Select SIM</label>
                <div className="grid grid-cols-2 gap-3">
                  {["SIM 1", "SIM 2"].map((sim) => (
                    <button
                      key={sim}
                      onClick={() => setSelectedSim(sim)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        selectedSim === sim
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-secondary text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      {sim}
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-card-foreground">Mobile Number</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground bg-secondary px-3 py-3 rounded-xl">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                    className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-lg font-mono tracking-wider"
                  />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}

                <button
                  onClick={handlePhoneSubmit}
                  disabled={loading || phone.length < 10 || !selectedSim}
                  className="w-full py-3.5 rounded-xl font-semibold text-primary-foreground flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>

              <div className="rounded-xl bg-secondary/60 p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Demo Numbers</p>
                  <p>Try: <span className="font-mono">9876543210</span>, <span className="font-mono">9123456789</span>, <span className="font-mono">8765432109</span>, or <span className="font-mono">7654321098</span></p>
                </div>
              </div>
            </div>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-elevated)" }}>
                  <ShieldCheck className="w-8 h-8 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Enter OTP</h2>
                <p className="text-muted-foreground text-sm">
                  A 6-digit code was sent to <span className="font-mono font-medium text-foreground">+91 {phone}</span>
                </p>
              </div>

              <div className="rounded-2xl bg-card p-6 space-y-6" style={{ boxShadow: "var(--shadow-card)" }}>
                <OtpInput onComplete={handleOtpComplete} />
                {loading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </div>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  Enter any 6 digits to proceed (demo)
                </p>
              </div>

              <button onClick={reset} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> Change number
              </button>
            </div>
          )}

          {/* Result Step - Account Selection */}
          {step === "result" && (
            <div className="space-y-6 animate-fade-in">
              {accounts.length > 0 ? (
                <>
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-elevated)" }}>
                      <CheckCircle2 className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Select Bank Account</h2>
                    <p className="text-muted-foreground text-sm">
                      {accounts.length} account{accounts.length > 1 ? "s" : ""} found for <span className="font-mono font-medium text-foreground">+91 {phone}</span>
                    </p>
                    <p className="text-sm font-medium text-foreground">{holderName}</p>
                  </div>
                  <div className="space-y-4">
                    {accounts.map((acc, i) => (
                      <div key={i} className="cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => handleSelectAccount(acc)}>
                        <BankCard account={acc} index={i} />
                        <div className="mt-2 text-center">
                          <span className="text-xs text-primary font-medium">Tap to select this account →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 bg-destructive" style={{ boxShadow: "var(--shadow-elevated)" }}>
                    <XCircle className="w-8 h-8 text-destructive-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">No Accounts Found</h2>
                  <p className="text-muted-foreground text-sm">
                    No bank accounts are linked to <span className="font-mono font-medium text-foreground">+91 {phone}</span> for e₹ wallet.
                  </p>
                </div>
              )}

              <button
                onClick={reset}
                className="w-full py-3.5 rounded-xl font-semibold text-primary-foreground flex items-center justify-center gap-2"
                style={{ background: "var(--gradient-primary)" }}
              >
                <RotateCcw className="w-4 h-4" /> Start Over
              </button>
            </div>
          )}

          {/* Card Verification Step */}
          {step === "cardVerify" && selectedAccount && (
            <CardVerification
              account={selectedAccount}
              onVerified={() => setStep("walletAccess")}
              onBack={() => setStep("result")}
            />
          )}

          {/* Wallet Access Step */}
          {step === "walletAccess" && selectedAccount && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-elevated)" }}>
                  <Wallet className="w-8 h-8 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Wallet Activated! 🎉</h2>
                <p className="text-muted-foreground text-sm">
                  Your e₹ wallet is now active for <span className="font-medium text-foreground">{selectedAccount.bankName}</span>
                </p>
              </div>

              <div className="rounded-2xl bg-card p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">Available e₹ Balance</p>
                  <p className="text-4xl font-bold text-accent">{selectedAccount.eRupeeBalance}</p>
                </div>
                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-mono text-card-foreground">{selectedAccount.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Holder</span>
                    <span className="text-card-foreground">{selectedAccount.accountHolder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-accent font-medium">● Active</span>
                  </div>
                </div>
              </div>

              <button
                onClick={reset}
                className="w-full py-3.5 rounded-xl font-semibold text-primary-foreground flex items-center justify-center gap-2"
                style={{ background: "var(--gradient-primary)" }}
              >
                <RotateCcw className="w-4 h-4" /> Verify Another Number
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        Powered by Reserve Bank of India · Demo Application
      </footer>
    </div>
  );
};

export default Index;
