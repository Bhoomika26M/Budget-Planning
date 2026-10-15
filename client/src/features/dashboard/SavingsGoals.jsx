import React from "react";


const savingsGoals = [
  {
    id: 1,
    name: "Emergency Fund",
    saved: 1500,
    target: 3000,
    icon: "🛡️",
    deadline: "Dec 2026",
  },
  {
    id: 2,
    name: "New Laptop",
    saved: 800,
    target: 1500,
    icon: "💻",
    deadline: "Jan 2027",
  },
];

function SavingsGoals() {
  return (
    <section className="savings-goals-card">
      <div className="savings-goals-header">
        <div>
          <h2>Savings Goals</h2>
          <p>Track your progress towards your goals</p>
        </div>

        <button className="view-all-btn">View All</button>
      </div>

      <div className="savings-goals-list">
        {savingsGoals.map((goal) => {
          const percentage = Math.min(
            Math.round((goal.saved / goal.target) * 100),
            100
          );

          return (
            <div className="savings-goal" key={goal.id}>
              <div className="goal-top">
                <div className="goal-info">
                  <div className="goal-icon">{goal.icon}</div>

                  <div>
                    <h3>{goal.name}</h3>
                    <span>
                      Target: ₹{goal.target.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="goal-percentage">
                  {percentage}%
                </div>
              </div>

              <div className="goal-progress">
                <div
                  className="goal-progress-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="goal-bottom">
                <span>
                  ₹{goal.saved.toLocaleString()} saved
                </span>

                <span>{goal.deadline}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default SavingsGoals;