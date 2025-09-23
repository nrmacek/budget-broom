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
            <div className="p-2 rounded-lg bg-gradient-hero">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold">ReceiptParser</h1>
          </div>
          
          {/* Center Pill Navigation - Absolutely Centered */}
          <nav className="absolute left-1/2 transform -translate-x-1/2 bg-foreground/95 backdrop-blur-sm rounded-full px-8 py-4 shadow-glow">
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
              <button onClick={() => scrollToSection('final-cta')} className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                Get Started Free
              </button>
            </div>
          </nav>
          
          {/* Sign In - Outside Pill */}
          <Link to="/auth">
            <Button variant="outline" className="rounded-full font-medium">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Avatar Cluster Social Proof */}
            <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full px-6 py-3 shadow-medium">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-hero border-2 border-white flex items-center justify-center text-white font-semibold text-sm">
                  JS
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-accent border-2 border-white flex items-center justify-center text-white font-semibold text-sm">
                  MK
                </div>
                <div className="w-10 h-10 rounded-full bg-primary border-2 border-white flex items-center justify-center text-white font-semibold text-sm">
                  AL
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">Trusted by 500+ users</span>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-7xl lg:text-8xl font-bold leading-[1.2] tracking-tight pb-3">
                Know Exactly Where
                <span className="bg-gradient-hero bg-clip-text text-transparent block mt-2">
                  Your Money Goes
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Turn vague charges and messy receipts into clear, categorized expenses you can understand, track, and export.
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="bg-gradient-hero hover:opacity-90 transition-all shadow-glow text-lg px-8 py-6 rounded-full h-auto font-semibold"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                No credit card required
              </p>
            </div>
            
            {/* Dashboard Visual - Centered Below Content */}
            <div className="relative mt-12 max-w-md mx-auto">
              <div className="bg-gradient-card rounded-3xl p-8 shadow-large border border-border/50">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="font-semibold text-lg">Receipt Breakdown</h3>
                    <div className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                      Processed
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="font-medium">Groceries</span>
                      </div>
                      <span className="font-bold">$92.44</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        <span className="font-medium">Household Items</span>
                      </div>
                      <span className="font-bold">$42.18</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-warning"></div>
                        <span className="font-medium">Personal Care</span>
                      </div>
                      <span className="font-bold">$19.82</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-lg font-bold">$154.44</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Updated */}
      <section id="pricing" className="py-20 px-4 bg-gradient-subtle">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple plans. No hidden costs.</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Choose the plan that fits your needs
            </p>
            
            {/* Monthly/Yearly Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Yearly
              </span>
              {isYearly && (
                <Badge variant="secondary" className="ml-2 bg-success/10 text-success">
                  2 months free!
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Basic Plan */}
            <Card className="p-8 bg-white border border-border shadow-medium hover:shadow-large transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Basic</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground">Free / Entry</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>3 receipts / month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>View parsed line items & categories</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>On-screen totals only (no exports)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Email support</span>
                  </div>
                </div>
                
                <Link to="/auth" className="block">
                  <Button className="w-full rounded-full font-semibold" variant="outline">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Standard Plan - Featured */}
            <Card className="p-8 bg-gradient-hero text-white shadow-glow relative overflow-hidden border-0 scale-105">
              <div className="absolute top-0 right-0 bg-warning text-warning-foreground px-3 py-1 text-sm font-semibold rounded-bl-lg">
                Most Popular
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Standard</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">
                      ${isYearly ? '90' : '9'}
                    </span>
                    <span className="text-white/80">/{isYearly ? 'yr' : 'mo'}</span>
                    {isYearly && (
                      <div className="text-sm text-white/80 mt-1">
                        2 months free!
                      </div>
                    )}
                  </div>
                  <p className="text-white/80">Plus Tier</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-white" />
                    <span>50 receipts / month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-white" />
                    <span>CSV export included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-white" />
                    <span>Category totals & spend summaries</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-white" />
                    <span>Email support</span>
                  </div>
                </div>
                
                <Link to="/auth" className="block">
                  <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-full font-semibold">
                    Start Standard Plan
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Enterprise Plan */}
            <Card className="p-8 bg-white border border-border shadow-medium hover:shadow-large transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">
                      ${isYearly ? '290' : '29'}
                    </span>
                    <span className="text-muted-foreground">/{isYearly ? 'yr' : 'mo'}</span>
                    {isYearly && (
                      <div className="text-sm text-muted-foreground mt-1">
                        2 months free!
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground">Pro Tier</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>500 receipts / month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>CSV + QuickBooks/Xero/Expensify exports</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Bulk upload (PDFs & ZIPs)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Advanced spend analytics dashboard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>Priority email support</span>
                  </div>
                </div>
                
                <Link to="/auth" className="block">
                  <Button className="w-full rounded-full font-semibold">
                    Start Enterprise Plan
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-8">Powered by enterprise-grade technology</p>
          
          <div className="flex justify-center items-center gap-12 opacity-60">
            <div className="text-lg font-semibold text-muted-foreground">Google Cloud Vision</div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
            <div className="text-lg font-semibold text-muted-foreground">OpenAI GPT</div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
            <div className="text-lg font-semibold text-muted-foreground">Advanced OCR</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need to track expenses</h2>
            <p className="text-xl text-muted-foreground">
              Powerful features designed for clarity and ease of use
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 bg-gradient-card border border-border/50 shadow-medium hover:shadow-large transition-all text-center">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Clear Spending Insights</h3>
              <p className="text-sm text-muted-foreground">
                See what's really behind vague Target/Costco charges
              </p>
            </Card>
            
            <Card className="p-6 bg-gradient-card border border-border/50 shadow-medium hover:shadow-large transition-all text-center">
              <div className="p-4 rounded-full bg-accent/10 w-fit mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Business-Ready Data</h3>
              <p className="text-sm text-muted-foreground">
                Export clean CSVs for QuickBooks, Excel, etc.
              </p>
            </Card>
            
            <Card className="p-6 bg-gradient-card border border-border/50 shadow-medium hover:shadow-large transition-all text-center">
              <div className="p-4 rounded-full bg-warning/10 w-fit mx-auto mb-4">
                <Zap className="h-8 w-8 text-warning" />
              </div>
              <h3 className="font-semibold mb-2">Instant Processing</h3>
              <p className="text-sm text-muted-foreground">
                Upload → breakdown in seconds
              </p>
            </Card>
            
            <Card className="p-6 bg-gradient-card border border-border/50 shadow-medium hover:shadow-large transition-all text-center">
              <div className="p-4 rounded-full bg-success/10 w-fit mx-auto mb-4">
                <Lock className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Private & Secure</h3>
              <p className="text-sm text-muted-foreground">
                Your data is encrypted and never shared
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Perfect for every situation</h2>
            <p className="text-xl text-muted-foreground">
              Whether personal or business, ReceiptParser adapts to your needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center bg-white border border-border shadow-medium hover:shadow-large transition-all">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-6">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Families & Individuals</h3>
              <p className="text-muted-foreground">
                "No more mystery charges in your budget."
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Finally see where your money goes each month without guesswork.
              </p>
            </Card>
            
            <Card className="p-8 text-center bg-white border border-border shadow-medium hover:shadow-large transition-all">
              <div className="p-4 rounded-full bg-accent/10 w-fit mx-auto mb-6">
                <FileText className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Freelancers & Gig Workers</h3>
              <p className="text-muted-foreground">
                "Organize receipts for tax season in minutes."
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Export clean data directly to your accounting software.
              </p>
            </Card>
            
            <Card className="p-8 text-center bg-white border border-border shadow-medium hover:shadow-large transition-all">
              <div className="p-4 rounded-full bg-success/10 w-fit mx-auto mb-6">
                <Building className="h-10 w-10 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Small Businesses</h3>
              <p className="text-muted-foreground">
                "Export hundreds of receipts into clean reports for bookkeeping."
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Turn receipt chaos into organized expense data.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Customer Success Stories */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">From the founder</h2>
          
          <Card className="p-10 bg-gradient-card border border-border/50 shadow-large">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center text-white font-bold text-xl">
                JD
              </div>
            </div>
            
            <blockquote className="text-lg text-muted-foreground italic mb-6 leading-relaxed">
              "I built ReceiptParser after years of manually sorting receipts. It's designed to save hours and remove the guesswork from your finances. What used to take me an entire weekend now takes minutes."
            </blockquote>
            
            <div className="text-sm font-semibold">
              John Doe, Founder
            </div>
          </Card>
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="py-20 px-4 bg-gradient-subtle">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            <Card className="p-6 bg-white border border-border">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Do you store my receipts?</h3>
                <p className="text-muted-foreground">
                  No, everything stays private. We process your receipts and then permanently delete them from our servers. Only you have access to the categorized results.
                </p>
              </div>
            </Card>
            
            <Card className="p-6 bg-white border border-border">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">What formats can I upload?</h3>
                <p className="text-muted-foreground">
                  We support images (JPG, PNG), PDFs, and CSV files. Simply drag and drop or click to upload from your device.
                </p>
              </div>
            </Card>
            
            <Card className="p-6 bg-white border border-border">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Can I export to QuickBooks?</h3>
                <p className="text-muted-foreground">
                  Yes, our Pro plan includes CSV export that's compatible with QuickBooks, Excel, and most accounting software.
                </p>
              </div>
            </Card>
            
            <Card className="p-6 bg-white border border-border">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Is there a free plan?</h3>
                <p className="text-muted-foreground">
                  Yes! Try ReceiptParser free with up to 5 receipts per month. No credit card required to start.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="final-cta" className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-hero rounded-3xl p-12 text-white shadow-glow">
            <h2 className="text-4xl font-bold mb-6">
              Ready to See Where Your Money Really Goes?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Start parsing receipts today — free, fast, and secure.
            </p>
            
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-full h-auto font-semibold shadow-large"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            
            <p className="text-white/70 text-sm mt-4">
              Join 500+ users • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-hero">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold">ReceiptParser</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Turn messy receipts into clear, categorized expenses.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollToSection('pricing')}>Pricing</button></li>
                <li><button onClick={() => scrollToSection('features')}>Features</button></li>
                <li><button onClick={() => scrollToSection('faq')}>FAQs</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:support@receiptparser.com">Contact</a></li>
                <li><a href="#">Help Center</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ReceiptParser. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;