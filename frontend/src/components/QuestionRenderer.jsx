import React, { useState } from 'react';
// import CodeEditor from './CodeEditor'; // Import your existing editor here

export default function QuestionRenderer({ question, onSubmitAnswer }) {
  const [answer, setAnswer] = useState('');

  if (!question) return <div>Loading question...</div>;

  // 1. ROUTE CODING QUESTIONS TO EXISTING UI
  if (question.type === 'coding') {
    return (
      <div className="coding-question-container">
        <h3>{question.title || question.question}</h3>
        {/* Mount your existing CodeEditor or Challenge workspace here */}
        {/* <CodeEditor challengeId={question.id} /> */}
        <p><em>(Your existing Code Editor will mount here)</em></p>
      </div>
    );
  }

  // 2. ROUTE NON-CODING QUESTIONS
  const handleSubmit = () => {
    onSubmitAnswer(question.id, answer);
  };

  return (
    <div className="non-coding-question-container">
      <h3>{question.question}</h3>
      <span className="points-badge">{question.points} Points</span>

      {question.type === 'mcq' && (
        <div className="options-list" style={{ marginTop: '1rem' }}>
          {question.options.map((opt, i) => (
            <label key={i} style={{ display: 'block', margin: '0.5rem 0', cursor: 'pointer' }}>
              <input
                type="radio"
                name={`mcq-${question.id}`}
                value={opt}
                checked={answer === opt}
                onChange={(e) => setAnswer(e.target.value)}
                style={{ marginRight: '10px' }}
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {question.type === 'true_false' && (
        <div className="options-list" style={{ marginTop: '1rem' }}>
          {['True', 'False'].map((opt) => (
            <label key={opt} style={{ display: 'block', margin: '0.5rem 0', cursor: 'pointer' }}>
              <input
                type="radio"
                name={`tf-${question.id}`}
                value={opt}
                checked={answer === opt}
                onChange={(e) => setAnswer(e.target.value)}
                style={{ marginRight: '10px' }}
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {question.type === 'short_answer' && (
        <div style={{ margin: '1.5rem 0' }}>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px' }}
          />
        </div>
      )}

      <button 
        onClick={handleSubmit} 
        disabled={!answer.trim()}
        style={{ marginTop: '1rem' }}
      >
        Submit Answer
      </button>
    </div>
  );
}