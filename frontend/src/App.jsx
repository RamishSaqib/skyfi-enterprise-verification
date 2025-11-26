import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));

    const handleSetToken = (newToken) => {
        if (newToken) {
            localStorage.setItem('token', newToken);
        } else {
            localStorage.removeItem('token');
        }
        setToken(newToken);
    };

    return (
        <div className="App">
            {!token ? (
                <Login setToken={handleSetToken} />
            ) : (
                <Dashboard token={token} setToken={handleSetToken} />
            )}
        </div>
    );
}

export default App;
