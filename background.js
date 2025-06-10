// background.js

browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'searchAndGetAnswer') {
    const question = request.question;
    console.log('Background script received question for search and answer:', question);

    let tempTabId = null;
    try {
      // Step 1: Perform Google search for the question on itexamanswers.net
      const encodedQuestion = encodeURIComponent(question + ' site:itexamanswers.net');
      const googleSearchUrl = `https://www.google.com/search?q=${encodedQuestion}`;
      console.log('Searching Google for:', googleSearchUrl);

      const googleResponse = await fetch(googleSearchUrl);
      if (!googleResponse.ok) {
        throw new Error(`Google search failed with status: ${googleResponse.status}`);
      }
      const googleHtml = await googleResponse.text();
      const googleDoc = new DOMParser().parseFromString(googleHtml, 'text/html');

      // Find the first ITExamAnswers.net link
      let itexamanswersUrl = null;
      const searchResults = googleDoc.querySelectorAll('a');
      for (const link of searchResults) {
        const href = link.href;
        if (href && href.includes('itexamanswers.net/question/')) {
          if (href.startsWith('https://www.google.com/url?q=')) {
            itexamanswersUrl = decodeURIComponent(href.split('https://www.google.com/url?q=')[1].split('&')[0]);
          } else {
            itexamanswersUrl = href;
          }
          break;
        }
      }

      if (!itexamanswersUrl) {
        console.log('No ITExamAnswers.net link found in Google search results.');
        return sendResponse({ error: 'No matching ITExamAnswers.net page found.' });
      }
      console.log('Found ITExamAnswers.net URL:', itexamanswersUrl);

      // Step 2: Open the ITExamAnswers.net page in a new, hidden tab
      const tab = await browser.tabs.create({ url: itexamanswersUrl, active: false });
      tempTabId = tab.id;
      console.log('Opened hidden tab with ID:', tempTabId, 'URL:', itexamanswersUrl);

      // Step 3: Wait for the tab to fully load
      await new Promise(resolve => {
        const listener = (tabId, changeInfo) => {
          if (tabId === tempTabId && changeInfo.status === 'complete') {
            browser.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        browser.tabs.onUpdated.addListener(listener);
      });
      console.log('Hidden tab loaded.');

      // Step 4: Inject content script and scrape the answer
      const responseFromContent = await browser.tabs.sendMessage(tempTabId, { action: 'scrapeAnswer' });
      console.log('Response from content script:', responseFromContent);

      if (responseFromContent.error) {
        throw new Error(responseFromContent.error);
      } else if (responseFromContent.answer) {
        sendResponse({ answer: responseFromContent.answer, explanation: responseFromContent.explanation });
      } else {
        throw new Error('Content script did not return an answer.');
      }

    } catch (error) {
      console.error('Error in background script:', error);
      sendResponse({ error: error.message });
    } finally {
      // Step 5: Close the temporary tab
      if (tempTabId) {
        browser.tabs.remove(tempTabId);
        console.log('Closed hidden tab with ID:', tempTabId);
      }
    }
  }
  return true; // Keep the message channel open for sendResponse
}); 