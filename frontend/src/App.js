import logo from './logo.svg';
import './App.css';
import axios from 'axios';

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
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        <div onClick={test}>test</div>
        </a>
      </header>
    </div>
  );
}

export default App;
