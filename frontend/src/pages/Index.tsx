import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ReportIssueForm from "@/components/ReportIssueForm";
import { IssuesList } from "@/components/IssuesList";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ReportIssueForm />
        <div id="issues">
          <IssuesList />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container max-w-screen-xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">CivicVoice</h3>
              <p className="text-primary-foreground/80 text-sm leading-relaxed">
                Empowering citizens to improve their communities through collaborative civic issue reporting and tracking.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#home" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Home</a></li>
                <li><a href="#issues" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Browse Issues</a></li>
                <li><a href="#report" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Report Issue</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-primary-foreground/80 text-sm">
                Questions or feedback?<br />
                <a href="mailto:support@civicvoice.app" className="underline hover:no-underline">
                  support@civicvoice.app
                </a>
              </p>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/80">
            <p>&copy; 2024 CivicVoice. Making communities better, one report at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;