import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Plus, 
  Filter, 
  Search,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Mock data for decisions
const decisions = [
  {
    id: 1,
    title: "Q4 Marketing Budget Allocation",
    status: "approved",
    priority: "high",
    category: "Budget",
    assignee: "Sarah Chen",
    dueDate: "2024-12-15",
    progress: 85,
    aiRisk: 23,
  },
  {
    id: 2,
    title: "New Market Entry - APAC Region",
    status: "review",
    priority: "critical",
    category: "Strategic",
    assignee: "Michael Park",
    dueDate: "2024-12-20",
    progress: 60,
    aiRisk: 67,
  },
  {
    id: 3,
    title: "Engineering Team Expansion",
    status: "draft",
    priority: "medium",
    category: "HR",
    assignee: "Emma Wilson",
    dueDate: "2024-12-30",
    progress: 25,
    aiRisk: 34,
  },
  {
    id: 4,
    title: "Cloud Infrastructure Migration",
    status: "implemented",
    priority: "high",
    category: "Technical",
    assignee: "David Kim",
    dueDate: "2024-11-30",
    progress: 100,
    aiRisk: 45,
  },
  {
    id: 5,
    title: "Customer Success Platform Selection",
    status: "review",
    priority: "medium",
    category: "Operational",
    assignee: "Lisa Zhang",
    dueDate: "2024-12-18",
    progress: 50,
    aiRisk: 28,
  },
];

const stats = [
  { label: "Total Decisions", value: "47", icon: FileText, trend: "+12%" },
  { label: "In Review", value: "8", icon: Clock, trend: "-2" },
  { label: "Approved", value: "23", icon: CheckCircle2, trend: "+5" },
  { label: "Avg. Cycle Time", value: "4.2d", icon: TrendingUp, trend: "-18%" },
];

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "draft": return "bg-muted text-muted-foreground";
      case "review": return "bg-warning/20 text-warning";
      case "approved": return "bg-success/20 text-success";
      case "implemented": return "bg-primary/20 text-primary";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "low": return "text-muted-foreground";
      case "medium": return "text-primary";
      case "high": return "text-warning";
      case "critical": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 p-4 flex flex-col">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-lg">DecisionOS</span>
        </Link>

        <nav className="flex-1 space-y-1">
          <SidebarLink icon={BarChart3} label="Dashboard" active />
          <SidebarLink icon={FileText} label="Decisions" />
          <SidebarLink icon={Users} label="Teams" />
          <SidebarLink icon={TrendingUp} label="Analytics" />
          <SidebarLink icon={Settings} label="Settings" />
        </nav>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium">JD</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Overview of all decisions</p>
          </div>
          <Button variant="hero" size="lg">
            <Plus className="w-5 h-5" />
            New Decision
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="font-display text-3xl font-bold">{stat.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-sm text-success mt-2">{stat.trend}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <Button variant="glass">
            <Filter className="w-4 h-4" />
            Filter
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Decisions Table */}
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Decision</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Priority</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">AI Risk</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Due Date</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((decision, i) => (
                <motion.tr
                  key={decision.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{decision.title}</p>
                        <p className="text-sm text-muted-foreground">{decision.assignee}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyles(decision.status)}`}>
                      {decision.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-medium capitalize ${getPriorityStyles(decision.priority)}`}>
                      ● {decision.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{decision.category}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            decision.aiRisk > 60 ? 'bg-destructive' : 
                            decision.aiRisk > 40 ? 'bg-warning' : 
                            'bg-success'
                          }`}
                          style={{ width: `${decision.aiRisk}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{decision.aiRisk}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">{decision.dueDate}</span>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

// Sidebar link component
const SidebarLink = ({ icon: Icon, label, active = false }: { icon: any; label: string; active?: boolean }) => (
  <button
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
    }`}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

export default Dashboard;
