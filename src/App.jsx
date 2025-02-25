import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

const HomePage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="card max-w-md w-full mx-auto">
      <div className="card-body">
        <h1 className="text-center">InnoCap Forge</h1>
        <p className="text-center text-gray-600 mb-6">
          Connecting Innovation with Capital
        </p>
        <div className="space-y-4">
          <a href="/login" className="btn-primary w-full flex justify-center">
            Login
          </a>
          <a href="/register" className="btn-outline w-full flex justify-center">
            Register
          </a>
        </div>
      </div>
    </div>
  </div>
)

const Login = () => <div className="p-8">Login Page</div>
const Register = () => <div className="p-8">Register Page</div>
const Dashboard = () => <div className="p-8">Dashboard Page</div>
const NotFound = () => <div className="p-8">404 Not Found</div>

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App