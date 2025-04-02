import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";

const QuizGeneration = () => {
    const [quiz, setQuiz] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [subject, setSubject] = useState('');
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [score, setScore] = useState(null); // Score state
    const hasFetched = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const urlParams = new URLSearchParams(window.location.search);
        const subjectParam = urlParams.get('subject');

        if (!subjectParam) {
            setError('Subject is required');
            setLoading(false);
            return;
        }
        setSubject(subjectParam);

        const fetchQuiz = async () => {
            try {
                
                const response = await fetch('http://localhost:5000/generate_quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subject: subjectParam, num_questions: 5 }),
                });

                const data = await response.json();
                if (!response.ok) {
                    setError(data.error || 'Failed to generate quiz');
                } else {
                    setQuiz(data.quiz);
                }
            } catch (err) {
                setError('Error fetching quiz');
                console.error(err);
            }
            setLoading(false);
        };

        fetchQuiz();
    }, []);

    const handleAnswerClick = (questionIndex, option) => {
        if (selectedAnswers[questionIndex] !== undefined) return;

        setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: option }));
    };

    const calculateScore = () => {
        let correctCount = 0;
        quiz.forEach((q, index) => {
            if (selectedAnswers[index] === q.answer) correctCount++;
        });
        setScore(correctCount);
    };

    return (
        <div className="quiz-container">
            <button className="back-button" onClick={() => navigate(-1)}>
                Back
            </button>
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
                                            <li
                                                key={idx}
                                                className={`option ${
                                                    selectedAnswers[index] === option
                                                        ? option === q.answer
                                                            ? 'correct'
                                                            : 'incorrect'
                                                        : ''
                                                }`}
                                                onClick={() => handleAnswerClick(index, option)}
                                            >
                                                {option}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <p>No quiz generated.</p>
                        )}
                    </div>
                    {quiz && Object.keys(selectedAnswers).length === quiz.length && (
                        <button className="finish-button" onClick={calculateScore}>Finish Quiz</button>
                    )}
                    {score !== null && (
                        <div className="score">Your Score: {score} / {quiz.length}</div>
                    )}
                </div>
            )}
            <style jsx>{`
                .quiz-container {
                    max-width: 600px;
                    margin: auto;
                    font-family: Arial, sans-serif;
                }
                .question {
                    margin-bottom: 15px;
                }
                .option {
                    cursor: pointer;
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    margin: 5px 0;
                    transition: background 0.3s;
                }
                .option:hover {
                    background: #f0f0f0;
                }
                .correct {
                    background: #4CAF50;
                    color: white;
                }
                .incorrect {
                    background: #FF4C4C;
                    color: white;
                }
                .finish-button {
                    margin-top: 20px;
                    padding: 10px 20px;
                    font-size: 16px;
                    cursor: pointer;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    transition: background 0.3s;
                }
                .finish-button:hover {
                    background-color: #0056b3;
                }
                .score {
                    margin-top: 15px;
                    font-size: 20px;
                    font-weight: bold;
                    color: #333;
                }
            `}</style>
        </div>
    );
};

export default QuizGeneration;