console.log("StudyBuddy Content Script Loaded");

// Listen for messages from the extension (sidebar/popup)
// Listen for messages from the extension (sidebar/popup)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_PROBLEM_CONTEXT") {
    const context = getProblemContext();
    sendResponse(context);
  }
  return true; // Keep the message channel open for async response
});

function getProblemContext() {
  const url = window.location.href;
  let title = document.title;
  let description = "No description found.";

  // LeetCode Specific Scraping
  if (url.includes("leetcode.com")) {
    // Try to find the title
    // LeetCode titles are often in a specific format or just the document title
    // Example: "1. Two Sum - LeetCode"

    // Try to find the description
    // LeetCode descriptions are usually in a container with specific classes.
    // These classes change often, so we might need to be generic or look for specific attributes.

    // Strategy 1: Look for meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      description = metaDesc.getAttribute('content');
    }

    // Strategy 2: Look for the main content container
    // Often in a div with class 'elfjS' or similar (obfuscated).
    // But usually there is a [data-track-load="description_content"] or similar.
    // Let's try to get the visible text of the left panel if possible.

    // A more robust way for LeetCode might be to grab the text of the element that looks like the problem description.
    // It often has a class like 'markdown-content' or is within a specific pane.

    const descriptionElement = document.querySelector('[data-track-load="description_content"]');
    if (descriptionElement) {
      description = descriptionElement.innerText;
    } else {
      // Fallback: Try to find the largest block of text that isn't code?
      // Or just grab the body text if it's not too huge.
      // For now, let's stick to the meta description or a generic selector.
      const content = document.querySelector('.elfjS'); // Old LeetCode class
      if (content) description = content.innerText;
    }
  }
  // HackerRank / GeeksForGeeks support can be added here
  else {
    // Generic Fallback
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      description = metaDesc.getAttribute('content');
    } else {
      // Grab first few paragraphs?
      const paragraphs = document.querySelectorAll('p');
      if (paragraphs.length > 0) {
        description = Array.from(paragraphs).slice(0, 5).map(p => p.innerText).join('\n');
      }
    }
  }

  return {
    title: title,
    description: description,
    url: url
  };
}
