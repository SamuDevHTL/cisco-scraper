document.addEventListener('DOMContentLoaded', function() {
  const getAnswerButton = document.getElementById('getAnswer');
  const resultDiv = document.getElementById('result');
  const answerDiv = document.getElementById('answer');
  const explanationDiv = document.getElementById('explanation');

  getAnswerButton.addEventListener('click', async () => {
    answerDiv.textContent = 'Searching for answer... This might take a few moments.';
    explanationDiv.textContent = '';
    resultDiv.style.display = 'block';

    try {
      const clipboardText = await navigator.clipboard.readText();
      
      if (!clipboardText || clipboardText.trim() === '') {
        throw new Error('Clipboard is empty. Please copy the question first.');
      }

      const question = clipboardText.trim();
      console.log('Question from clipboard:', question);

      // Send message to background script to search, open hidden tab, scrape, and return answer
      const response = await browser.runtime.sendMessage({
        action: 'searchAndGetAnswer',
        question: question
      });

      console.log('Response from background script:', response);
      
      if (response.error) {
        throw new Error(response.error);
      } else if (response.answer) {
        answerDiv.textContent = `Answer: ${response.answer}`;
        explanationDiv.textContent = `Explanation: ${response.explanation}`;
      } else {
        throw new Error('No answer found for the copied question.');
      }

    } catch (error) {
      console.error('Detailed error:', error);
      answerDiv.textContent = `Error: ${error.message || 'Could not get answer'}`;
      explanationDiv.textContent = 'Please ensure you have copied the question and try again.';
    }
  });
});

// Function that will be injected into the page
function extractAnswer() {
  // Find the correct answer (usually in red)
  const answerElement = document.querySelector('strong[style*="color: red"]');
  const answer = answerElement ? answerElement.textContent.trim() : null;

  // Find the explanation
  const explanationElement = Array.from(document.querySelectorAll('strong'))
    .find(el => el.textContent.includes('Explanation:'));
  const explanation = explanationElement ? 
    explanationElement.nextSibling.textContent.trim() : 
    'No explanation found';

  return {
    answer,
    explanation
  };
} 