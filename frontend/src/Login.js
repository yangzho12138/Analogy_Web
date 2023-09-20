// LoginPage.js
import React, {useState} from 'react';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import './Login.css';

function Login(){
    
    const [action, setAction] = useState('Sign Up');

    return(
        <div className='container'>
            <div className='header'>
                <div className='text'>{action}</div>
                <div className='underline'></div>
            </div>

            <div className='inputs'>

                <div className='input'>
                    <EmailIcon className='icon' />
                    <input type='email' placeholder='Illinois email'/>
                </div>

                <div className='input'>
                    <LockIcon className='icon' />
                    <input type='password' placeholder='Password'/>
                </div>
            </div>
            {action==='Sign Up'?<div></div>:<div className='forgot-password'>Forgot Password?<span>Click here</span></div>}
            <div className='submit-container'>
                <div className={action==='Login'?'submit gray':'submit'} onClick={()=>{setAction('Sign Up')}}>Sign Up</div>
                <div className={action==='Sign Up'?'submit gray':'submit'} onClick={()=>{setAction('Login')}}>Login</div>
            </div>
        </div>

    )
}


export default Login;
