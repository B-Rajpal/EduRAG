import React, { useState, useEffect } from 'react';

const QuizGeneration = () => {
    const [quiz, setQuiz] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [subject, setSubject] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);

    useEffect(() => {
        // Get the subject from the query params (assuming it's passed from the previous page)
        const urlParams = new URLSearchParams(window.location.search);
        const subjectParam = urlParams.get('subject');
        if (subjectParam) {
            setSubject(subjectParam);
        } else {
            setError('Subject is required');
            setLoading(false);
            return;
        }

        // Fetch quiz data from the backend
        const fetchQuiz = async () => {
            try {
                const response = await fetch('http://localhost:5000/generate_quiz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        subject: subjectParam,
                        num_questions: numQuestions,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    setError(data.error || 'Failed to generate quiz');
                } else {
                    const data = await response.json();
                    setQuiz(data.quiz);
                }
            } catch (err) {
                setError('Error fetching quiz');
                console.error(err);
            }
            setLoading(false);
        };

        fetchQuiz();
    }, [subject, numQuestions]);

    return (
        <div className="quiz-container">
            <h1>Generated Quiz for {subject}</h1>

            {loading ? (
                <p>Loading quiz...</p>
            ) : error ? (
                <div className="error">{error}</div>
            ) : (
                <div id="quizResult">
                    <h2>Your Quiz:</h2>
                    <div id="questionsContainer">
                        {quiz && quiz.length > 0 ? (
                            quiz.map((q, index) => (
                                <div key={index} className="question">
                                    <p>{`${index + 1}. ${q.question}`}</p>
                                    <ul>
                                        {q.options.map((option, idx) => (
                                            <li key={idx}>{option}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <p>No quiz generated.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizGeneration;
