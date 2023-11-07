import React, {useState} from 'react';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import axios from 'axios';
import './Login.css';
import { useNavigate } from 'react-router-dom';

function Login(){
    const [action, setAction] = useState('signup');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    // const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
    const [emailForPasswordReset, setEmailForPasswordReset] = useState('');

    const handleLogin = () => {
        const credentials = {
            email,
            password
        }
        axios.post('/api/users/signin', credentials)
        .then(res => {
            if (res.status === 200){
                setIsLoggedIn(true);
                navigate('/search');
        
            }
            else{
                console.log('Invalid credentials');
                // setShowErrorPopup(true);
            }
        })
        .catch(error => {
            console.error('Axios error => ',error);
            // setShowErrorPopup(true);
        })
    }

    const handleForgotPassword = () => {
        setShowPasswordResetModal(true);
    };

    const handlePasswordReset = () => {
        axios.post('/api/reset-password', { email: emailForPasswordReset })
          .then(response => {
            setShowPasswordResetModal(false);
            alert('Password reset successfully.');
          })
          .catch(error => {
            console.error('Password reset error:', error);
            alert('Password reset failed.');
          });
    };
      
    const handleSignup = () => {
        const credentials = {
            email: email,
            password: password
        };
    
        // Check if the password length is within the required range
        if (password.length < 4 || password.length > 20) {
            alert('The password length must be between 4 and 20 characters, both inclusive.');
        } else {
            // Make an API call to the backend to register the user
            axios.post('/api/users/signup', credentials)
                .then(response => {
                    if (response.status === 201) {
                        alert('Signup successful. You can now log in.');
                    }
                })
                .catch(error => {
                    console.error('Signup error:', error);
                    alert(error.response.data);
                });
        }
    };
    
    return(<div className='login-container'>
        {
            isLoggedIn ? (<div>Logged in</div>) : 
            (<div>
                <div className='login-header'> 
                    <div className='login-text'>{action}</div>
                    <div className='login-underline'></div>
                </div>
                <div className='login-inputs'>
                    <div className='login-input'>
                        <EmailIcon className='login-icon' />
                        <input type='email' placeholder='Illinois email' value={email} onChange={(e) => setEmail(e.target.value)}/>
                    </div>
                    <div className='login-input'>
                        <LockIcon className='login-icon' />
                        <input type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)}/>
                    </div>
                </div>
                {action==='signup'?(<div></div>):(<div className='login-forgot-password'>Forgot Password?<span onClick={handleForgotPassword}>Click here</span></div>)}
                {showPasswordResetModal && (
                    <div className='login-password-reset-modal'>
                    <h2>Forgot Password</h2>
                    <input
                        type='email'
                        placeholder='Enter your email'
                        value={emailForPasswordReset}
                        onChange={(e) => setEmailForPasswordReset(e.target.value)}
                    />
                    <button onClick={handlePasswordReset}>Reset Password</button>
                    {/* Add a close button or option to dismiss the modal */}
                    <button onClick={() => setShowPasswordResetModal(false)}>Close</button>
                    </div>
                )}
                <div className='login-submit-container'>
                    <div className={action === 'login' ? 'submit gray' : 'submit'} onClick={handleLogin}>Login</div>
                    <div className={action === 'signup' ? 'submit gray' : 'submit'} onClick={action === 'signup'? handleSignup : () => setAction('signup')}>Sign Up</div>
                </div>
            </div>)
        }
    </div>);
    
}

export default Login;