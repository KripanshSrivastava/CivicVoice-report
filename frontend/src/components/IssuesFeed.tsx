import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, MessageCircle, ThumbsUp } from "lucide-react";

const mockIssues = [
  {
    id: 1,
    title: "Large pothole on Main Street",
    category: "Road & Infrastructure",
    description: "Deep pothole causing damage to vehicles near the intersection of Main St and Oak Ave.",
    location: "Main Street & Oak Avenue",
    status: "In Progress",
    priority: "high",
    reportedAt: "2 hours ago",
    upvotes: 23,
    comments: 5,
    reporterName: "Sarah M."
  },
  {
    id: 2,
    title: "Broken streetlight in downtown area",
    category: "Lighting",
    description: "Streetlight has been out for several days, creating safety concerns for pedestrians.",
    location: "Downtown Plaza, 5th Street",
    status: "Reported",
    priority: "medium",
    reportedAt: "5 hours ago",
    upvotes: 12,
    comments: 3,
    reporterName: "Mike D."
  },
  {
    id: 3,
    title: "Overflowing trash bin at City Park",
    category: "Waste Management", 
    description: "Trash bin near playground is overflowing, attracting pests and creating unsanitary conditions.",
    location: "City Park, Near Playground",
    status: "Resolved",
    priority: "medium",
    reportedAt: "1 day ago",
    upvotes: 8,
    comments: 2,
    reporterName: "Jennifer L."
  },
  {
    id: 4,
    title: "Damaged park bench needs repair",
    category: "Parks & Recreation",
    description: "Wooden park bench is broken and unsafe to sit on.",
    location: "Riverside Park, Trail Section B",
    status: "Reported", 
    priority: "low",
    reportedAt: "3 days ago",
    upvotes: 5,
    comments: 1,
    reporterName: "Tom R."
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Reported": return "bg-accent/20 text-accent-foreground";
    case "In Progress": return "bg-primary/20 text-primary";
    case "Resolved": return "bg-secondary/20 text-secondary";
    default: return "bg-muted text-muted-foreground";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent": return "bg-destructive/20 text-destructive";
    case "high": return "bg-destructive/10 text-destructive";
    case "medium": return "bg-accent/20 text-accent-foreground";
    case "low": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const IssuesFeed = () => {
  return (
    <section id="issues" className="py-20">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Community Issues</h2>
          <p className="text-lg text-muted-foreground">
            Track reported issues and their resolution status in real-time
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <Button variant="outline" size="sm">All Issues</Button>
          <Button variant="ghost" size="sm">Reported</Button>
          <Button variant="ghost" size="sm">In Progress</Button>
          <Button variant="ghost" size="sm">Resolved</Button>
        </div>

        {/* Issues List */}
        <div className="space-y-6">
          {mockIssues.map((issue) => (
            <Card key={issue.id} className="hover:shadow-elevated transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{issue.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {issue.location}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {issue.reportedAt}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {issue.reporterName}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(issue.status)}>
                      {issue.status}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                      {issue.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {issue.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      {issue.upvotes}
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      {issue.comments}
                    </button>
                  </div>
                  
                  <Badge variant="secondary" className="text-xs">
                    {issue.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Load More Issues
          </Button>
        </div>
      </div>
    </section>
  );
};

export default IssuesFeed;