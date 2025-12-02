export const shouldAutoCompleteSession = (sessionDoc) => {
  if (!sessionDoc) return false;
  const { status, revealAnswer, currentQuestionIndex, questions } = sessionDoc;
  if (status !== 'running') return false;
  if (!revealAnswer) return false;
  const questionCount = Array.isArray(questions) ? questions.length : 0;
  if (!questionCount) return false;
  return currentQuestionIndex === questionCount - 1;
};
