import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function GoogleCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const processed = useRef(false);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            if (processed.current) return;
            processed.current = true;

            client.post('/auth/google/', { code })
                .then(res => {
                    const { access, refresh } = res.data;
                    localStorage.setItem('access_token', access);
                    localStorage.setItem('refresh_token', refresh);
                    window.location.href = '/dashboard';
                })
                .catch(err => {
                    console.error('Google login failed', err);
                    if (err.response) {
                        console.error('Backend error data:', err.response.data);
                        console.error('Backend error status:', err.response.status);
                        setError(`Google login failed: ${err.response.data.error || err.response.statusText}`);
                    } else {
                        setError('Google login failed. Please try again.');
                    }
                });
        } else {
            setError('No authorization code found.');
        }
    }, [searchParams, navigate]);

    if (error) {
        return <div className="text-center mt-10 text-red-600">{error}</div>;
    }

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-xl">Processing Google Login...</div>
        </div>
    );
}
