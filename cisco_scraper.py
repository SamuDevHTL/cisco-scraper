import requests
from bs4 import BeautifulSoup
import urllib.parse
import time

def search_question(question):
    """Search for the question and return the first ITExamAnswers.net URL."""
    try:
        # Format the search query
        search_query = f"{question} site:itexamanswers.net"
        encoded_query = urllib.parse.quote(search_query)
        search_url = f"https://www.google.com/search?q={encoded_query}"
        
        # Set headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Make the request
        response = requests.get(search_url, headers=headers)
        response.raise_for_status()
        
        # Parse the response
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all links
        for link in soup.find_all('a'):
            href = link.get('href')
            if href and 'itexamanswers.net' in href and '/question/' in href:
                # Clean up the URL (remove Google's redirect)
                if href.startswith('/url?q='):
                    href = href.split('/url?q=')[1].split('&')[0]
                return href
        
        return None
    
    except Exception as e:
        print(f"Error searching for question: {str(e)}")
        return None

def get_answer(url):
    """Extract the correct answer from the given ITExamAnswers.net URL."""
    try:
        # Set headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Make the request
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Parse the response
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the explanation section
        explanation = soup.find('strong', text='Explanation:')
        if explanation:
            explanation_text = explanation.find_next(text=True).strip()
        else:
            explanation_text = "No explanation found"
        
        # Find the correct answer (usually in red)
        answer = soup.find('strong', style=lambda x: x and 'color: red' in x)
        if answer:
            answer_text = answer.text.strip()
        else:
            answer_text = "Answer not found"
        
        return {
            'answer': answer_text,
            'explanation': explanation_text
        }
    
    except Exception as e:
        return {
            'error': str(e),
            'answer': None,
            'explanation': None
        }

def main():
    # Get the question from user
    question = input("Enter your Cisco exam question: ")
    
    print("\nSearching for the answer...")
    url = search_question(question)
    
    if not url:
        print("Could not find a matching question on ITExamAnswers.net")
        return
    
    print(f"\nFound question at: {url}")
    result = get_answer(url)
    
    if 'error' in result:
        print(f"Error: {result['error']}")
    else:
        print("\nCorrect Answer:", result['answer'])
        print("\nExplanation:", result['explanation'])

if __name__ == "__main__":
    main() 