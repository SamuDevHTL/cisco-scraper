// content.js

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'scrapeAnswer') {
    try {
      const result = extractAnswer();
      console.log('Extracted answer:', result);
      sendResponse(result);
    } catch (error) {
      console.error('Error in content script:', error);
      sendResponse({ error: error.message });
    }
  }
  return true; // Keep the message channel open for sendResponse
});

function extractAnswer() {
  console.log('Starting answer extraction on ITExamAnswers.net...');
  
  let answer = null;
  let explanation = "No explanation found";

  // Strategy: Find the correct answer by looking for bolded text within list items.
  // This seems to be the most consistent pattern from previous observations.
  const listItems = document.querySelectorAll('ul li');
  for (const li of listItems) {
    const strongElement = li.querySelector('strong'); // Look for a strong tag inside the list item
    if (strongElement && strongElement.textContent.trim().length > 0) { 
      answer = strongElement.textContent.trim();
      console.log('Found answer via strong tag in list item:', answer);
      break; 
    }
  }

  // Fallback: If not found in a strong tag within an li, look for any element with inline red style
  if (!answer) {
    const possibleAnswerElements = document.querySelectorAll('[style*="color: red"]');
    for (const el of possibleAnswerElements) {
      answer = el.textContent.trim();
      console.log('Found answer via direct red style on element:', el.tagName, answer);
      break; 
    }
  }

  // Find the explanation section
  const explanationElement = Array.from(document.querySelectorAll('strong'))
    .find(el => el.textContent.includes('Explanation:'));
  explanation = explanationElement ? 
    (explanationElement.nextSibling ? explanationElement.nextSibling.textContent.trim() : 'No explanation text found.') : 
    'No explanation found';
  console.log('Extracted explanation text:', explanation);

  if (!answer) {
    console.log('Answer is still null. Full HTML (first 2000 chars):', document.documentElement.outerHTML.substring(0, 2000));
    throw new Error('Answer element not found by content script.');
  }

  return {
    answer,
    explanation
  };
} 