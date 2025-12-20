import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Leaf, Truck, Calendar, Shield, ArrowRight } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-hero py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
                <Leaf className="w-4 h-4" />
                <span className="text-sm font-medium">Fresh Groceries, Delivered Weekly or Monthly</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 animate-slide-up">
                Subscribe to <span className="text-gradient">Fresh Groceries</span> Delivered to Your Door
              </h1>
              <p className="text-lg text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Never run out of essentials again. Build your custom grocery subscription and enjoy automatic deliveries in PKR—weekly or monthly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link to="/products">
                  <Button variant="hero" size="xl">
                    Start Your Subscription
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="xl">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-bold text-center mb-12">Why Choose FreshBox?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Calendar, title: 'Flexible Schedules', desc: 'Choose weekly or monthly deliveries that fit your lifestyle.' },
                { icon: Truck, title: 'Fresh Delivery', desc: 'Quality groceries delivered fresh to your doorstep.' },
                { icon: Shield, title: 'Easy Management', desc: 'Pause, modify, or cancel your subscription anytime.' },
              ].map((feature, i) => (
                <div key={i} className="text-center p-6 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
