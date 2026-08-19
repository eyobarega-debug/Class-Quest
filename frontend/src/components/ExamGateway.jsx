import React, { useState } from 'react';
import api from '../services/api'; // Adjust based on your axios/fetch wrapper

export default function ExamGateway({ examId, onAccessGranted }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('verify'); 

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Calls the verifyPassword controller
      await api.post(`/exams/${examId}/verify-password`, { password });
      setStep('start');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    }
  };

  const handleStart = async () => {
    try {
      // Calls the startExam controller to record server time
      const res = await api.post(`/exams/${examId}/start`);
      onAccessGranted(res.data); // Passes attemptId, startedAt, durationMinutes to parent
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start exam');
    }
  };

  return (
    <div className="exam-gateway">
      {step === 'verify' ? (
        <form onSubmit={handleVerify}>
          <h3>Enter Exam Password</h3>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (leave blank if none)"
          />
          <button type="submit">Verify</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      ) : (
        <div>
          <h3>Password Verified</h3>
          <p>Once you start, the timer will begin automatically. Are you ready?</p>
          <button onClick={handleStart}>Start Exam</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}