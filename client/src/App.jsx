
import { useState } from 'react'
import Home from './pages/Home'

function App() {
  const [role, setRole] = useState('Student')

  return (
    <>
      <div className="role-selector">
        <label htmlFor="dashboard-role">View dashboard:</label>

        <select
          id="dashboard-role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="Admin">Admin</option>
          <option value="Student">Student</option>
          <option value="Premium User">Premium User</option>
        </select>
      </div>

      <Home role={role} />
    </>
  )
}

export default App
