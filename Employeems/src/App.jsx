import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Start from './Components/Start';  
import Login from './Components/Login';
import EmployeeDetail from './Components/EmployeeDetail';
import Dashboard from './Components/Dashboard';
import Home from './Components/Home';
import Employee from './Components/Employee';
import Category from './Components/Category';
import Attendancesystem from './Components/Attendancesystem';
import Profile from './Components/Profile'; 
import AddCategory from './Components/AddCategory';
import AddEmployee from './Components/AddEmployee';
import EditEmployee from './Components/EditEmployee';
import EmployeeLogin from './Components/EmployeeLogin';
import ReportSection from './Components/ReportSection';
import EditCategory from './Components/EditCategory'; // Import EditCategory component
import SalaryRequests from './Components/SalaryRequests';
import Tasks from './Components/Tasks'; // Import Tasks component
import AdminManagement from './Components/AdminManagement'; // Import AdminManagement component

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Start />} />  
        <Route path='/adminlogin' element={<Login />} />
        <Route path='/employee_login' element={<EmployeeLogin />} />
        <Route path='/employee_detail/:id' element={<EmployeeDetail />} />
        <Route path='/dashboard/*' element={<Dashboard />}>
          <Route index element={<Home />} />
          <Route path='employee' element={<Employee />} />
          <Route path='category' element={<Category />} />
          <Route path='attendancesystem' element={<Attendancesystem />} />
          <Route path='profile' element={<Profile />} />
          <Route path='add_category' element={<AddCategory />} />
          <Route path='add_employee' element={<AddEmployee />} />
          <Route path='edit_employee/:id' element={<EditEmployee />} />
          <Route path='edit_category/:id' element={<EditCategory />} />
          <Route path='salary_requests' element={<SalaryRequests />} />
          <Route path='tasks' element={<Tasks />} />
          <Route path='admin-management' element={<AdminManagement />} />
        </Route>
        <Route path='/report' element={<ReportSection />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
