import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Search from './Search';

function App() {
  const test = async() => {
    console.log('test');
    const {data} = await axios.post('/api/users/signout', {
      'email': 'yz@illinois.edu',
      'password': '123456'
    });
    console.log(data);
  }
  return (
    // <div className="App">
    //   <Login />
    //   {/* <SearchComponent /> */}
    // </div>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<Search />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
