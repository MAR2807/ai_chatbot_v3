'use client';


import { useRouter } from 'next/navigation';
import { useState, CSSProperties } from 'react';
import {getAuth, signInWithEmailAndPassword} from 'firebase/auth';
import {auth} from '../firebase';
import { sign } from 'crypto';


const Login = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
   
    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const user = userCredential.user;
      console.log('Logged in user:', user);
      router.push('/'); // Redirect after successful login
    } catch (error) {
      const errorCode = (error as { code: string }).code;
      const errorMessage = (error as { message: string }).message;
      setError(errorMessage);
      setIsModalOpen(true);
      console.log(errorCode, errorMessage);


    }
  };


  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);


  }


 




  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Login Page</h1>
      <form onSubmit={handleLogin} style={formStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>
        <button type="submit" style={buttonStyle}>Login</button>
      </form>


      <button type="submit" style={buttonStyle} onClick={() => {router.push("/signup")}}>Sign Up</button>


      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h2>Error</h2>
            <p>{error}</p>
            <button style={buttonStyle} onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};


const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};


const modalStyle: CSSProperties = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
  width: '400px',
  textAlign: 'center',
  color: 'black',
};
const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  backgroundColor: '#f0f2f5',
};


const titleStyle: CSSProperties = {
  fontSize: '2rem',
  marginBottom: '1rem',
};


const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '300px',
  padding: '2rem',
  borderRadius: '8px',
  backgroundColor: '#fff',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
};


const inputGroupStyle: CSSProperties = {
  marginBottom: '1rem',
};


const labelStyle: CSSProperties = {
  marginBottom: '0.5rem',
  fontSize: '1rem',
};


const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  fontSize: '1rem',
  borderRadius: '4px',
  border: '1px solid #ccc',
  color: 'black',
};


const buttonStyle: CSSProperties = {
  padding: '0.75rem',
  fontSize: '1rem',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: '#007bff',
  color: '#fff',
  cursor: 'pointer',
};


export default Login;
