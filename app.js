const { t, apply } = window.siteLocale;
const direct = new URLSearchParams(location.search).get('path') === 'direct';
const topics = {
  steps: ['How the process works', 'You’d open a private intake, share the details the care team requests, and wait for a response about the next step.'],
  availability: ['Timing and availability', 'Availability depends on the service. Starting an intake would begin a request. It would not reserve an appointment or guarantee a response time.'],
  team: ['Who reviews the request', 'The service would tell you which team reviews your intake and how to contact them before you share personal information.'],
};
const flow = document.querySelector('#flow');
const stage = document.querySelector('#stage');
const stepLabel = document.querySelector('#step');
const begin = document.querySelector('#begin');
const overview = document.querySelector('#return');
let selection = '';
let contactWindow = 'Morning';

function showStep(step, markup, progress) {
  flow.dataset.progress = progress;
  stepLabel.textContent = t(step);
  stage.innerHTML = '<div>' + markup + '</div>';
  apply(stage);
  if (!flow.open) flow.showModal();
  stage.querySelector('h2').focus();
}

function showTopic() {
  showStep('Step 1 of 2', `
    <h2 tabindex="-1">What would you like to know first?</h2>
    <form>
      <fieldset><legend>Choose one topic</legend>
        ${Object.entries(topics).map(([key, [label]]) => `
          <label class="choice"><input type="radio" name="topic" value="${key}" required ${selection === key ? 'checked' : ''}> ${label}</label>
        `).join('')}
      </fieldset>
      <button class="button">Show my overview</button>
    </form>`, 1);
  stage.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    selection = new FormData(event.currentTarget).get('topic');
    showOverview();
  });
}

function showOverview() {
  const [title, summary] = topics[selection];
  showStep('Step 2 of 2', `
    <h2 tabindex="-1">${title}</h2>
    <p>${summary}</p>
    <div class="stage-actions">
      <button class="button" type="button">Start consultation</button>
      <button class="quiet" type="button">Choose another topic</button>
    </div>`, 2);
  stage.querySelector('.button').addEventListener('click', showIntake);
  stage.querySelector('.quiet').addEventListener('click', showTopic);
}

const requestKey = 'carepath-demo-request';

function readRequests() {
  try {
    const stored = JSON.parse(localStorage.getItem(requestKey));
    return Array.isArray(stored) ? stored : stored?.reference ? [stored] : [];
  } catch { return []; }
}

function storeRequest(request) {
  try {
    const history = readRequests();
    const index = history.findIndex(item => item.reference === request.reference);
    if (index === -1) history.unshift(request);
    else history[index] = request;
    localStorage.setItem(requestKey, JSON.stringify(history));
    return true;
  }
  catch { return false; }
}

function showIntake() {
  showStep('Sample intake', `
    <h2 tabindex="-1">Build a sample request</h2>
    <p>Use the fictional profile below. This demo never asks for personal or medical information.</p>
    <form>
      <label class="preference">Preferred contact window
        <select name="contactWindow">
          ${['Morning', 'Afternoon', 'Evening'].map(value => `<option ${contactWindow === value ? 'selected' : ''}>${value}</option>`).join('')}
        </select>
      </label>
      <fieldset><legend>Sample profile</legend>
        <label class="choice"><input type="checkbox" required> Use the sample patient profile</label>
      </fieldset>
      <button class="button">Review sample request</button>
    </form>`, 3);
  stage.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    contactWindow = new FormData(event.currentTarget).get('contactWindow');
    showReview();
  });
}

function showReview() {
  showStep('Review', `
    <h2 tabindex="-1">Check your request</h2>
    <dl class="receipt"><dt>Patient</dt><dd>Alex Morgan</dd><dt>Request type</dt><dd>First consultation</dd><dt>Contact window</dt><dd>${contactWindow}</dd></dl>
    <p>This sends a fictional request to the demo inbox on this device.</p>
    <div class="stage-actions">
      <button class="button" type="button">Send sample request</button>
      <button class="quiet" type="button">Edit request</button>
    </div>
    <p role="status"></p>`, 3);
  stage.querySelector('.quiet').addEventListener('click', showIntake);
  stage.querySelector('.button').addEventListener('click', () => {
    const request = { reference: 'CP-' + crypto.randomUUID().slice(0, 6).toUpperCase(), reviewed: false, contactWindow, createdAt: new Date().toISOString() };
    if (!storeRequest(request)) {
      stage.querySelector('[role="status"]').textContent = t('This browser could not save the sample request.');
      return;
    }
    showReceipt(request);
  });
}

function showReceipt(request) {
  const title = request.withdrawn ? 'Sample request withdrawn' : request.reviewed ? 'Sample review complete' : 'Sample request received';
  const nextStep = request.withdrawn
    ? 'This request is closed. You can return to the overview and start another sample request.'
    : request.reviewed
      ? 'The sample team has finished reviewing this request. No action is needed.'
      : 'You can leave this page and check back later. If your plans change, withdraw the request here.';
  showStep('Request timeline', `
    <h2 tabindex="-1">${title}</h2>
    <p class="next-action">${nextStep}</p>
    <dl class="receipt"><dt>Reference</dt><dd id="request-reference"></dd></dl>
    <ol class="timeline">
      <li>Sample request submitted</li>
      <li>${request.withdrawn ? 'Withdrawn by the patient' : request.reviewed ? 'Sample review completed' : 'Waiting for sample review'}</li>
    </ol>
    <p>No real consultation was requested.</p>
    ${request.reviewed || request.withdrawn ? '' : `
      <div class="stage-actions">
        <button class="button" type="button">Simulate team review</button>
        <button class="quiet" id="withdraw-request" type="button">Withdraw request</button>
      </div>`}
    <p role="status"></p>`, 3);
  stage.querySelector('#request-reference').textContent = request.reference;
  if (['Morning', 'Afternoon', 'Evening'].includes(request.contactWindow)) {
    const receipt = stage.querySelector('.receipt');
    const label = document.createElement('dt');
    const value = document.createElement('dd');
    label.textContent = t('Contact window');
    value.textContent = t(request.contactWindow);
    receipt.append(label, value);
  }
  const historyLink = document.createElement('button');
  historyLink.className = 'quiet history-link';
  historyLink.type = 'button';
  historyLink.textContent = t('Request history');
  historyLink.addEventListener('click', showHistory);
  stage.firstElementChild.append(historyLink);
  stage.querySelector('#withdraw-request')?.addEventListener('click', () => {
    showStep('Withdraw request', `
      <h2 tabindex="-1">Withdraw this sample request?</h2>
      <p>The sample team will no longer review it.</p>
      <div class="stage-actions">
        <button class="button" type="button">Confirm withdrawal</button>
        <button class="quiet" type="button">Keep request</button>
      </div>
      <p role="status"></p>`, 3);
    stage.querySelector('.quiet').addEventListener('click', () => showReceipt(request));
    stage.querySelector('.button').addEventListener('click', () => {
      const updated = { ...request, withdrawn: true };
      if (storeRequest(updated)) showReceipt(updated);
      else stage.querySelector('[role="status"]').textContent = t('This browser could not save the sample request.');
    });
  });
  stage.querySelector('.button')?.addEventListener('click', () => {
    const updated = { ...request, reviewed: true };
    if (storeRequest(updated)) showReceipt(updated);
    else stage.querySelector('[role="status"]').textContent = t('This browser could not save the sample request.');
  });
}

const resumeButton = document.querySelector('#resume-request');
function syncResume() { resumeButton.hidden = !readRequests().length; }

function showHistory() {
  showStep('Request history', `<h2 tabindex="-1">Your requests</h2><ul class="request-history"></ul>`, 3);
  const list = stage.querySelector('ul');
  for (const request of readRequests()) {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'quiet';
    button.textContent = request.reference;
    button.addEventListener('click', () => showReceipt(request));
    const status = document.createElement('span');
    status.textContent = t(request.withdrawn ? 'Withdrawn' : request.reviewed ? 'Reviewed' : 'In review');
    row.append(button, status);
    list.append(row);
  }
}

syncResume();
resumeButton.addEventListener('click', showHistory);
flow.addEventListener('close', syncResume);

if (direct) {
  document.querySelector('#hero-title').textContent = t('Start an online consultation.');
  document.querySelector('#offer-copy').textContent = t('Open the intake preview to see where a consultation request would begin.');
  begin.textContent = t('Start consultation');
}
begin.addEventListener('click', direct ? showIntake : showTopic);
overview.addEventListener('click', () => flow.close());
begin.hidden = false;
