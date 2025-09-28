import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, 
  Zap, 
  Shield, 
  Download, 
  ArrowRight, 
  Eye, 
  Users, 
  Building, 
  Check, 
  Star, 
  Mail,
  FileText,
  BarChart3,
  Lock,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroPlaceholder from '@/assets/hero-placeholder.jpg';
import logo from '@/assets/BRP_Logo_Only.png';

const Landing = () => {
  const [isYearly, setIsYearly] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header - Logo Outside Pill Navigation */}
      <header className="py-4 px-4">
        <div className="max-w-7xl mx-auto relative flex items-center justify-between">
          {/* Logo - Outside Pill */}
          <div className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="Best Receipt Parser Logo" 
              className="h-12 w-auto object-contain flex-shrink-0"
            />
            <h1 className="text-xl font-bold font-raleway"><span style={{ color: '#3498DB' }}>Best</span> Receipt Parser</h1>
          </div>
          
          {/* Center Pill Navigation - Absolutely Centered */}
          <nav className="absolute left-1/2 transform -translate-x-1/2 bg-foreground/95 backdrop-blur-sm px-8 py-4 shadow-glow">
            <div className="flex items-center gap-8">
              <button onClick={() => scrollToSection('pricing')} className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                Pricing
              </button>
              <button onClick={() => scrollToSection('features')} className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                Features
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                FAQs
              </button>
              <Link to="/auth?tab=signup" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                Get Started Free
              </Link>
            </div>
          </nav>
          
          {/* Sign In - Outside Pill */}
          <Link to="/auth">
            <Button variant="outline" className="font-medium border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section - Split Layout */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="font-raleway leading-[1.15]">
                  <div className="text-5xl md:text-6xl lg:text-7xl text-foreground font-bold tracking-tight">
                    Receipts → Ready-to-Use
                  </div>
                  <div className="text-4xl md:text-5xl lg:text-6xl text-primary font-bold tracking-tight mt-2">
                    Data in Seconds.
                  </div>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground/80 leading-relaxed font-sans font-medium max-w-2xl">
                  Upload receipts, get clean, categorized expense data you can understand, track, and export.
                </p>
              </div>
              
              <div className="flex flex-col items-start gap-3">
                <Link to="/auth?tab=signup">
                  <Button 
                    size="lg" 
                    className="bg-gradient-hero hover:opacity-90 transition-all shadow-glow text-lg px-12 py-7 h-auto font-semibold"
                  >
                    Parse My First Receipt
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground/60 font-sans font-normal">
                  No credit card required
                </p>
              </div>
            </div>
            
            {/* Right Side - Image */}
            <div className="relative">
              <img 
                src={heroPlaceholder}
                alt="ReceiptParser Dashboard Interface"
                className="w-full h-auto shadow-large border border-border/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Simplified */}
      <section id="pricing" className="py-12 px-4 bg-gradient-subtle">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 font-raleway">Simple pricing for everyone</h2>
            <p className="text-xl text-muted-foreground font-sans">
              Choose the plan that fits your needs
            </p>
            
            {/* Monthly/Yearly Toggle */}
            <div className="flex items-center justify-center gap-4 mt-8 mb-8">
              <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-primary"
              />
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Yearly
              </span>
              {isYearly && (
                <Badge variant="secondary" className="ml-2 bg-success/10 text-success border-success/20">
                  Save up to 20%
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <Card className="p-8 bg-white border border-border shadow-medium">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2 font-raleway">Basic</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold font-raleway">$0</span>
                    <span className="text-muted-foreground font-sans">/{isYearly ? 'year' : 'month'}</span>
                  </div>
                  <p className="text-muted-foreground font-sans">Perfect for getting started</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span className="font-sans">3 receipts / month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span className="font-sans">Basic categorization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span className="font-sans">Email support</span>
                  </div>
                </div>
                
                <Link to="/auth?tab=signup" className="block">
                  <Button className="w-full font-semibold" variant="outline">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Standard Plan */}
            <Card className="p-8 bg-gradient-hero text-white shadow-glow relative border-0 scale-105">
              <div className="absolute top-0 right-0 bg-warning text-warning-foreground px-3 py-1 text-sm font-semibold">
                Most Popular
              </div>
              {isYearly && (
                <div className="absolute top-0 left-0 bg-success text-success-foreground px-3 py-1 text-sm font-semibold">
                  Save $22
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2 font-raleway">Standard</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold font-raleway">${isYearly ? '86' : '9'}</span>
                    <span className="text-white/80 font-sans">/{isYearly ? 'year' : 'month'}</span>
                  </div>
                  <p className="text-white/80 font-sans">For regular users</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-white" />
                    <span className="font-sans">50 receipts / month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-white" />
                    <span className="font-sans">CSV export</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-white" />
                    <span className="font-sans">Advanced categorization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-white" />
                    <span className="font-sans">Priority support</span>
                  </div>
                </div>
                
                <Link to="/auth?tab=signup" className="block">
                  <Button className="w-full bg-white text-primary hover:bg-white/90 font-semibold">
                    Start Standard Plan
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Enterprise Plan */}
            <Card className="p-8 bg-white border border-border shadow-medium relative">
              {isYearly && (
                <div className="absolute top-0 right-0 bg-success text-success-foreground px-3 py-1 text-sm font-semibold">
                  Save $70
                </div>
              )}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2 font-raleway">Enterprise</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold font-raleway">${isYearly ? '278' : '29'}</span>
                    <span className="text-muted-foreground font-sans">/{isYearly ? 'year' : 'month'}</span>
                  </div>
                  <p className="text-muted-foreground font-sans">For power users</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span className="font-sans">500 receipts / month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span className="font-sans">Multiple export formats</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span className="font-sans">Bulk upload</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span className="font-sans">Advanced analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span className="font-sans">Dedicated support</span>
                  </div>
                </div>
                
                <Link to="/auth" className="block">
                  <Button className="w-full font-semibold">
                    Start Enterprise Plan
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-8 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-lg text-muted-foreground mb-8 font-sans">Trusted by small businesses, bookkeepers, and home budgeters.</p>
          
          <div className="flex justify-center items-center gap-8 mb-12">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">MJ</div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm">RK</div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">AL</div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">JS</div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">TW</div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">DM</div>
          </div>

          <p className="text-sm text-muted-foreground font-sans">Powered by enterprise-grade technology</p>
          
          <div className="flex justify-center items-center gap-12 opacity-60 mt-6">
            <div className="text-lg font-semibold text-muted-foreground font-sans">Google Cloud Vision</div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
            <div className="text-lg font-semibold text-muted-foreground font-sans">OpenAI GPT</div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
            <div className="text-lg font-semibold text-muted-foreground font-sans">Advanced OCR</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 font-raleway">Everything you need to track expenses</h2>
            <p className="text-xl text-muted-foreground font-sans">
              Powerful features designed for clarity and ease of use
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 bg-gradient-card border border-border/50 shadow-medium hover:shadow-large transition-all text-center">
              <div className="p-4 bg-primary/10 w-fit mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 font-raleway">Clear Spending Insights</h3>
              <p className="text-sm text-muted-foreground font-sans">
                See what's really behind vague Target/Costco charges
              </p>
            </Card>
            
            <Card className="p-6 bg-gradient-card border border-border/50 shadow-medium hover:shadow-large transition-all text-center">
              <div className="p-4 bg-accent/10 w-fit mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-semibold mb-2 font-raleway">Business-Ready Data</h3>
              <p className="text-sm text-muted-foreground font-sans">
                Export clean CSVs for QuickBooks, Excel, etc.
              </p>
            </Card>
            
            <Card className="p-6 bg-gradient-card border border-border/50 shadow-medium hover:shadow-large transition-all text-center">
              <div className="p-4 bg-warning/10 w-fit mx-auto mb-4">
                <Zap className="h-8 w-8 text-warning" />
              </div>
              <h3 className="font-semibold mb-2 font-raleway">Instant Processing</h3>
              <p className="text-sm text-muted-foreground font-sans">
                Upload → breakdown in seconds
              </p>
            </Card>
            
            <Card className="p-6 bg-gradient-card border border-border/50 shadow-medium hover:shadow-large transition-all text-center">
              <div className="p-4 bg-success/10 w-fit mx-auto mb-4">
                <Lock className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-semibold mb-2 font-raleway">Private & Secure</h3>
              <p className="text-sm text-muted-foreground font-sans">
                Your data is encrypted and never shared
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-12 px-4 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 font-raleway">Perfect for every situation</h2>
            <p className="text-xl text-muted-foreground font-sans">
              Whether personal or business, ReceiptParser adapts to your needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center bg-white border border-border shadow-medium hover:shadow-large transition-all">
              <div className="p-4 bg-primary/10 w-fit mx-auto mb-6">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4 font-raleway">Families & Individuals</h3>
              <p className="text-muted-foreground font-sans">
                "No more mystery charges in your budget."
              </p>
              <p className="text-sm text-muted-foreground mt-3 font-sans">
                Finally see where your money goes each month without guesswork.
              </p>
            </Card>
            
            <Card className="p-8 text-center bg-white border border-border shadow-medium hover:shadow-large transition-all">
              <div className="p-4 bg-accent/10 w-fit mx-auto mb-6">
                <FileText className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-4 font-raleway">Freelancers & Gig Workers</h3>
              <p className="text-muted-foreground font-sans">
                "Organize receipts for tax season in minutes."
              </p>
              <p className="text-sm text-muted-foreground mt-3 font-sans">
                Export clean data directly to your accounting software.
              </p>
            </Card>
            
            <Card className="p-8 text-center bg-white border border-border shadow-medium hover:shadow-large transition-all">
              <div className="p-4 bg-success/10 w-fit mx-auto mb-6">
                <Building className="h-10 w-10 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-4 font-raleway">Small Businesses</h3>
              <p className="text-muted-foreground font-sans">
                "Export hundreds of receipts into clean reports for bookkeeping."
              </p>
              <p className="text-sm text-muted-foreground mt-3 font-sans">
                Turn receipt chaos into organized expense data.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 font-raleway">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            <Card className="p-6 bg-white border border-border">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg font-raleway">Do you store my receipts?</h3>
                <p className="text-muted-foreground font-sans">
                  No, everything stays private. We process your receipts and then permanently delete them from our servers. Only you have access to the categorized results.
                </p>
              </div>
            </Card>
            
            <Card className="p-6 bg-white border border-border">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg font-raleway">What formats can I upload?</h3>
                <p className="text-muted-foreground font-sans">
                  We support images (JPG, PNG), PDFs, and CSV files. Simply drag and drop or click to upload from your device.
                </p>
              </div>
            </Card>
            
            <Card className="p-6 bg-white border border-border">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg font-raleway">Can I export to QuickBooks?</h3>
                <p className="text-muted-foreground font-sans">
                  Yes, our Pro plan includes CSV export that's compatible with QuickBooks, Excel, and most accounting software.
                </p>
              </div>
            </Card>
            
            <Card className="p-6 bg-white border border-border">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg font-raleway">Is there a free plan?</h3>
                <p className="text-muted-foreground font-sans">
                  Yes! Try ReceiptParser free with up to 5 receipts per month. No credit card required to start.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="final-cta" className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-hero p-12 text-white shadow-glow">
            <h2 className="text-4xl font-bold mb-6 font-raleway">
              Ready to See Where Your Money Really Goes?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto font-sans">
              Start parsing receipts today — free, fast, and secure.
            </p>
            
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 h-auto font-semibold shadow-large"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            
            <p className="text-white/70 text-sm mt-4 font-sans">
              Join 500+ users • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src={logo} 
                  alt="Best Receipt Parser Logo" 
                  className="h-8 w-auto object-contain flex-shrink-0"
                />
                <h3 className="font-bold font-raleway"><span style={{ color: '#3498DB' }}>Best</span> Receipt Parser</h3>
              </div>
              <p className="text-sm text-muted-foreground font-sans">
                Receipts Made Useful
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 font-raleway">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollToSection('pricing')} className="font-sans">Pricing</button></li>
                <li><button onClick={() => scrollToSection('features')} className="font-sans">Features</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="font-sans">FAQs</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 font-raleway">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:support@receiptparser.com" className="font-sans">Contact</a></li>
                <li><a href="#" className="font-sans">Help Center</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 font-raleway">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="font-sans">Privacy Policy</a></li>
                <li><a href="#" className="font-sans">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p className="font-sans">&copy; 2025 ReceiptParser. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;