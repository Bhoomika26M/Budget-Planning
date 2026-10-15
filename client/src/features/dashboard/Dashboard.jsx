//import Sidebar from "./Sidebar";
import Header from "./Header";
import "./Dashboard.css";
import SummaryCards from "./SummaryCards";
import MonthlyOverview from "./MonthlyOverview";
import AIInsights from "./AIInsights";
import RecentTransactions from "./RecentTransactions";
import BudgetProgress from "./BudgetProgress";
import SavingsGoals from "./SavingsGoals";

function Dashboard() {
  return (
    <div className="dashboard-layout">

      {/* <Sidebar /> */}

      <div className="dashboard-main">

         <Header /> 

        <main className="dashboard-content">
           <SummaryCards />
        
        <section className="overview-row">
            <MonthlyOverview />
            <AIInsights />
          </section>

           <section className="bottom-row">
            <RecentTransactions />
            <BudgetProgress />
          </section>
           
           <SavingsGoals />

          </main>
      </div>

    </div>
  );
}

export default Dashboard;