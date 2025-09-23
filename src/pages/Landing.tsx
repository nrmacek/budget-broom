import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeroSection } from '@/components/ui/hero-section';
import { Receipt, Zap, Shield, Download, ArrowRight, Eye, Users, Building, Check, Star, Mail, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-hero">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">ReceiptParser</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection('benefits')} className="text-muted-foreground hover:text-foreground transition-colors">
              Benefits
            </button>
            <button onClick={() => scrollToSection('why-receiptparser')} className="text-muted-foreground hover:text-foreground transition-colors">
              Why ReceiptParser
            </button>
            <button onClick={() => scrollToSection('use-cases')} className="text-muted-foreground hover:text-foreground transition-colors">
              Use Cases
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </button>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="outline">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-gradient-hero hover:scale-105 transition-transform">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection
        badge={{
          text: "🚀 Transform Your Receipt Management",
          action: {
            text: "Learn more",
            href: "#benefits",
          },
        }}
        title="Turn Receipts Into Actionable Insights"
        description="Upload any receipt and get instant data extraction, categorization, and financial insights. Perfect for expense tracking, tax prep, and business accounting."
        actions={[
          {
            text: "Get Started Free",
            href: "/auth",
            variant: "default",
          },
          {
            text: "See How It Works",
            href: "#benefits",
            variant: "outline",
          },
        ]}
        image={{
          src: "/src/assets/hero-receipt-parser.jpg",
          alt: "ReceiptParser Dashboard Preview",
        }}
      />

      {/* Quick Benefits Row */}
      <section id="benefits" className="py-16 px-4 bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Clear Insights</h3>
                <p className="text-sm text-muted-foreground">See exactly what's behind every big-box charge</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-warning/10">
                <Zap className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold">Instant Processing</h3>
                <p className="text-sm text-muted-foreground">Upload a receipt and get results in seconds</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <Download className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Business-Ready Data</h3>
                <p className="text-sm text-muted-foreground">Export to QuickBooks, Excel, or your budgeting tool</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why ReceiptParser Section */}
      <section id="why-receiptparser" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why ReceiptParser?</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 bg-gradient-card border-0 shadow-medium hover:shadow-large transition-shadow">
              <div className="p-4 rounded-full bg-primary/10 w-fit mb-6">
                <Eye className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Turn Confusion Into Clarity</h3>
              <p className="text-muted-foreground">
                No more wondering if that $154 Target bill was groceries, household items, or toys. ReceiptParser breaks it down line by line, with totals by category.
              </p>
            </Card>
            
            <Card className="p-8 bg-gradient-card border-0 shadow-medium hover:shadow-large transition-shadow">
              <div className="p-4 rounded-full bg-accent/10 w-fit mb-6">
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Streamline Your Bookkeeping</h3>
              <p className="text-muted-foreground">
                Upload hundreds of receipts and instantly export clean, categorized data. Perfect for freelancers, contractors, and small business owners who need quick, accurate expense reports.
              </p>
            </Card>
            
            <Card className="p-8 bg-gradient-card border-0 shadow-medium hover:shadow-large transition-shadow">
              <div className="p-4 rounded-full bg-success/10 w-fit mb-6">
                <Shield className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Private & Secure</h3>
              <p className="text-muted-foreground">
                Your data stays encrypted and never shared. Receipts are processed securely and remain private to your account.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Visual Example Section */}
      <section className="py-20 px-4 bg-muted/10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">See It In Action</h2>
          <div className="bg-gradient-card rounded-2xl p-8 shadow-large">
            <div className="bg-muted/20 rounded-lg p-12 mb-6">
              <p className="text-6xl mb-4">📸</p>
              <p className="text-muted-foreground text-lg">App Screenshot Placeholder</p>
              <p className="text-sm text-muted-foreground mt-2">"Receipt Parsed Successfully" interface</p>
            </div>
            <p className="text-lg text-muted-foreground">
              From one receipt to a full breakdown of spending — ready to review, categorize, and export.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Perfect For</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center bg-gradient-card border-0 shadow-medium hover:shadow-large transition-shadow">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Families & Individuals</h3>
              <p className="text-muted-foreground">
                Finally see where your money goes each month without guesswork. Turn confusing store receipts into clear budget categories.
              </p>
            </Card>
            
            <Card className="p-8 text-center bg-gradient-card border-0 shadow-medium hover:shadow-large transition-shadow">
              <div className="p-4 rounded-full bg-accent/10 w-fit mx-auto mb-6">
                <Receipt className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Freelancers & Gig Workers</h3>
              <p className="text-muted-foreground">
                Organize receipts for taxes in minutes, not hours. Export clean data directly to your accounting software.
              </p>
            </Card>
            
            <Card className="p-8 text-center bg-gradient-card border-0 shadow-medium hover:shadow-large transition-shadow">
              <div className="p-4 rounded-full bg-success/10 w-fit mx-auto mb-6">
                <Building className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Small Businesses</h3>
              <p className="text-muted-foreground">
                Export clean CSVs for your bookkeeper or accounting software. Turn receipt chaos into organized expense data.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Proof & Trust Section */}
      <section className="py-20 px-4 bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Powered by Proven Technology</h2>
          <div className="bg-gradient-card rounded-2xl p-8 shadow-medium mb-8">
            <p className="text-lg text-muted-foreground mb-6">
              ReceiptParser uses industry-standard OCR + AI models trusted by enterprise systems, built into a simple tool designed for everyday users.
            </p>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Founder's Note:</h3>
              <p className="text-muted-foreground italic">
                "I built ReceiptParser to solve my own frustration with unclear charges and messy receipts. Whether you're managing a household budget or running a business, it's designed to give you clarity and control."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground">
              Find the perfect plan for your receipt processing needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <Card className="p-8 bg-gradient-card border-0 shadow-medium hover:shadow-large transition-shadow">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground">Perfect for trying out ReceiptParser</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span>2 receipts per month</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span>Basic OCR processing</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span>CSV export</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span>Email support</span>
                </div>
              </div>
              
              <Link to="/auth" className="block">
                <Button className="w-full" variant="outline">
                  Get Started Free
                </Button>
              </Link>
            </Card>

            {/* Plus Tier */}
            <Card className="p-8 bg-gradient-hero border-0 shadow-glow relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-warning text-warning-foreground px-3 py-1 text-sm font-semibold">
                Popular
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2 text-white">Plus</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">$9</span>
                  <span className="text-white/80">/month</span>
                </div>
                <p className="text-white/80">Great for individuals and families</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-white" />
                  <span className="text-white">100 receipts per month</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-white" />
                  <span className="text-white">Advanced categorization</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-white" />
                  <span className="text-white">Priority processing</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-white" />
                  <span className="text-white">Multiple export formats</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-white" />
                  <span className="text-white">Email support</span>
                </div>
              </div>
              
              <Link to="/auth" className="block">
                <Button className="w-full bg-white text-primary hover:bg-white/90">
                  Start Plus Trial
                </Button>
              </Link>
            </Card>

            {/* Pro Tier */}
            <Card className="p-8 bg-gradient-card border-0 shadow-medium hover:shadow-large transition-shadow">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground">Perfect for small businesses</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span>Unlimited receipts</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span>Advanced categorization</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span>Priority processing</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span>API access</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span>Bulk upload</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span>Phone + email support</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span>Custom integrations</span>
                </div>
              </div>
              
              <Link to="/auth" className="block">
                <Button className="w-full bg-gradient-hero">
                  Start Pro Trial
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-muted/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to See Where Your Money Really Goes?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start parsing receipts today — free, fast, and secure.
          </p>
          <Link to="/auth">
            <Button 
              size="lg" 
              className="bg-gradient-hero hover:scale-105 transition-transform shadow-glow mb-4"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            No credit card required. Instant setup.
          </p>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t bg-card/50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-hero">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">ReceiptParser</span>
              </div>
              <p className="text-muted-foreground">
                Transform your receipts into structured data for better expense management.
              </p>
            </div>

            {/* FAQs */}
            <div className="space-y-4">
              <h3 className="font-semibold">Common Questions</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Do you store my receipts?</p>
                  <p className="text-muted-foreground">No, your data stays private and encrypted.</p>
                </div>
                <div>
                  <p className="font-medium">What file formats work?</p>
                  <p className="text-muted-foreground">JPG, PNG, PDF, and CSV files.</p>
                </div>
                <div>
                  <p className="font-medium">How accurate is the OCR?</p>
                  <p className="text-muted-foreground">Industry-leading 95%+ accuracy rate.</p>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h3 className="font-semibold">Support</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-muted-foreground">support@receiptparser.com</span>
                </div>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h3 className="font-semibold">Legal</h3>
              <div className="space-y-2 text-sm">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                <br />
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 text-center text-muted-foreground text-sm">
            <p>&copy; 2024 ReceiptParser. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;