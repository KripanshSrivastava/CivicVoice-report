import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Users, MapPin } from "lucide-react";
import heroImage from "@/assets/civic-hero.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Citizens reporting civic issues" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-hero/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container max-w-screen-xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Smartphone className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Mobile-First Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Your Voice,
              <br />
              <span className="text-accent">Your City</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 max-w-lg">
              Report civic issues instantly, track progress, and help make your community better. 
              From potholes to broken streetlights, every report matters.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button size="lg" variant="civic" className="text-lg">
                Report an Issue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg border-white/30 text-white hover:bg-white hover:text-primary">
                Browse Issues
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">2.4k+</div>
                <div className="text-sm text-white/70">Issues Reported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">1.8k+</div>
                <div className="text-sm text-white/70">Issues Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">95%</div>
                <div className="text-sm text-white/70">Response Rate</div>
              </div>
            </div>
          </div>

          {/* Right Content - Features */}
          <div className="space-y-6">
            {[
              {
                icon: MapPin,
                title: "Location-Based Reporting",
                description: "Automatically detect your location or manually pin issue locations on the map"
              },
              {
                icon: Users,
                title: "Community Driven",
                description: "Join thousands of citizens working together to improve their neighborhoods"
              },
              {
                icon: Smartphone,
                title: "Mobile Optimized",
                description: "Report issues on-the-go with our mobile-first, PWA-enabled platform"
              }
            ].map((feature, index) => (
              <div key={index} className="flex gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/80 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;