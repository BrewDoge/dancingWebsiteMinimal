import './style.css'
document.querySelector<HTMLDivElement>('#userForm')!.innerHTML = `
  <div>
  <!-- Input fields for the song requests -->

    <h1 class="read-the-docs">Song Request Form</h1>
    <form id="userForm">
    <input type="text" id="input1" placeholder="Song1" />
    <br />
    <input type="text" id="input2" placeholder="Song2" />
    <br />
    <input type="text" id="input3" placeholder="Song3" />
    <br />
    <input type="text" id="input4" placeholder="Song4" />
    <br />
    <input type="text" id="input5" placeholder="Song5" />
    <br />
    </form>
    <!-- Submit button to trigger the count -->
    <button id="submitButton">Submit</button>
    <p class="read-the-docs" id="submissionCount">Submissions Today: 0</p>

  </div>
  <div>
    <!-- Text area to display song request counts -->
  <textarea id="outputBox" rows="10" cols="30" readonly></textarea>
  </div>
`
let submissionCount=0

// Define a Map to store song requests and their counts
const requestCounts = new Map<string, number>();

const ipSubmissionTimes: { [key: string]: number } = {};
//const COOLDOWN_PERIOD = 7200000; // 2 hour lockout in milliseconds
const COOLDOWN_PERIOD = 600;

// Function to update the output box and count requests for a single input
function updateOutput(userInput: string): void {
  // Trim the user input to remove any leading/trailing spaces
  const trimmedInput = userInput.trim();

  // Only process non-empty inputs
  if (trimmedInput !== '') {
    // If the request already exists in the Map, increment the count
    if (requestCounts.has(trimmedInput)) {
      requestCounts.set(trimmedInput, requestCounts.get(trimmedInput)! + 1);
    } else {
      // If the request doesn't exist yet, add it to the Map with a count of 1
      requestCounts.set(trimmedInput, 1);
    }
  }
}

// Function to update the output box with the current request counts
function updateOutputBox(): void {
  const sortedRequests = [...requestCounts.entries()]
  .sort((a, b) => b[1] - a[1]);
  
  let outputText = '';
  sortedRequests.forEach(([request, count]) => {
    outputText += `Requests: ${count} --- ${request} \n`;
  });
  // Update the output box with the formatted string
  const outputBox = document.getElementById('outputBox') as HTMLTextAreaElement;
  outputBox.value = outputText;
}

function getUserIP(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use ipify API to get the user's public IP address
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => {
        resolve(data.ip); // Return the IP address
      })
      .catch(error => {
        reject('Unable to retrieve IP address'); // Handle errors
      });
  });
}

function rateLimitByIP(ip: string): number {
  const lastSubmitTime = ipSubmissionTimes[ip];

  if (lastSubmitTime) {
    const currentTime = Date.now();
    const timeDelta = currentTime-lastSubmitTime;
    return timeDelta;
  } 
}

function sanitizeInput(input: string): string {
  // Keep only alphanumeric characters, spaces, and a few common symbols
  const element = document.createElement('div');
  if (input) {
    element.innerText = input; // Set text content (automatically escapes HTML)
    return element.innerText.toLowerCase().replace(/[^a-zA-Z0-9\s\-._,?!]/g, '');;
  }
  return '';
}

// Check if it's a new day and reset the output box at midnight
function checkNewDay() {
  const currentDate = new Date();
  const lastResetDate = localStorage.getItem('lastResetDate');

  // If the last reset date is different from today's date, reset the output box
  if (lastResetDate !== currentDate.toLocaleDateString()) {
    resetOutputBox();
    localStorage.setItem('lastResetDate', currentDate.toLocaleDateString());
  }
}

// Function to reset the output box and prepare for the new day
function resetOutputBox() {
  const outputBox = document.getElementById('outputBox') as HTMLTextAreaElement;
  outputBox.value = '';  // Reset the output box

  // Reset the request counts for a new day (optional)
  requestCounts.clear();
  submissionCount = 0;

  // Update the submission count on the page
  const submissionCountElement = document.getElementById('submissionCount');
  if (submissionCountElement) {
    submissionCountElement.textContent = 'Submissions Today: 0';
  }
}

// Function to move output box content to the running tab
function moveToRunningTab() {
  const outputBox = document.getElementById('outputBox') as HTMLTextAreaElement;
  const previousSubmissions = document.getElementById('previousSubmissions');

  // Get the current day's submissions
  const currentDayOutput = outputBox.value.trim();

  if (currentDayOutput !== '') {
    const currentDate = new Date().toLocaleDateString();
    const submissionEntry = document.createElement('div');
    submissionEntry.classList.add('submissionEntry');
    submissionEntry.innerHTML = `<strong>${currentDate}</strong><pre>${currentDayOutput}</pre>`;

    // Append to the running tab
    if (previousSubmissions) {
      previousSubmissions.appendChild(submissionEntry);
    }
  }
}

// Wait for the DOM content to fully load before adding event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Get the submit button by ID
  const submitButton = document.getElementById('submitButton');
  checkNewDay();
  // Optionally move output to running tab at the end of the day
  moveToRunningTab();


  // Check if the button exists and attach an event listener
  if (submitButton) {
    submitButton.addEventListener('click', () => {
      const ip = getUserIP();

      const timeDelta = (COOLDOWN_PERIOD - rateLimitByIP(ip)) / 60000;
      if ( timeDelta >= 0 ) {
        alert('You are currently rate limited, try again in: ' + timeDelta + ' minutes');
        return;
      }
      


      // Gather the values from the input fields
      const inputs = [
        (document.getElementById('input1') as HTMLInputElement).value,
        (document.getElementById('input2') as HTMLInputElement).value,
        (document.getElementById('input3') as HTMLInputElement).value,
        (document.getElementById('input4') as HTMLInputElement).value,
        (document.getElementById('input5') as HTMLInputElement).value
      ];

      if (inputs.every(input => input.trim() === '')){
        alert('All inputs are empty, try again.');
      } else {
      // Process each input
      inputs.forEach(input => {
        let sanitizedString=sanitizeInput(input);
        updateOutput(sanitizedString); // Update the song count based on the input
      });

      // Update the output box to display counts after processing all inputs
      updateOutputBox();

      ipSubmissionTimes[ip] = Date.now();
      submissionCount++;
      const submissionCountElement=document.getElementById('submissionCount');
      if (submissionCountElement) {
        submissionCountElement.textContent=`Submissions: ${submissionCount}`;
      }
      // Optionally, clear the input fields after submission
      (document.getElementById('input1') as HTMLInputElement).value = '';
      (document.getElementById('input2') as HTMLInputElement).value = '';
      (document.getElementById('input3') as HTMLInputElement).value = '';
      (document.getElementById('input4') as HTMLInputElement).value = '';
      (document.getElementById('input5') as HTMLInputElement).value = '';
      }
    });
  }
});
